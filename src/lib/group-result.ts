import type { Breakdown } from '@/lib/engine';
import type { GroupCalculation } from '@/lib/group-engine';

export type CotizarGrupoResult = Breakdown & {
  trm: number;
  margen: number;
  modulos: number;
  largoTotalIn: number;
  laterales: number;
  uniones: number;
  piezasContinuas: string[];
};

const sum = (values: number[]) => values.reduce((total, value) => total + Number(value || 0), 0);
const nearZero = (value: number) => Math.abs(value) < 1e-9 ? 0 : value;
const clean = (value: number) => nearZero(Math.round(value * 1e9) / 1e9);

function groupBy<T, A>(
  rows: T[],
  keyOf: (row: T) => string,
  seed: (row: T) => A,
  merge: (acc: A, row: T) => void,
): A[] {
  const grouped = new Map<string, A>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = grouped.get(key);
    if (current) merge(current, row);
    else grouped.set(key, seed(row));
  }
  return [...grouped.values()];
}

/**
 * Convierte las asignaciones internas por integrante del motor de grupos en un
 * único desglose físico y comercial. Las líneas continúan existiendo dentro
 * del motor para conciliar costos, pero no se exponen en el simulador.
 */
export function consolidarGrupo(
  group: GroupCalculation,
  meta: { trm: number; margen: number },
): CotizarGrupoResult {
  const lineas = group.lineas;
  const piezas = groupBy(
    lineas.flatMap((linea) => linea.piezas),
    (row) => [row.pieza, row.rol, row.largoIn, row.anchoIn].join('|'),
    (row) => ({ ...row }),
    (acc, row) => {
      acc.cant = clean(acc.cant + row.cant);
      acc.areaCm2 = clean(acc.areaCm2 + row.areaCm2);
    },
  );
  const maderaPorRol = groupBy(
    lineas.flatMap((linea) => linea.maderaPorRol),
    (row) => `${row.rol}|${row.codigo}`,
    (row) => ({ ...row }),
    (acc, row) => {
      acc.cm2 = clean(acc.cm2 + row.cm2);
      acc.costo = clean(acc.costo + row.costo);
    },
  );
  const cantoPorCalibre = groupBy(
    lineas.flatMap((linea) => linea.cantoPorCalibre),
    (row) => `${row.calibre}|${row.precio}`,
    (row) => ({ ...row }),
    (acc, row) => {
      acc.longCm = clean(acc.longCm + row.longCm);
      acc.costo = clean(acc.costo + row.costo);
    },
  );
  const herrajes = groupBy(
    lineas.flatMap((linea) => linea.herrajes),
    (row) => `${row.rol}|${row.codigo ?? ''}|${row.precio}`,
    (row) => ({ ...row }),
    (acc, row) => {
      acc.cant = clean(acc.cant + row.cant);
      acc.costo = clean(acc.costo + row.costo);
    },
  );
  const consumibles: Record<string, number> = {};
  for (const linea of lineas) {
    for (const [key, value] of Object.entries(linea.consumibles)) {
      consumibles[key] = clean((consumibles[key] ?? 0) + value);
    }
  }

  return {
    vars: {
      modulos: lineas.length,
      largo_total_in: clean(group.largoTotalIn),
      laterales: group.laterales,
      uniones: group.uniones,
    },
    piezas,
    maderaPorRol,
    cantoPorCalibre,
    consumibles,
    herrajes,
    costoMadera: sum(lineas.map((linea) => linea.costoMadera)),
    costoCanto: sum(lineas.map((linea) => linea.costoCanto)),
    costoConsumibles: sum(lineas.map((linea) => linea.costoConsumibles)),
    costoSinHerrajes: sum(lineas.map((linea) => linea.costoSinHerrajes)),
    costoHerrajes: sum(lineas.map((linea) => linea.costoHerrajes)),
    costoConHerrajes: sum(lineas.map((linea) => linea.costoConHerrajes)),
    precioCop: sum(lineas.map((linea) => linea.precioCop)),
    precioUsd: sum(lineas.map((linea) => linea.precioUsd)),
    precioHerrajesCop: sum(lineas.map((linea) => linea.precioHerrajesCop)),
    precioHerrajesUsd: sum(lineas.map((linea) => linea.precioHerrajesUsd)),
    precioConHerrajesCop: sum(lineas.map((linea) => linea.precioConHerrajesCop)),
    precioConHerrajesUsd: sum(lineas.map((linea) => linea.precioConHerrajesUsd)),
    margenHerraje: lineas[0]?.margenHerraje ?? 0,
    trm: meta.trm,
    margen: meta.margen,
    modulos: lineas.length,
    largoTotalIn: clean(group.largoTotalIn),
    laterales: group.laterales,
    uniones: group.uniones,
    piezasContinuas: group.piezasContinuas,
  };
}
