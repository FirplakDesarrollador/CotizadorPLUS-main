export const CAPACIDAD_CONTENEDOR_KG = 22500;
export const DENSIDAD_TABLERO_KG_M3 = 720;
export const FACTOR_PESO_NETO = 0.9775;

export type TableroPeso = { codigo: string; espesor_mm: number | null; densidad_kg_m3?: number | null };
export type MaderaRol = { rol: string; codigo: string; cm2: number };
export type LineaPeso = {
  cantidad: number;
  breakdown?: { maderaPorRol?: MaderaRol[] } | Record<string, unknown> | null;
  clasificacion?: 'mueble' | 'herrajes_otros';
};
export type AreaPeso = { nombre: string; cantidad: number; lineas: LineaPeso[] };
export type ParametrosContenedores = { capacidadKg: number; densidadKgM3: number; factorPeso: number };
export type DetalleAreaContenedores = {
  area: string;
  repeticiones: number;
  unidades: number;
  pesoKg: number;
  pesoPorUnidadKg: number | null;
};
export type ResultadoContenedores = {
  pesoTotalKg: number;
  pesoPorUnidadKg: number | null;
  unidadesTotales: number;
  contenedores: number;
  ocupacionPct: number;
  capacidadKg: number;
  advertencias: string[];
  detallePorArea: DetalleAreaContenedores[];
};

function cantidadValida(cantidad: number | null | undefined): number {
  if (cantidad == null || Number.isNaN(cantidad)) return 1;
  return Number.isFinite(cantidad) ? Math.max(0, cantidad) : 0;
}

function positivo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0;
}

function promedio(pesoKg: number, unidades: number): number | null {
  const kg = pesoKg / unidades;
  return unidades > 0 && Number.isFinite(kg) ? kg : null;
}

export function calcularContenedores(
  areas: readonly AreaPeso[],
  tableros: readonly TableroPeso[],
  parametros: Partial<ParametrosContenedores> = {},
): ResultadoContenedores {
  const capacidad = parametros.capacidadKg ?? CAPACIDAD_CONTENEDOR_KG;
  const capacidadKg = positivo(capacidad) ? capacidad : 0;
  const densidadKgM3 = parametros.densidadKgM3 ?? DENSIDAD_TABLERO_KG_M3;
  const factorPeso = parametros.factorPeso ?? FACTOR_PESO_NETO;
  const porCodigo = new Map(tableros.map(tablero => [tablero.codigo, tablero]));
  const advertencias = new Set<string>();
  if (!capacidadKg) advertencias.add('Capacidad por contenedor inválida.');

  function sumar(total: number, aporte: number): number {
    const suma = total + aporte;
    if (Number.isFinite(suma)) return suma;
    advertencias.add('Se omitió un valor fuera del rango numérico.');
    return total;
  }

  let pesoTotalKg = 0;
  let unidadesTotales = 0;
  const detallePorArea = areas.map(({ nombre: area, cantidad, lineas }) => {
    const repeticiones = cantidadValida(cantidad);
    let unidades = 0;
    let pesoKg = 0;

    for (const [indice, linea] of lineas.entries()) {
      if (linea.clasificacion === 'herrajes_otros') continue;
      const piezas = cantidadValida(linea.cantidad) * repeticiones;
      unidades = sumar(unidades, piezas);
      if (!positivo(piezas)) continue;

      const madera = linea.breakdown?.maderaPorRol;
      if (!Array.isArray(madera) || madera.length === 0) {
        advertencias.add(`Línea sin despiece (${area}, línea ${indice + 1}).`);
        continue;
      }

      for (const fila of madera) {
        if (!positivo(fila?.cm2)) continue;
        const tablero = porCodigo.get(fila.codigo);
        const espesor = tablero?.espesor_mm;
        if (!positivo(espesor)) {
          advertencias.add(`Tablero sin espesor válido o fuera del catálogo (${fila.codigo}).`);
          continue;
        }
        const densidad = tablero?.densidad_kg_m3 ?? densidadKgM3;
        if (!positivo(densidad) || !Number.isFinite(factorPeso) || factorPeso < 0) {
          advertencias.add(`Densidad o factor de peso inválido (${fila.codigo}).`);
          continue;
        }
        pesoKg = sumar(pesoKg, (fila.cm2 / 10000) * (espesor / 1000) * densidad * factorPeso * piezas);
      }
    }

    unidadesTotales = sumar(unidadesTotales, unidades);
    pesoTotalKg = sumar(pesoTotalKg, pesoKg);
    return { area, repeticiones, unidades, pesoKg, pesoPorUnidadKg: promedio(pesoKg, unidades) };
  });

  const carga = capacidadKg > 0 ? pesoTotalKg / capacidadKg : 0;
  const contenedores = sumar(0, Math.ceil(carga));
  return {
    pesoTotalKg,
    pesoPorUnidadKg: promedio(pesoTotalKg, unidadesTotales),
    unidadesTotales,
    contenedores,
    ocupacionPct: contenedores > 0 ? (carga / contenedores) * 100 : 0,
    capacidadKg,
    advertencias: [...advertencias],
    detallePorArea,
  };
}
