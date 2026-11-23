import { calcularContenedores, type TableroPeso } from './contenedores';
import { esHerrajeOtroAdicional, totalLineaPropuesta, type AreaPropuesta, type LineaPropuesta } from './propuesta-cotizacion';
import { normalizarInstalacion, type ConfigInstalacion } from './instalacion-cotizacion';

export type Incoterm = 'FOB' | 'CIF' | 'DDP';
export type TamanoContenedor = '20T' | '40T';
export type EntregaParcial = { contenedor: TamanoContenedor | null; areas: string[]; modulos?: string[]; cantidades?: Record<string, number> };
export type ImporteEntrega = { importe: number; moneda: 'COP' | 'USD' };
export type ConfigEntrega = {
  incoterm: Incoterm | null;
  cif: ImporteEntrega;
  ddp: { aplicarTarifas: boolean; transporte: ImporteEntrega };
  modo: 'parcial' | 'total' | null;
  contenedor: TamanoContenedor | null;
  parciales: EntregaParcial[];
  instalacion: ConfigInstalacion;
};
export type ParametrosDdp = { tableroPct: number; herrajesPct: number };
export type AreaEntrega = AreaPropuesta & { id: string };

// Las capacidades son cargas útiles, independientes del tamaño del contenedor.
export const CAPACIDAD_ENTREGA = { '20T': 15_000, '40T': 22_000 } as const satisfies Record<TamanoContenedor, number>;

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === 'object' ? valor as Record<string, unknown> : {};
}

function positivo(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : 0;
}

function contenedor(valor: unknown): TamanoContenedor | null {
  return valor === '20T' || valor === '40T' ? valor : null;
}

function asignaciones(valor: unknown, usadas: Set<string>): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((id): id is string => {
    if (typeof id !== 'string' || usadas.has(id)) return false;
    usadas.add(id);
    return true;
  });
}

export function modulosDeEntrega(area: AreaEntrega) {
  return area.lineas.filter(linea => !esHerrajeOtroAdicional(linea));
}

export function areasParaEntrega(areas: AreaEntrega[], sinArea: LineaPropuesta[]): AreaEntrega[] {
  return sinArea.some(linea => !esHerrajeOtroAdicional(linea))
    ? [...areas, { id: 'sin-area', nombre: 'Sin área', lineas: sinArea }]
    : areas;
}

export function cantidadProyecto(area: AreaEntrega, linea: LineaPropuesta): number {
  return positivo(Number(linea.cantidad ?? 1)) * positivo(Number(area.cantidad ?? 1));
}

/** Convierte asignaciones históricas y limita todas las entregas al saldo del proyecto. */
export function cantidadesDeParciales(parciales: readonly EntregaParcial[], areas: readonly AreaEntrega[]) {
  const lineas = areas.flatMap(area => modulosDeEntrega(area).map(linea => ({ areaId: area.id, id: linea.id, total: cantidadProyecto(area, linea) })));
  const saldos = new Map(lineas.map(({ id, total }) => [id, total]));
  return parciales.map(parcial => {
    const areasAsignadas = new Set(parcial.areas);
    const modulos = new Set(parcial.modulos);
    const cantidades = new Map<string, number>();
    for (const { id, total, areaId } of lineas) {
      const solicitada = parcial.cantidades?.[id] ?? (areasAsignadas.has(areaId) || modulos.has(id) ? total : 0);
      const saldo = saldos.get(id) ?? 0;
      const asignada = Math.min(saldo, positivo(solicitada));
      if (asignada) {
        cantidades.set(id, asignada);
        saldos.set(id, saldo - asignada);
      }
    }
    return cantidades;
  });
}

export function normalizarEntrega(valor: unknown): ConfigEntrega {
  const { incoterm, cif, ddp, modo, contenedor: tamano, parciales, instalacion } = objeto(valor);
  const { aplicarTarifas, transporte } = objeto(ddp);
  const asignadas = new Set<string>();
  const modulosAsignados = new Set<string>();
  const entregas = (Array.isArray(parciales) ? parciales.slice(0, 100) : []).map(valor => {
    const parcial = objeto(valor);
    return {
      contenedor: contenedor(parcial.contenedor),
      areas: asignaciones(parcial.areas, asignadas),
      ...(Array.isArray(parcial.modulos) ? { modulos: asignaciones(parcial.modulos, modulosAsignados) } : {}),
      ...(parcial.cantidades != null ? {
        cantidades: Object.fromEntries(Object.entries(objeto(parcial.cantidades)).filter(([, cantidad]) => positivo(cantidad) > 0)) as Record<string, number>,
      } : {}),
    };
  });
  return {
    incoterm: incoterm === 'FOB' || incoterm === 'CIF' || incoterm === 'DDP' ? incoterm : null,
    cif: normalizarImporte(cif),
    ddp: {
      aplicarTarifas: aplicarTarifas === true || (ddp == null && incoterm === 'DDP'),
      transporte: normalizarImporte(transporte),
    },
    modo: modo === 'parcial' || modo === 'total' ? modo : null,
    contenedor: contenedor(tamano),
    parciales: entregas,
    instalacion: normalizarInstalacion(instalacion),
  };
}

function normalizarImporte(valor: unknown): ImporteEntrega {
  const { importe, moneda } = objeto(valor);
  return { importe: positivo(importe), moneda: moneda === 'COP' ? 'COP' : 'USD' };
}

export function normalizarDdp(valor: unknown): ParametrosDdp {
  const { tableroPct, herrajesPct } = objeto(valor);
  return { tableroPct: positivo(tableroPct), herrajesPct: positivo(herrajesPct) };
}

export function resumirEntrega(
  config: ConfigEntrega,
  areas: readonly AreaEntrega[],
  tableros: readonly TableroPeso[],
  capacidades: Readonly<Record<TamanoContenedor, number | null>> = CAPACIDAD_ENTREGA,
) {
  function calcularArea(area: AreaEntrega, lineas = modulosDeEntrega(area)) {
    return calcularContenedores([{
      nombre: area.nombre,
      cantidad: Number(area.cantidad ?? 1),
      lineas: lineas.map(linea => ({ cantidad: Number(linea.cantidad ?? 1), breakdown: linea.breakdown })),
    }], tableros);
  }
  const datos = areas.map(area => ({
    id: area.id,
    resultado: calcularArea(area),
  }));
  const unidadesProyecto = datos.reduce((total, area) => total + area.resultado.unidadesTotales, 0);
  const entregas: EntregaParcial[] = config.modo === 'parcial' ? config.parciales : [{ contenedor: config.contenedor, areas: datos.map(area => area.id) }];
  const asignacionesParciales = config.modo === 'parcial' ? cantidadesDeParciales(entregas, areas) : [];
  return entregas.map((entrega, i) => {
    const ids = new Set(entrega.areas);
    const seleccionadas = config.modo === 'parcial' ? areas.flatMap(area => {
      const cantidades = asignacionesParciales[i];
      const lineas = modulosDeEntrega(area).flatMap(linea => {
        const cantidad = cantidades.get(linea.id);
        return cantidad ? [{ ...linea, cantidad }] : [];
      });
      return lineas.length ? [{ resultado: calcularArea({ ...area, cantidad: 1 }, lineas) }] : [];
    }) : datos.filter(area => ids.has(area.id));
    const unidades = seleccionadas.reduce((total, area) => total + area.resultado.unidadesTotales, 0);
    const pesoKg = seleccionadas.reduce((total, area) => total + area.resultado.pesoTotalKg, 0);
    const capacidadKg = entrega.contenedor ? positivo(capacidades[entrega.contenedor]) || null : null;
    const contenedores = capacidadKg ? Math.ceil(pesoKg / capacidadKg) : null;
    return {
      unidades, pesoKg, capacidadKg, contenedores,
      ocupacionPct: capacidadKg && contenedores ? pesoKg / (capacidadKg * contenedores) * 100 : 0,
      porcentaje: unidadesProyecto ? unidades / unidadesProyecto * 100 : 0,
      advertencias: [...new Set(seleccionadas.flatMap(area => area.resultado.advertencias))],
    };
  });
}

export function calcularRecargoEntrega(
  config: ConfigEntrega, ddp: ParametrosDdp, areas: readonly AreaPropuesta[], trm: number,
) {
  const convertir = ({ importe, moneda }: ImporteEntrega) => {
    return moneda === 'USD' ? { cop: importe * trm, usd: importe } : { cop: importe, usd: trm > 0 ? importe / trm : 0 };
  };
  if (config.incoterm === 'CIF') return convertir(config.cif);
  if (config.incoterm !== 'DDP') return { cop: 0, usd: 0 };
  const transporte = convertir(config.ddp.transporte);
  if (!config.ddp.aplicarTarifas) return transporte;

  function porMoneda(linea: LineaPropuesta, moneda: 'COP' | 'USD'): number {
    const material = linea.config?.material?.tipo;
    if (esHerrajeOtroAdicional(linea)) {
      const pct = material === 'tablero' ? ddp.tableroPct : material === 'herraje' ? ddp.herrajesPct : 0;
      return totalLineaPropuesta(linea, moneda) * pct / 100;
    }
    const b = linea.breakdown ?? {};
    const costoSinHerrajes = positivo(b.costoSinHerrajes);
    const parteTablero = costoSinHerrajes ? positivo(b.costoMadera) / costoSinHerrajes : 0;
    const tablero = parteTablero * positivo(moneda === 'COP' ? b.precioCop : b.precioUsd);
    const herrajes = positivo(moneda === 'COP' ? b.precioHerrajesCop : b.precioHerrajesUsd);
    const cantidad = Math.max(0, Number(linea.cantidad ?? 1));
    return cantidad * (tablero * ddp.tableroPct + herrajes * ddp.herrajesPct) / 100;
  }
  let { cop, usd } = transporte;
  for (const area of areas) {
    const repeticiones = Math.max(0, Number(area.cantidad ?? 1));
    for (const linea of area.lineas) {
      cop += porMoneda(linea, 'COP') * repeticiones;
      usd += porMoneda(linea, 'USD') * repeticiones;
    }
  }
  return { cop, usd };
}
