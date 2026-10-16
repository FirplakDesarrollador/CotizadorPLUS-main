// Acomodo de las piezas en la lámina: el optimizador de guillotina.
//
// Fase 2 del plan (`docs/plan_optimizador_corte.md`). Módulo puro, sin Next ni
// Supabase, probado con tests igual que el motor.
//
// La máquina es una seccionadora: cada corte va de lado a lado, así que el
// acomodo es por **franjas** horizontales. Dentro de una franja las piezas se
// ponen una al lado de la otra (corte de 2.º nivel) y, si la pieza es más baja
// que la franja, hace falta un recorte de 3.er nivel: por eso `nivelesCorte < 3`
// obliga a que todas las piezas de una franja midan lo mismo de alto.
//
// No busca el óptimo matemático —es inviable— sino un acomodo bueno: prueba
// varias heurísticas de ordenación y se queda con la mejor según el criterio de
// planta. Siempre se informa el mínimo teórico para saber a qué distancia quedó.
import type { ConfigOptimizador, FormatoLamina } from './config';

export type PiezaCorte = {
  /** Identifica la fila de la lista de corte de la que sale. */
  id: string;
  etiqueta: string;
  largoMm: number;
  anchoMm: number;
  cantidad: number;
  /** La veta del material permite girarla 90°. */
  girable: boolean;
};

export type Colocacion = {
  id: string;
  etiqueta: string;
  /** Número con el que se rotula en el esquema: (1), (2)… Una medida, un número. */
  grupo: number;
  /** Esquina superior izquierda, en mm desde el borde de la lámina. */
  x: number;
  y: number;
  /** Medidas ya en la orientación en la que se corta. */
  largoMm: number;
  anchoMm: number;
  girada: boolean;
  /**
   * Franja (corte de 1.er nivel) y columna (2.º nivel) a las que pertenece. La
   * secuencia de cortes se cuenta con esto y no adivinando por coordenadas, porque
   * dentro de una columna se apilan piezas a distintas alturas.
   */
  franja?: number;
  columna?: number;
};

export type Sobrante = {
  x: number;
  y: number;
  largoMm: number;
  anchoMm: number;
  /** Llega al mínimo de planta y vale la pena guardarlo. */
  reutilizable: boolean;
};

export type Patron = {
  /** Cuántas láminas se cortan con este mismo acomodo (la pila de la seccionadora). */
  repeticiones: number;
  colocaciones: Colocacion[];
  sobrantes: Sobrante[];
  areaPiezasMm2: number;
  desperdicioPct: number;
  /**
   * El primer corte va a lo ancho de la lámina (franjas verticales). Con `false`
   * las franjas corren a lo largo, como hasta ahora.
   */
  transpuesta?: boolean;
};

export type GrupoMedida = {
  grupo: number;
  etiqueta: string;
  largoMm: number;
  anchoMm: number;
  cantidad: number;
};

export type PlanMaterialCorte = {
  formato: FormatoLamina;
  patrones: Patron[];
  laminas: number;
  grupos: GrupoMedida[];
  areaPiezasM2: number;
  areaLaminasM2: number;
  /** Desperdicio sobre la lámina entera, como lo reporta la planta. */
  desperdicioPct: number;
  /** Cota inferior: ni el acomodo perfecto bajaría de aquí con este número de láminas. */
  desperdicioMinimoPct: number;
  laminasMinimas: number;
  /** Combinaciones probadas antes de quedarse con esta. */
  iteraciones: number;
  /**
   * El desperdicio **no puede** bajar de la meta con este volumen de piezas: ni el
   * acomodo perfecto lo lograría, porque las láminas se compran enteras.
   */
  metaInalcanzable: boolean;
  /** Sobrantes que llegan al mínimo de planta, sumando todas las láminas (pila incluida). */
  sobrantesReutilizables: number;
  sobranteReutilizableM2: number;
  /** Mayor sobrante reutilizable del plan, en mm (0 si no hay). */
  mayorSobrante: { largoMm: number; anchoMm: number } | null;
  /** Piezas que no caben ni girando en la lámina útil: quedan fuera del plan. */
  noCaben: { etiqueta: string; largoMm: number; anchoMm: number; cantidad: number }[];
};

type Unidad = {
  id: string; etiqueta: string; grupo: number;
  l: number; a: number; girable: boolean;
  /** Largo de la pieza en el despiece: contra este se decide si quedó girada. */
  l0: number;
  /** Ancho de la pieza en el despiece; hace falta para transponer la lámina. */
  a0: number;
};
/**
 * Columna (corte de 2.º nivel) dentro de una franja. Las piezas se apilan una
 * sobre otra (3.er nivel) mientras quepan en el alto de la franja: es lo que
 * aprovecha el hueco que antes quedaba encima de las piezas bajas.
 */
type Columna = { x: number; ancho: number; yLibre: number; idx: number; items: Colocacion[] };
type Franja = { y: number; alto: number; x: number; idx: number; items: Colocacion[]; columnas: Columna[] };
type Lamina = { franjas: Franja[]; usado: number; yLibre: number; transpuesta: boolean };

const M2 = (mm2: number) => Math.round(mm2 / 1e4) / 100;
const pct = (n: number) => Math.round(n * 1000) / 1000;
const casi = (a: number, b: number) => Math.abs(a - b) < 0.1;

/**
 * Acomoda las piezas de un material en láminas de un formato.
 *
 * `girable` viene por pieza porque depende de la textura del tablero: la *soft*
 * rota veta y se puede girar; rustick y amazonas, no.
 */
export function optimizarMaterial(
  piezas: readonly PiezaCorte[],
  formato: FormatoLamina,
  cfg: ConfigOptimizador,
): PlanMaterialCorte {
  const X1 = formato.largoMm - cfg.refiladoMm;
  const Y1 = formato.anchoMm - cfg.refiladoMm;
  const utilL = X1 - cfg.refiladoMm;
  const utilA = Y1 - cfg.refiladoMm;
  const areaLamina = formato.largoMm * formato.anchoMm;

  // Una medida, un número de esquema. Las más grandes primero, como en la hoja de planta.
  const porMedida = new Map<string, GrupoMedida & { girable: boolean; id: string }>();
  const noCaben: PlanMaterialCorte['noCaben'] = [];
  for (const p of piezas) {
    const cantidad = Math.round(p.cantidad);
    if (!(cantidad > 0) || !(p.largoMm > 0) || !(p.anchoMm > 0)) continue;
    if (!cabe(p.largoMm, p.anchoMm, utilL, utilA, p.girable)) {
      noCaben.push({ etiqueta: p.etiqueta, largoMm: p.largoMm, anchoMm: p.anchoMm, cantidad });
      continue;
    }
    const clave = `${p.largoMm}x${p.anchoMm}`;
    const g = porMedida.get(clave);
    if (g) { g.cantidad += cantidad; g.girable = g.girable && p.girable; continue; }
    porMedida.set(clave, {
      grupo: 0, etiqueta: p.etiqueta, largoMm: p.largoMm, anchoMm: p.anchoMm,
      cantidad, girable: p.girable, id: p.id,
    });
  }

  const grupos = [...porMedida.values()]
    .sort((a, b) => b.largoMm * b.anchoMm - a.largoMm * a.anchoMm || a.etiqueta.localeCompare(b.etiqueta))
    .map((g, i) => ({ ...g, grupo: i + 1 }));

  const areaPiezasMm2 = grupos.reduce((s, g) => s + g.cantidad * g.largoMm * g.anchoMm, 0);
  const vacio: PlanMaterialCorte = {
    formato, patrones: [], laminas: 0, grupos: grupos.map(limpiar),
    areaPiezasM2: M2(areaPiezasMm2), areaLaminasM2: 0,
    desperdicioPct: 0, desperdicioMinimoPct: 0, laminasMinimas: 0,
    iteraciones: 0, metaInalcanzable: false,
    sobrantesReutilizables: 0, sobranteReutilizableM2: 0, mayorSobrante: null, noCaben,
  };
  if (!grupos.length || !(utilL > 0) || !(utilA > 0)) return vacio;

  const unidades: Unidad[] = [];
  for (const g of grupos) {
    for (let i = 0; i < g.cantidad; i++) {
      unidades.push({
        id: g.id, etiqueta: g.etiqueta, grupo: g.grupo,
        l: g.largoMm, a: g.anchoMm, girable: g.girable, l0: g.largoMm, a0: g.anchoMm,
      });
    }
  }

  // Varias heurísticas; se queda la que use menos láminas y, a igualdad, la que
  // deje el hueco libre más grande (el criterio de planta: un solo sobrante útil).
  const caja = { X0: cfg.refiladoMm, Y0: cfg.refiladoMm, X1, Y1 };
  const laminasIdeal = Math.max(1, Math.ceil(
    grupos.reduce((t, g) => t + g.cantidad * (g.largoMm + cfg.discoMm) * (g.anchoMm + cfg.discoMm), 0) / (utilL * utilA),
  ));
  const { mejor, iteraciones } = buscarAcomodo(unidades, caja, cfg, laminasIdeal);
  const laminas = mejor ?? [];
  if (!laminas.length) return vacio;

  const patrones = agruparPatrones(laminas.map((lam) => aPatron(lam, { X1, Y1 }, areaLamina, cfg)));
  // Ordena para que el sobrante quede al final: la lámina menos llena, la última.
  patrones.sort((a, b) => b.areaPiezasMm2 - a.areaPiezasMm2);
  const areaLaminasMm2 = laminas.length * areaLamina;
  const laminasMinimas = laminasIdeal;
  const utiles = patrones.flatMap((p) => p.sobrantes.filter((r) => r.reutilizable).map((r) => ({ r, veces: p.repeticiones })));
  const mayor = utiles.reduce<Sobrante | null>((m, { r }) => (!m || r.largoMm * r.anchoMm > m.largoMm * m.anchoMm ? r : m), null);

  return {
    formato,
    patrones,
    laminas: laminas.length,
    grupos: grupos.map(limpiar),
    areaPiezasM2: M2(areaPiezasMm2),
    areaLaminasM2: M2(areaLaminasMm2),
    desperdicioPct: pct((1 - areaPiezasMm2 / areaLaminasMm2) * 100),
    desperdicioMinimoPct: pct((1 - areaPiezasMm2 / (laminasMinimas * areaLamina)) * 100),
    laminasMinimas,
    iteraciones,
    metaInalcanzable: (1 - areaPiezasMm2 / (laminasMinimas * areaLamina)) * 100 > cfg.desperdicioMaxPct,
    sobrantesReutilizables: utiles.reduce((t, u) => t + u.veces, 0),
    sobranteReutilizableM2: M2(utiles.reduce((t, { r, veces }) => t + r.largoMm * r.anchoMm * veces, 0)),
    mayorSobrante: mayor ? { largoMm: mayor.largoMm, anchoMm: mayor.anchoMm } : null,
    noCaben,
  };
}

const limpiar = (g: GrupoMedida & { girable?: boolean; id?: string }): GrupoMedida =>
  ({ grupo: g.grupo, etiqueta: g.etiqueta, largoMm: g.largoMm, anchoMm: g.anchoMm, cantidad: g.cantidad });

function cabe(l: number, a: number, utilL: number, utilA: number, girable: boolean): boolean {
  return (l <= utilL && a <= utilA) || (girable && a <= utilL && l <= utilA);
}

// Cada heurística fija una orientación de partida y un orden de entrada. La
// seccionadora corta franjas, así que el orden manda sobre el resultado.
const ORDENES: { preparar: (u: Unidad) => Unidad; comparar: (a: Unidad, b: Unidad) => number }[] = [
  // Franjas altas primero: el lado largo de la pieza queda vertical.
  { preparar: (u) => (u.girable && u.a < u.l ? { ...u, l: u.a, a: u.l } : u), comparar: (a, b) => b.a - a.a || b.l - a.l },
  // Franjas bajas y anchas: el lado largo se acuesta a lo ancho de la lámina.
  { preparar: (u) => (u.girable && u.a > u.l ? { ...u, l: u.a, a: u.l } : u), comparar: (a, b) => b.a - a.a || b.l - a.l },
  // Tal como viene del despiece, por alto.
  { preparar: (u) => u, comparar: (a, b) => b.a - a.a || b.l - a.l },
  // Por área: primero las grandes, que son las que condicionan.
  { preparar: (u) => (u.girable && u.a > u.l ? { ...u, l: u.a, a: u.l } : u), comparar: (a, b) => b.l * b.a - a.l * a.a || b.a - a.a },
  // Por largo: agrupa medidas iguales a lo ancho, que es como corta la planta.
  { preparar: (u) => (u.girable && u.a > u.l ? { ...u, l: u.a, a: u.l } : u), comparar: (a, b) => b.l - a.l || b.a - a.a },
];

// ---------------------------------------------------------------------------
// Búsqueda: probar muchas combinaciones y quedarse con la mejor.
//
// El objetivo de planta es desperdicio <= 15 %, y mejor por debajo. Con 3 niveles
// de guillotina el acomodo es por franjas, así que lo único que se puede variar es
// **qué piezas comparten franja, en qué orden y en qué orientación**. Eso es lo que
// se barre aquí: primero las heurísticas fijas, y si no se llegó al mínimo teórico,
// arranques aleatorios hasta agotar el presupuesto de `cfg.iteraciones` o
// `cfg.tiempoMaxMs`.
//
// El azar está **sembrado**: la misma entrada da siempre el mismo plan, que es un
// criterio de aceptación del plan de obra.
// ---------------------------------------------------------------------------

function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Caja = { X0: number; Y0: number; X1: number; Y1: number };
type Orientacion = 'largo' | 'ancho';
type Modo = 'global' | 'secuencial' | 'mochila';
type FranjaNueva = 'baja' | 'alta' | 'mejor';
/** Por encima de esta cantidad de piezas la mochila "mejor alto" se vuelve cara. */
const MOCHILA_MEJOR_MAX = 800;

function buscarAcomodo(
  unidades: Unidad[], caja: Caja, cfg: ConfigOptimizador, laminasIdeal: number,
): { mejor: Lamina[] | null; iteraciones: number } {
  let mejor: Lamina[] | null = null;
  let iteraciones = 0;

  const probar = (us: Unidad[], comparar: (a: Unidad, b: Unidad) => number,
    modo: Modo, franjaNueva: FranjaNueva, orientacion: Orientacion, azar?: () => number) => {
    iteraciones++;
    const intento = empacar(us, comparar, caja, cfg, modo, franjaNueva, orientacion, azar);
    if (!mejor || mejorQue(intento, mejor)) mejor = intento;
  };

  // El primer corte puede ir a lo largo o a lo ancho de la lámina (la Holz-Her gira
  // la lámina): se prueban las dos, porque cuál gana depende de las medidas.
  const orientaciones: Orientacion[] = cfg.giraLamina ? ['largo', 'ancho'] : ['largo'];

  // Con `heuristicasMax` se corren solo las primeras: la busqueda de reparto acomoda
  // miles de dias y no puede pagarlas todas cada vez.
  const topeHeuristicas = cfg.heuristicasMax > 0 ? cfg.heuristicasMax : Number.POSITIVE_INFINITY;
  // Primero la mochila (no depende del orden de entrada): es la que mejor llena
  // franjas con medidas variadas y la que corre aunque el presupuesto sea corto.
  salir: {
    // En modo rápido (`heuristicasMax`, el que usa la búsqueda del reparto) se omite
    // la variante "mejor alto": es la más cara y el reparto evalúa miles de días.
    const conMejor = unidades.length <= MOCHILA_MEJOR_MAX && !(cfg.heuristicasMax > 0);
    const variantes: FranjaNueva[] = conMejor ? ['mejor', 'alta', 'baja'] : ['alta', 'baja'];
    for (const orientacion of orientaciones) {
      for (const franjaNueva of variantes) {
        probar(unidades, ORDENES[0].comparar, 'mochila', franjaNueva, orientacion);
        if (iteraciones >= topeHeuristicas || (mejor as Lamina[] | null)!.length <= laminasIdeal) break salir;
      }
    }
  // El resto de heurísticas fijas es más lento en proyectos grandes (cientos de ms
  // por corrida con miles de piezas): corren mientras quede presupuesto. Con pocas
  // piezas terminan todas y el resultado no depende de la máquina.
  const finFijas = Date.now() + Math.max(300, cfg.tiempoMaxMs);
  for (const orden of ORDENES) {
    if (Date.now() > finFijas) break salir;
    for (const orientacion of orientaciones) {
      for (const modo of ['global', 'secuencial'] as const) {
        for (const franjaNueva of ['baja', 'alta'] as const) {
          probar(unidades.map(orden.preparar), orden.comparar, modo, franjaNueva, orientacion);
          if (iteraciones >= topeHeuristicas || Date.now() > finFijas
            || (mejor as Lamina[] | null)!.length <= laminasIdeal) break salir;
        }
      }
    }
  }
  }

  // Corrección secuencial de valores (la idea de "sequential value correction" de
  // packingsolver): las medidas que terminan en la última lámina —las difíciles de
  // acomodar— suben de valor en la mochila y se meten antes en el siguiente intento.
  if (mejor && (mejor as Lamina[]).length > laminasIdeal && unidades.length <= MOCHILA_MEJOR_MAX && cfg.iteraciones > 0) {
    const finSvc = Date.now() + Math.max(400, cfg.tiempoMaxMs);
    for (const orientacion of orientaciones) {
      const pesos = new Map<number, number>();
      for (let r = 0; r < 40 && Date.now() < finSvc; r++) {
        iteraciones++;
        const intento = empacar(unidades, ORDENES[0].comparar, caja, cfg, 'mochila', 'mejor', orientacion, undefined, pesos);
        if (mejorQue(intento, mejor as Lamina[])) mejor = intento;
        if ((mejor as Lamina[]).length <= laminasIdeal) break;
        const ultima = intento[intento.length - 1];
        if (!ultima) break;
        for (const f of ultima.franjas) for (const c of f.items) pesos.set(c.grupo, (pesos.get(c.grupo) ?? 1) * 1.35);
      }
      if ((mejor as Lamina[]).length <= laminasIdeal) break;
    }
  }

  // Si ya se alcanzó el mínimo teórico no hay nada que buscar: no existe mejor.
  const tope = Math.max(0, Math.round(cfg.iteraciones));
  const limite = Date.now() + Math.max(0, cfg.tiempoMaxMs);
  if (!mejor || (mejor as Lamina[]).length <= laminasIdeal || tope === 0) return { mejor, iteraciones };

  // Semilla derivada del problema: determinista, pero distinta para cada material.
  const semilla = unidades.reduce((h, u) => (h * 31 + u.l * 7 + u.a * 13 + u.grupo) % 2147483647, unidades.length + 1);
  const azar = mulberry32(semilla);
  const CLAVES: ((u: Unidad) => number)[] = [
    (u) => u.a, (u) => u.l, (u) => u.l * u.a, (u) => Math.max(u.l, u.a),
  ];

  // Si muchos arranques seguidos no mejoran, se deja de gastar tiempo: el acomodo
  // corre en el navegador y además se repite por cada día y cada material.
  const ESTANCAMIENTO = 300;
  let sinMejorar = 0;

  for (let i = 0; i < tope && sinMejorar < ESTANCAMIENTO; i++) {
    if (Date.now() > limite) break;

    // Orientación de partida: toda alta, toda baja, o pieza por pieza al azar.
    const sesgo = azar();
    const us = unidades.map((u) => {
      if (!u.girable || casi(u.l, u.a)) return u;
      const alta = sesgo < 0.34 ? true : sesgo < 0.67 ? false : azar() < 0.5;
      const hayQueVoltear = alta ? u.a < u.l : u.a > u.l;
      return hayQueVoltear ? { ...u, l: u.a, a: u.l } : u;
    });

    // Orden: una clave al azar, con ruido para romper el orden estricto y explorar
    // combinaciones de franja que el orden puro nunca produce.
    const clave = CLAVES[Math.floor(azar() * CLAVES.length)];
    const ruido = azar() * 0.35;
    const peso = new Map<Unidad, number>(us.map((u) => [u, clave(u) * (1 + (azar() - 0.5) * ruido)]));
    const comparar = (a: Unidad, b: Unidad) => (peso.get(b) ?? 0) - (peso.get(a) ?? 0);

    const antes = (mejor as Lamina[]).length;
    const r = azar();
    probar(us, comparar, r < 0.5 ? 'mochila' : r < 0.75 ? 'global' : 'secuencial', azar() < 0.5 ? 'baja' : 'alta',
      orientaciones[Math.floor(azar() * orientaciones.length)], azar);
    sinMejorar = (mejor as Lamina[]).length < antes ? 0 : sinMejorar + 1;
    if ((mejor as Lamina[]).length <= laminasIdeal) break;
  }

  return { mejor, iteraciones };
}

/**
 * Reparte las unidades en láminas con dos estrategias, porque ninguna gana siempre:
 *
 * - `global`: todas las láminas quedan abiertas y cada pieza entra en la primera
 *   donde quepa. Rellena los huecos que dejaron las piezas grandes y suele gastar
 *   menos tableros.
 * - `secuencial`: se llena una lámina antes de abrir la siguiente. Gasta más en
 *   proyectos variados, pero repite patrones idénticos, que es lo que permite
 *   cortar la pila de 3 o 4 láminas de una vez.
 *
 * `franjaNueva` decide con qué alto se abre una franja: `baja` gasta lo mínimo de
 * alto, `alta` acuesta la pieza para meter muchas de canto. `orientacion` decide si
 * las franjas corren a lo largo de la lámina o a lo ancho: para lo segundo se
 * acomoda en la lámina transpuesta y al final se devuelven las coordenadas.
 *
 * Manda el criterio de planta: primero menos tableros.
 */
function empacar(
  unidades: Unidad[],
  comparar: (a: Unidad, b: Unidad) => number,
  cajaReal: Caja,
  cfg: ConfigOptimizador,
  modo: Modo,
  franjaNueva: FranjaNueva,
  orientacion: Orientacion,
  azar?: () => number,
  pesosGrupo?: Map<number, number>,
): Lamina[] {
  const transpuesta = orientacion === 'ancho';
  // En la lámina transpuesta el "largo" de trabajo es el ancho físico. La rotación
  // de una pieza no cambia al transponer, así que basta intercambiar sus ejes.
  const caja: Caja = transpuesta
    ? { X0: cajaReal.Y0, Y0: cajaReal.X0, X1: cajaReal.Y1, Y1: cajaReal.X1 }
    : cajaReal;
  const pendientes = (transpuesta
    ? unidades.map((u) => ({ ...u, l: u.a, a: u.l, l0: u.a0, a0: u.l0 }))
    : [...unidades]).sort(comparar);
  if (modo === 'mochila') return empacarMochila(pendientes, caja, cfg, franjaNueva, transpuesta, azar, pesosGrupo);
  const laminas: Lamina[] = [];
  const nueva = (): Lamina => ({ franjas: [], usado: 0, yLibre: caja.Y0, transpuesta });
  // Una lámina sin área libre suficiente no puede recibir la pieza: se salta sin
  // recorrer sus franjas (en proyectos grandes es lo que más tiempo ahorra).
  const areaUtil = (caja.X1 - caja.X0) * (caja.Y1 - caja.Y0);

  if (modo === 'global') {
    for (const u of pendientes) {
      let puesto = null;
      for (const lam of laminas) {
        if (lam.usado + u.l * u.a > areaUtil) continue;
        puesto = colocar(u, lam, caja, cfg, franjaNueva);
        if (puesto) break;
      }
      if (!puesto) {
        const lam = nueva();
        puesto = colocar(u, lam, caja, cfg, franjaNueva);
        if (!puesto) continue; // no cabe ni en lámina vacía: ya se filtró antes.
        laminas.push(lam);
      }
    }
    return laminas;
  }

  let restantes = pendientes;
  while (restantes.length) {
    const lam = nueva();
    const quedan: Unidad[] = [];
    for (const u of restantes) {
      if (!colocar(u, lam, caja, cfg, franjaNueva)) quedan.push(u);
    }
    // Si no entró nada no hay acomodo posible: se corta aquí en vez de ciclar.
    if (!lam.franjas.length || quedan.length === restantes.length) break;
    laminas.push(lam);
    restantes = quedan;
  }
  return laminas;
}

/**
 * Coloca una pieza en la lámina, en este orden de preferencia:
 *
 * 1. **Apilada en una columna existente** (3.er nivel): ocupa el hueco que queda
 *    encima de una pieza más baja que su franja, sin gastar largo de franja. Puede
 *    ser más angosta que la columna: el sobrante lateral sale con un recorte, igual
 *    que el de una pieza más baja que su franja (corte "no exacto" de los solvers
 *    de guillotina de 3 etapas). Pendiente de confirmar con planta junto con los
 *    niveles de la Holz-Her.
 * 2. **Columna nueva en una franja existente** (2.º nivel), la que menos alto deje sin usar.
 * 3. **Franja nueva** (1.er nivel).
 *
 * Devuelve la colocación o null si no cabe en esta lámina.
 */
function colocar(
  u: Unidad, lam: Lamina, caja: Caja, cfg: ConfigOptimizador, franjaNueva: FranjaNueva,
): Colocacion | null {
  const nivel3 = cfg.nivelesCorte >= 3;
  const orientaciones = u.girable && !casi(u.l, u.a) ? [[u.l, u.a], [u.a, u.l]] : [[u.l, u.a]];
  const k = cfg.discoMm;

  // 1. Apilar en una columna.
  if (nivel3) {
    let mejorPila: { franja: Franja; col: Columna; l: number; a: number; resto: number } | null = null;
    for (const franja of lam.franjas) {
      const tope = franja.y + franja.alto;
      for (const col of franja.columnas) {
        for (const [l, a] of orientaciones) {
          const anchoOk = l <= col.ancho + 0.01;
          if (!anchoOk || col.yLibre + a > tope + 0.01) continue;
          // Menor hueco que queda en la columna; a igualdad, la pieza más ancha.
          const resto = (tope - col.yLibre - a) * col.ancho + (col.ancho - l) * a;
          if (!mejorPila || resto < mejorPila.resto) mejorPila = { franja, col, l, a, resto };
        }
      }
    }
    if (mejorPila) {
      const { franja, col, l, a } = mejorPila;
      const c: Colocacion = {
        id: u.id, etiqueta: u.etiqueta, grupo: u.grupo, x: col.x, y: col.yLibre,
        largoMm: l, anchoMm: a, girada: !casi(l, u.l0), franja: franja.idx, columna: col.idx,
      };
      col.items.push(c);
      franja.items.push(c);
      col.yLibre += a + k;
      lam.usado += l * a;
      return c;
    }
  }

  // 2. Columna nueva en una franja existente.
  let mejor: { franja: Franja; l: number; a: number; sobra: number } | null = null;
  for (const franja of lam.franjas) {
    for (const [l, a] of orientaciones) {
      const encaja = nivel3 ? a <= franja.alto + 0.01 : casi(a, franja.alto);
      if (!encaja) continue;
      if (franja.x + l > caja.X1 + 0.01) continue;
      const sobra = franja.alto - a;
      if (!mejor || sobra < mejor.sobra) mejor = { franja, l, a, sobra };
    }
  }
  if (mejor) return abrirColumna(u, lam, mejor.franja, mejor.l, mejor.a, k);

  // 3. Franja nueva: o la más baja (gasta poco alto) o la más alta que quepa (permite
  // meter muchas piezas de canto). La heurística decide cuál se prueba.
  const cabenNuevas = orientaciones
    .filter(([l, a]) => l <= caja.X1 - caja.X0 + 0.01 && lam.yLibre + a <= caja.Y1 + 0.01)
    .sort((p, q) => (franjaNueva === 'baja' ? p[1] - q[1] : q[1] - p[1]));
  const elegida = cabenNuevas[0];
  if (!elegida) return null;

  const [l, a] = elegida;
  const franja: Franja = { y: lam.yLibre, alto: a, x: caja.X0, idx: lam.franjas.length, items: [], columnas: [] };
  lam.franjas.push(franja);
  lam.yLibre = franja.y + a + k;
  return abrirColumna(u, lam, franja, l, a, k);
}

function abrirColumna(u: Unidad, lam: Lamina, franja: Franja, l: number, a: number, k: number): Colocacion {
  const col: Columna = { x: franja.x, ancho: l, yLibre: franja.y + a + k, idx: franja.columnas.length, items: [] };
  const c: Colocacion = {
    id: u.id, etiqueta: u.etiqueta, grupo: u.grupo, x: col.x, y: franja.y,
    largoMm: l, anchoMm: a, girada: !casi(l, u.l0), franja: franja.idx, columna: col.idx,
  };
  col.items.push(c);
  franja.columnas.push(col);
  franja.items.push(c);
  franja.x += l + k;
  lam.usado += l * a;
  return c;
}


// ---------------------------------------------------------------------------
// Llenado por mochila: cada franja se llena con la combinación de piezas que más
// área cubre, en vez de tomarlas en orden hasta que una no quepa.
//
// Es la idea de los solvers de guillotina por franjas (packingsolver resuelve una
// mochila por franja): con muchas medidas distintas, el orden fijo deja huecos que
// una combinación elegida llena. Medido en el frente de 18 mm del proyecto de
// referencia, el orden fijo daba 6 láminas donde el óptimo es 5.
// ---------------------------------------------------------------------------

type TipoPendiente = { l: number; a: number; girable: boolean; unidades: Unidad[] };

function agruparTipos(unidades: Unidad[]): TipoPendiente[] {
  const mapa = new Map<string, TipoPendiente>();
  for (const u of unidades) {
    const clave = `${u.l}x${u.a}|${u.girable ? 1 : 0}`;
    const t = mapa.get(clave);
    if (t) t.unidades.push(u);
    else mapa.set(clave, { l: u.l, a: u.a, girable: u.girable, unidades: [u] });
  }
  return [...mapa.values()];
}

// Orientación de un tipo dentro de una franja de alto `h`: la más alta que quepa
// (aprovecha mejor el alto). null si no cabe de ninguna forma.
function orientarEnFranja(t: TipoPendiente, h: number, exacta: boolean, largoMax: number): [number, number] | null {
  const opciones: [number, number][] = t.girable && !casi(t.l, t.a) ? [[t.l, t.a], [t.a, t.l]] : [[t.l, t.a]];
  let mejor: [number, number] | null = null;
  for (const [l, a] of opciones) {
    if (l > largoMax + 0.01) continue;
    if (exacta ? !casi(a, h) : a > h + 0.01) continue;
    if (!mejor || a > mejor[1]) mejor = [l, a];
  }
  return mejor;
}

/**
 * Mochila acotada sobre el largo de la franja. Cada copia ocupa su largo más una
 * sierra; la capacidad incluye una sierra de más porque la última pieza no la
 * necesita. Valor = área de la pieza. Las copias se parten en potencias de dos
 * para que el costo crezca con log(cantidad), no con la cantidad.
 * Devuelve cuántas copias de cada tipo entran.
 */
function mochilaFranja(
  opciones: { tipo: number; l: number; a: number; disponibles: number; peso?: number }[], capacidad: number, k: number,
): Map<number, number> {
  // Celdas de 2 mm: la mitad de trabajo; el redondeo hacia arriba del peso deja
  // siempre la sierra completa, así que nunca acepta una combinación que no quepa.
  const RES = 2;
  const cap = Math.max(0, Math.floor((capacidad + k) / RES));
  const items: { tipo: number; copias: number; peso: number; valor: number }[] = [];
  for (const o of opciones) {
    let resto = o.disponibles;
    for (let p = 1; resto > 0; p *= 2) {
      const c = Math.min(p, resto);
      resto -= c;
      const peso = Math.ceil((c * (o.l + k)) / RES);
      if (peso <= cap) items.push({ tipo: o.tipo, copias: c, peso, valor: c * o.l * o.a * (o.peso ?? 1) });
    }
  }
  const valor = new Float64Array(cap + 1);
  const elegido = items.map(() => new Uint8Array(cap + 1));
  items.forEach((it, i) => {
    const marca = elegido[i];
    for (let w = cap; w >= it.peso; w--) {
      const v = valor[w - it.peso] + it.valor;
      if (v > valor[w] + 1e-9) { valor[w] = v; marca[w] = 1; }
    }
  });
  const usados = new Map<number, number>();
  let w = cap;
  for (let i = items.length - 1; i >= 0; i--) {
    if (elegido[i][w]) {
      usados.set(items[i].tipo, (usados.get(items[i].tipo) ?? 0) + items[i].copias);
      w -= items[i].peso;
    }
  }
  return usados;
}

/**
 * Acomoda lámina por lámina y franja por franja:
 * 1. abre la franja con la pieza que la define (la más alta en `alta`; la de más
 *    área, acostada, en `baja`);
 * 2. llena su largo con la mochila;
 * 3. apila en las columnas lo que todavía quepa encima (3.er nivel).
 * Repite hasta que no entre nada más en el alto que queda, y pasa a otra lámina.
 */
function empacarMochila(
  unidades: Unidad[], caja: Caja, cfg: ConfigOptimizador, franjaNueva: FranjaNueva, transpuesta: boolean,
  azar?: () => number,
  pesosGrupo?: Map<number, number>,
): Lamina[] {
  const tipos = agruparTipos(unidades);
  // Con azar (fase de búsqueda) cada tipo pesa distinto en la mochila y la pieza
  // guía se elige entre las mejores: así se exploran combinaciones de franja que
  // la versión determinista nunca forma.
  const pesos = tipos.map((t) => (pesosGrupo?.get(t.unidades[0].grupo) ?? 1) * (azar ? 1 + (azar() - 0.5) * 0.6 : 1));
  const quedan = () => tipos.some((t) => t.unidades.length > 0);
  const exacta = cfg.nivelesCorte < 3;
  const largoUtil = caja.X1 - caja.X0;
  const k = cfg.discoMm;
  const laminas: Lamina[] = [];

  while (quedan()) {
    const lam: Lamina = { franjas: [], usado: 0, yLibre: caja.Y0, transpuesta };
    for (;;) {
      const altoLibre = caja.Y1 - lam.yLibre;
      // Pieza que define la franja.
      let guia: { t: TipoPendiente; l: number; a: number } | null = null;
      const candidatas: { t: TipoPendiente; l: number; a: number }[] = [];
      for (const t of tipos) {
        if (!t.unidades.length) continue;
        const ops: [number, number][] = t.girable && !casi(t.l, t.a) ? [[t.l, t.a], [t.a, t.l]] : [[t.l, t.a]];
        for (const [l, a] of ops) {
          if (l > largoUtil + 0.01 || a > altoLibre + 0.01) continue;
          const mejorAhora = !guia
            || (franjaNueva === 'alta' ? a > guia.a + 0.01 || (casi(a, guia.a) && l * a > guia.l * guia.a)
              : l * a > guia.l * guia.a + 0.01 || (casi(l * a, guia.l * guia.a) && a < guia.a));
          if (mejorAhora) guia = { t, l, a };
            if (azar) candidatas.push({ t, l, a });
        }
      }
      if (!guia) break;
      if (franjaNueva === 'mejor') {
        // Prueba como guía cada alto distinto (y la mejor pieza de ese alto) y se queda
        // con la franja que más área llena por área de franja: elige el alto de la
        // franja en vez de heredarlo de la pieza más alta.
        const porAlto = new Map<number, { t: TipoPendiente; l: number; a: number }>();
        for (const t of tipos) {
          if (!t.unidades.length) continue;
          const ops: [number, number][] = t.girable && !casi(t.l, t.a) ? [[t.l, t.a], [t.a, t.l]] : [[t.l, t.a]];
          for (const [l, a] of ops) {
            if (l > largoUtil + 0.01 || a > altoLibre + 0.01) continue;
            const clave = Math.round(a * 10);
            const ya = porAlto.get(clave);
            if (!ya || l * a > ya.l * ya.a) porAlto.set(clave, { t, l, a });
          }
        }
        let mejorEf = -1;
        // Las 10 guías de mayor área bastan: más candidatas casi nunca cambian el alto elegido.
        const guias = [...porAlto.values()].sort((p, q) => q.l * q.a - p.l * p.a).slice(0, 10);
        for (const c of guias) {
          const ops: { tipo: number; l: number; a: number; disponibles: number; peso: number }[] = [];
          tipos.forEach((t, i) => {
            const disp = t.unidades.length - (t === c.t ? 1 : 0);
            if (disp <= 0) return;
            const o = orientarEnFranja(t, c.a, exacta, largoUtil);
            if (o) ops.push({ tipo: i, l: o[0], a: o[1], disponibles: disp, peso: pesos[i] });
          });
          const us = mochilaFranja(ops, largoUtil - c.l - k, k);
          let area = c.l * c.a;
          for (const o of ops) area += (us.get(o.tipo) ?? 0) * o.l * o.a * pesos[o.tipo];
          area += c.l * c.a * (pesos[tipos.indexOf(c.t)] - 1);
          const ef = area / (largoUtil * (c.a + k));
          if (ef > mejorEf + 1e-9) { mejorEf = ef; guia = c; }
        }
      }
      if (azar && candidatas.length > 1 && azar() < 0.35) {
        candidatas.sort((p, q) => (franjaNueva === 'alta' ? q.a - p.a : q.l * q.a - p.l * p.a));
        guia = candidatas[Math.floor(azar() * Math.min(4, candidatas.length))];
      }
      const h = guia.a;

      // Mochila sobre el largo de la franja, con la guía ya puesta.
      const opciones: { tipo: number; l: number; a: number; disponibles: number; peso: number }[] = [];
      tipos.forEach((t, i) => {
        const disp = t.unidades.length - (t === guia!.t ? 1 : 0);
        if (disp <= 0) return;
        const o = orientarEnFranja(t, h, exacta, largoUtil);
        if (o) opciones.push({ tipo: i, l: o[0], a: o[1], disponibles: disp, peso: pesos[i] });
      });
      const usados = mochilaFranja(opciones, largoUtil - guia.l - k, k);

      const franja: Franja = { y: lam.yLibre, alto: h, x: caja.X0, idx: lam.franjas.length, items: [], columnas: [] };
      lam.franjas.push(franja);
      lam.yLibre = franja.y + h + k;
      abrirColumna(guia.t.unidades.pop()!, lam, franja, guia.l, guia.a, k);
      for (const o of opciones) {
        const n = usados.get(o.tipo) ?? 0;
        for (let c = 0; c < n; c++) abrirColumna(tipos[o.tipo].unidades.pop()!, lam, franja, o.l, o.a, k);
      }

      // Apilar en las columnas lo que todavía quepa encima (de más alto a más bajo).
      if (!exacta) {
        for (const col of franja.columnas) {
          for (;;) {
            const libre = franja.y + franja.alto - col.yLibre;
            let elegido: { t: TipoPendiente; l: number; a: number } | null = null;
            for (const t of tipos) {
              if (!t.unidades.length) continue;
              const ops: [number, number][] = t.girable && !casi(t.l, t.a) ? [[t.l, t.a], [t.a, t.l]] : [[t.l, t.a]];
              for (const [l, a] of ops) {
                const anchoOk = l <= col.ancho + 0.01;
                if (anchoOk && a <= libre + 0.01 && (!elegido || l * a > elegido.l * elegido.a)) elegido = { t, l, a };
              }
            }
            if (!elegido) break;
            const u = elegido.t.unidades.pop()!;
            const c: Colocacion = {
              id: u.id, etiqueta: u.etiqueta, grupo: u.grupo, x: col.x, y: col.yLibre,
              largoMm: elegido.l, anchoMm: elegido.a, girada: !casi(elegido.l, u.l0), franja: franja.idx, columna: col.idx,
            };
            col.items.push(c);
            franja.items.push(c);
            col.yLibre += elegido.a + k;
            lam.usado += elegido.l * elegido.a;
          }
        }
      }
    }
    if (!lam.franjas.length) break; // nada cabe ni en lámina vacía
    laminas.push(lam);
  }
  return laminas;
}

/**
 * Criterio de planta, en orden:
 * 1. Menos láminas.
 * 2. La última lámina lo más vacía posible: el sobrante queda en una sola pieza al final.
 * 3. Menos cortes (franjas + columnas): menos tiempo de seccionadora a igual material.
 */
function mejorQue(a: Lamina[], b: Lamina[]): boolean {
  if (a.length !== b.length) return a.length < b.length;
  const ua = usadoUltima(a);
  const ub = usadoUltima(b);
  if (Math.abs(ua - ub) > 1) return ua < ub;
  return cortesAprox(a) < cortesAprox(b);
}

const usadoUltima = (laminas: Lamina[]) => laminas[laminas.length - 1]?.usado ?? 0;
const cortesAprox = (laminas: Lamina[]) =>
  laminas.reduce((t, l) => t + l.franjas.reduce((s, f) => s + 1 + f.columnas.length, 0), 0);

// Sobrantes: lo que queda encima de cada columna, a la derecha de cada franja y la
// banda final sin usar. Se calcula en el sistema de la lámina acomodada y, si estaba
// transpuesta, se devuelve a la orientación física.
function aPatron(
  lam: Lamina, bordeReal: { X1: number; Y1: number }, areaLamina: number, cfg: ConfigOptimizador,
): Patron {
  const borde = lam.transpuesta ? { X1: bordeReal.Y1, Y1: bordeReal.X1 } : bordeReal;
  const colocaciones = lam.franjas.flatMap((f) => f.items);
  const areaPiezasMm2 = colocaciones.reduce((s, c) => s + c.largoMm * c.anchoMm, 0);
  const sobrantes: Sobrante[] = [];

  for (const f of lam.franjas) {
    const tope = f.y + f.alto;
    for (const col of f.columnas) {
      const alto = tope - col.yLibre;
      if (alto > 1) sobrantes.push(sobrante(col.x, col.yLibre, col.ancho, alto, cfg));
    }
    const ancho = borde.X1 - f.x;
    if (ancho > 1) sobrantes.push(sobrante(f.x, f.y, ancho, f.alto, cfg));
  }
  const yFin = Math.max(...lam.franjas.map((f) => f.y + f.alto), 0) + cfg.discoMm;
  const alto = borde.Y1 - yFin;
  if (alto > 1) sobrantes.push(sobrante(cfg.refiladoMm, yFin, borde.X1 - cfg.refiladoMm, alto, cfg));

  const patron: Patron = {
    repeticiones: 1, colocaciones, sobrantes,
    areaPiezasMm2,
    desperdicioPct: pct((1 - areaPiezasMm2 / areaLamina) * 100),
  };
  return lam.transpuesta ? transponer(patron) : patron;
}

function transponer(p: Patron): Patron {
  return {
    ...p,
    transpuesta: true,
    colocaciones: p.colocaciones.map((c) => ({ ...c, x: c.y, y: c.x, largoMm: c.anchoMm, anchoMm: c.largoMm })),
    sobrantes: p.sobrantes.map((r) => ({ ...r, x: r.y, y: r.x, largoMm: r.anchoMm, anchoMm: r.largoMm })),
  };
}

/**
 * Revisa que un patrón se pueda cortar: cada pieza dentro de la zona útil (con
 * refilado) y ninguna pieza solapada con otra ni a menos del espesor de sierra.
 * Devuelve la lista de problemas (vacía si es válido). Lo usan las pruebas y el
 * benchmark; es barato para detectar regresiones del acomodo.
 */
export function validarPatron(p: Patron, formato: FormatoLamina, cfg: ConfigOptimizador): string[] {
  const errores: string[] = [];
  const r = cfg.refiladoMm;
  const tol = 0.05;
  const cs = p.colocaciones;
  for (const c of cs) {
    if (c.x < r - tol || c.y < r - tol
      || c.x + c.largoMm > formato.largoMm - r + tol || c.y + c.anchoMm > formato.anchoMm - r + tol) {
      errores.push(`Pieza ${c.etiqueta} fuera de la zona útil en (${c.x}, ${c.y})`);
    }
  }
  const k = cfg.discoMm - tol;
  for (let i = 0; i < cs.length; i++) {
    for (let j = i + 1; j < cs.length; j++) {
      const a = cs[i]; const b = cs[j];
      const separadas = a.x + a.largoMm + k <= b.x || b.x + b.largoMm + k <= a.x
        || a.y + a.anchoMm + k <= b.y || b.y + b.anchoMm + k <= a.y;
      if (!separadas) errores.push(`Piezas ${a.etiqueta} y ${b.etiqueta} se solapan o no dejan sierra`);
    }
  }
  return errores;
}

function sobrante(x: number, y: number, largoMm: number, anchoMm: number, cfg: ConfigOptimizador): Sobrante {
  const mayor = Math.max(largoMm, anchoMm);
  const menor = Math.min(largoMm, anchoMm);
  const minMayor = Math.max(cfg.sobranteMinLargoMm, cfg.sobranteMinAnchoMm);
  const minMenor = Math.min(cfg.sobranteMinLargoMm, cfg.sobranteMinAnchoMm);
  return {
    x, y, largoMm: Math.round(largoMm * 10) / 10, anchoMm: Math.round(anchoMm * 10) / 10,
    reutilizable: mayor >= minMayor && menor >= minMenor,
  };
}

// Las láminas con el mismo acomodo se cortan juntas: se muestran como "N de L x A".
function agruparPatrones(patrones: Patron[]): Patron[] {
  const salida: Patron[] = [];
  const indice = new Map<string, Patron>();
  for (const p of patrones) {
    const clave = p.colocaciones
      .map((c) => `${c.grupo}@${Math.round(c.x)},${Math.round(c.y)},${Math.round(c.largoMm)}x${Math.round(c.anchoMm)}`)
      .sort()
      .join('|');
    const ya = indice.get(clave);
    if (ya) { ya.repeticiones += 1; continue; }
    indice.set(clave, p);
    salida.push(p);
  }
  return salida;
}

// ---------------------------------------------------------------------------
// Puente entre la lista de corte y el acomodo: un plan por material.
// ---------------------------------------------------------------------------

export type EsquemaMaterial = {
  material: string;
  proveedor: string;
  espesorMm: number | null;
  laminasPorPila: number | null;
  textura: string;
  /** La textura del material permite girar sus piezas. */
  girable: boolean;
  plan: PlanMaterialCorte;
};

/**
 * Optimiza cada material de la lista de corte en su propio formato de lámina.
 *
 * Los materiales sin formato configurado se devuelven aparte en vez de
 * acomodarse a ciegas: sin medida de lámina el plan no significa nada.
 */
export function esquemasDesdeLista(
  lista: {
    filas: readonly { material: string; pieza: string; largoMm: number; anchoMm: number; cantidad: number }[];
    materiales: readonly {
      material: string; proveedor: string; espesorMm: number | null;
      formato: FormatoLamina | null; laminasPorPila: number | null;
    }[];
  },
  cfg: ConfigOptimizador,
  texturaDe: (material: string) => string,
): { esquemas: EsquemaMaterial[]; sinFormato: string[] } {
  const esquemas: EsquemaMaterial[] = [];
  const sinFormato: string[] = [];

  for (const m of lista.materiales) {
    if (!m.formato) { sinFormato.push(m.material); continue; }
    const textura = texturaDe(m.material);
    // El giro depende de la máquina y de la veta: si el tablero no rota veta, no se gira.
    const rotaVeta = cfg.texturas.find((t) => t.nombre === textura)?.rotaVeta ?? true;
    const girable = cfg.giraLamina && rotaVeta;

    const piezas: PiezaCorte[] = lista.filas
      .filter((f) => f.material === m.material)
      .map((f, i) => ({
        id: `${m.material}#${i}`, etiqueta: f.pieza,
        largoMm: f.largoMm, anchoMm: f.anchoMm, cantidad: f.cantidad, girable,
      }));

    esquemas.push({
      material: m.material, proveedor: m.proveedor, espesorMm: m.espesorMm,
      laminasPorPila: m.laminasPorPila, textura, girable,
      plan: optimizarMaterial(piezas, m.formato, cfg),
    });
  }
  return { esquemas, sinFormato };
}
