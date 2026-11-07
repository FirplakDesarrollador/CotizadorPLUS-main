/** Regla de fabricación por espesor real del catálogo; prevalece sobre todo canto elegido. */
export function noLlevaCanto(espesorMm: unknown): boolean {
  const espesor = Number(String(espesorMm ?? '').trim().replace(',', '.'));
  return [4.5, 5.5, 6, 9].some(mm => Math.abs(espesor - mm) < 1e-6);
}

/** Detecta resultados antiguos al sincronizar/restaurar, sin modificar el snapshot original. */
export function cumpleReglaCantosDelgados(breakdown: { piezas?: { rol: string; cantoLargos?: number; cantoAnchos?: number; cantoCalibre?: string | null }[] } | null | undefined, preset: Record<string, string>, tableros: readonly { codigo: string; espesor_mm?: number | null }[]): boolean {
  return (breakdown?.piezas ?? []).every(p => !noLlevaCanto(tableros.find(t => t.codigo === preset[p.rol])?.espesor_mm)
    || (Number(p.cantoLargos ?? 0) === 0 && Number(p.cantoAnchos ?? 0) === 0 && !p.cantoCalibre));
}
