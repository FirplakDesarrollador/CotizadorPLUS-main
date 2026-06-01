import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { cotizar, type CotizarInput } from '@/lib/cotizar';

export type CotizacionHeader = {
  id: string; codigo: string | null; nombre: string | null;
  cliente_nombre: string | null; moneda: string; trm: number; estado: string;
  total_cop: number; total_usd: number; created_at: string;
};

export async function listarCotizaciones(): Promise<CotizacionHeader[]> {
  const sb = await createClient();
  const { data } = await sb.from('cot_cotizaciones')
    .select('id,codigo,nombre,cliente_nombre,moneda,trm,estado,total_cop,total_usd,created_at')
    .order('created_at', { ascending: false });
  return (data ?? []) as CotizacionHeader[];
}

// Proyecto con sus cocinas y, dentro de cada cocina, sus módulos (líneas).
export async function getCotizacion(id: string) {
  const sb = await createClient();
  const [{ data: cab }, { data: cocinas }, { data: lineas }] = await Promise.all([
    sb.from('cot_cotizaciones').select('*').eq('id', id).single(),
    sb.from('cot_cocinas').select('*').eq('cotizacion_id', id).order('orden'),
    sb.from('cot_cotizacion_lineas').select('*').eq('cotizacion_id', id).order('orden'),
  ]);
  const lineasByCocina: Record<string, unknown[]> = {};
  for (const l of (lineas ?? [])) {
    const k = (l as { cocina_id: string | null }).cocina_id ?? 'sin';
    (lineasByCocina[k] ||= []).push(l);
  }
  const cocinasConLineas = (cocinas ?? []).map((c) => ({ ...c, lineas: lineasByCocina[(c as { id: string }).id] ?? [] }));
  return { cabecera: cab, cocinas: cocinasConLineas, lineasSinCocina: lineasByCocina['sin'] ?? [] };
}

export async function crearCotizacion(input: { nombre: string; cliente_nombre?: string; moneda?: 'COP' | 'USD'; trm?: number }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data, error } = await sb.from('cot_cotizaciones').insert({
    nombre: input.nombre,
    cliente_nombre: input.cliente_nombre || null,
    moneda: input.moneda ?? 'USD',
    trm: input.trm ?? 4200,
    creado_por: user.id,
  }).select('id').single();
  if (error) throw new Error(error.message);
  // Toda cotización arranca con una cocina por defecto.
  await sb.from('cot_cocinas').insert({ cotizacion_id: data!.id, nombre: 'Cocina 1', orden: 0 });
  return data!.id as string;
}

// ---- Cocinas ----
export async function crearCocina(cotizacionId: string, nombre: string) {
  const sb = await createClient();
  const { count } = await sb.from('cot_cocinas').select('id', { count: 'exact', head: true }).eq('cotizacion_id', cotizacionId);
  const { error } = await sb.from('cot_cocinas').insert({ cotizacion_id: cotizacionId, nombre: nombre || `Cocina ${(count ?? 0) + 1}`, orden: count ?? 0 });
  if (error) throw new Error(error.message);
}

export async function actualizarCocina(cocinaId: string, nombre: string) {
  const sb = await createClient();
  const { error } = await sb.from('cot_cocinas').update({ nombre }).eq('id', cocinaId);
  if (error) throw new Error(error.message);
}

export async function eliminarCocina(cocinaId: string, cotizacionId: string) {
  const sb = await createClient();
  const { error } = await sb.from('cot_cocinas').delete().eq('id', cocinaId);
  if (error) throw new Error(error.message);
  await recomputarTotales(cotizacionId);
}

// ---- Módulos (líneas) dentro de una cocina ----
export type AgregarLineaInput = CotizarInput & { cantidad: number; prefLabel?: string };

export async function agregarLinea(cocinaId: string, input: AgregarLineaInput) {
  const sb = await createClient();
  const { data: cocina, error: ce } = await sb.from('cot_cocinas').select('id,cotizacion_id').eq('id', cocinaId).single();
  if (ce || !cocina) throw new Error('Cocina no encontrada');
  const cotizacionId = (cocina as { cotizacion_id: string }).cotizacion_id;

  const res = await cotizar(input);
  const cantidad = input.cantidad || 1;
  const precioUnitCop = res.precioCopConRecargo;
  const precioUnitUsd = res.precioUsd;

  const { count } = await sb.from('cot_cotizacion_lineas')
    .select('id', { count: 'exact', head: true }).eq('cocina_id', cocinaId);

  const desc = `${input.prefLabel ?? ''} ${input.largo}x${input.alto}x${input.prof} ${input.unidad}`.trim()
    + (res.vars.n_puertas ? ` · ${res.vars.n_puertas} puerta(s)` : '');

  const { error } = await sb.from('cot_cotizacion_lineas').insert({
    cotizacion_id: cotizacionId,
    cocina_id: cocinaId,
    orden: count ?? 0,
    tipo_mueble_id: input.tipoId,
    pref: input.prefLabel ?? null,
    largo: input.largo, alto: input.alto, prof: input.prof, unidad_dim: input.unidad,
    config: { preset: input.preset, conHerrajes: input.conHerrajes, recargoPct: input.recargoPct, overrides: input.overrides ?? null },
    cantidad,
    costo_sin_herrajes_cop: res.costoSinHerrajes,
    costo_herrajes_cop: res.costoHerrajes,
    costo_total_cop: res.costoConHerrajes,
    precio_unit_cop: precioUnitCop,
    precio_unit_usd: precioUnitUsd,
    precio_total_cop: precioUnitCop * cantidad,
    precio_total_usd: precioUnitUsd * cantidad,
    descripcion_es: desc,
    breakdown: res,
  });
  if (error) throw new Error(error.message);
  await recomputarTotales(cotizacionId);
  return cotizacionId;
}

export async function actualizarCotizacion(id: string, patch: { nombre?: string; cliente_nombre?: string; moneda?: 'COP' | 'USD'; trm?: number; estado?: string }) {
  const sb = await createClient();
  const upd: Record<string, unknown> = {};
  if (patch.nombre !== undefined) upd.nombre = patch.nombre;
  if (patch.cliente_nombre !== undefined) upd.cliente_nombre = patch.cliente_nombre || null;
  if (patch.moneda !== undefined) upd.moneda = patch.moneda;
  if (patch.trm !== undefined) upd.trm = patch.trm;
  if (patch.estado !== undefined) upd.estado = patch.estado;
  const { error } = await sb.from('cot_cotizaciones').update(upd).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function eliminarLinea(cotizacionId: string, lineaId: string) {
  const sb = await createClient();
  const { error } = await sb.from('cot_cotizacion_lineas').delete().eq('id', lineaId);
  if (error) throw new Error(error.message);
  await recomputarTotales(cotizacionId);
}

export async function eliminarCotizacion(id: string) {
  const sb = await createClient();
  const { error } = await sb.from('cot_cotizaciones').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Recalcula totales por cocina y del proyecto.
async function recomputarTotales(cotizacionId: string) {
  const sb = await createClient();
  const { data: lineas } = await sb.from('cot_cotizacion_lineas')
    .select('cocina_id,precio_total_cop,precio_total_usd').eq('cotizacion_id', cotizacionId);
  const rows = lineas ?? [];

  // Por cocina
  const porCocina: Record<string, { cop: number; usd: number }> = {};
  for (const l of rows) {
    const k = (l as { cocina_id: string | null }).cocina_id;
    if (!k) continue;
    (porCocina[k] ||= { cop: 0, usd: 0 });
    porCocina[k].cop += Number(l.precio_total_cop || 0);
    porCocina[k].usd += Number(l.precio_total_usd || 0);
  }
  const { data: cocinas } = await sb.from('cot_cocinas').select('id').eq('cotizacion_id', cotizacionId);
  for (const c of (cocinas ?? [])) {
    const id = (c as { id: string }).id;
    const t = porCocina[id] ?? { cop: 0, usd: 0 };
    await sb.from('cot_cocinas').update({ total_cop: t.cop, total_usd: t.usd }).eq('id', id);
  }

  // Proyecto
  const total_cop = rows.reduce((a, l) => a + Number(l.precio_total_cop || 0), 0);
  const total_usd = rows.reduce((a, l) => a + Number(l.precio_total_usd || 0), 0);
  await sb.from('cot_cotizaciones').update({ total_cop, total_usd }).eq('id', cotizacionId);
}
