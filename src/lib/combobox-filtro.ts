// Filtro del desplegable con buscador (`src/components/Combobox.tsx`).
//
// Vive aparte del componente para poder probarlo: el componente necesita DOM y el
// repositorio corre las pruebas con `node:test` sin navegador.

export type OpcionFiltrable = { value: string; label: string; searchText?: string };

/** Quita tildes y pasa a minúsculas, para que "boynton" encuentre "Boyntón". */
export const normalizarBusqueda = (valor: string) => valor
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase();

/**
 * Opciones que coinciden con lo escrito.
 *
 * Sin texto devuelve **todas**: abrir el desplegable tiene que mostrar la lista
 * completa, no la opción ya elegida.
 *
 * Con texto se exige que estén **todas las palabras**, en cualquier orden y en
 * cualquier parte de la etiqueta o del texto de búsqueda. Así "boynton coastland"
 * encuentra la cotización aunque el cliente vaya después del nombre, y "sunset
 * jimenez" encuentra la otra.
 */
export function filtrarOpciones<T extends OpcionFiltrable>(opciones: readonly T[], texto: string): T[] {
  const palabras = normalizarBusqueda(texto).trim().split(/\s+/).filter(Boolean);
  if (!palabras.length) return [...opciones];
  return opciones.filter((o) => {
    const heno = normalizarBusqueda(`${o.label} ${o.searchText ?? ''}`);
    return palabras.every((p) => heno.includes(p));
  });
}
