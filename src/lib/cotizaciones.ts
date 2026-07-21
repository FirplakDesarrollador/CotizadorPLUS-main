import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { cotizar, cotizarGrupo, type CotizarInput, type CotizarResult } from '@/lib/cotizar';
import {
  codigoGrupo, codigoModulo, indiceALetras, letrasAIndice, normalizarEtiquetaGrupo,
  distribuirResiduoMoneda, redondearMoneda,
  type SistemaMedida,
} from '@/lib/module-groups';

export type CotizacionHeader = {
  id: string; codigo: string | null; nombre: string | null;
  cliente_nombre: string | null; moneda: string; trm: number; estado: string;
  sistema_medida: SistemaMedida;
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
  const [{ data: cab }, { data: cocinas }, { data: grupos }, { data: lineas }] = await Promise.all([
    sb.from('cot_cotizaciones').select('*').eq('id', id).single(),
    sb.from('cot_cocinas').select('*').eq('cotizacion_id', id).order('orden'),
    sb.from('cot_grupos_modulos').select('*').eq('cotizacion_id', id).order('orden'),
    sb.from('cot_cotizacion_lineas').select('*').eq('cotizacion_id', id).order('orden'),
  ]);
  const gruposById = Object.fromEntries((grupos ?? []).map((g) => [g.id, g]));
  const lineasByCocina: Record<string, unknown[]> = {};
  for (const l of (lineas ?? [])) {
    const k = (l as { cocina_id: string | null }).cocina_id ?? 'sin';
    const grupo = gruposById[(l as { grupo_id?: string }).grupo_id ?? ''];
    (lineasByCocina[k] ||= []).push({ ...l, grupo });
  }
  for (const rows of Object.values(lineasByCocina)) rows.sort((a, b) => {
    const aa = a as { grupo?: { orden?: number }; posicion_grupo?: number; orden?: number };
    const bb = b as { grupo?: { orden?: number }; posicion_grupo?: number; orden?: number };
    return Number(aa.grupo?.orden ?? aa.orden ?? 0) - Number(bb.grupo?.orden ?? bb.orden ?? 0)
      || Number(aa.posicion_grupo ?? 1) - Number(bb.posicion_grupo ?? 1);
  });
  const cocinasConLineas = (cocinas ?? []).map((c) => ({ ...c, lineas: lineasByCocina[(c as { id: string }).id] ?? [] }));
  return { cabecera: cab, cocinas: cocinasConLineas, lineasSinCocina: lineasByCocina['sin'] ?? [] };
}

export async function crearCotizacion(input: { nombre: string; cliente_nombre?: string; moneda?: 'COP' | 'USD'; trm?: number; sistema_medida?: SistemaMedida }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data, error } = await sb.from('cot_cotizaciones').insert({
    nombre: input.nombre,
    cliente_nombre: input.cliente_nombre || null,
    moneda: input.moneda ?? 'USD',
    trm: input.trm ?? 4200,
    sistema_medida: input.sistema_medida ?? 'imperial',
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

// Construye las columnas de una línea a partir del input y el resultado del motor.
// Lo comparten agregarLinea y editarLinea para garantizar el mismo cálculo.
function construirFilaLinea(input: AgregarLineaInput, res: CotizarResult) {
  const cantidad = input.cantidad || 1;
  // Si hay margenOverride, usamos la lógica unificada de Andrés (precioCop ya consolidado).
  // Si no, la lógica local de márgenes independientes.
  const usarUnificado = input.margenOverride !== undefined;
  const precioUnitCop = (input.conHerrajes && !usarUnificado) ? res.precioConHerrajesCop /* res.precioConHerrajesCopConRecargo */ : res.precioCop /* res.precioCopConRecargo */;
  const precioUnitUsd = (input.conHerrajes && !usarUnificado) ? res.precioConHerrajesUsd : res.precioUsd;
  const desc = `${input.prefLabel ?? ''} ${input.largo}x${input.alto}x${input.prof} ${input.unidad}`.trim()
    + (res.vars.n_puertas ? ` · ${res.vars.n_puertas} puerta(s)` : '');
  return {
    tipo_mueble_id: input.tipoId,
    pref: input.prefLabel ?? null,
    largo: input.largo, alto: input.alto, prof: input.prof, unidad_dim: input.unidad,
    config: {
      preset: input.preset, conHerrajes: input.conHerrajes, /* recargoPct: input.recargoPct, */
      overrides: input.overrides ?? null, modoFrentes: input.modoFrentes ?? 'normal',
      herrajesExcluidos: input.herrajesExcluidos ?? null,
      trm: res.trm, margen: res.margen, margenHerraje: res.margenHerraje,
      margenOverride: input.margenOverride ?? null,
      tarifaMadera: input.tarifaMadera ?? null,
      tarifaHerrajes: input.tarifaHerrajes ?? null,
      descuento: input.descuento ?? null,
      cantoFrentes: input.cantoFrentes ?? null,
      cantoCaja: input.cantoCaja ?? null,
    },
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
  };
}

type LineaPersistida = {
  id: string;
  cotizacion_id: string;
  cocina_id: string;
  grupo_id: string;
  posicion_grupo: number;
  tipo_mueble_id: string;
  pref: string | null;
  largo: number;
  alto: number;
  prof: number;
  unidad_dim: 'in' | 'cm' | 'mm';
  cantidad: number;
  config: Record<string, unknown> | null;
};

function inputDesdeLinea(linea: LineaPersistida): AgregarLineaInput {
  const c = linea.config ?? {};
  return {
    tipoId: linea.tipo_mueble_id,
    largo: Number(linea.largo), alto: Number(linea.alto), prof: Number(linea.prof),
    unidad: linea.unidad_dim,
    preset: (c.preset ?? {}) as Record<string, string>,
    conHerrajes: c.conHerrajes !== false,
    trm: c.trm == null ? undefined : Number(c.trm),
    overrides: (c.overrides ?? undefined) as Record<string, number> | undefined,
    modoFrentes: (c.modoFrentes ?? 'normal') as CotizarInput['modoFrentes'],
    herrajesExcluidos: (c.herrajesExcluidos ?? undefined) as string[] | undefined,
    margenOverride: c.margenOverride == null ? undefined : Number(c.margenOverride),
    tarifaMadera: c.tarifaMadera == null ? undefined : Number(c.tarifaMadera),
    tarifaHerrajes: c.tarifaHerrajes == null ? undefined : Number(c.tarifaHerrajes),
    descuento: c.descuento == null ? undefined : Number(c.descuento),
    cantoFrentes: c.cantoFrentes == null ? undefined : String(c.cantoFrentes),
    cantoCaja: c.cantoCaja == null ? undefined : String(c.cantoCaja),
    cantidad: Number(linea.cantidad || 1),
    prefLabel: linea.pref ?? undefined,
  };
}

async function obtenerSistema(cotizacionId: string): Promise<SistemaMedida> {
  const sb = await createClient();
  const { data, error } = await sb.from('cot_cotizaciones').select('sistema_medida').eq('id', cotizacionId).single();
  if (error || !data) throw new Error('Proyecto no encontrado');
  return (data.sistema_medida ?? 'imperial') as SistemaMedida;
}

async function normalizarGrupos(cocinaId: string) {
  const sb = await createClient();
  const { data: grupos, error } = await sb.from('cot_grupos_modulos').select('id').eq('cocina_id', cocinaId).order('orden').order('created_at');
  if (error) throw new Error(error.message);
  for (let i = 0; i < (grupos ?? []).length; i += 1) {
    await sb.from('cot_grupos_modulos').update({ orden: i, etiqueta: `TMP-${grupos![i].id}` }).eq('id', grupos![i].id);
  }
  for (let i = 0; i < (grupos ?? []).length; i += 1) {
    const gid = grupos![i].id;
    await sb.from('cot_grupos_modulos').update({ etiqueta: indiceALetras(i) }).eq('id', gid);
    const { data: lineas } = await sb.from('cot_cotizacion_lineas').select('id').eq('grupo_id', gid).order('posicion_grupo').order('orden');
    for (let p = 0; p < (lineas ?? []).length; p += 1) {
      await sb.from('cot_cotizacion_lineas').update({ posicion_grupo: p + 1, orden: i * 1000 + p }).eq('id', lineas![p].id);
    }
  }
}

async function recalcularGrupo(grupoId: string) {
  const sb = await createClient();
  const { data: grupo, error: ge } = await sb.from('cot_grupos_modulos').select('id,cotizacion_id,cocina_id').eq('id', grupoId).single();
  if (ge || !grupo) return;
  const { data, error } = await sb.from('cot_cotizacion_lineas').select('*').eq('grupo_id', grupoId).order('posicion_grupo');
  if (error) throw new Error(error.message);
  const lineas = (data ?? []) as LineaPersistida[];
  if (lineas.length === 0) {
    await sb.from('cot_grupos_modulos').delete().eq('id', grupoId);
    return;
  }
  if (lineas.length > 1 && lineas.some((l) => Number(l.cantidad) !== 1)) {
    throw new Error('Para agrupar módulos, cada línea debe tener cantidad 1.');
  }

  const inputs = lineas.map(inputDesdeLinea);
  const sistema = await obtenerSistema(grupo.cotizacion_id);
  const calculated = await cotizarGrupo(inputs);

  const calculatedRows: { code: string; row: ReturnType<typeof construirFilaLinea> }[] = [];
  for (let i = 0; i < lineas.length; i += 1) {
    const prepared = calculated.preparados[i];
    const pref = sistema === 'metrico'
      ? (prepared?.prefMetrico ?? lineas[i].pref ?? '')
      : (prepared?.prefImperial ?? lineas[i].pref ?? '');
    const code = codigoModulo(pref, inputs[i].largo, inputs[i].unidad, sistema);
    const baseResult = calculated.lineas[i] as CotizarResult;
    const result = {
      ...baseResult,
      trm: Number(baseResult.trm ?? inputs[i].trm ?? 4200),
      margen: Number(baseResult.margen ?? calculated.preparados[i]?.margen ?? 0),
    } as CotizarResult;
    const row = construirFilaLinea({ ...inputs[i], prefLabel: pref }, result);
    calculatedRows.push({ code, row });
  }

  const copByLine = distribuirResiduoMoneda(calculatedRows.map(({ row }) => Number(row.precio_total_cop)));
  const usdByLine = distribuirResiduoMoneda(calculatedRows.map(({ row }) => Number(row.precio_total_usd)));
  const codigos = calculatedRows.map(({ code }) => code);
  for (let i = 0; i < calculatedRows.length; i += 1) {
    const quantity = Number(calculatedRows[i].row.cantidad || 1);
    const row = {
      ...calculatedRows[i].row,
      precio_unit_cop: redondearMoneda(copByLine[i] / quantity),
      precio_unit_usd: redondearMoneda(usdByLine[i] / quantity),
      precio_total_cop: copByLine[i],
      precio_total_usd: usdByLine[i],
    };
    const { error: updateError } = await sb.from('cot_cotizacion_lineas').update({ ...row, codigo_modulo: calculatedRows[i].code }).eq('id', lineas[i].id);
    if (updateError) throw new Error(updateError.message);
  }
  const totalCop = redondearMoneda(copByLine.reduce((sum, value) => sum + value, 0));
  const totalUsd = redondearMoneda(usdByLine.reduce((sum, value) => sum + value, 0));
  const { error: groupError } = await sb.from('cot_grupos_modulos').update({
    codigo_grupo: codigoGrupo(codigos), total_cop: totalCop, total_usd: totalUsd,
    breakdown: {
      largo_total_in: calculated.largoTotalIn,
      laterales: calculated.laterales,
      uniones: calculated.uniones,
      piezas_continuas: calculated.piezasContinuas,
    },
  }).eq('id', grupoId);
  if (groupError) throw new Error(groupError.message);
}

export async function agregarLinea(cocinaId: string, input: AgregarLineaInput) {
  const sb = await createClient();
  const { data: cocina, error: ce } = await sb.from('cot_cocinas').select('id,cotizacion_id').eq('id', cocinaId).single();
  if (ce || !cocina) throw new Error('Cocina no encontrada');
  const cotizacionId = (cocina as { cotizacion_id: string }).cotizacion_id;

  const res = await cotizar(input);
  const { count } = await sb.from('cot_cotizacion_lineas')
    .select('id', { count: 'exact', head: true }).eq('cocina_id', cocinaId);

  const { count: groupCount } = await sb.from('cot_grupos_modulos')
    .select('id', { count: 'exact', head: true }).eq('cocina_id', cocinaId);
  const { data: grupo, error: groupError } = await sb.from('cot_grupos_modulos').insert({
    cotizacion_id: cotizacionId,
    cocina_id: cocinaId,
    orden: groupCount ?? 0,
    etiqueta: `NUEVO-${crypto.randomUUID()}`,
  }).select('id').single();
  if (groupError || !grupo) throw new Error(groupError?.message ?? 'No se pudo crear el bloque del módulo');

  const { error } = await sb.from('cot_cotizacion_lineas').insert({
    cotizacion_id: cotizacionId,
    cocina_id: cocinaId,
    grupo_id: grupo.id,
    posicion_grupo: 1,
    orden: count ?? 0,
    ...construirFilaLinea(input, res),
  });
  if (error) {
    await sb.from('cot_grupos_modulos').delete().eq('id', grupo.id);
    throw new Error(error.message);
  }
  await normalizarGrupos(cocinaId);
  await recalcularGrupo(grupo.id);
  await recomputarTotales(cotizacionId);
  return cotizacionId;
}

// Edita una línea existente recalculando con el motor (mismos datos que al agregar).
export async function editarLinea(lineaId: string, input: AgregarLineaInput) {
  const sb = await createClient();
  const { data: linea, error: le } = await sb.from('cot_cotizacion_lineas').select('*').eq('id', lineaId).single();
  if (le || !linea) throw new Error('Línea no encontrada');
  const cotizacionId = (linea as { cotizacion_id: string }).cotizacion_id;

  if (linea.grupo_id) {
    const { data: groupRows, error: groupError } = await sb.from('cot_cotizacion_lineas').select('*')
      .eq('grupo_id', linea.grupo_id).order('posicion_grupo');
    if (groupError) throw new Error(groupError.message);
    if ((groupRows ?? []).length > 1) {
      if (Number(input.cantidad) !== 1) throw new Error('Un módulo agrupado debe conservar cantidad 1.');
      const prospective = ((groupRows ?? []) as LineaPersistida[]).map((row) => row.id === lineaId ? input : inputDesdeLinea(row));
      await cotizarGrupo(prospective);
    }
  }

  const res = await cotizar(input);
  const { error } = await sb.from('cot_cotizacion_lineas')
    .update(construirFilaLinea(input, res)).eq('id', lineaId);
  if (error) throw new Error(error.message);
  if (linea.grupo_id) await recalcularGrupo(linea.grupo_id);
  await recomputarTotales(cotizacionId);
  return cotizacionId;
}

export async function cambiarGrupoLinea(lineaId: string, etiquetaSolicitada: string) {
  const sb = await createClient();
  const parsed = normalizarEtiquetaGrupo(etiquetaSolicitada);
  const { data: linea, error: lineError } = await sb.from('cot_cotizacion_lineas')
    .select('*').eq('id', lineaId).single();
  if (lineError || !linea) throw new Error('Módulo no encontrado');
  const current = linea as LineaPersistida;
  if (!current.cocina_id || !current.grupo_id) throw new Error('El módulo no tiene un bloque asignado');

  const { data: grupos, error: groupsError } = await sb.from('cot_grupos_modulos')
    .select('id,etiqueta,orden').eq('cocina_id', current.cocina_id).order('orden');
  if (groupsError) throw new Error(groupsError.message);
  const list = grupos ?? [];
  let target = list.find((g) => g.etiqueta === parsed.letra) ?? null;
  let createdTargetId: string | null = null;

  if (!target) {
    const requestedIndex = Math.min(letrasAIndice(parsed.letra), list.length);
    const { data: created, error } = await sb.from('cot_grupos_modulos').insert({
      cotizacion_id: current.cotizacion_id,
      cocina_id: current.cocina_id,
      orden: list.length,
      etiqueta: `NUEVO-${crypto.randomUUID()}`,
    }).select('id,etiqueta,orden').single();
    if (error || !created) throw new Error(error?.message ?? 'No se pudo crear el grupo');
    createdTargetId = created.id;
    const ordered = [...list, created];
    ordered.splice(requestedIndex, 0, ordered.pop()!);
    for (let i = 0; i < ordered.length; i += 1) {
      await sb.from('cot_grupos_modulos').update({ orden: 10000 + i }).eq('id', ordered[i].id);
    }
    target = created;
  }

  const { data: targetRows } = await sb.from('cot_cotizacion_lineas').select('*')
    .eq('grupo_id', target.id).neq('id', lineaId).order('posicion_grupo');
  const prospective = [...((targetRows ?? []) as LineaPersistida[])];
  const requestedPos = Math.max(1, Math.min(parsed.posicion ?? prospective.length + 1, prospective.length + 1));
  prospective.splice(requestedPos - 1, 0, current);
  if (prospective.length > 1) {
    try {
      if (prospective.some((row) => Number(row.cantidad) !== 1)) {
        throw new Error('Para agrupar módulos, cada línea debe tener cantidad 1.');
      }
      await cotizarGrupo(prospective.map(inputDesdeLinea));
    } catch (error) {
      if (createdTargetId) {
        await sb.from('cot_grupos_modulos').delete().eq('id', createdTargetId);
        await normalizarGrupos(current.cocina_id);
      }
      throw error;
    }
  }

  for (let i = 0; i < prospective.length; i += 1) {
    const { error } = await sb.from('cot_cotizacion_lineas').update({
      grupo_id: target.id,
      posicion_grupo: i + 1,
    }).eq('id', prospective[i].id);
    if (error) throw new Error(error.message);
  }

  if (current.grupo_id !== target.id) await recalcularGrupo(current.grupo_id);
  await recalcularGrupo(target.id);
  await normalizarGrupos(current.cocina_id);
  await recomputarTotales(current.cotizacion_id);
  return current.cotizacion_id;
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
  const { data: linea } = await sb.from('cot_cotizacion_lineas').select('grupo_id,cocina_id').eq('id', lineaId).single();
  const { error } = await sb.from('cot_cotizacion_lineas').delete().eq('id', lineaId);
  if (error) throw new Error(error.message);
  if (linea?.grupo_id) await recalcularGrupo(linea.grupo_id);
  if (linea?.cocina_id) await normalizarGrupos(linea.cocina_id);
  await recomputarTotales(cotizacionId);
}

export async function eliminarCotizacion(id: string) {
  const sb = await createClient();
  const { error } = await sb.from('cot_cotizaciones').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function duplicarLineaACocina(lineaId: string, nuevaCocinaId: string, cotizacionId: string, nuevaCantidad?: number) {
  const sb = await createClient();
  const { data: lineaOriginal, error: getErr } = await sb.from('cot_cotizacion_lineas').select('*').eq('id', lineaId).single();
  if (getErr || !lineaOriginal) throw new Error('No se pudo encontrar el módulo a copiar');

  const { count } = await sb.from('cot_cotizacion_lineas')
    .select('id', { count: 'exact', head: true }).eq('cocina_id', nuevaCocinaId);

  const { count: groupCount } = await sb.from('cot_grupos_modulos')
    .select('id', { count: 'exact', head: true }).eq('cocina_id', nuevaCocinaId);
  const { data: grupo, error: groupError } = await sb.from('cot_grupos_modulos').insert({
    cotizacion_id: cotizacionId,
    cocina_id: nuevaCocinaId,
    orden: groupCount ?? 0,
    etiqueta: `COPIA-${crypto.randomUUID()}`,
  }).select('id').single();
  if (groupError || !grupo) throw new Error(groupError?.message ?? 'No se pudo crear el bloque de destino');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, created_at, updated_at, grupo_id, posicion_grupo, codigo_modulo, ...lineaCopy } = lineaOriginal;
  
  const finalCantidad = nuevaCantidad !== undefined ? nuevaCantidad : lineaCopy.cantidad;
  const precio_unit_cop = Number(lineaCopy.precio_unit_cop || 0);
  const precio_unit_usd = Number(lineaCopy.precio_unit_usd || 0);
  
  const { error: insertErr } = await sb.from('cot_cotizacion_lineas').insert({
    ...lineaCopy,
    cocina_id: nuevaCocinaId,
    grupo_id: grupo.id,
    posicion_grupo: 1,
    orden: count ?? 0,
    cantidad: finalCantidad,
    precio_total_cop: precio_unit_cop * finalCantidad,
    precio_total_usd: precio_unit_usd * finalCantidad,
  });
  if (insertErr) {
    await sb.from('cot_grupos_modulos').delete().eq('id', grupo.id);
    throw new Error(insertErr.message);
  }

  await normalizarGrupos(nuevaCocinaId);
  await recalcularGrupo(grupo.id);
  await recomputarTotales(cotizacionId);
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
