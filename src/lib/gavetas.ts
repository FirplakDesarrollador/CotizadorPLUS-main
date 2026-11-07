import type { Pieza } from './engine';

export const LARGO_LATERAL_FE = '(P >= 24-0.000000001 ? 500 : P >= 21-0.000000001 ? 450 : 350)/25.4';

/** Dimensiones FE en pulgadas; conserva alturas, aristas y materiales de cada variante. */
export function ajustarGavetasFe(piezas: readonly Pieza[], pref: string, preset: Record<string, string>, cantoCaja?: string): Pieza[] {
  // El refuerzo compartido debe resolver el mismo canto también en grupos mixtos.
  const conCanto = piezas.map(p => p.rol_tablero === 'refuerzo' && cantoCaja && (preset.refuerzo ?? preset.caja) === preset.caja && p.cantos?.calibre && !p.cantos.forceCalibre
    ? { ...p, cantos: { ...p.cantos, calibre: cantoCaja, forceCalibre: true } } : p);
  if (!herrajesFijosDbFe(pref)) return conCanto;
  const rolLateral = piezas.find(p => /^lateral_gaveta(?:_|$)/.test(p.nombre))?.rol_tablero;
  const espesorLateral = rolLateral === 'refuerzo' ? 'TR' : 'TC';
  return conCanto.map(original => {
    let p = original;
    if (/^lateral_gaveta(?:_|$)/.test(p.nombre)) p = { ...p, formula_largo: LARGO_LATERAL_FE };
    if (/^(trasero_gaveta|contraparche)(_|$)/.test(p.nombre)) p = { ...p, formula_largo: `L-2*TC-26/25.4-2*${espesorLateral}` };
    if (p.nombre === 'fondo_gaveta' || p.nombre === 'base_gaveta') p = { ...p, formula_largo: `(${LARGO_LATERAL_FE})-8/25.4` };
    return p;
  });
}

/** Las variantes comerciales y sus subtipologías pertenecen a la misma familia DB. */
export function usaTableroGaveta(pref: string | null | undefined): boolean {
  return /^DB(?:-|$)/i.test(String(pref ?? '').trim()) && !/^DB-FE(?:-SF)?$/i.test(String(pref ?? '').trim());
}
export function herrajesFijosDbFe(pref: string | null | undefined): boolean {
  return /^DB(?:-.*)?-FE(?:-SF)?$/i.test(String(pref ?? '').trim());
}
const PIEZAS_GAVETA = new Set(['base_gaveta', 'trasero_gaveta_pequena', 'trasero_gaveta_grande']);
export function piezasConTableroGaveta<T extends { nombre: string; rol_tablero: string }>(piezas: readonly T[], pref: string): T[] {
  return piezas.map(p => {
    // En FE el piso del cajón comparte referencia y espesor con el respaldo,
    // incluso en variantes SF o cuando se omite el respaldo exterior.
    if (herrajesFijosDbFe(pref) && /^(base_gaveta|fondo_gaveta)(_|$)/.test(p.nombre)) return { ...p, rol_tablero: 'fondo' };
    if (/^DB-FE(?:-SF)?$/i.test(pref) && /^(contraparche|lateral_gaveta|trasero_gaveta)(_|$)/.test(p.nombre)) return { ...p, rol_tablero: 'caja' };
    return usaTableroGaveta(pref) && PIEZAS_GAVETA.has(p.nombre) ? { ...p, rol_tablero: 'gaveta' } : p;
  });
}
/** Solo equivalencia exacta de referencia y espesor; nunca cambia color por similitud. */
export function tableroGaveta15(codigoCaja: string | undefined, tableros: readonly { codigo: string; espesor_mm?: number | null }[]): string {
  if (!codigoCaja) return '';
  const actual = tableros.find(t => t.codigo === codigoCaja);
  if (Number(actual?.espesor_mm) === 15) return codigoCaja;
  const equivalente = codigoCaja.replace(/18(?=[^0-9]|$)/, '15');
  return tableros.find(t => t.codigo === equivalente && Number(t.espesor_mm) === 15)?.codigo ?? '';
}
