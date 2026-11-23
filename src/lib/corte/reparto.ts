// Búsqueda del reparto de muebles entre días de corte.
//
// Hasta ahora el reparto era codicioso de una sola pasada (`plan-diario.ts`) y el
// optimizador solo barría **el acomodo dado ese reparto**. Medido en el prototipo,
// el margen grande estaba justo aquí: en un proyecto de 288 muebles, repartir mejor
// bajó de 237 a 215 tableros sin tocar el acomodo.
//
// Módulo puro: no sabe de Next, de Supabase ni de guillotina. La evaluación de un
// día entra como función (`evaluarDia`), de modo que la búsqueda se puede probar
// con un evaluador de juguete y el caro se inyecta desde `plan-corte.ts`.
//
// Decisiones de planta vigentes (valores por defecto, prompt §2):
//   D1 meta sobre el total del proyecto · D2 sin sobrantes entre días
//   D3 sin lotes · D4 ritmo exacto · D5 sin días extra
//   D6 una línea con varias unidades sí se reparte, por unidades completas
// Lo que **no** se parte nunca: un grupo físico (`grupoId`), porque sus piezas
// compartidas —el lateral × 1,5— se redondearían dos veces y aparecerían piezas
// que no existen.

export type LineaReparto = {
  lineaId: string;
  /** Unidades a repartir. */
  unidades: number;
  /** Líneas con el mismo grupo van completas al mismo día. */
  grupoId: string | null;
  /** Piezas de una unidad; puede ser fraccionario en módulos agrupados. */
  piezasPorUnidad: number;
};

export type MetricasDia = {
  laminas: number;
  areaPiezasM2: number;
  areaLaminasM2: number;
};

export type EntradaReparto = {
  lineas: readonly LineaReparto[];
  piezasPorDia: number;
  /** Margen sobre el ritmo, en tanto por uno (D4). */
  toleranciaRitmo?: number;
  /** Días además de los que exige el ritmo (D5). */
  diasExtra?: number;
  /** Coste de cortar en un día el vector de unidades por línea. */
  evaluarDia: (unidades: Int32Array) => MetricasDia;
  /**
   * Cota inferior barata de laminas de un dia, sin acomodar: area con sierra
   * dividida por area util. Si se da, los movimientos que ni en el mejor caso
   * mejoran se descartan sin llamar al acomodo, que cuesta 50 veces mas.
   */
  cotaDia?: (unidades: Int32Array) => number;
};

export type Reparto = {
  /** `dias × lineas`: unidades de cada línea en cada día. */
  matriz: Int32Array;
  dias: number;
  lineas: number;
};

export type ResultadoReparto = {
  reparto: Reparto;
  tableros: number;
  costo: number;
  /** Sobre la capacidad del día; 0 en un reparto válido. */
  excesoCapacidad: number;
  iteraciones: number;
  /** Se demostró que no existe mejor (enumeración completa o cota alcanzada). */
  optimo: boolean;
  /** Movimientos descartados por la cota, sin pagar el acomodo. */
  podados: number;
  aciertosCache: number;
  evaluaciones: number;
};

export type OpcionesBusqueda = {
  semilla?: number;
  /** Tope de tiempo en ms. 0 = solo el reparto inicial. */
  tiempoMaxMs?: number;
  /** Tope de movimientos. 0 = sin tope (manda el tiempo). */
  iteracionesMax?: number;
  /** Tamaño del espacio por debajo del cual se enumera en vez de buscar. */
  exactoMax?: number;
  /** Entradas de caché de día antes de empezar a descartar. */
  cacheMax?: number;
  /** Para detener desde fuera (botón «Detener y usar el mejor»). */
  seguirCorriendo?: () => boolean;
};

const r3 = (n: number) => Math.round(n * 1000) / 1000;

export function mulberry32(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Días que exige el ritmo, más los que permita D5. */
export function diasNecesarios(entrada: EntradaReparto): number {
  const total = entrada.lineas.reduce((s, l) => s + l.unidades * l.piezasPorUnidad, 0);
  const ritmo = Math.round(entrada.piezasPorDia);
  if (!(ritmo > 0) || !(total > 0)) return 0;
  return Math.ceil(total / ritmo) + Math.max(0, Math.round(entrada.diasExtra ?? 0));
}

/**
 * Cota inferior de tableros: ni el reparto perfecto baja de aquí.
 *
 * Son dos cotas a la vez y manda la mayor: el área total del material contra la
 * lámina, y el número de días en que ese material aparece —cada día abre lámina
 * propia, porque sin D2 los sobrantes no pasan de un día al siguiente—. La segunda
 * es la que de verdad muerde cuando se corta a diario.
 */
export function cotaInferior(entrada: EntradaReparto): { tableros: number; dias: number } {
  const dias = diasNecesarios(entrada);
  if (dias === 0) return { tableros: 0, dias: 0 };
  // Todo junto en un solo día: la cota de área pura.
  const todo = new Int32Array(entrada.lineas.length);
  entrada.lineas.forEach((l, i) => { todo[i] = l.unidades; });
  return { tableros: entrada.evaluarDia(todo).laminas, dias };
}

// ---------------------------------------------------------------------------
// Bloques: la unidad que se mueve.
// ---------------------------------------------------------------------------

type Bloque = {
  /** Índices de línea que arrastra (más de uno solo en grupos físicos). */
  lineas: number[];
  /** Unidades de cada una de esas líneas. */
  unidades: number[];
  piezas: number;
  /** Un grupo físico va entero; una línea suelta se mueve de a una unidad. */
  atomico: boolean;
};

function armarBloques(lineas: readonly LineaReparto[]): Bloque[] {
  const bloques: Bloque[] = [];
  const grupos = new Map<string, number[]>();

  lineas.forEach((l, i) => {
    if (l.grupoId) {
      grupos.set(l.grupoId, [...(grupos.get(l.grupoId) ?? []), i]);
      return;
    }
    // Línea suelta: cada unidad es un bloque, así se reparte por unidades (D6).
    for (let u = 0; u < l.unidades; u++) {
      bloques.push({ lineas: [i], unidades: [1], piezas: l.piezasPorUnidad, atomico: false });
    }
  });

  for (const idx of grupos.values()) {
    bloques.push({
      lineas: idx,
      unidades: idx.map((i) => lineas[i].unidades),
      piezas: idx.reduce((s, i) => s + lineas[i].unidades * lineas[i].piezasPorUnidad, 0),
      atomico: true,
    });
  }
  return bloques;
}

// ---------------------------------------------------------------------------
// Evaluación con caché. Un movimiento solo toca dos días: se recalculan esos.
// ---------------------------------------------------------------------------

class Evaluador {
  private cache = new Map<string, MetricasDia>();
  aciertos = 0;
  evaluaciones = 0;

  constructor(
    private readonly fn: (u: Int32Array) => MetricasDia,
    private readonly lineas: number,
    private readonly cacheMax: number,
  ) {}

  /** Métricas de un día, con caché por su firma de conteos. */
  dia(matriz: Int32Array, dia: number): MetricasDia {
    const base = dia * this.lineas;
    let clave = '';
    let vacio = true;
    for (let i = 0; i < this.lineas; i++) {
      const n = matriz[base + i];
      if (n !== 0) { clave += i + ':' + n + ','; vacio = false; }
    }
    if (vacio) return { laminas: 0, areaPiezasM2: 0, areaLaminasM2: 0 };

    const ya = this.cache.get(clave);
    if (ya) { this.aciertos++; return ya; }

    const u = new Int32Array(this.lineas);
    for (let i = 0; i < this.lineas; i++) u[i] = matriz[base + i];
    const r = this.fn(u);
    this.evaluaciones++;
    if (this.cache.size >= this.cacheMax) {
      // Descarte simple: se vacía la mitad más vieja en vez de llevar orden de uso.
      let n = 0;
      for (const k of this.cache.keys()) { this.cache.delete(k); if (++n >= this.cacheMax / 2) break; }
    }
    this.cache.set(clave, r);
    return r;
  }
}

// Coste de un día: tableros, más una guía que premia dejar la última lámina llena.
// Sin la guía la búsqueda se estanca en mesetas donde mover algo no cambia el
// número de láminas pero sí acerca a poder quitar una.
function costoDia(m: MetricasDia): number {
  if (m.laminas === 0) return 0;
  const llenado = m.areaLaminasM2 > 0 ? m.areaPiezasM2 / m.areaLaminasM2 : 0;
  return m.laminas + 0.4 * (1 - llenado);
}

/**
 * Reparto codicioso inicial: llena cada día hasta el ritmo, en el orden dado.
 * Es el punto de partida de la búsqueda y también el que se usa para comparar.
 */
function repartoInicial(bloques: Bloque[], dias: number, lineas: number, capacidad: number): Int32Array {
  const matriz = new Int32Array(dias * lineas);
  const carga = new Float64Array(dias);
  for (const b of bloques) {
    let destino = 0;
    for (let d = 0; d < dias; d++) {
      if (carga[d] + b.piezas <= capacidad + 1e-9) { destino = d; break; }
      // Si en ninguno cabe, va al menos cargado: mejor pasarse que perder el bloque.
      if (d === dias - 1) {
        let min = 0;
        for (let k = 1; k < dias; k++) if (carga[k] < carga[min]) min = k;
        destino = min;
      }
    }
    aplicar(matriz, lineas, destino, b, 1);
    carga[destino] += b.piezas;
  }
  return matriz;
}

function aplicar(matriz: Int32Array, lineas: number, dia: number, b: Bloque, signo: number): void {
  for (let k = 0; k < b.lineas.length; k++) matriz[dia * lineas + b.lineas[k]] += signo * b.unidades[k];
}

function piezasDelDia(matriz: Int32Array, lineas: number, dia: number, piezasPorLinea: Float64Array): number {
  let total = 0;
  for (let i = 0; i < lineas; i++) total += matriz[dia * lineas + i] * piezasPorLinea[i];
  return total;
}

/**
 * Busca el reparto que menos tableros gasta.
 *
 * Recocido simulado sobre la matriz días × líneas, con evaluación incremental
 * (un movimiento solo cambia dos días) y caché por firma de día. El azar va
 * **sembrado**: misma semilla y mismo presupuesto dan exactamente el mismo
 * reparto, que es lo que permite repetir un plan de producción.
 */
export function buscarReparto(entrada: EntradaReparto, opciones: OpcionesBusqueda = {}): ResultadoReparto {
  const lineas = entrada.lineas.length;
  const dias = diasNecesarios(entrada);
  const vacio: ResultadoReparto = {
    reparto: { matriz: new Int32Array(0), dias: 0, lineas },
    tableros: 0, costo: 0, excesoCapacidad: 0, iteraciones: 0, podados: 0,
    optimo: true, aciertosCache: 0, evaluaciones: 0,
  };
  if (dias === 0 || lineas === 0) return vacio;

  const piezasPorLinea = new Float64Array(lineas);
  entrada.lineas.forEach((l, i) => { piezasPorLinea[i] = l.piezasPorUnidad; });
  const capacidad = entrada.piezasPorDia * (1 + Math.max(0, entrada.toleranciaRitmo ?? 0));

  const bloques = armarBloques(entrada.lineas);
  const evaluador = new Evaluador(entrada.evaluarDia, lineas, Math.max(64, opciones.cacheMax ?? 200_000));

  let actual = repartoInicial(bloques, dias, lineas, capacidad);
  const costos = new Float64Array(dias);
  const laminas = new Int32Array(dias);
  for (let d = 0; d < dias; d++) {
    const m = evaluador.dia(actual, d);
    costos[d] = costoDia(m);
    laminas[d] = m.laminas;
  }
  const exceso = () => {
    let e = 0;
    for (let d = 0; d < dias; d++) e += Math.max(0, piezasDelDia(actual, lineas, d, piezasPorLinea) - capacidad);
    return e;
  };

  let costoActual = sumar(costos) + exceso() * 1000;
  let mejorMatriz = Int32Array.from(actual);
  let mejorCosto = costoActual;
  let mejorTableros = sumar32(laminas);
  let iteraciones = 0;
  let podados = 0;

  const tiempoMax = Math.max(0, opciones.tiempoMaxMs ?? 0);
  const topeIter = Math.max(0, opciones.iteracionesMax ?? 0);
  const limite = Date.now() + tiempoMax;
  const seguir = opciones.seguirCorriendo ?? (() => true);
  const cota = cotaInferior(entrada).tableros;

  if ((tiempoMax === 0 && topeIter === 0) || dias < 2 || mejorTableros <= cota) {
    return armarResultado(mejorMatriz, dias, lineas, mejorTableros, mejorCosto, iteraciones, podados,
      mejorTableros <= cota, evaluador, piezasPorLinea, capacidad);
  }

  const azar = mulberry32((opciones.semilla ?? 20261014) >>> 0);
  let T = 1.5;
  const enfriar = Math.pow(0.02 / 1.5, 1 / Math.max(1, topeIter || 200_000));
  const sinMejorarMax = Math.max(2000, 20 * lineas * dias);
  let sinMejorar = 0;

  while (true) {
    if (topeIter > 0 && iteraciones >= topeIter) break;
    // El reloj se mira en cada movimiento: evaluar un día puede costar decenas de
    // milisegundos y revisarlo cada 256 se pasaba del presupuesto varias veces.
    if (tiempoMax > 0 && Date.now() > limite) break;
    if ((iteraciones & 15) === 0 && !seguir()) break;
    iteraciones++;

    // Un movimiento: llevar un bloque de un día a otro y, la mitad de las veces,
    // devolver otro en sentido contrario (intercambio).
    const b1 = bloques[Math.floor(azar() * bloques.length)];
    const d1 = diaCon(actual, lineas, dias, b1, azar);
    if (d1 < 0) continue;
    let d2 = Math.floor(azar() * dias);
    if (d2 === d1) d2 = (d2 + 1) % dias;

    aplicar(actual, lineas, d1, b1, -1);
    aplicar(actual, lineas, d2, b1, +1);

    let b2: Bloque | null = null;
    if (azar() < 0.5) {
      const cand = bloques[Math.floor(azar() * bloques.length)];
      if (cand !== b1 && tieneBloque(actual, lineas, d2, cand)) {
        b2 = cand;
        aplicar(actual, lineas, d2, b2, -1);
        aplicar(actual, lineas, d1, b2, +1);
      }
    }

    // Filtro por cota: si ni optimistamente caben en las laminas que esos dos dias
    // ya usan, el movimiento solo puede empeorar el termino que manda. Se descarta
    // sin acomodar, que es lo caro.
    if (entrada.cotaDia) {
      const cb = entrada.cotaDia(unidadesDelDia({ matriz: actual, dias, lineas }, d1))
        + entrada.cotaDia(unidadesDelDia({ matriz: actual, dias, lineas }, d2));
      if (cb > laminas[d1] + laminas[d2]) {
        if (b2) { aplicar(actual, lineas, d1, b2, -1); aplicar(actual, lineas, d2, b2, +1); }
        aplicar(actual, lineas, d2, b1, -1);
        aplicar(actual, lineas, d1, b1, +1);
        podados++;
        sinMejorar++;
        continue;
      }
    }

    const m1 = evaluador.dia(actual, d1);
    const m2 = evaluador.dia(actual, d2);
    const c1 = costoDia(m1);
    const c2 = costoDia(m2);
    const excesoNuevo =
      Math.max(0, piezasDelDia(actual, lineas, d1, piezasPorLinea) - capacidad) +
      Math.max(0, piezasDelDia(actual, lineas, d2, piezasPorLinea) - capacidad);
    const excesoViejo =
      Math.max(0, piezasViejas(actual, lineas, d1, piezasPorLinea, b1, b2, +1) - capacidad) +
      Math.max(0, piezasViejas(actual, lineas, d2, piezasPorLinea, b1, b2, -1) - capacidad);

    const costoNuevo = costoActual - costos[d1] - costos[d2] + c1 + c2 - excesoViejo * 1000 + excesoNuevo * 1000;
    const delta = costoNuevo - costoActual;

    if (delta <= 0 || azar() < Math.exp(-delta / Math.max(1e-6, T))) {
      costos[d1] = c1; costos[d2] = c2;
      laminas[d1] = m1.laminas; laminas[d2] = m2.laminas;
      costoActual = costoNuevo;
      const tableros = sumar32(laminas);
      if (costoActual < mejorCosto - 1e-9) {
        mejorCosto = costoActual;
        mejorTableros = tableros;
        mejorMatriz = Int32Array.from(actual);
        sinMejorar = 0;
        if (mejorTableros <= cota) break; // óptimo demostrado: no existe mejor.
      } else sinMejorar++;
    } else {
      // Deshacer en el sitio: nada de copiar la matriz entera por movimiento.
      if (b2) { aplicar(actual, lineas, d1, b2, -1); aplicar(actual, lineas, d2, b2, +1); }
      aplicar(actual, lineas, d2, b1, -1);
      aplicar(actual, lineas, d1, b1, +1);
      sinMejorar++;
    }

    T = Math.max(0.02, T * enfriar);
    if (sinMejorar >= sinMejorarMax) {
      // Recalentar desde la mejor conocida en vez de parar.
      actual = Int32Array.from(mejorMatriz);
      for (let d = 0; d < dias; d++) {
        const m = evaluador.dia(actual, d);
        costos[d] = costoDia(m);
        laminas[d] = m.laminas;
      }
      costoActual = mejorCosto;
      T = 1.5;
      sinMejorar = 0;
    }
  }

  return armarResultado(mejorMatriz, dias, lineas, mejorTableros, mejorCosto, iteraciones, podados,
    mejorTableros <= cota, evaluador, piezasPorLinea, capacidad);
}

function armarResultado(
  matriz: Int32Array, dias: number, lineas: number, tableros: number, costo: number,
  iteraciones: number, podados: number, optimo: boolean, evaluador: Evaluador,
  piezasPorLinea: Float64Array, capacidad: number,
): ResultadoReparto {
  let exceso = 0;
  for (let d = 0; d < dias; d++) exceso += Math.max(0, piezasDelDia(matriz, lineas, d, piezasPorLinea) - capacidad);
  return {
    reparto: { matriz, dias, lineas },
    tableros, costo: r3(costo), excesoCapacidad: r3(exceso), iteraciones, podados, optimo,
    aciertosCache: evaluador.aciertos, evaluaciones: evaluador.evaluaciones,
  };
}

function diaCon(matriz: Int32Array, lineas: number, dias: number, b: Bloque, azar: () => number): number {
  const inicio = Math.floor(azar() * dias);
  for (let k = 0; k < dias; k++) {
    const d = (inicio + k) % dias;
    if (tieneBloque(matriz, lineas, d, b)) return d;
  }
  return -1;
}

function tieneBloque(matriz: Int32Array, lineas: number, dia: number, b: Bloque): boolean {
  for (let k = 0; k < b.lineas.length; k++) {
    if (matriz[dia * lineas + b.lineas[k]] < b.unidades[k]) return false;
  }
  return true;
}

// Piezas que tenía el día antes del movimiento, sin rehacer la suma completa.
function piezasViejas(
  matriz: Int32Array, lineas: number, dia: number, piezasPorLinea: Float64Array,
  b1: Bloque, b2: Bloque | null, signo: number,
): number {
  let total = piezasDelDia(matriz, lineas, dia, piezasPorLinea);
  total += signo * b1.piezas;
  if (b2) total -= signo * b2.piezas;
  return total;
}

const sumar = (a: Float64Array) => a.reduce((s, n) => s + n, 0);
const sumar32 = (a: Int32Array) => a.reduce((s, n) => s + n, 0);

/** Unidades de cada línea en un día, listo para armar la lista de corte. */
export function unidadesDelDia(reparto: Reparto, dia: number): Int32Array {
  const u = new Int32Array(reparto.lineas);
  for (let i = 0; i < reparto.lineas; i++) u[i] = reparto.matriz[dia * reparto.lineas + i];
  return u;
}
