// Lista de corte de un proyecto: convierte el despiece de cada módulo de una cotización
// en piezas por material y calcula los indicadores previos a la optimización
// (piezas totales, días de producción, láminas mínimas y meta de desperdicio).
// Módulo puro: recibe datos ya calculados por el motor.
import {
  formatoConfigurado, laminasPorPila, repartoDiario,
  type ConfigOptimizador, type FormatoLamina,
} from './config';

const MM_POR_IN = 25.4;

export type PiezaEntrada = {
  pieza: string;
  rol: string;
  cant: number;
  largoIn: number;
  anchoIn: number;
  cantoLargos: number;
  cantoAnchos: number;
  cantoCalibre: string | null;
};

export type ModuloEntrada = {
  codigo: string;
  cantidad: number;
  piezas: PiezaEntrada[];
  // rol de tablero → código de tablero (sale de `maderaPorRol` del motor).
  tableroPorRol: Record<string, string>;
};

export type TableroInfo = {
  codigo: string;
  espesor_mm: number | null;
  formato: string | null;
  proveedor?: string | null;
  color_nombre?: string | null;
};

export type FilaListaCorte = {
  material: string;
  pieza: string;
  largoMm: number;
  anchoMm: number;
  cantidad: number;
  cantoLargos: number;
  cantoAnchos: number;
  calibre: string;
  modulos: string[];
};

export type ResumenMaterial = {
  material: string;
  proveedor: string;
  espesorMm: number | null;
  formatoCodigo: string;
  formato: FormatoLamina | null;
  roles: string[];
  piezas: number;
  areaNetaM2: number;
  // Láminas que harían falta si no hubiera ningún desperdicio salvo sierra y refilado.
  laminasMinimas: number | null;
  // Máximo de láminas con el que todavía se cumple el desperdicio máximo.
  laminasMaxDesperdicio: number | null;
  // Desperdicio si se lograra el mínimo teórico (cota inferior real).
  desperdicioMinimoPct: number | null;
  laminasPorPila: number | null;
  alertas: string[];
};

export type ListaCorte = {
  filas: FilaListaCorte[];
  materiales: ResumenMaterial[];
  totalPiezas: number;
  reparto: number[];
};

export const SIN_TABLERO = '(sin tablero asignado)';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function construirListaCorte(modulos: ModuloEntrada[], tableros: TableroInfo[], cfg: ConfigOptimizador): ListaCorte {
  const tabPorCodigo = new Map(tableros.map((t) => [t.codigo, t]));
  const filas = new Map<string, FilaListaCorte & { cantExacta: number }>();
  const rolesPorMaterial = new Map<string, Set<string>>();

  for (const m of modulos) {
    const unidades = Number(m.cantidad) > 0 ? Number(m.cantidad) : 1;
    for (const p of m.piezas) {
      if (!(p.cant > 0)) continue;
      const material = m.tableroPorRol[p.rol] || SIN_TABLERO;
      const largoMm = r1(p.largoIn * MM_POR_IN);
      const anchoMm = r1(p.anchoIn * MM_POR_IN);
      // El enchape va en la llave: dos piezas iguales con canto distinto no se cortan igual.
      const key = [material, largoMm, anchoMm, p.cantoLargos, p.cantoAnchos, p.cantoCalibre ?? '', p.pieza].join('|');
      const fila = filas.get(key) ?? {
        material, pieza: p.pieza, largoMm, anchoMm, cantidad: 0, cantExacta: 0,
        cantoLargos: p.cantoLargos, cantoAnchos: p.cantoAnchos, calibre: p.cantoCalibre ?? '', modulos: [],
      };
      // Los módulos agrupados reparten piezas compartidas en fracciones (lateral × 1,5):
      // se suma exacto y se redondea una sola vez por fila.
      fila.cantExacta += p.cant * unidades;
      if (!fila.modulos.includes(m.codigo)) fila.modulos.push(m.codigo);
      filas.set(key, fila);
      const roles = rolesPorMaterial.get(material) ?? new Set<string>();
      roles.add(p.rol);
      rolesPorMaterial.set(material, roles);
    }
  }

  const lista: FilaListaCorte[] = [...filas.values()]
    .map(({ cantExacta, ...f }) => ({ ...f, cantidad: Math.round(cantExacta) }))
    .filter((f) => f.cantidad > 0)
    .sort((a, b) => a.material.localeCompare(b.material) || b.largoMm - a.largoMm || b.anchoMm - a.anchoMm);

  const materiales: ResumenMaterial[] = [...rolesPorMaterial.keys()].sort().map((material) => {
    const filasMat = lista.filter((f) => f.material === material);
    const tab = tabPorCodigo.get(material);
    const formato = formatoConfigurado(cfg, tab?.formato);
    const piezas = filasMat.reduce((s, f) => s + f.cantidad, 0);
    const areaNetaMm2 = filasMat.reduce((s, f) => s + f.cantidad * f.largoMm * f.anchoMm, 0);
    const areaConSierraMm2 = filasMat.reduce((s, f) => s + f.cantidad * (f.largoMm + cfg.discoMm) * (f.anchoMm + cfg.discoMm), 0);
    const alertas: string[] = [];
    let laminasMinimas: number | null = null;
    let laminasMaxDesperdicio: number | null = null;
    let desperdicioMinimoPct: number | null = null;

    if (material === SIN_TABLERO) alertas.push('Piezas sin tablero asignado en el preset');
    else if (!tab) alertas.push('El tablero no está en el catálogo');
    if (tab && !formato) alertas.push(`Formato "${tab.formato ?? '—'}" no configurado`);
    if (formato && !formato.activo) alertas.push('Formato no confirmado por planta');

    if (formato) {
      const areaLamina = formato.largoMm * formato.anchoMm;
      const areaUtil = (formato.largoMm - 2 * cfg.refiladoMm) * (formato.anchoMm - 2 * cfg.refiladoMm);
      const enLamina = filasMat.every((f) => cabeEnLamina(f, formato, cfg));
      if (!enLamina) alertas.push('Hay piezas más grandes que la lámina útil');
      if (areaUtil > 0 && areaNetaMm2 > 0) {
        laminasMinimas = Math.ceil(areaConSierraMm2 / areaUtil);
        laminasMaxDesperdicio = Math.floor(areaNetaMm2 / (areaLamina * (1 - cfg.desperdicioMaxPct / 100)));
        desperdicioMinimoPct = r1((1 - areaNetaMm2 / (laminasMinimas * areaLamina)) * 100);
        if (laminasMaxDesperdicio < laminasMinimas) {
          alertas.push(`Con este volumen no se puede bajar del ${desperdicioMinimoPct} % de desperdicio`);
        }
      }
    }

    const espesorMm = tab?.espesor_mm != null ? Number(tab.espesor_mm) : null;
    const pila = laminasPorPila(cfg, espesorMm);
    if (espesorMm != null && pila == null) alertas.push(`Sin altura de pila para ${espesorMm} mm`);

    return {
      material,
      proveedor: tab?.proveedor ?? '',
      espesorMm,
      formatoCodigo: tab?.formato ?? '',
      formato,
      roles: [...(rolesPorMaterial.get(material) ?? [])].sort(),
      piezas,
      areaNetaM2: Math.round(areaNetaMm2 / 1e4) / 100,
      laminasMinimas,
      laminasMaxDesperdicio,
      desperdicioMinimoPct,
      laminasPorPila: pila,
      alertas,
    };
  });

  const totalPiezas = lista.reduce((s, f) => s + f.cantidad, 0);
  return { filas: lista, materiales, totalPiezas, reparto: repartoDiario(totalPiezas, cfg.piezasPorDia) };
}

// La pieza cabe en la lámina útil en alguna orientación (la veta se decide después).
function cabeEnLamina(f: FilaListaCorte, formato: FormatoLamina, cfg: ConfigOptimizador): boolean {
  const L = formato.largoMm - 2 * cfg.refiladoMm;
  const A = formato.anchoMm - 2 * cfg.refiladoMm;
  return (f.largoMm <= L && f.anchoMm <= A) || (f.largoMm <= A && f.anchoMm <= L);
}
