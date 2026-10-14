// Plan de corte completo: qué se corta cada día, cómo se acomoda en la lámina y
// cuánto cuesta en tableros, desperdicio y cortes.
//
// Compone lo que ya existe, sin lógica nueva de acomodo:
//   plan-diario  →  qué módulos van en cada día
//   lista        →  las piezas de esos módulos, por material
//   guillotina   →  el acomodo de cada material en su lámina
//   secuencia    →  los cortes de ese acomodo
//
// Importa: **optimizar día por día gasta más tablero que optimizar todo junto**,
// porque las piezas de días distintos no pueden compartir lámina. Por eso el plan
// trae también la corrida del proyecto completo, para que se vea lo que cuesta
// repartir la producción en jornadas.
import type { ConfigOptimizador } from './config';
import { construirListaCorte, type ModuloEntrada, type TableroInfo } from './lista';
import { materialPrincipal, planDiarioDeCorte, type ModuloPlanEntrada } from './plan-diario';
import {
  buscarReparto, unidadesDelDia,
  type EntradaReparto, type LineaReparto, type OpcionesBusqueda, type Reparto,
} from './reparto';
import { esquemasDesdeLista, type EsquemaMaterial } from './guillotina';
import { cortesDeMaterial, sumarCortes, CORTES_CERO, type Cortes } from './secuencia';

export type ModuloProyecto = ModuloEntrada & ModuloPlanEntrada & {
  /** Grupo fisico: sus lineas no se separan entre dias. */
  grupoId?: string | null;
};

/** Como se repartieron los muebles entre los dias y que costo decidirlo. */
export type InfoReparto = {
  /** Movimientos de reparto evaluados; distintos de los acomodos de lamina. */
  iteraciones: number;
  /** Se demostro que no existe un reparto mejor. */
  optimo: boolean;
  /** Tableros del reparto codicioso de partida, para ver cuanto gano la busqueda. */
  tablerosInicial: number;
  /** Ni el reparto perfecto baja de aqui. */
  cotaTableros: number;
  semilla: number;
  evaluaciones: number;
  aciertosCache: number;
};

export type TotalesCorte = {
  laminas: number;
  /** Combinaciones de acomodo evaluadas para llegar a este plan. */
  iteraciones: number;
  areaLaminasM2: number;
  areaPiezasM2: number;
  desperdicioPct: number;
  cortes: Cortes;
};

export type MaterialDia = {
  material: string;
  esquema: EsquemaMaterial;
  cortes: Cortes;
};

export type CorteDia = {
  dia: number;
  piezas: number;
  modulos: {
    codigo: string;
    cocina: string;
    unidades: number;
    /** Piezas de esas unidades. Fraccionario en módulos agrupados. */
    piezas: number;
    /** Tablero que más piezas aporta al módulo: el que ordenó el reparto. */
    material: string;
    /** El módulo se corta también en otro día. */
    partido: boolean;
  }[];
  materiales: MaterialDia[];
  sinFormato: string[];
  totales: TotalesCorte;
};

export type FilaMaterial = {
  material: string;
  laminas: number;
  iteraciones: number;
  areaLaminasM2: number;
  areaPiezasM2: number;
  desperdicioPct: number;
  cortes: Cortes;
};

export type PlanCorte = {
  ritmo: number;
  reparto: InfoReparto;
  dias: CorteDia[];
  /** Totales sumando todos los días: lo que de verdad se compra y se corta. */
  consolidado: TotalesCorte;
  /**
   * Mismo proyecto cortado de una sola vez: sirve para ver qué cuesta partirlo en
   * días y es lo que se muestra mientras no haya ritmo definido.
   */
  proyectoCompleto: TotalesCorte & { materiales: MaterialDia[]; sinFormato: string[] };
  /** Consolidado abierto por material, sumando los días. */
  porMaterial: FilaMaterial[];
};

const M2 = (mm2: number) => Math.round(mm2 / 1e4) / 100;
const pct = (n: number) => Math.round(n * 1000) / 1000;
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Plan de corte del proyecto, día por día.
 *
 * Con `piezasPorDia` en 0 no hay jornadas: se devuelve el proyecto completo y
 * `dias` vacío, que es lo que la pantalla usa para pedir el ritmo.
 */
export function planDeCorte(
  modulos: readonly ModuloProyecto[],
  tableros: readonly TableroInfo[],
  cfg: ConfigOptimizador,
  texturaDe: (material: string) => string,
  busqueda: OpcionesBusqueda = {},
): PlanCorte {
  const todoJunto = esquemasDe(modulos, tableros, cfg, texturaDe);
  const ritmo = Math.round(cfg.piezasPorDia);
  const completo = { ...totalesDe(todoJunto.materiales), ...todoJunto };

  if (!(ritmo > 0) || modulos.length === 0) {
    return {
      ritmo, dias: [], consolidado: sumarTotales([]), proyectoCompleto: completo, porMaterial: [],
      reparto: {
        iteraciones: 0, optimo: true, tablerosInicial: 0, cotaTableros: 0,
        semilla: 0, evaluaciones: 0, aciertosCache: 0,
      },
    };
  }

  // Durante la busqueda el acomodo corre en modo rapido (solo las heuristicas
  // deterministas): se evaluan miles de repartos y cada uno acomoda varios dias.
  // El reparto elegido se vuelve a acomodar con la configuracion completa.
  const cfgRapida: ConfigOptimizador = { ...cfg, iteraciones: 0, tiempoMaxMs: 0, heuristicasMax: 4 };
  const entrada = entradaDeReparto(modulos, tableros, cfgRapida, texturaDe, ritmo, cfg);
  const semilla = busqueda.semilla ?? 20261014;
  const inicial = buscarReparto(entrada, { iteracionesMax: 0, tiempoMaxMs: 0 });
  const hallado = buscarReparto(entrada, { ...busqueda, semilla });
  const dias = diasDesdeReparto(hallado.reparto, modulos, tableros, cfg, texturaDe);

  return {
    ritmo,
    dias,
    consolidado: sumarTotales(dias.map((d) => d.totales)),
    proyectoCompleto: completo,
    porMaterial: consolidarPorMaterial(dias),
    reparto: {
      iteraciones: hallado.iteraciones,
      optimo: hallado.optimo,
      tablerosInicial: inicial.tableros,
      cotaTableros: completo.laminas,
      semilla,
      evaluaciones: hallado.evaluaciones,
      aciertosCache: hallado.aciertosCache,
    },
  };
}

// Traduce el proyecto a lo que la busqueda entiende: lineas con sus unidades, su
// grupo fisico y cuanto cuesta cortar un dia cualquiera.
function entradaDeReparto(
  modulos: readonly ModuloProyecto[],
  tableros: readonly TableroInfo[],
  cfgRapida: ConfigOptimizador,
  texturaDe: (material: string) => string,
  ritmo: number,
  cfg: ConfigOptimizador,
): EntradaReparto {
  const lineas: LineaReparto[] = modulos.map((m) => ({
    lineaId: m.lineaId,
    unidades: Number(m.cantidad) > 0 ? Math.round(Number(m.cantidad)) : 1,
    grupoId: m.grupoId ?? null,
    piezasPorUnidad: piezasDe(m),
  }));

  return {
    lineas,
    piezasPorDia: ritmo,
    toleranciaRitmo: cfg.toleranciaRitmoPct / 100,
    diasExtra: cfg.diasExtraPermitidos,
    cotaDia: (u) => {
      const delDia = modulos.map((m, i) => ({ ...m, cantidad: u[i] })).filter((m) => m.cantidad > 0);
      if (!delDia.length) return 0;
      const lista = construirListaCorte(delDia, [...tableros], cfgRapida);
      let total = 0;
      for (const mat of lista.materiales) {
        if (!mat.formato) continue;
        const util = (mat.formato.largoMm - 2 * cfgRapida.refiladoMm) * (mat.formato.anchoMm - 2 * cfgRapida.refiladoMm);
        if (!(util > 0)) continue;
        const conSierra = lista.filas
          .filter((f) => f.material === mat.material)
          .reduce((s, f) => s + f.cantidad * (f.largoMm + cfgRapida.discoMm) * (f.anchoMm + cfgRapida.discoMm), 0);
        total += Math.ceil(conSierra / util);
      }
      return total;
    },
    evaluarDia: (u) => {
      const delDia = modulos.map((m, i) => ({ ...m, cantidad: u[i] })).filter((m) => m.cantidad > 0);
      const { materiales } = esquemasDe(delDia, tableros, cfgRapida, texturaDe);
      return {
        laminas: materiales.reduce((s, m) => s + m.esquema.plan.laminas, 0),
        areaPiezasM2: materiales.reduce((s, m) => s + m.esquema.plan.areaPiezasM2, 0),
        areaLaminasM2: materiales.reduce((s, m) => s + m.esquema.plan.areaLaminasM2, 0),
      };
    },
  };
}

const piezasDe = (m: ModuloProyecto) => m.piezas.reduce((s, p) => s + (p.cant > 0 ? p.cant : 0), 0);

// El reparto elegido, ya acomodado con la configuracion completa.
function diasDesdeReparto(
  reparto: Reparto,
  modulos: readonly ModuloProyecto[],
  tableros: readonly TableroInfo[],
  cfg: ConfigOptimizador,
  texturaDe: (material: string) => string,
): CorteDia[] {
  const enVariosDias = modulos.map((_, i) => {
    let n = 0;
    for (let d = 0; d < reparto.dias; d++) if (reparto.matriz[d * reparto.lineas + i] > 0) n++;
    return n > 1;
  });

  const dias: CorteDia[] = [];
  for (let d = 0; d < reparto.dias; d++) {
    const u = unidadesDelDia(reparto, d);
    const delDia = modulos.map((m, i) => ({ ...m, cantidad: u[i] })).filter((m) => m.cantidad > 0);
    if (!delDia.length) continue; // un dia sin trabajo no se muestra.

    const { materiales, sinFormato } = esquemasDe(delDia, tableros, cfg, texturaDe);
    dias.push({
      dia: dias.length + 1,
      piezas: r2(delDia.reduce((s, m) => s + m.cantidad * piezasDe(m), 0)),
      modulos: modulos
        .map((m, i) => ({ m, i, unidades: u[i] }))
        .filter((x) => x.unidades > 0)
        .map(({ m, i, unidades }) => ({
          codigo: m.codigo,
          cocina: m.cocina,
          unidades,
          piezas: r2(unidades * piezasDe(m)),
          material: materialPrincipal(m),
          partido: enVariosDias[i],
        })),
      materiales,
      sinFormato,
      totales: totalesDe(materiales),
    });
  }
  return dias;
}

function esquemasDe(
  modulos: readonly ModuloProyecto[],
  tableros: readonly TableroInfo[],
  cfg: ConfigOptimizador,
  texturaDe: (material: string) => string,
): { materiales: MaterialDia[]; sinFormato: string[] } {
  const lista = construirListaCorte([...modulos], [...tableros], cfg);
  const { esquemas, sinFormato } = esquemasDesdeLista(lista, cfg, texturaDe);
  return {
    materiales: esquemas.map((esquema) => ({
      material: esquema.material,
      esquema,
      cortes: cortesDeMaterial(esquema.plan.patrones, esquema.plan.formato, esquema.laminasPorPila, cfg),
    })),
    sinFormato,
  };
}

function totalesDe(materiales: readonly MaterialDia[]): TotalesCorte {
  const laminas = materiales.reduce((s, m) => s + m.esquema.plan.laminas, 0);
  const areaLaminasM2 = r2(materiales.reduce((s, m) => s + m.esquema.plan.areaLaminasM2, 0));
  const areaPiezasM2 = r2(materiales.reduce((s, m) => s + m.esquema.plan.areaPiezasM2, 0));
  return {
    laminas, areaLaminasM2, areaPiezasM2,
    iteraciones: materiales.reduce((s, m) => s + m.esquema.plan.iteraciones, 0),
    desperdicioPct: areaLaminasM2 > 0 ? pct((1 - areaPiezasM2 / areaLaminasM2) * 100) : 0,
    cortes: materiales.reduce((acc, m) => sumarCortes(acc, m.cortes), CORTES_CERO),
  };
}

function sumarTotales(totales: readonly TotalesCorte[]): TotalesCorte {
  const laminas = totales.reduce((s, t) => s + t.laminas, 0);
  const areaLaminasM2 = r2(totales.reduce((s, t) => s + t.areaLaminasM2, 0));
  const areaPiezasM2 = r2(totales.reduce((s, t) => s + t.areaPiezasM2, 0));
  return {
    laminas, areaLaminasM2, areaPiezasM2,
    iteraciones: totales.reduce((s, t) => s + t.iteraciones, 0),
    desperdicioPct: areaLaminasM2 > 0 ? pct((1 - areaPiezasM2 / areaLaminasM2) * 100) : 0,
    cortes: totales.reduce((acc, t) => sumarCortes(acc, t.cortes), CORTES_CERO),
  };
}

// El mismo material aparece en varios días: aquí se suma para saber cuánto tablero
// de cada referencia hay que comprar y cuánto se pierde en total.
function consolidarPorMaterial(dias: readonly CorteDia[]): FilaMaterial[] {
  const acc = new Map<string, FilaMaterial>();
  for (const d of dias) {
    for (const m of d.materiales) {
      const fila = acc.get(m.material) ?? {
        material: m.material, laminas: 0, iteraciones: 0, areaLaminasM2: 0, areaPiezasM2: 0,
        desperdicioPct: 0, cortes: CORTES_CERO,
      };
      fila.laminas += m.esquema.plan.laminas;
      fila.iteraciones += m.esquema.plan.iteraciones;
      fila.areaLaminasM2 = r2(fila.areaLaminasM2 + m.esquema.plan.areaLaminasM2);
      fila.areaPiezasM2 = r2(fila.areaPiezasM2 + m.esquema.plan.areaPiezasM2);
      fila.cortes = sumarCortes(fila.cortes, m.cortes);
      acc.set(m.material, fila);
    }
  }
  return [...acc.values()]
    .map((f) => ({ ...f, desperdicioPct: f.areaLaminasM2 > 0 ? pct((1 - f.areaPiezasM2 / f.areaLaminasM2) * 100) : 0 }))
    .sort((a, b) => b.laminas - a.laminas || a.material.localeCompare(b.material));
}
