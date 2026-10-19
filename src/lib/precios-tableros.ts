export type PreciosTablerosCotizacion = Record<string, number>;

type TableroConPrecio = { codigo: string; precio_m2: number };

export function normalizarPreciosTableros(value: unknown): PreciosTablerosCotizacion {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: PreciosTablerosCotizacion = {};
  for (const [codigo, raw] of Object.entries(value as Record<string, unknown>)) {
    const precio = Number(raw);
    if (codigo.trim() && Number.isFinite(precio) && precio >= 0) result[codigo] = precio;
  }
  return result;
}

/**
 * Crea un catálogo aislado para un cálculo. Nunca modifica los objetos que
 * vienen del catálogo global de Supabase.
 */
export function aplicarPreciosTableros<T extends TableroConPrecio>(
  tableros: Record<string, T>,
  precios: unknown,
): Record<string, T> {
  const overrides = normalizarPreciosTableros(precios);
  if (Object.keys(overrides).length === 0) return tableros;
  const result = { ...tableros };
  for (const [codigo, precio_m2] of Object.entries(overrides)) {
    const tablero = tableros[codigo];
    if (tablero) result[codigo] = { ...tablero, precio_m2 };
  }
  return result;
}

export function precioTableroCotizacion(
  codigo: string,
  tableros: readonly TableroConPrecio[],
  precios: unknown,
): number | null {
  const overrides = normalizarPreciosTableros(precios);
  if (codigo in overrides) return overrides[codigo];
  const catalogo = tableros.find((tablero) => tablero.codigo === codigo)?.precio_m2;
  return catalogo == null || !Number.isFinite(Number(catalogo)) ? null : Number(catalogo);
}
