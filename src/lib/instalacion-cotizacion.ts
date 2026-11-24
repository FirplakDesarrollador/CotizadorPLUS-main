import { esHerrajeOtroAdicional, type AreaPropuesta, type LineaPropuesta } from './propuesta-cotizacion';

export const ZONAS_INSTALACION = { miami: 'Miami', fueraMiami: 'Fuera de Miami', texas: 'Texas' } as const;
export type ZonaInstalacion = keyof typeof ZONAS_INSTALACION;
export const GRUPOS_INSTALACION = { muebles: 'Muebles', mesones: 'Mesones' } as const;
export type GrupoInstalacion = keyof typeof GRUPOS_INSTALACION;

const MUEBLES = [
  ['muebles', 'Muebles'], ['alacena', 'Alacena'], ['armado', 'Armado'], ['manijas', 'Manijas'],
  ['fillersTk', 'Fillers y TK'], ['panelMayor', 'Paneles de 70″ o más'], ['panelMenor', 'Paneles de menos de 70″'],
] as const;
const ESTADIA = ['estadia', 'Estadía fuera de Miami'] as const;
const MESONES = [
  ['mesonCocina', 'Mesón cocina (m²)'], ['mesonBano', 'Mesón baño instalado (m²)'],
  ['perforacionCocina', 'Perforaciones mesón cocina'], ['perforacionBano', 'Perforaciones mesón baño'],
  ['perforacionCubierta', 'Perforación cubierta'],
] as const;
export const CONCEPTOS_SUPERVISION = [
  ['supervision', 'Supervisión'], ['trailer', 'Entrega en Miami'],
] as const;
export const UNIDADES_POR_TRAILER = 20;
export const CAMPOS_SUPERVISION = [
  ['unidades', 'Cantidad'], ['costoUnit', 'Costo/unidad'], ['costo', 'Costo'],
  ['precioUnit', 'Precio/unidad'], ['precio', 'Precio'], ['margen', 'Margen'],
] as const;
type ConceptoSupervision = typeof CONCEPTOS_SUPERVISION[number][0];
export type CampoSupervision = typeof CAMPOS_SUPERVISION[number][0];
export type SupervisionEntrega = {
  moneda: 'USD' | 'COP';
  costoTrailer?: number;
  capacidadTrailer?: number;
  supervision?: Partial<Record<CampoSupervision, number>>;
  trailer?: Partial<Record<CampoSupervision, number>>;
};

export function precioInstalacion(costo: number, margen: number) {
  return costo / (1 - margen / 100);
}

export type ConceptoInstalacion = typeof MUEBLES[number][0] | typeof ESTADIA[0] | typeof MESONES[number][0];
export type ConceptoManual = typeof ESTADIA[0] | typeof MESONES[number][0];
export type TarifaInstalacion = { costo: number; precio: number; margen: number };
export type TarifasInstalacion = Record<ZonaInstalacion, Partial<Record<ConceptoInstalacion, TarifaInstalacion>>>;
export type ConfigInstalacion = {
  activa: boolean;
  zona: ZonaInstalacion | null;
  muebles: boolean;
  mesones: boolean;
  cantidades: Partial<Record<ConceptoManual, number>>;
  supervisionEntrega?: SupervisionEntrega;
};
export type LineaInstalacion = LineaPropuesta & { largo?: number; alto?: number; unidad_dim?: string };

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as Record<string, unknown> : {};
}

function cantidad(valor: unknown): number {
  const n = typeof valor === 'number' || typeof valor === 'string' ? Number(valor) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function conceptosInstalacion(zona: ZonaInstalacion, grupo: GrupoInstalacion) {
  if (grupo === 'mesones') return MESONES;
  return zona === 'miami' ? MUEBLES : [...MUEBLES, ESTADIA] as const;
}

export function conceptosManualesInstalacion(zona: ZonaInstalacion, grupo: GrupoInstalacion) {
  if (grupo === 'mesones') return MESONES;
  return zona === 'miami' ? [] : [ESTADIA];
}

function normalizarSupervision(valor: unknown): SupervisionEntrega | undefined {
  const datos = objeto(valor);
  if (datos.moneda !== 'USD' && datos.moneda !== 'COP') return;
  const resultado: SupervisionEntrega = { moneda: datos.moneda };
  if (typeof datos.costoTrailer === 'number' && Number.isFinite(datos.costoTrailer) && datos.costoTrailer >= 0) {
    resultado.costoTrailer = datos.costoTrailer;
  }
  if (typeof datos.capacidadTrailer === 'number' && Number.isInteger(datos.capacidadTrailer) && datos.capacidadTrailer > 0) {
    resultado.capacidadTrailer = datos.capacidadTrailer;
  }
  for (const [clave] of CONCEPTOS_SUPERVISION) {
    const original = objeto(datos[clave]);
    const fila: NonNullable<SupervisionEntrega[ConceptoSupervision]> = {};
    for (const [campo] of CAMPOS_SUPERVISION) {
      const n = original[campo];
      if (typeof n === 'number' && Number.isFinite(n) && (campo === 'margen' ? n < 100 : n >= 0)) fila[campo] = n;
    }
    if (Object.keys(fila).length) resultado[clave] = fila;
  }
  return resultado;
}

export function normalizarInstalacion(valor: unknown): ConfigInstalacion {
  const datos = objeto(valor);
  const zona = datos.zona;
  const manuales = objeto(datos.cantidades);
  const cantidades: ConfigInstalacion['cantidades'] = {};
  for (const [clave] of [...MESONES, ESTADIA]) {
    if (manuales[clave] != null) cantidades[clave] = cantidad(manuales[clave]);
  }
  const supervisionEntrega = normalizarSupervision(datos.supervisionEntrega);
  return {
    ...(supervisionEntrega && { supervisionEntrega }),
    activa: datos.activa === true,
    zona: zona === 'miami' || zona === 'fueraMiami' || zona === 'texas' ? zona : null,
    muebles: datos.muebles === true,
    mesones: datos.mesones === true,
    cantidades,
  };
}

export function normalizarTarifasInstalacion(valor: unknown): TarifasInstalacion {
  const datos = objeto(valor);
  const tarifas: TarifasInstalacion = { miami: {}, fueraMiami: {}, texas: {} };
  for (const zona of Object.keys(ZONAS_INSTALACION) as ZonaInstalacion[]) {
    const tabla = objeto(datos[zona]);
    for (const [clave] of [...conceptosInstalacion(zona, 'muebles'), ...MESONES]) {
      if (tabla[clave] == null) continue;
      const t = objeto(tabla[clave]);
      const margen = typeof t.margen === 'number' && Number.isFinite(t.margen) && t.margen < 100 ? t.margen : 0;
      const costo = cantidad(t.costo);
      tarifas[zona][clave] = { costo, precio: precioInstalacion(costo, margen), margen };
    }
  }
  return tarifas;
}

export function cantidadesInstalacion(
  areas: readonly AreaPropuesta<LineaInstalacion>[],
  tipos: readonly { id: string; nombre_es: string | null }[],
) {
  const alacenas = new Set(tipos.filter(tipo => /\balacena\b/i.test(tipo.nombre_es ?? '')).map(tipo => tipo.id));
  const totales = { muebles: 0, alacena: 0, armado: 0, manijas: 0, fillersTk: 0, panelMayor: 0, panelMenor: 0 };
  for (const area of areas) for (const linea of area.lineas) {
    if (esHerrajeOtroAdicional(linea) || linea.config?.clasificacionPdf === 'mesones') continue;
    const unidades = cantidad(linea.cantidad) * cantidad(area.cantidad ?? 1);
    const pref = String(linea.pref || linea.codigo_modulo || '').trim().toUpperCase().match(/^[A-Z]+/)?.[0];
    if (pref === 'F' || pref === 'TK') {
      totales.fillersTk += unidades;
      continue;
    }
    if (pref === 'PN') {
      const mayor = Math.max(cantidad(linea.largo), cantidad(linea.alto));
      const enPulgadas = linea.unidad_dim === 'mm' ? mayor / 25.4 : linea.unidad_dim === 'cm' ? mayor / 2.54 : mayor;
      totales[enPulgadas >= 70 ? 'panelMayor' : 'panelMenor'] += unidades;
      continue;
    }
    const esAlacena = alacenas.has(linea.tipo_mueble_id ?? '') || /^(AL|PC|PCFD|OVPC|WPC)$/.test(pref ?? '');
    totales[esAlacena ? 'alacena' : 'muebles'] += unidades;
    totales.armado += unidades;
    if (Array.isArray(linea.breakdown?.herrajes)) {
      for (const herraje of linea.breakdown.herrajes) {
        if (herraje?.rol === 'manija' && herraje.codigo) totales.manijas += cantidad(herraje.cant) * unidades;
      }
    }
  }
  return totales;
}

export function calcularInstalacion(
  config: ConfigInstalacion,
  tarifas: TarifasInstalacion,
  cantidades: ReturnType<typeof cantidadesInstalacion>,
  moneda: 'USD' | 'COP',
  trm: number,
) {
  const { zona } = config;
  if (!config.activa || !zona) return [];
  const unidades: Partial<Record<ConceptoInstalacion, number>> = { ...cantidades, ...config.cantidades };
  const factor = moneda === 'COP' ? cantidad(trm) : 1;
  return (Object.keys(GRUPOS_INSTALACION) as GrupoInstalacion[]).filter(grupo => config[grupo]).map(grupo => ({
    grupo,
    filas: conceptosInstalacion(zona, grupo).map(([clave, etiqueta]) => {
      const tarifa = tarifas[zona][clave];
      const cantidad = unidades[clave];
      return {
        clave, etiqueta,
        costo: tarifa == null || cantidad == null || !factor ? null : tarifa.costo * cantidad * factor,
        precio: tarifa == null || cantidad == null || !factor ? null : tarifa.precio * cantidad * factor,
        margen: tarifa?.margen ?? null,
      };
    }),
  }));
}

export function unidadesSupervisionEntrega(areas: readonly AreaPropuesta[]) {
  return areas.reduce((total, area) => area.lineas.some(linea =>
    !esHerrajeOtroAdicional(linea) && cantidad(linea.cantidad) > 0,
  ) ? total + cantidad(area.cantidad ?? 1) : total, 0);
}

export function calcularSupervisionEntrega(unidadesProyecto: number, datos: SupervisionEntrega) {
  const unidades = datos.supervision?.unidades ?? unidadesProyecto;
  const capacidad = datos.capacidadTrailer ?? UNIDADES_POR_TRAILER;
  return CONCEPTOS_SUPERVISION.map(([clave, etiqueta]) => {
    const manual = datos[clave] ?? {};
    const esEntrega = clave === 'trailer';
    const costoTrailerUnitario = esEntrega && datos.costoTrailer != null ? datos.costoTrailer / capacidad : undefined;
    const costoUnit = costoTrailerUnitario ?? manual.costoUnit
      ?? (manual.costo != null && unidades > 0 ? manual.costo / unidades : undefined);
    const precioUnitManual = manual.precioUnit ?? (manual.precio != null && unidades > 0 ? manual.precio / unidades : undefined);
    const margen = manual.margen ?? (costoUnit != null && precioUnitManual
      ? (1 - costoUnit / precioUnitManual) * 100 : undefined);
    const precioCalculado = costoUnit != null && manual.margen != null
      ? precioInstalacion(costoUnit, manual.margen) : undefined;
    const precioUnit = precioCalculado ?? precioUnitManual;
    const valores = {
      unidades: esEntrega ? capacidad : unidades, costoUnit, precioUnit, margen,
      costo: costoTrailerUnitario == null
        ? manual.costo ?? (costoUnit == null ? undefined : unidades * costoUnit)
        : unidades * costoTrailerUnitario,
      precio: precioCalculado == null
        ? manual.precio ?? (precioUnit == null ? undefined : unidades * precioUnit)
        : unidades * precioCalculado,
    };
    return { clave, etiqueta, manual, valores, costoDesdeTrailer: costoTrailerUnitario != null, precioAutomatico: precioCalculado != null };
  });
}
