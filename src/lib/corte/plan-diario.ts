// Plan de corte día por día: reparte los módulos de una cotización entre jornadas
// de producción según el ritmo de la seccionadora (`piezasPorDia`), diciendo qué
// módulos y cuántas unidades van en cada día.
//
// Dos reglas decididas con producción (2026-10-14):
//  1. Los módulos se **agrupan por material**, para cambiar de tablero lo menos
//     posible en la máquina. Una cocina puede quedar repartida en varios días.
//  2. Las unidades de un módulo **se pueden partir** entre dos días (6 y 4 de un
//     módulo de 10), de modo que cada jornada se llene hasta el ritmo.
//
// Módulo puro: recibe el despiece ya calculado por el motor, sin Next ni Supabase.
import { SIN_TABLERO } from './lista';

export type ModuloPlanEntrada = {
  lineaId: string;
  codigo: string;
  cocina: string;
  cantidad: number;
  piezas: readonly { rol: string; cant: number }[];
  // rol de tablero → código de tablero (`maderaPorRol` del motor).
  tableroPorRol: Record<string, string>;
};

export type ItemDia = {
  lineaId: string;
  codigo: string;
  cocina: string;
  /** Tablero que más piezas aporta al módulo: es el que ordena el plan. */
  material: string;
  unidades: number;
  /** Piezas de esas unidades. Fraccionario en módulos agrupados (lateral × 1,5). */
  piezas: number;
  /** El módulo no cabe en un solo día y se corta también en otro. */
  partido: boolean;
};

export type DiaCorte = {
  dia: number;
  piezas: number;
  /** Piezas que caben todavía en la jornada. */
  libre: number;
  materiales: string[];
  items: ItemDia[];
  alertas: string[];
};

export type PlanDiario = {
  dias: DiaCorte[];
  ritmo: number;
  /** Suma exacta del despiece por módulo (puede traer fracciones). */
  totalPiezas: number;
  /** Cota teórica si las piezas se pudieran cortar sueltas: no siempre se alcanza. */
  diasMinimos: number;
};

const PLAN_VACIO = (ritmo: number, totalPiezas: number, diasMinimos: number): PlanDiario =>
  ({ dias: [], ritmo, totalPiezas, diasMinimos });

const unidadesDe = (cantidad: number) => (Number(cantidad) > 0 ? Number(cantidad) : 1);

const piezasPorUnidadDe = (m: ModuloPlanEntrada) =>
  m.piezas.reduce((s, p) => s + (p.cant > 0 ? p.cant : 0), 0);

/** Tablero que más piezas aporta al módulo; empate, el primero por nombre. */
export function materialPrincipal(m: ModuloPlanEntrada): string {
  const porMaterial = new Map<string, number>();
  for (const p of m.piezas) {
    if (!(p.cant > 0)) continue;
    const material = m.tableroPorRol[p.rol] || SIN_TABLERO;
    porMaterial.set(material, (porMaterial.get(material) ?? 0) + p.cant);
  }
  const orden = [...porMaterial.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return orden[0]?.[0] ?? SIN_TABLERO;
}

/**
 * Reparte los módulos en jornadas de `piezasPorDia` piezas.
 *
 * Los materiales se atienden de mayor a menor volumen —la corrida larga primero—
 * y dentro de cada material se respeta el orden de la cotización. Si una sola
 * unidad ya pasa del ritmo, ocupa su día y se avisa en `alertas`: el ritmo está
 * mal puesto o el módulo es excepcional, y conviene que se vea en pantalla en vez
 * de repartirlo callando.
 */
export function planDiarioDeCorte(modulos: readonly ModuloPlanEntrada[], piezasPorDia: number): PlanDiario {
  const ritmo = Math.round(Number(piezasPorDia));
  const totalPiezas = modulos.reduce((s, m) => s + piezasPorUnidadDe(m) * unidadesDe(m.cantidad), 0);
  const diasMinimos = ritmo > 0 ? Math.ceil(totalPiezas / ritmo) : 0;
  if (!(ritmo > 0) || !(totalPiezas > 0)) return PLAN_VACIO(ritmo, totalPiezas, diasMinimos);

  // Orden: material con más piezas primero; dentro del material, orden de la cotización.
  const volumen = new Map<string, number>();
  const conMaterial = modulos.map((m, i) => {
    const material = materialPrincipal(m);
    const piezas = piezasPorUnidadDe(m) * unidadesDe(m.cantidad);
    volumen.set(material, (volumen.get(material) ?? 0) + piezas);
    return { m, material, orden: i };
  });
  const cola = conMaterial.sort((a, b) =>
    (volumen.get(b.material) ?? 0) - (volumen.get(a.material) ?? 0)
    || a.material.localeCompare(b.material)
    || a.orden - b.orden,
  );

  const dias: DiaCorte[] = [];
  let dia: DiaCorte = nuevoDia(1, ritmo);

  for (const { m, material } of cola) {
    const porUnidad = piezasPorUnidadDe(m);
    let restantes = unidadesDe(m.cantidad);
    let yaCortadas = 0;

    // Un módulo sin piezas no consume jornada: se anota donde caiga y no parte el día.
    if (!(porUnidad > 0)) {
      dia.items.push({ lineaId: m.lineaId, codigo: m.codigo, cocina: m.cocina, material, unidades: restantes, piezas: 0, partido: false });
      continue;
    }

    while (restantes > 0) {
      const caben = Math.floor(dia.libre / porUnidad);
      if (caben < 1) {
        // Ni una unidad cabe. Si el día ya tiene trabajo, se cierra y se sigue en
        // el siguiente; si está vacío, el módulo excede el ritmo y ocupa el día solo.
        if (dia.items.length > 0) {
          dias.push(cerrar(dia));
          dia = nuevoDia(dias.length + 1, ritmo);
          continue;
        }
        dia.items.push({ lineaId: m.lineaId, codigo: m.codigo, cocina: m.cocina, material, unidades: 1, piezas: porUnidad, partido: yaCortadas > 0 || restantes > 1 });
        dia.piezas += porUnidad;
        dia.libre = 0;
        dia.alertas.push(`Una unidad de ${m.codigo} son ${redondear(porUnidad)} piezas y el ritmo es de ${ritmo}: ocupa el día sola.`);
        restantes -= 1;
        yaCortadas += 1;
        continue;
      }

      const toma = Math.min(caben, restantes);
      const piezas = toma * porUnidad;
      dia.items.push({ lineaId: m.lineaId, codigo: m.codigo, cocina: m.cocina, material, unidades: toma, piezas, partido: yaCortadas > 0 || toma < restantes });
      dia.piezas += piezas;
      dia.libre -= piezas;
      restantes -= toma;
      yaCortadas += toma;
    }
  }
  if (dia.items.length > 0) dias.push(cerrar(dia));

  return { dias, ritmo, totalPiezas, diasMinimos };
}

function nuevoDia(dia: number, ritmo: number): DiaCorte {
  return { dia, piezas: 0, libre: ritmo, materiales: [], items: [], alertas: [] };
}

// Al cerrar se fijan los materiales del día y se redondean las piezas una sola vez.
function cerrar(dia: DiaCorte): DiaCorte {
  return {
    ...dia,
    piezas: redondear(dia.piezas),
    libre: redondear(dia.libre),
    materiales: [...new Set(dia.items.map((i) => i.material))],
  };
}

const redondear = (n: number) => Math.round(n * 100) / 100;
