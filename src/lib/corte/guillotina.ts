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
  /** Piezas que no caben ni girando en la lámina útil: quedan fuera del plan. */
  noCaben: { etiqueta: string; largoMm: number; anchoMm: number; cantidad: number }[];
};

type Unidad = {
  id: string; etiqueta: string; grupo: number;
  l: number; a: number; girable: boolean;
  /** Largo de la pieza en el despiece: contra este se decide si quedó girada. */
  l0: number;
};
type Franja = { y: number; alto: number; x: number; items: Colocacion[] };
type Lamina = { franjas: Franja[]; usado: number; yLibre: number };

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
    iteraciones: 0, metaInalcanzable: false, noCaben,
  };
  if (!grupos.length || !(utilL > 0) || !(utilA > 0)) return vacio;

  const unidades: Unidad[] = [];
  for (const g of grupos) {
    for (let i = 0; i < g.cantidad; i++) {
      unidades.push({
        id: g.id, etiqueta: g.etiqueta, grupo: g.grupo,
        l: g.largoMm, a: g.anchoMm, girable: g.girable, l0: g.largoMm,
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
  const areaLaminasMm2 = laminas.length * areaLamina;
  const laminasMinimas = laminasIdeal;

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

function buscarAcomodo(
  unidades: Unidad[], caja: Caja, cfg: ConfigOptimizador, laminasIdeal: number,
): { mejor: Lamina[] | null; iteraciones: number } {
  let mejor: Lamina[] | null = null;
  let iteraciones = 0;

  const probar = (us: Unidad[], comparar: (a: Unidad, b: Unidad) => number,
    modo: 'global' | 'secuencial', franjaNueva: 'baja' | 'alta') => {
    iteraciones++;
    const intento = empacar(us, comparar, caja, cfg, modo, franjaNueva);
    if (!mejor || mejorQue(intento, mejor)) mejor = intento;
  };

  // Con `heuristicasMax` se corren solo las primeras: la busqueda de reparto acomoda
  // miles de dias y no puede pagar las 20 cada vez.
  const topeHeuristicas = cfg.heuristicasMax > 0 ? cfg.heuristicasMax : Number.POSITIVE_INFINITY;
  salir: for (const orden of ORDENES) {
    for (const modo of ['global', 'secuencial'] as const) {
      for (const franjaNueva of ['baja', 'alta'] as const) {
        probar(unidades.map(orden.preparar), orden.comparar, modo, franjaNueva);
        if (iteraciones >= topeHeuristicas) break salir;
      }
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
    if ((i & 15) === 0 && Date.now() > limite) break;

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
    probar(us, comparar, azar() < 0.5 ? 'global' : 'secuencial', azar() < 0.5 ? 'baja' : 'alta');
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
 * alto, `alta` acuesta la pieza para meter muchas de canto (16 refuerzos en una
 * franja en vez de 2 por franja). Cuál gana depende del despiece, así que se
 * prueban las dos.
 *
 * Manda el criterio de planta: primero menos tableros.
 */
function empacar(
  unidades: Unidad[],
  comparar: (a: Unidad, b: Unidad) => number,
  caja: { X0: number; Y0: number; X1: number; Y1: number },
  cfg: ConfigOptimizador,
  modo: 'global' | 'secuencial',
  franjaNueva: 'baja' | 'alta',
): Lamina[] {
  const pendientes = [...unidades].sort(comparar);
  const laminas: Lamina[] = [];
  const nivel3 = cfg.nivelesCorte >= 3;
  const nueva = (): Lamina => ({ franjas: [], usado: 0, yLibre: caja.Y0 });

  if (modo === 'global') {
    for (const u of pendientes) {
      let puesto = null;
      for (const lam of laminas) {
        puesto = colocar(u, lam, caja, cfg, nivel3, franjaNueva);
        if (puesto) break;
      }
      if (!puesto) {
        const lam = nueva();
        puesto = colocar(u, lam, caja, cfg, nivel3, franjaNueva);
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
      if (!colocar(u, lam, caja, cfg, nivel3, franjaNueva)) quedan.push(u);
    }
    // Si no entró nada no hay acomodo posible: se corta aquí en vez de ciclar.
    if (!lam.franjas.length || quedan.length === restantes.length) break;
    laminas.push(lam);
    restantes = quedan;
  }
  return laminas;
}

// Mete la pieza en la franja que menos alto desperdicie; si en ninguna cabe,
// abre franja nueva. Devuelve la colocación o null.
function colocar(
  u: Unidad, lam: Lamina,
  caja: { X0: number; Y0: number; X1: number; Y1: number },
  cfg: ConfigOptimizador, nivel3: boolean, franjaNueva: 'baja' | 'alta',
): Colocacion | null {
  const orientaciones = u.girable && !casi(u.l, u.a) ? [[u.l, u.a], [u.a, u.l]] : [[u.l, u.a]];

  let mejor: { franja: Franja; l: number; a: number; girada: boolean; sobra: number } | null = null;
  for (const franja of lam.franjas) {
    for (const [l, a] of orientaciones) {
      const encaja = nivel3 ? a <= franja.alto + 0.01 : casi(a, franja.alto);
      if (!encaja) continue;
      if (franja.x + l > caja.X1 + 0.01) continue;
      const sobra = franja.alto - a;
      if (!mejor || sobra < mejor.sobra) mejor = { franja, l, a, girada: !casi(l, u.l0), sobra };
    }
  }

  if (mejor) {
    const col: Colocacion = {
      id: u.id, etiqueta: u.etiqueta, grupo: u.grupo,
      x: mejor.franja.x, y: mejor.franja.y, largoMm: mejor.l, anchoMm: mejor.a, girada: mejor.girada,
    };
    mejor.franja.items.push(col);
    mejor.franja.x += mejor.l + cfg.discoMm;
    lam.usado += mejor.l * mejor.a;
    return col;
  }

  // Franja nueva: o la más baja (gasta poco alto) o la más alta que quepa (permite
  // meter muchas piezas de canto). La heurística decide cuál se prueba.
  const cabenNuevas = orientaciones
    .filter(([l, a]) => l <= caja.X1 - caja.X0 + 0.01 && lam.yLibre + a <= caja.Y1 + 0.01)
    .sort((p, q) => (franjaNueva === 'baja' ? p[1] - q[1] : q[1] - p[1]));
  const elegida = cabenNuevas[0];
  if (!elegida) return null;

  const [l, a] = elegida;
  const franja: Franja = { y: lam.yLibre, alto: a, x: caja.X0, items: [] };
  const col: Colocacion = {
    id: u.id, etiqueta: u.etiqueta, grupo: u.grupo,
    x: franja.x, y: franja.y, largoMm: l, anchoMm: a, girada: !casi(l, u.l0),
  };
  franja.items.push(col);
  franja.x += l + cfg.discoMm;
  lam.franjas.push(franja);
  lam.yLibre = franja.y + a + cfg.discoMm;
  lam.usado += l * a;
  return col;
}

// Menos láminas manda; a igualdad, el hueco libre más grande de la última lámina,
// que es el criterio de planta: si sobra, que sobre en una sola pieza aprovechable.
function mejorQue(a: Lamina[], b: Lamina[]): boolean {
  if (a.length !== b.length) return a.length < b.length;
  // A igualdad de láminas, mejor la que deje la última más vacía: el sobrante
  // queda concentrado en una sola lámina, que es lo que pide planta.
  return usadoUltima(a) < usadoUltima(b);
}

const usadoUltima = (laminas: Lamina[]) => laminas[laminas.length - 1]?.usado ?? 0;

// Sobrantes: lo que queda a la derecha de cada franja y la banda inferior sin usar.
function aPatron(
  lam: Lamina, borde: { X1: number; Y1: number }, areaLamina: number, cfg: ConfigOptimizador,
): Patron {
  const colocaciones = lam.franjas.flatMap((f) => f.items);
  const areaPiezasMm2 = colocaciones.reduce((s, c) => s + c.largoMm * c.anchoMm, 0);
  const sobrantes: Sobrante[] = [];

  for (const f of lam.franjas) {
    const ancho = borde.X1 - f.x;
    if (ancho > 1) sobrantes.push(sobrante(f.x, f.y, ancho, f.alto, cfg));
  }
  const yFin = Math.max(...lam.franjas.map((f) => f.y + f.alto), 0) + cfg.discoMm;
  const alto = borde.Y1 - yFin;
  if (alto > 1) sobrantes.push(sobrante(cfg.refiladoMm, yFin, borde.X1 - cfg.refiladoMm, alto, cfg));

  return {
    repeticiones: 1, colocaciones, sobrantes,
    areaPiezasMm2,
    desperdicioPct: pct((1 - areaPiezasMm2 / areaLamina) * 100),
  };
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
