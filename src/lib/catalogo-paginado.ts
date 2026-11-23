/** Lee todas las páginas sin truncar el catálogo al límite de PostgREST. */
export async function leerCatalogoPaginado<T>(
  pagina: (desde: number, hasta: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ data: T[] }> {
  const data: T[] = [];
  const size = 1000;
  for (let desde = 0; ; desde += size) {
    const result = await pagina(desde, desde + size - 1);
    if (result.error) throw new Error(`No se pudo cargar el catálogo: ${result.error.message}`);
    const rows = result.data ?? [];
    data.push(...rows);
    if (rows.length < size) return { data };
  }
}
