import { calcularContenedores, type TableroPeso } from './contenedores';
import { esHerrajeOtroAdicional, totalLineaPropuesta, type AreaPropuesta, type LineaPropuesta } from './propuesta-cotizacion';

export type Incoterm = 'FOB' | 'CIF' | 'DDP';
export type TamanoContenedor = '20T' | '40T';
export type EntregaParcial = { contenedor: TamanoContenedor | null; areas: string[]; modulos?: string[] };
export type ImporteEntrega = { importe: number; moneda: 'COP' | 'USD' };
export type ConfigEntrega = {
  incoterm: Incoterm | null;
  cif: ImporteEntrega;
  ddp: { aplicarTarifas: boolean; transporte: ImporteEntrega };
  modo: 'parcial' | 'total' | null;
  contenedor: TamanoContenedor | null;
  parciales: EntregaParcial[];
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

export function modulosDelParcial(parcial: EntregaParcial, area: AreaEntrega) {
  return parcial.areas.includes(area.id) ? modulosDeEntrega(area).map(linea => linea.id) : parcial.modulos ?? [];
}

export function normalizarEntrega(valor: unknown): ConfigEntrega {
  const { incoterm, cif, ddp, modo, contenedor: tamano, parciales } = objeto(valor);
  const { aplicarTarifas, transporte } = objeto(ddp);
  const asignadas = new Set<string>();
  const modulosAsignados = new Set<string>();
  const entregas = (Array.isArray(parciales) ? parciales.slice(0, 100) : []).map(valor => {
    const parcial = objeto(valor);
    return {
      contenedor: contenedor(parcial.contenedor),
      areas: asignaciones(parcial.areas, asignadas),
      ...(Array.isArray(parcial.modulos) ? { modulos: asignaciones(parcial.modulos, modulosAsignados) } : {}),
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
  const modulosUsados = new Set<string>();
  return entregas.map(entrega => {
    const ids = new Set(entrega.areas);
    const seleccionadas = config.modo === 'parcial' ? areas.flatMap(area => {
      const modulos = new Set(modulosDelParcial(entrega, area));
      if (!modulos.size) return [];
      const lineas = modulosDeEntrega(area).filter(linea => {
        if (!modulos.has(linea.id) || modulosUsados.has(linea.id)) return false;
        modulosUsados.add(linea.id);
        return true;
      });
      return lineas.length ? [{ resultado: calcularArea(area, lineas) }] : [];
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
