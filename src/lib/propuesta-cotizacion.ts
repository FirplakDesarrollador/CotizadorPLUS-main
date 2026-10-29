import { UNIDAD_MATERIAL, type MaterialLinea } from './materiales-linea';

export type LineaPropuesta = {
  id: string; cantidad: number; tipo_mueble_id?: string | null;
  pref?: string | null; codigo_modulo?: string | null; descripcion_es?: string | null;
  precio_total_cop?: number; precio_total_usd?: number; precio_unit_usd?: number;
  config?: { material?: MaterialLinea; clasificacionPdf?: string } | null;
  breakdown?: Record<string, unknown> | null;
};
export type AreaPropuesta<T extends LineaPropuesta = LineaPropuesta> = { nombre: string; cantidad?: number; lineas: T[] };
export type AdicionalPropuesta = { id: string; area: string; codigo: string; descripcion: string; unidad: string; cantidad: number; unitCop: number; unitUsd: number; totalCop: number; totalUsd: number };

/** Incluye todos los tipos del botón, sin depender de prefijos ni descripciones. */
export function esHerrajeOtroAdicional(linea: LineaPropuesta): boolean {
  return Boolean(linea.config?.material) || linea.config?.clasificacionPdf === 'herrajes_otros';
}

export function totalLineaPropuesta(linea: LineaPropuesta, moneda: 'COP' | 'USD'): number {
  const guardado = moneda === 'COP' ? linea.precio_total_cop : linea.precio_total_usd;
  if (guardado != null && Number.isFinite(Number(guardado))) return Number(guardado);
  const unitario = moneda === 'COP' ? linea.breakdown?.precioConHerrajesCop : linea.breakdown?.precioConHerrajesUsd ?? linea.precio_unit_usd;
  return Number(unitario ?? 0) * Number(linea.cantidad ?? 1);
}

export function separarPropuesta<T extends LineaPropuesta, A extends AreaPropuesta<T>>(areas: readonly A[]) {
  const adicionales: AdicionalPropuesta[] = [];
  const muebles = areas.map(area => {
    const veces = Number(area.cantidad ?? 1);
    const lineas = area.lineas.filter(linea => {
      if (!esHerrajeOtroAdicional(linea)) return true;
      const material = linea.config?.material;
      const cantidad = Number(material?.cantidad ?? 1) * Number(linea.cantidad ?? 1) * veces;
      const totalCop = totalLineaPropuesta(linea, 'COP') * veces;
      const totalUsd = totalLineaPropuesta(linea, 'USD') * veces;
      adicionales.push({ id: linea.id, area: area.nombre, codigo: material?.codigo ?? linea.codigo_modulo ?? '', descripcion: linea.descripcion_es ?? '', unidad: material ? UNIDAD_MATERIAL[material.tipo] : 'und', cantidad, unitCop: cantidad > 0 ? totalCop / cantidad : 0, unitUsd: cantidad > 0 ? totalUsd / cantidad : 0, totalCop, totalUsd });
      return false;
    });
    return { ...area, lineas } as A;
  });
  const totalAdicionalCop = adicionales.reduce((s, r) => s + r.totalCop, 0);
  const totalAdicionalUsd = adicionales.reduce((s, r) => s + r.totalUsd, 0);
  const totalMueblesCop = muebles.reduce((s, a) => s + a.lineas.reduce((n, l) => n + totalLineaPropuesta(l, 'COP'), 0) * Number(a.cantidad ?? 1), 0);
  const totalMueblesUsd = muebles.reduce((s, a) => s + a.lineas.reduce((n, l) => n + totalLineaPropuesta(l, 'USD'), 0) * Number(a.cantidad ?? 1), 0);
  return { muebles, adicionales, totalAdicionalCop, totalAdicionalUsd, totalMueblesCop, totalMueblesUsd, totalCop: totalMueblesCop + totalAdicionalCop, totalUsd: totalMueblesUsd + totalAdicionalUsd };
}
