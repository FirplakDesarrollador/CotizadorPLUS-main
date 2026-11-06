/** Las variantes comerciales y sus subtipologías pertenecen a la misma familia DB. */
export function usaTableroGaveta(pref: string | null | undefined): boolean {
  return /^DB(?:-|$)/i.test(String(pref ?? '').trim());
}
export function herrajesFijosDbFe(pref: string | null | undefined): boolean {
  return /^DB(?:-.*)?-FE(?:-SF)?$/i.test(String(pref ?? '').trim());
}
const PIEZAS_GAVETA = new Set(['base_gaveta', 'trasero_gaveta_pequena', 'trasero_gaveta_grande']);
export function piezasConTableroGaveta<T extends { nombre: string; rol_tablero: string }>(piezas: readonly T[], pref: string): T[] {
  return piezas.map(p => usaTableroGaveta(pref) && PIEZAS_GAVETA.has(p.nombre) ? { ...p, rol_tablero: 'gaveta' } : p);
}
/** Solo equivalencia exacta de referencia y espesor; nunca cambia color por similitud. */
export function tableroGaveta15(codigoCaja: string | undefined, tableros: readonly { codigo: string; espesor_mm?: number | null }[]): string {
  if (!codigoCaja) return '';
  const actual = tableros.find(t => t.codigo === codigoCaja);
  if (Number(actual?.espesor_mm) === 15) return codigoCaja;
  const equivalente = codigoCaja.replace(/18(?=[^0-9]|$)/, '15');
  return tableros.find(t => t.codigo === equivalente && Number(t.espesor_mm) === 15)?.codigo ?? '';
}
