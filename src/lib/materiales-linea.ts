// Líneas de material suelto: tablero, canto o herraje añadidos a una cocina sin
// pasar por un módulo. Sirven para cobrar lo que no sale del despiece — un
// repuesto, un sobrante, herraje adicional.
//
// Vive aparte de `cotizaciones.ts` para poder probarse: aquel importa
// `server-only` y no se carga desde un test. La regla que contiene es de
// precio, así que necesita prueba.

export type TipoMaterial = 'tablero' | 'canto' | 'herraje';

// Cada catálogo cobra en su propia unidad, y su tarifa ya está expresada en
// ella: `cot_tableros.precio_m2` por metro cuadrado, `cot_cantos.precio` por
// metro lineal y `cot_herrajes.precio` por unidad.
export const UNIDAD_MATERIAL: Record<TipoMaterial, string> = {
  tablero: 'm²',
  canto: 'm',
  herraje: 'und',
};

export const ETIQUETA_MATERIAL: Record<TipoMaterial, string> = {
  tablero: 'Tablero',
  canto: 'Canto',
  herraje: 'Herraje',
};

export type MaterialLinea = {
  tipo: TipoMaterial;
  /** Código del tablero, calibre del canto o código del herraje. */
  codigo: string;
  /** En la unidad natural del tipo: m², metros lineales o unidades. */
  cantidad: number;
  /** Tarifa de catálogo, por esa misma unidad, en COP. */
  precioUnitarioCop: number;
};

export type PreciosLinea = {
  costoSinHerrajes: number;
  costoHerrajes: number;
  costoConHerrajes: number;
  precioCop: number;
  precioUsd: number;
  precioConHerrajesCop: number;
  precioConHerrajesUsd: number;
};

// El herraje se cobra con `margen_herraje`; el tablero y el canto con
// `margen_muebles`, igual que dentro de un módulo.
export function margenDeMaterial(
  tipo: TipoMaterial,
  margenMuebles: number,
  margenHerraje: number,
): number {
  return tipo === 'herraje' ? margenHerraje : margenMuebles;
}

/**
 * Precio de una línea de material, con la misma cadena que `engine.ts`: margen
 * sobre precio (`costo / (1 - margen)`) y el descuento del proyecto aplicado
 * después, solo sobre el valor en USD, tal como hace el motor.
 *
 * El costo se reparte igual que en un módulo: un herraje suma a `costoHerrajes`
 * y el resto a `costoSinHerrajes`, de modo que las columnas "s/H" y "c/H" de la
 * cotización siguen significando lo mismo.
 */
export function calcularPrecioMaterial(
  linea: MaterialLinea,
  opciones: { margenMuebles: number; margenHerraje: number; trm: number; descuento?: number },
): PreciosLinea {
  const { margenMuebles, margenHerraje, trm, descuento = 0 } = opciones;
  const costo = Math.max(0, linea.cantidad) * Math.max(0, linea.precioUnitarioCop);
  const esHerraje = linea.tipo === 'herraje';
  const margen = margenDeMaterial(linea.tipo, margenMuebles, margenHerraje);
  // Un margen de 1 (100%) dividiría por cero; se trata como "sin margen".
  const precio = margen > 0 && margen < 1 ? costo / (1 - margen) : costo;
  const descF = 1 - descuento;
  const aUsd = (cop: number) => (trm > 0 ? (cop * descF) / trm : 0);

  return {
    costoSinHerrajes: esHerraje ? 0 : costo,
    costoHerrajes: esHerraje ? costo : 0,
    costoConHerrajes: costo,
    // "Sin herrajes" solo lleva valor cuando la línea no es un herraje.
    precioCop: esHerraje ? 0 : precio,
    precioUsd: esHerraje ? 0 : aUsd(precio),
    precioConHerrajesCop: precio,
    precioConHerrajesUsd: aUsd(precio),
  };
}

/** Texto de la línea en la cotización: `Herraje BISAGRAPAR · 12 und`. */
export function descripcionMaterial(linea: Pick<MaterialLinea, 'tipo' | 'codigo' | 'cantidad'>): string {
  const cantidad = Number(linea.cantidad);
  // Se muestran hasta tres decimales, sin ceros de relleno: 2,5 m² y no 2,500.
  const texto = Number.isInteger(cantidad) ? String(cantidad) : String(Number(cantidad.toFixed(3)));
  return `${ETIQUETA_MATERIAL[linea.tipo]} ${linea.codigo} · ${texto} ${UNIDAD_MATERIAL[linea.tipo]}`;
}

/**
 * Si un grupo debe saltarse el recálculo del motor.
 *
 * Las líneas de material no tienen módulo que recalcular, y pasarlas por el
 * motor lanzaría "Tipo de mueble no encontrado", tumbando el recálculo de toda
 * la cotización. Se comprueba con `some` y no con `every` para fallar del lado
 * seguro: si alguna quedara mezclada con módulos, se deja el grupo intacto en
 * vez de reventar. `agregarLineaMaterial` las pone siempre solas en su grupo.
 */
export function grupoSeSaltaElMotor(
  lineas: readonly { tipo_mueble_id: string | null }[],
): boolean {
  return lineas.some((l) => !l.tipo_mueble_id);
}
