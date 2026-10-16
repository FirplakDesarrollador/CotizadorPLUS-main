// Cómo se agrupa la "Programación de módulos" de la propuesta.
//
// La tabla era una lista plana de SKU. Producción y el cliente leen cosas
// distintas en ella —cuántos muebles, cuántos paneles, cuántos fillers— y sacar
// ese conteo a mano de una lista de cien renglones es trabajo perdido.

export type GrupoProgramacion = 'muebles' | 'paneles' | 'filler' | 'herrajes';

export const TITULO_GRUPO: Record<GrupoProgramacion, string> = {
  muebles: 'Muebles',
  paneles: 'Paneles',
  filler: 'Filler',
  herrajes: 'Herrajes',
};

// El orden del documento. Los muebles primero, que es el grueso.
export const ORDEN_GRUPOS: readonly GrupoProgramacion[] = ['muebles', 'paneles', 'filler', 'herrajes'];

/** Letras iniciales del prefijo o del código completo: `PN2496` → `PN`. */
function letrasIniciales(valor: string | null | undefined): string {
  return String(valor ?? '').trim().toUpperCase().match(/^[A-Z]+/)?.[0] ?? '';
}

/**
 * A qué bloque va una línea.
 *
 * Una línea **sin prefijo** es material suelto —lo que se agrega con "Agregar
 * herrajes/otros"— y va al bloque de herrajes. Todo lo demás que no sea panel ni
 * filler es un mueble, incluidos los zócalos: el usuario pidió cuatro bloques y
 * no se inventa un quinto.
 */
export function grupoDeLinea(pref: string | null | undefined): GrupoProgramacion {
  const letras = letrasIniciales(pref);
  if (!letras) return 'herrajes';
  if (letras === 'PN') return 'paneles';
  if (letras === 'F') return 'filler';
  return 'muebles';
}

export type FilaProgramacion = { sku: string; description: string; quantity: number; grupo: GrupoProgramacion };

export type BloqueProgramacion = {
  grupo: GrupoProgramacion;
  titulo: string;
  filas: FilaProgramacion[];
  /** Suma de las cantidades del bloque, que es lo que se pidió al final de cada uno. */
  total: number;
};

/** Agrupa las filas en bloques, en el orden del documento. Los vacíos no salen. */
export function bloquesDeProgramacion(filas: readonly FilaProgramacion[]): BloqueProgramacion[] {
  return ORDEN_GRUPOS
    .map((grupo) => {
      const propias = filas.filter((f) => f.grupo === grupo);
      return {
        grupo,
        titulo: TITULO_GRUPO[grupo],
        filas: propias,
        total: Math.round(propias.reduce((s, f) => s + (Number.isFinite(f.quantity) ? f.quantity : 0), 0) * 100) / 100,
      };
    })
    .filter((b) => b.filas.length > 0);
}
