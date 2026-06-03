import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  calcularMueble, derivarVars, toInches, normCalibre,
  type Dims, type UnidadDim, type Regla, type Pieza, type HerrajePlantilla,
  type Breakdown,
} from '@/lib/engine';

export type CotizarInput = {
  tipoId: string;
  largo: number; alto: number; prof: number;
  unidad: UnidadDim;
  preset: Record<string, string>;       // rol_tablero -> codigo
  conHerrajes: boolean;
  recargoPct: number;                    // recargo cliente (0.10 = 10%)
  trm?: number;                          // override TRM (si no, usa parámetro)
  overrides?: Record<string, number>;    // n_puertas, etc.
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes';
  margenOverride?: number;
};

export type CotizarResult = Breakdown & { trm: number; margen: number };

export async function cotizar(inp: CotizarInput): Promise<CotizarResult> {
  const sb = await createClient();

  const [{ data: params }, { data: tipo }] = await Promise.all([
    sb.from('cot_parametros').select('key,value'),
    sb.from('cot_tipos_mueble').select('id,etiquetas_und,margen_key,usa_carton').eq('id', inp.tipoId).single(),
  ]);
  if (!tipo) throw new Error('Tipo de mueble no encontrado');
  const P = Object.fromEntries((params ?? []).map((r) => [r.key, r.value])) as Record<string, unknown>;

  const [{ data: piezas }, { data: reglas }, { data: herrajesPlant }, { data: cantos }, { data: herrajesAll }] = await Promise.all([
    sb.from('cot_piezas_plantilla').select('*').eq('tipo_mueble_id', inp.tipoId).order('orden'),
    sb.from('cot_reglas_config').select('*').or(`tipo_mueble_id.is.null,tipo_mueble_id.eq.${inp.tipoId}`).eq('activo', true),
    sb.from('cot_herrajes_plantilla').select('*').eq('tipo_mueble_id', inp.tipoId).order('orden'),
    sb.from('cot_cantos').select('calibre,precio'),
    sb.from('cot_herrajes').select('codigo,precio,selector_key,categoria'),
  ]);

  // Preset final: el preset por defecto cubre cualquier rol que el formulario no envíe (p.ej. "refuerzo").
  const presetDefault = (P.preset_default ?? {}) as Record<string, string>;
  const preset = { ...presetDefault, ...inp.preset };

  // Tableros del preset
  const codes = [...new Set(Object.values(preset).filter(Boolean))];
  const { data: tableros } = await sb.from('cot_tableros').select('codigo,precio_m2').in('codigo', codes);

  const tablerosByCode = Object.fromEntries((tableros ?? []).map((t) => [t.codigo, t]));
  const cantosByCalibre = Object.fromEntries((cantos ?? []).map((c) => [normCalibre(c.calibre), c]));
  const herrajesByCode = Object.fromEntries((herrajesAll ?? []).map((h) => [h.codigo, h]));
  const consumiblesBySelector = Object.fromEntries(
    (herrajesAll ?? []).filter((h) => h.categoria === 'consumible' && h.selector_key).map((h) => [h.selector_key as string, Number(h.precio)])
  );

  const margenes = (P.margenes ?? {}) as Record<string, number>;
  const margen = inp.margenOverride ?? Number(margenes[tipo.margen_key] ?? margenes.muebles ?? 0.57);
  const trm = inp.trm ?? Number((P.trm as { valor?: number })?.valor ?? 4200);
  const desperdicio = Number(P.desperdicio_madera ?? 0.15);

  const dims: Dims = {
    L: toInches(inp.largo, inp.unidad),
    A: toInches(inp.alto, inp.unidad),
    P: toInches(inp.prof, inp.unidad),
  };

  const breakdown = calcularMueble({
    dims,
    piezas: (piezas ?? []) as Pieza[],
    herrajesPlantilla: inp.conHerrajes ? ((herrajesPlant ?? []) as HerrajePlantilla[]) : [],
    reglas: (reglas ?? []) as Regla[],
    preset,
    tablerosByCode,
    cantosByCalibre,
    herrajesByCode,
    consumiblesBySelector,
    etiquetasUnd: tipo.etiquetas_und ?? 4,
    usaCarton: tipo.usa_carton !== false,
    margen,
    recargo: inp.recargoPct ?? 0,
    trm,
    desperdicio,
    overrides: inp.overrides,
    modoFrentes: inp.modoFrentes ?? 'normal',
  });

  return { ...breakdown, trm, margen };
}

// Datos para poblar la UI del cotizador.
export async function getCotizadorData() {
  const sb = await createClient();
  const [{ data: tipos }, { data: recargos }, { data: tableros }, { data: params }, { data: piezasRoles }] = await Promise.all([
    sb.from('cot_tipos_mueble').select('id,pref,nombre_es,categoria,margen_key').eq('activo', true).order('pref'),
    sb.from('cot_recargos_cliente').select('id,cliente_nombre,recargo_pct,incluye_herrajes').eq('activo', true).order('cliente_nombre'),
    sb.from('cot_tableros').select('codigo,proveedor,sustrato,espesor_mm,color_nombre,precio_m2').eq('activo', true).order('codigo'),
    sb.from('cot_parametros').select('key,value'),
    sb.from('cot_piezas_plantilla').select('tipo_mueble_id,rol_tablero').not('rol_tablero', 'is', null),
  ]);
  const P = Object.fromEntries((params ?? []).map((r) => [r.key, r.value]));

  // Roles de tablero por tipo (orden estable caja/refuerzo/frente/fondo)
  const ORD = ['caja', 'refuerzo', 'frente', 'fondo'];
  const rolesByTipo: Record<string, string[]> = {};
  for (const pr of (piezasRoles ?? [])) {
    const set = (rolesByTipo[pr.tipo_mueble_id] ||= []);
    if (pr.rol_tablero && !set.includes(pr.rol_tablero)) set.push(pr.rol_tablero);
  }
  for (const k of Object.keys(rolesByTipo)) rolesByTipo[k].sort((a, b) => (ORD.indexOf(a) + 99) - (ORD.indexOf(b) + 99) || a.localeCompare(b));

  return {
    tipos: tipos ?? [],
    recargos: recargos ?? [],
    tableros: tableros ?? [],
    trmDefault: Number((P.trm as { valor?: number })?.valor ?? 4200),
    presetDefault: (P.preset_default ?? {}) as Record<string, string>,
    rolesByTipo,
  };
}
