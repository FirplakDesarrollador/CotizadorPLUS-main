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

export function normalizarInstalacion(valor: unknown): ConfigInstalacion {
  const datos = objeto(valor);
  const zona = datos.zona;
  const manuales = objeto(datos.cantidades);
  const cantidades: ConfigInstalacion['cantidades'] = {};
  for (const [clave] of [...MESONES, ESTADIA]) {
    if (manuales[clave] != null) cantidades[clave] = cantidad(manuales[clave]);
  }
  return {
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
      const margen = typeof t.margen === 'number' && Number.isFinite(t.margen) ? t.margen : 0;
      tarifas[zona][clave] = { costo: cantidad(t.costo), precio: cantidad(t.precio), margen };
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
    if (esHerrajeOtroAdicional(linea)) continue;
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
