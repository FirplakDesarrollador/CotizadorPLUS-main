import { toInches, type UnidadDim } from './engine';

export type MaterialMeson = {
  id: string;
  nombre: string;
  origen: 'COL' | 'US';
  material: number | null;
  empaque: number;
  produccion: number;
  pulido: number;
  huecoPulido: number;
  hueco: number;
};

export const parametrosMesones = {
  profundidad: 25.5,
  backsplash: 4,
  espesor: 0.75,
  espesorReforzado: 1.5,
  suplementoCanto: 4,
  alturaWaterfall: 36,
  merma: 5,
  margenFpk: 50,
  margenMaquila: 30,
  margenMaterial: 35.99,
  margenProduccion: 35.8533,
  margenAcabados: 35.9,
};

export const TIPOS_MESON = { cocina: 'Cocina', isla: 'Isla/Península', bano: 'Baño' } as const;
export type TipoMeson = keyof typeof TIPOS_MESON;
export type ParametrosMeson = typeof parametrosMesones;
export type CatalogoMesones = {
  materiales: MaterialMeson[];
  parametros: ParametrosMeson;
  parametrosPorTipo?: Record<TipoMeson, ParametrosMeson>;
};

export function parametrosParaMeson(catalogo: CatalogoMesones, tipo: TipoMeson) {
  return catalogo.parametrosPorTipo?.[tipo] ?? catalogo.parametros;
}

export function mueblesDelTipo(muebles: readonly MuebleParaMeson[], tipo?: TipoMeson) {
  if (tipo === 'isla') return [];
  return muebles.filter(m => !tipo || !m.categoria || m.categoria === (tipo === 'bano' ? 'vanity' : 'inferior'));
}

const colombia: [string, string, number | null][] = [
  ['marmol', 'Mármol Crema Marfil', null],
  ['granito-col', 'Granito Gris Concreto', 180000],
  ['polar', 'Quarztone Blanco Polar', 194000],
  ['titan', 'Quarztone Gris Titan', 226890],
  ['statuario', 'Sinterizado Statuario Mate', null],
  ['black', 'Sinterizado Absolute Black', null],
  ['bulgaria', 'Sinterizado Bulgaria Black', null],
  ['white', 'Sinterizado Absolute White', null],
  ['creame', 'Sinterizado Absolute Creame', null],
  ['grey', 'Sinterizado Absolute Grey', null],
];

export const catalogoInicialMesones: CatalogoMesones = {
  parametros: parametrosMesones,
  materiales: [
    ...colombia.map(([id, nombre, material]): MaterialMeson => ({
      id, nombre, material, origen: 'COL', empaque: material === null ? 0 : 16357,
      produccion: 0, pulido: material === null ? 0 : 77800,
      huecoPulido: material === null ? 0 : 50000, hueco: material === null ? 0 : 30000,
    })),
    { id: 'granito-us', nombre: 'Granito', origen: 'US', material: 7.35, empaque: 0, produccion: 6, pulido: 0, huecoPulido: 25, hueco: 25 },
    { id: 'quarztone-us', nombre: 'Quarztone', origen: 'US', material: 9.9, empaque: 0, produccion: 6, pulido: 0, huecoPulido: 25, hueco: 25 },
  ],
};

export type IslaMeson = {
  largo: number;
  voladizoFrontal: number;
  voladizoLateral: number;
  cantosPulidos: number;
  waterfalls: number;
  mueblesIds: string[];
};

export type ConfiguracionMeson = {
  tipo?: TipoMeson;
  perforacionesEn?: 'fabricacion' | 'instalacion';
  refuerzo?: boolean;
  mueblesExcluidos?: string[];
  profundidad: number;
  backsplash: number;
  espesor: number;
  dishwasher: number | null;
  equipo: 'ninguno' | 'range' | 'cooktop';
  anchoRange: number;
  murosLaterales: number;
  cantosPulidos: number;
  waterfalls: number;
  isla: IslaMeson | null;
  huecos: number;
  pulirHuecos: boolean;
};

export type MuebleParaMeson = { id: string; etiqueta: string; largo: number; categoria?: string };

export function mueblesParaMeson(lineas: readonly {
  id: string; largo: number; cantidad: number; unidad_dim: UnidadDim;
  codigo_modulo?: string | null;
  tipo: { categoria: string | null; pref: string } | null;
}[]): MuebleParaMeson[] {
  return lineas.flatMap(l => {
    if (!l.tipo || !['inferior', 'vanity'].includes(l.tipo.categoria ?? '') || /^(PC|PN|F|TK)/i.test(l.tipo.pref)) return [];
    const largo = toInches(Number(l.largo), l.unidad_dim) * Number(l.cantidad);
    return Number.isFinite(largo) && largo > 0 ? [{ id: l.id, etiqueta: l.codigo_modulo || l.tipo.pref, largo, categoria: l.tipo.categoria ?? undefined }] : [];
  });
}

export function medidasMesonDesdeMuebles(mueblesArea: readonly MuebleParaMeson[], opciones: ConfiguracionMeson): MedidasMeson {
  if (opciones.tipo !== undefined && !Object.hasOwn(TIPOS_MESON, opciones.tipo)) throw new Error('Selecciona un tipo de mesón.');
  if (opciones.tipo === 'isla' && !opciones.isla) throw new Error('Completa las medidas de la isla o península.');
  if (opciones.perforacionesEn !== undefined && !['fabricacion', 'instalacion'].includes(opciones.perforacionesEn)) {
    throw new Error('Selecciona dónde se harán las perforaciones.');
  }
  if (opciones.refuerzo !== undefined && typeof opciones.refuerzo !== 'boolean') throw new Error('Revisa la selección de refuerzo.');
  const muebles = mueblesDelTipo(mueblesArea, opciones.tipo);
  const { dishwasher, equipo, anchoRange, murosLaterales, cantosPulidos, waterfalls, isla, profundidad, backsplash } = opciones;
  const entero = (n: number, max = Infinity) => Number.isInteger(n) && n >= 0 && n <= max;
  if (!['ninguno', 'range', 'cooktop'].includes(equipo) || (equipo === 'range' && !(anchoRange > 0 && Number.isFinite(anchoRange))) ||
    (dishwasher !== null && !(dishwasher > 0 && Number.isFinite(dishwasher))) ||
    !entero(murosLaterales, 2) || !entero(cantosPulidos) || !entero(waterfalls, 2) || !entero(opciones.huecos)) {
    throw new Error('Revisa los electrodomésticos y las cantidades del mesón.');
  }
  const mueblesIsla = new Set(isla?.mueblesIds);
  if (isla && (!(isla.largo > 0) || [isla.largo, isla.voladizoFrontal, isla.voladizoLateral].some(v => !Number.isFinite(v) || v < 0) ||
    !entero(isla.cantosPulidos) || !entero(isla.waterfalls, 2) || [...mueblesIsla].some(id => !muebles.some(m => m.id === id)))) {
    throw new Error('Revisa las medidas y los muebles asignados a la isla.');
  }
  const excluidos = new Set(opciones.mueblesExcluidos);
  const largoMuebles = muebles.reduce((total, m) =>
    total + (mueblesIsla.has(m.id) || excluidos.has(m.id) ? 0 : m.largo), 0);
  if (!largoMuebles && !isla) throw new Error('Agrega muebles inferiores al área para calcular el largo.');
  if (!largoMuebles && (dishwasher !== null || equipo === 'range' || murosLaterales || cantosPulidos || waterfalls)) {
    throw new Error('El lavavajillas, el Range, los muros y los acabados del tramo principal requieren muebles inferiores fuera de la isla.');
  }
  const largo = largoMuebles + (dishwasher ?? 0);
  const cantonera = profundidad + backsplash;
  const largoDelTramo = opciones.tipo === 'isla' && isla ? isla.largo + isla.voladizoLateral : largo;
  const largoBacksplash = largoDelTramo + (equipo === 'range' ? anchoRange : 0);
  return {
    largo, profundidad, largoBacksplash, backsplash,
    espesor: opciones.espesor, voladizo: 0, extensionLateral: 0, waterfalls,
    cantoExpuesto: cantosPulidos * cantonera + (isla ? isla.cantosPulidos * (profundidad + isla.voladizoFrontal) : 0),
    huecos: opciones.huecos + Number(equipo === 'cooktop'), pulirHuecos: opciones.pulirHuecos,
    opciones,
  };
}

export type MesonGuardado = {
  material: MaterialMeson;
  medidas: MedidasMeson;
  parametros?: ParametrosMeson;
};

export type MedidasMeson = {
  largo: number;
  profundidad: number;
  largoBacksplash: number;
  backsplash: number;
  espesor: number;
  voladizo: number;
  extensionLateral: number;
  waterfalls: number;
  cantoExpuesto: number;
  huecos: number;
  pulirHuecos: boolean;
  opciones?: ConfiguracionMeson;
};

export function validarCatalogoMesones(catalogo: CatalogoMesones) {
  for (const tipo of Object.keys(TIPOS_MESON) as TipoMeson[]) {
    const parametros = parametrosParaMeson(catalogo, tipo);
    for (const key of Object.keys(parametrosMesones) as (keyof typeof parametrosMesones)[]) {
      const valor = parametros[key];
      if (!Number.isFinite(valor) || valor < 0 || (key.startsWith('margen') && valor >= 100)) {
        throw new Error('Revisa los parámetros. Los márgenes deben ser menores que 100 %.');
      }
    }
  }
  if (new Set(catalogo.materiales.map(m => m.id)).size !== catalogo.materiales.length) throw new Error('Hay materiales repetidos.');
  for (const m of catalogo.materiales) {
    if (!m.id || !m.nombre.trim() || !['COL', 'US'].includes(m.origen) ||
      (m.material !== null && !(Number.isFinite(m.material) && m.material > 0)) ||
      [m.empaque, m.produccion, m.pulido, m.hueco, m.huecoPulido].some(v => !Number.isFinite(v) || v < 0)) {
      throw new Error('Revisa el nombre, origen y costos de los materiales.');
    }
  }
}

export function calcularMeson(d: MedidasMeson, m: MaterialMeson, p: CatalogoMesones['parametros'], trm: number, descuento = 0) {
  const medidas = [d.largo, d.profundidad, d.largoBacksplash, d.backsplash, d.espesor, d.voladizo,
    d.extensionLateral, d.waterfalls, d.cantoExpuesto, d.huecos];
  if (medidas.some(v => !Number.isFinite(v) || v < 0) || (!d.largo && !d.opciones?.isla) || !d.profundidad || !d.espesor ||
    !Number.isInteger(d.waterfalls) || d.waterfalls > 2 || !Number.isInteger(d.huecos)) {
    throw new Error('Revisa las medidas y cantidades del tramo.');
  }
  if (!m.material) throw new Error('El material todavía no tiene tarifa.');
  if (!(Number.isFinite(trm) && trm > 0)) throw new Error('La cotización necesita una TRM positiva.');
  if (!Number.isFinite(descuento) || descuento > 1) throw new Error('El descuento de la cotización no es válido.');
  const fondo = d.profundidad + d.voladizo;
  const largo = d.largo + d.extensionLateral;
  const isla = d.opciones?.isla;
  const fondoIsla = isla ? d.profundidad + isla.voladizoFrontal : 0;
  const superficieIsla = isla ? (isla.largo + isla.voladizoLateral + isla.waterfalls * p.alturaWaterfall) * fondoIsla : 0;
  const muros = (d.opciones?.murosLaterales ?? 0) * d.profundidad * (3 + d.backsplash);
  const superficie = largo * fondo + d.largoBacksplash * d.backsplash + d.waterfalls * fondo * p.alturaWaterfall
    + superficieIsla + muros;
  const reforzado = d.opciones?.refuerzo ?? d.espesor === p.espesorReforzado;
  const refuerzo = reforzado ? d.cantoExpuesto * p.suplementoCanto : 0;
  const huecosFabricacion = d.opciones?.perforacionesEn === 'instalacion' ? 0 : d.huecos;
  const areaSqft = (superficie + refuerzo) / 144 * (1 + p.merma / 100);
  const piesPulidos = d.cantoExpuesto / 12;
  const col = m.origen === 'COL';
  const materialUsd = (m.material + m.empaque) / (col ? 10.76 * trm : 1);
  const produccionUsd = m.produccion / (col ? 10.76 * trm : 1);
  const pulidoUsd = m.pulido / (col ? 3.28 * trm : 1);
  const huecoUsd = (d.pulirHuecos ? m.huecoPulido : m.hueco) / (col ? trm : 1);
  const conceptos = [
    { costo: materialUsd * areaSqft, interno: col ? p.margenFpk : 0, comercial: p.margenMaterial },
    { costo: produccionUsd * areaSqft, interno: 0, comercial: p.margenProduccion },
    { costo: pulidoUsd * piesPulidos, interno: col ? p.margenMaquila : 0, comercial: p.margenAcabados },
    { costo: huecoUsd * huecosFabricacion, interno: col ? p.margenMaquila : 0, comercial: p.margenAcabados },
  ];
  const costoUsd = conceptos.reduce((total, c) => total + c.costo, 0);
  const precioUsd = conceptos.reduce((total, c) => total + c.costo / (1 - c.interno / 100) / (1 - c.comercial / 100), 0) * (1 - descuento);
  if (![areaSqft, costoUsd * trm, precioUsd * trm].every(Number.isFinite)) throw new Error('El cálculo supera el rango admitido.');
  return { areaSqft, piesPulidos, costoUsd, precioUsd, costoCop: costoUsd * trm, precioCop: precioUsd * trm };
}
