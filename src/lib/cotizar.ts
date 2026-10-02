import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  calcularMueble, toInches, normCalibre,
  type Dims, type UnidadDim, type Regla, type Pieza, type HerrajePlantilla,
  type Breakdown, type CalcInput,
  type Tablero, type Canto, type Herraje,
} from '@/lib/engine';
import { calcularGrupoFisico, type GroupCalculation, type PreparedGroupMember } from '@/lib/group-engine';
import { consolidarGrupo, type CotizarGrupoResult } from '@/lib/group-result';
import { construirVisualizacion } from './visualizacion';
import { codigoComercial } from './module-groups';
import { usaHuecoHornoParametrico, usaPuertaParametrica } from './muebles';

export type CotizarInput = {
  tipoId: string;
  largo: number; alto: number; prof: number;
  unidad: UnidadDim;
  preset: Record<string, string>;       // rol_tablero -> codigo
  conHerrajes: boolean;
  // recargoPct: number;                    // DESACTIVADO: recargo cliente (0.10 = 10%)
  trm?: number;                          // override TRM (si no, usa parámetro)
  overrides?: Record<string, number>;    // n_puertas, etc.
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes';
  herrajesExcluidos?: string[];          // roles de herraje a excluir
  margenOverride?: number;   // margen del mueble (override del proyecto, categoría 'muebles')
  tarifaMadera?: number;     // desperdicio/merma de madera (override del proyecto, ej. 0.10)
  tarifaHerrajes?: number;   // margen de herraje (override del proyecto, ej. 0.30)
  descuento?: number;        // descuento final del proyecto
  etiquetas?: number;        // nº de etiquetas por mueble (override del proyecto, ej. 3)
  cantoFrentes?: string;
  cantoCaja?: string;
  // Para diseños con cajón (DB/PCFD-OP): código del riel a usar.
  // Si se especifica, se reemplaza el precio del riel por defecto (RIELTANDEM) con
  // el precio del riel elegido, manteniendo la plantilla de herrajes sin tocar.
  rielCodigo?: string;
  door?: number;
  doorHand?: 'L' | 'R';
  conFondo?: boolean;
};

export type CotizarResult = Breakdown & { trm: number; margen: number };

export type CotizacionPreparada = PreparedGroupMember & {
  trm: number;
  margen: number;
  prefImperial: string;
  prefMetrico: string;
};

export type CatalogoPrecompilado = {
  params: Record<string, unknown>;
  tiposById: Record<string, {
    id: string;
    pref: string;
    pref_imperial: string;
    pref_metrico: string;
    permite_agrupacion: boolean;
    etiquetas_und: number;
    margen_key: string;
    usa_carton: boolean;
    categoria: string;
  }>;
  piezasByTipoId: Record<string, unknown[]>;
  reglasByTipoId: Record<string, unknown[]>;
  reglasGlobales: unknown[];
  herrajesPlantByTipoId: Record<string, unknown[]>;
  cantosByCalibre: Record<string, Canto>;
  herrajesByCode: Record<string, Herraje>;
  consumiblesBySelector: Record<string, number>;
  tablerosByCode: Record<string, Tablero>;
};

export async function cargarCatalogoPrecompilado(): Promise<CatalogoPrecompilado> {
  const sb = await createClient();
  const [
    { data: params },
    { data: tipos },
    { data: piezas },
    { data: reglas },
    { data: herrajesPlant },
    { data: cantos },
    { data: herrajesAll },
    { data: tableros },
  ] = await Promise.all([
    sb.from('cot_parametros').select('key,value'),
    sb.from('cot_tipos_mueble').select('id,pref,pref_imperial,pref_metrico,permite_agrupacion,etiquetas_und,margen_key,usa_carton,categoria'),
    sb.from('cot_piezas_plantilla').select('*').order('orden'),
    sb.from('cot_reglas_config').select('*').eq('activo', true),
    sb.from('cot_herrajes_plantilla').select('*').order('orden'),
    sb.from('cot_cantos').select('calibre,precio'),
    sb.from('cot_herrajes').select('codigo,precio,selector_key,categoria').eq('activo', true),
    sb.from('cot_tableros').select('codigo,precio_m2,espesor_mm,formato'),
  ]);

  const P = Object.fromEntries(((params ?? []) as any[]).map((r: any) => [r.key, r.value])) as Record<string, unknown>;
  const tiposById = Object.fromEntries(((tipos ?? []) as any[]).map((t: any) => [t.id, t]));
  const piezasByTipoId: Record<string, unknown[]> = {};
  for (const p of (piezas ?? []) as Array<{ tipo_mueble_id: string }>) {
    if (!piezasByTipoId[p.tipo_mueble_id]) piezasByTipoId[p.tipo_mueble_id] = [];
    piezasByTipoId[p.tipo_mueble_id].push(p);
  }
  const reglasGlobales: unknown[] = [];
  const reglasByTipoId: Record<string, unknown[]> = {};
  for (const r of (reglas ?? []) as Array<{ tipo_mueble_id?: string | null }>) {
    if (!r.tipo_mueble_id) reglasGlobales.push(r);
    else {
      if (!reglasByTipoId[r.tipo_mueble_id]) reglasByTipoId[r.tipo_mueble_id] = [];
      reglasByTipoId[r.tipo_mueble_id].push(r);
    }
  }
  const herrajesPlantByTipoId: Record<string, unknown[]> = {};
  for (const hp of (herrajesPlant ?? []) as Array<{ tipo_mueble_id: string }>) {
    if (!herrajesPlantByTipoId[hp.tipo_mueble_id]) herrajesPlantByTipoId[hp.tipo_mueble_id] = [];
    herrajesPlantByTipoId[hp.tipo_mueble_id].push(hp);
  }
  const cantosByCalibre = Object.fromEntries(((cantos ?? []) as any[]).map((c: any) => [normCalibre(c.calibre), c as Canto]));
  const herrajesByCode = Object.fromEntries(((herrajesAll ?? []) as any[]).map((h: any) => [h.codigo, h as Herraje]));
  const consumiblesBySelector = Object.fromEntries(
    ((herrajesAll ?? []) as any[]).filter((h: any) => h.categoria === 'consumible' && h.selector_key).map((h: any) => [h.selector_key as string, Number(h.precio)])
  );
  const tablerosByCode = Object.fromEntries(((tableros ?? []) as any[]).map((t: any) => [t.codigo, t as Tablero]));

  return {
    params: P,
    tiposById,
    piezasByTipoId,
    reglasByTipoId,
    reglasGlobales,
    herrajesPlantByTipoId,
    cantosByCalibre,
    herrajesByCode,
    consumiblesBySelector,
    tablerosByCode,
  };
}

export async function prepararCotizacion(inp: CotizarInput, catalogo?: CatalogoPrecompilado): Promise<CotizacionPreparada> {
  let P: Record<string, unknown>;
  let tipo: any;
  let piezas: unknown[];
  let reglas: unknown[];
  let herrajesPlant: unknown[];
  let tablerosByCode: Record<string, Tablero>;
  let cantosByCalibre: Record<string, Canto>;
  let herrajesByCode: Record<string, Herraje>;
  let consumiblesBySelector: Record<string, number>;

  if (catalogo) {
    P = catalogo.params;
    tipo = catalogo.tiposById[inp.tipoId];
    if (!tipo) throw new Error('Tipo de mueble no encontrado');
    piezas = catalogo.piezasByTipoId[inp.tipoId] ?? [];
    reglas = [...catalogo.reglasGlobales, ...(catalogo.reglasByTipoId[inp.tipoId] ?? [])];
    herrajesPlant = catalogo.herrajesPlantByTipoId[inp.tipoId] ?? [];
    tablerosByCode = catalogo.tablerosByCode;
    cantosByCalibre = catalogo.cantosByCalibre;
    herrajesByCode = { ...catalogo.herrajesByCode };
    consumiblesBySelector = catalogo.consumiblesBySelector;
  } else {
    const sb = await createClient();
    const [{ data: params }, { data: tipoDb }] = await Promise.all([
      sb.from('cot_parametros').select('key,value'),
      sb.from('cot_tipos_mueble').select('id,pref,pref_imperial,pref_metrico,permite_agrupacion,etiquetas_und,margen_key,usa_carton,categoria').eq('id', inp.tipoId).single(),
    ]);
    if (!tipoDb) throw new Error('Tipo de mueble no encontrado');
    tipo = tipoDb;
    P = Object.fromEntries(((params ?? []) as any[]).map((r: any) => [r.key, r.value])) as Record<string, unknown>;

    const [{ data: piezasDb }, { data: reglasDb }, { data: herrajesPlantDb }, { data: cantosDb }, { data: herrajesAllDb }] = await Promise.all([
      sb.from('cot_piezas_plantilla').select('*').eq('tipo_mueble_id', inp.tipoId).order('orden'),
      sb.from('cot_reglas_config').select('*').or(`tipo_mueble_id.is.null,tipo_mueble_id.eq.${inp.tipoId}`).eq('activo', true),
      sb.from('cot_herrajes_plantilla').select('*').eq('tipo_mueble_id', inp.tipoId).order('orden'),
      sb.from('cot_cantos').select('calibre,precio'),
      sb.from('cot_herrajes').select('codigo,precio,selector_key,categoria').eq('activo', true),
    ]);
    piezas = piezasDb ?? [];
    reglas = reglasDb ?? [];
    herrajesPlant = herrajesPlantDb ?? [];

    const presetDefault = (P.preset_default ?? {}) as Record<string, string>;
    const preset = { ...presetDefault, ...inp.preset };
    const codes = [...new Set(Object.values(preset).filter(Boolean))];
    const { data: tablerosDb } = await sb.from('cot_tableros').select('codigo,precio_m2,espesor_mm,formato').in('codigo', codes);

    tablerosByCode = Object.fromEntries(((tablerosDb ?? []) as any[]).map((t: any) => [t.codigo, t as Tablero]));
    cantosByCalibre = Object.fromEntries(((cantosDb ?? []) as any[]).map((c: any) => [normCalibre(c.calibre), c as Canto]));
    herrajesByCode = Object.fromEntries(((herrajesAllDb ?? []) as any[]).map((h: any) => [h.codigo, h as Herraje]));
    consumiblesBySelector = Object.fromEntries(
      ((herrajesAllDb ?? []) as any[]).filter((h: any) => h.categoria === 'consumible' && h.selector_key).map((h: any) => [h.selector_key as string, Number(h.precio)])
    );
  }

  // Preset final
  const presetDefault = (P.preset_default ?? {}) as Record<string, string>;
  const preset = { ...presetDefault, ...inp.preset };

  // Riel override para muebles DB
  if (inp.rielCodigo && inp.rielCodigo !== 'RIELTANDEM') {
    const rielElegido = herrajesByCode[inp.rielCodigo];
    if (rielElegido) {
      herrajesByCode['RIELTANDEM'] = { ...herrajesByCode['RIELTANDEM'], precio: Number(rielElegido.precio) };
    }
  }

  const margenes = (P.margenes ?? {}) as Record<string, number>;
  // Margen del elemento: si hay un override explícito (del proyecto o de la línea) aplica a todo;
  // si no, se usa el margen base de la categoría del elemento.
  const margenBase = Number(margenes[tipo.margen_key] ?? margenes.muebles ?? 0.57);
  const margen = inp.margenOverride != null ? inp.margenOverride : margenBase;
  // Tarifa hardware del proyecto = margen de herraje (margin-on-price). Default global 0.35.
  const margenHerraje = inp.tarifaHerrajes ?? Number(P.margen_herraje ?? 0.35);
  const trm = inp.trm ?? Number((P.trm as { valor?: number })?.valor ?? 4200);
  // Tarifa madera del proyecto = desperdicio total (único factor de merma). Default global 0.15.
  const desperdicio = inp.tarifaMadera ?? Number(P.desperdicio_madera ?? 0.15);
  // Etiquetas: override del proyecto (ej. 3) o el del tipo (default 4).
  const etiquetasUnd = inp.etiquetas ?? tipo.etiquetas_und ?? 4;

  const dims: Dims = {
    L: toInches(inp.largo, inp.unidad),
    A: toInches(inp.alto, inp.unidad),
    P: toInches(inp.prof, inp.unidad),
  };
  const overrides = {
    ...(inp.overrides ?? {}),
    ...(inp.door != null ? { door: toInches(inp.door, inp.unidad) } : {}),
    ...(inp.doorHand ? { mano_derecha: inp.doorHand === 'R' ? 1 : 0 } : {}),
  };
  if (usaPuertaParametrica(tipo.pref)) {
    if (!(inp.door != null && Number.isFinite(inp.door) && inp.door > 0)) throw new Error('Puerta es obligatoria y debe ser mayor que cero para esta tipología.');
    if (!inp.doorHand) throw new Error('Selecciona L o R para la apertura.');
    if (toInches(inp.door, inp.unidad) >= dims.L) throw new Error('Puerta debe ser menor que el largo del mueble.');
  }
  if (usaHuecoHornoParametrico(tipo.pref)) {
    const hornoLargo = Number(inp.overrides?.horno_largo);
    const hornoAlto = Number(inp.overrides?.horno_alto);
    if (!(Number.isFinite(hornoLargo) && hornoLargo > 0)) {
      throw new Error('El largo libre del horno es obligatorio y debe ser mayor que cero.');
    }
    if (!(Number.isFinite(hornoAlto) && hornoAlto > 0)) {
      throw new Error('El alto libre del horno es obligatorio y debe ser mayor que cero.');
    }
    if (hornoLargo >= dims.L - (3.2 / 25.4)) {
      throw new Error('El largo libre del horno debe dejar espacio para los frentes izquierdo y derecho.');
    }
  }

  for (const key of ['n_puertas', 'n_cajones', 'n_entrepanos', 'n_barras'] as const) {
    const value = inp.overrides?.[key];
    if (value == null) continue;
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${key} debe ser un número entero mayor o igual a cero`);
    }
  }
  const zocaloOverride = inp.overrides?.zocalo;
  if (zocaloOverride != null && (!Number.isFinite(zocaloOverride) || zocaloOverride < 0 || zocaloOverride >= dims.A)) {
    throw new Error('zocalo debe ser mayor o igual a cero y menor que el alto del mueble');
  }

  const piezasAjustadas = ((piezas ?? []) as Pieza[]).map((pieza) => {
    if (inp.conFondo !== false) return pieza;
    if (pieza.rol_tablero === 'fondo') return { ...pieza, formula_cantidad: '0' };
    if (pieza.nombre !== 'base') return pieza;

    // Sin fondo, la base ocupa la profundidad menos exactamente un espesor
    // del tablero de caja. Se conserva el eje de largo propio de cada plantilla.
    if (/\bP\b/.test(pieza.formula_ancho ?? '')) return { ...pieza, formula_ancho: 'P-TC' };
    if (/\bP\b/.test(pieza.formula_largo ?? '')) return { ...pieza, formula_largo: 'P-TC' };
    return pieza;
  });

  const calc: CalcInput = {
    dims,
    piezas: piezasAjustadas,
    herrajesPlantilla: inp.conHerrajes ? ((herrajesPlant ?? []) as HerrajePlantilla[]) : [],
    reglas: (reglas ?? []) as Regla[],
    preset,
    tablerosByCode,
    cantosByCalibre,
    herrajesByCode,
    consumiblesBySelector,
    etiquetasUnd,
    usaCarton: tipo.usa_carton !== false,
    margen,
    margenHerraje,
    // recargo: inp.recargoPct ?? 0,
    trm,
    desperdicio,
    overrides,
    modoFrentes: inp.modoFrentes ?? 'normal',
    herrajesExcluidos: inp.herrajesExcluidos,
    descuento: inp.descuento,
    cantoFrentes: inp.cantoFrentes,
    cantoCaja: inp.cantoCaja,
    rielCodigo: inp.rielCodigo ?? 'RIELTANDEM',
  };

  return {
    calc,
    pref: tipo.pref,
    omiteFondoSoloAgrupado: tipo.categoria === 'inferior'
      && tipo.pref.toUpperCase().includes('B')
      && /(^|-)SM($|-)/i.test(tipo.pref),
    codigoModulo: codigoComercial({
      pref: tipo.pref,
      largo: inp.largo,
      alto: inp.alto,
      prof: inp.prof,
      unidad: inp.unidad,
      sistema: inp.unidad === 'in' ? 'imperial' : 'metrico',
      door: inp.door,
      doorHand: inp.doorHand,
      espesorCajaMm: tablerosByCode[preset.caja]?.espesor_mm,
      espesorFrenteMm: tablerosByCode[preset.frente]?.espesor_mm,
    }),
    prefImperial: tipo.pref_imperial || tipo.pref,
    prefMetrico: tipo.pref_metrico || tipo.pref,
    permiteAgrupacion: tipo.permite_agrupacion === true,
    trm,
    margen,
  };
}

export async function cotizar(inp: CotizarInput): Promise<CotizarResult> {
  const prepared = await prepararCotizacion(inp);
  return { ...calcularMueble(prepared.calc), trm: prepared.trm, margen: prepared.margen };
}

export async function cotizarGrupo(
  inputs: CotizarInput[],
  catalogo?: CatalogoPrecompilado
): Promise<GroupCalculation & { preparados: CotizacionPreparada[] }> {
  // Una estructura físicamente agrupada comparte caja, refuerzos y canto. A1
  // es la fuente de verdad para evitar estados persistidos o cambios de perfil
  // que dejen códigos estructurales distintos entre módulos del mismo grupo.
  const first = inputs[0];
  const normalizados = inputs.length > 1 && first ? inputs.map((input) => ({
    ...input,
    preset: {
      ...input.preset,
      caja: first.preset.caja,
      refuerzo: first.preset.refuerzo ?? first.preset.caja,
    },
    cantoCaja: first.cantoCaja,
  })) : inputs;
  const preparados = await Promise.all(normalizados.map((i) => prepararCotizacion(i, catalogo)));
  return { ...calcularGrupoFisico(preparados), preparados };
}

export async function cotizarGrupoConsolidado(inputs: CotizarInput[]): Promise<CotizarGrupoResult> {
  if (inputs.length === 0) throw new Error('Agrega al menos un módulo para calcular.');
  const group = await cotizarGrupo(inputs);
  const first = group.preparados[0];
  const result = consolidarGrupo(group, { trm: first.trm, margen: first.margen });
  return { ...result, visualizacion: construirVisualizacion(group.preparados, group) };
}

export type { CotizarGrupoResult } from '@/lib/group-result';

// Datos para poblar la UI del cotizador.
export async function getCotizadorData() {
  const sb = await createClient();
  const [{ data: tipos }, /* { data: recargos }, */ { data: tableros }, { data: params }, { data: piezasRoles }, { data: perfiles }, { data: cantos }] = await Promise.all([
    sb.from('cot_tipos_mueble').select('id,pref,pref_imperial,pref_metrico,permite_agrupacion,nombre_es,categoria,margen_key').eq('activo', true).order('pref'),
    // sb.from('cot_recargos_cliente').select('id,cliente_nombre,recargo_pct,incluye_herrajes').eq('activo', true).order('cliente_nombre'),
    sb.from('cot_tableros').select('codigo,proveedor,sustrato,espesor_mm,color_nombre,precio_m2,formato').eq('activo', true).order('codigo'),
    sb.from('cot_parametros').select('key,value'),
    sb.from('cot_piezas_plantilla').select('tipo_mueble_id,rol_tablero').not('rol_tablero', 'is', null),
    sb.from('cot_preset_perfiles').select('id,nombre,descripcion,valores,es_default,orden').eq('activo', true).order('orden').order('nombre'),
    sb.from('cot_cantos').select('calibre').order('calibre'),
  ]);
  const { data: herrajesPlant } = await sb.from('cot_herrajes_plantilla').select('tipo_mueble_id,rol,herraje_codigo,orden').order('orden');
  const P = Object.fromEntries(((params ?? []) as Array<{ key: string; value: unknown }>).map((r: any) => [r.key, r.value]));

  // Herrajes por tipo (rol + código), para permitir incluir/excluir por línea.
  const herrajesByTipo: Record<string, { rol: string; codigo: string | null }[]> = {};
  for (const hp of (herrajesPlant ?? []) as Array<{ tipo_mueble_id: string; rol: string; herraje_codigo: string | null }>) {
    const set = (herrajesByTipo[hp.tipo_mueble_id] ||= []);
    if (!set.some((x) => x.rol === hp.rol)) set.push({ rol: hp.rol, codigo: hp.herraje_codigo });
  }

  // Roles de tablero por tipo (orden estable caja/refuerzo/frente/fondo)
  const ORD = ['caja', 'refuerzo', 'frente', 'fondo'];
  const rolesByTipo: Record<string, string[]> = {};
  for (const pr of (piezasRoles ?? []) as Array<{ tipo_mueble_id: string; rol_tablero: string | null }>) {
    const set = (rolesByTipo[pr.tipo_mueble_id] ||= []);
    if (pr.rol_tablero && !set.includes(pr.rol_tablero)) set.push(pr.rol_tablero);
  }
  for (const k of Object.keys(rolesByTipo)) rolesByTipo[k].sort((a, b) => (ORD.indexOf(a) + 99) - (ORD.indexOf(b) + 99) || a.localeCompare(b));

  // Perfil por defecto: el marcado es_default, o el primero, o el preset_default de parámetros.
  const perfilesList = (perfiles ?? []) as { id: string; nombre: string; descripcion: string | null; valores: Record<string, string>; es_default: boolean; orden: number }[];
  const presetParam = (P.preset_default ?? {}) as Record<string, string>;
  const perfilDefault = perfilesList.find((p) => p.es_default) ?? perfilesList[0];
  const presetDefault = perfilDefault?.valores ?? presetParam;

  return {
    tipos: tipos ?? [],
    // recargos: recargos ?? [],
    tableros: tableros ?? [],
    cantos: ((cantos ?? []) as Array<{ calibre: string }>).map((c: any) => c.calibre as string),
    trmDefault: Number((P.trm as { valor?: number })?.valor ?? 4200),
    presetDefault,
    perfiles: perfilesList,
    perfilDefaultId: perfilDefault?.id ?? '',
    rolesByTipo,
    herrajesByTipo,
  };
}
