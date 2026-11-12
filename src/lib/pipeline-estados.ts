export const ESTADOS_COTIZACION = ['borrador', 'en_desarrollo', 'enviada', 'en_pausa', 'reproceso', 'aprobada', 'rechazada', 'descartada'] as const;
export type EstadoCotizacion = typeof ESTADOS_COTIZACION[number];
export const ETIQUETAS_ESTADO: Record<EstadoCotizacion, string> = { borrador: 'Borrador', en_desarrollo: 'En desarrollo', enviada: 'Enviada', en_pausa: 'En pausa', reproceso: 'Reproceso', aprobada: 'Aprobada', rechazada: 'Rechazada', descartada: 'Descartada' };
export const COLORES_ESTADO: Record<EstadoCotizacion, string> = { borrador: 'bg-slate-100 text-slate-700', en_desarrollo: 'bg-cyan-100 text-cyan-900', enviada: 'bg-blue-100 text-blue-800', en_pausa: 'bg-amber-100 text-amber-900', reproceso: 'bg-violet-100 text-violet-800', aprobada: 'bg-emerald-100 text-emerald-800', rechazada: 'bg-red-100 text-red-800', descartada: 'bg-stone-200 text-stone-700' };
export const GRUPOS_ESTADO = { pendientes: ['borrador'], enCurso: ['en_desarrollo', 'en_pausa', 'reproceso'], cerradas: ['enviada', 'aprobada'], perdidas: ['rechazada', 'descartada'] } as const;
export function normalizarEstadoExcel(value: unknown): EstadoCotizacion {
  const estado = String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_') || 'borrador';
  if (!(ESTADOS_COTIZACION as readonly string[]).includes(estado)) throw new Error(`Estado de origen desconocido: ${value}`);
  return estado as EstadoCotizacion;
}
