// Cuántos cortes cuesta una lámina ya acomodada.
//
// Fase 2 del plan (`docs/plan_optimizador_corte.md`), la parte que faltaba junto a
// `guillotina.ts`. Módulo puro, probado con tests.
//
// El acomodo es por franjas, así que la secuencia de la seccionadora es siempre la
// misma y los cortes se pueden contar sin simular la máquina:
//
//   refilado → 1.er nivel (libera la franja, de lado a lado)
//            → 2.º nivel (separa las piezas dentro de la franja)
//            → 3.er nivel (recorta la pieza más baja que su franja)
//
// **Es un modelo, no una medición.** Los niveles de la Holz-Her siguen pendientes
// de confirmar con planta (plan, §4.1), así que este número sirve para comparar
// acomodos entre sí, no para prometerle un tiempo de máquina a producción.
import type { ConfigOptimizador, FormatoLamina } from './config';
import type { Patron } from './guillotina';

export type Cortes = {
  /** Los dos cantos que escuadran la lámina antes de empezar. */
  refilado: number;
  /** Transversales: uno por franja, de lado a lado. */
  nivel1: number;
  /** Longitudinales: separan las piezas dentro de cada franja. */
  nivel2: number;
  /** Recorte de las piezas más bajas que su franja. */
  nivel3: number;
  total: number;
};

const CERO: Cortes = { refilado: 0, nivel1: 0, nivel2: 0, nivel3: 0, total: 0 };
const TOL = 1; // mm: por debajo de esto no hay corte que valga la pena contar.

/** Cortes de una lámina con este acomodo (una sola pasada, sin contar la pila). */
export function cortesDeLamina(patron: Patron, formato: FormatoLamina, cfg: ConfigOptimizador): Cortes {
  if (!patron.colocaciones.length) return CERO;
  // Con el primer corte a lo ancho (`transpuesta`) las franjas corren sobre el eje y:
  // se leen las coordenadas en el sistema de la franja para contar igual en los dos casos.
  const t = patron.transpuesta === true;
  const X1 = (t ? formato.anchoMm : formato.largoMm) - cfg.refiladoMm;
  const pos = (c: Patron['colocaciones'][number]) => (t
    ? { a: c.y, b: c.x, largo: c.anchoMm, alto: c.largoMm }
    : { a: c.x, b: c.y, largo: c.largoMm, alto: c.anchoMm });

  // Franja y columna vienen del acomodo. Si faltan (patrones antiguos), la franja se
  // reconoce por su coordenada de inicio y cada pieza es su propia columna.
  const franjas = new Map<string, Map<string, ReturnType<typeof pos>[]>>();
  patron.colocaciones.forEach((c, i) => {
    const p = pos(c);
    const kf = c.franja != null ? `f${c.franja}` : `y${Math.round(p.b)}`;
    const kc = c.columna != null ? `c${c.columna}` : `i${i}`;
    const cols = franjas.get(kf) ?? new Map<string, ReturnType<typeof pos>[]>();
    cols.set(kc, [...(cols.get(kc) ?? []), p]);
    franjas.set(kf, cols);
  });

  let nivel2 = 0;
  let nivel3 = 0;
  for (const cols of franjas.values()) {
    const piezas = [...cols.values()].flat();
    const inicio = Math.min(...piezas.map((p) => p.b));
    const alto = Math.max(...piezas.map((p) => p.b + p.alto)) - inicio;
    const derecha = Math.max(...piezas.map((p) => p.a + p.largo));
    // n columnas en fila: n-1 cortes entre ellas, y uno más si queda sobrante al borde.
    nivel2 += cols.size - 1 + (X1 - derecha > TOL ? 1 : 0);
    for (const col of cols.values()) {
      const ancho = Math.max(...col.map((p) => p.largo));
      const ocupado = Math.max(...col.map((p) => p.b + p.alto)) - inicio;
      // Piezas apiladas: un corte entre cada dos, uno si sobra alto encima de la
      // última y un recorte por pieza más angosta que su columna (solo con 4 niveles).
      nivel3 += col.length - 1 + (alto - ocupado > TOL ? 1 : 0)
        + col.filter((p) => ancho - p.largo > TOL).length;
    }
  }

  const refilado = cfg.refiladoMm > 0 ? 2 : 0;
  const nivel1 = franjas.size;
  return { refilado, nivel1, nivel2, nivel3, total: refilado + nivel1 + nivel2 + nivel3 };
}

/**
 * Cortes de un patrón contando la pila: la seccionadora corta varias láminas
 * idénticas de una vez, así que un patrón repetido 4 veces con pila de 4 cuesta
 * una sola pasada. Sin dato de pila se cuenta lámina por lámina.
 */
export function pasadasDePatron(repeticiones: number, laminasPorPila: number | null): number {
  const pila = laminasPorPila != null && laminasPorPila > 0 ? laminasPorPila : 1;
  return Math.ceil(Math.max(0, repeticiones) / pila);
}

export function sumarCortes(a: Cortes, b: Cortes): Cortes {
  return {
    refilado: a.refilado + b.refilado,
    nivel1: a.nivel1 + b.nivel1,
    nivel2: a.nivel2 + b.nivel2,
    nivel3: a.nivel3 + b.nivel3,
    total: a.total + b.total,
  };
}

export function escalarCortes(c: Cortes, veces: number): Cortes {
  return {
    refilado: c.refilado * veces, nivel1: c.nivel1 * veces,
    nivel2: c.nivel2 * veces, nivel3: c.nivel3 * veces, total: c.total * veces,
  };
}

export const CORTES_CERO = CERO;

/** Cortes de todos los patrones de un material, pila incluida. */
export function cortesDeMaterial(
  patrones: readonly Patron[], formato: FormatoLamina, laminasPorPila: number | null, cfg: ConfigOptimizador,
): Cortes {
  return patrones.reduce(
    (acc, p) => sumarCortes(acc, escalarCortes(cortesDeLamina(p, formato, cfg), pasadasDePatron(p.repeticiones, laminasPorPila))),
    CERO,
  );
}
