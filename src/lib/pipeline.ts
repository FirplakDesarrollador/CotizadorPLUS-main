import { ESTADOS_COTIZACION, type EstadoCotizacion } from './pipeline-estados';
export type RegistroPipeline = { id: string; codigo: string | null; nombre_proyecto: string | null; cliente: string | null; pais: string; ciudad: string | null; estado: EstadoCotizacion; creado_por: string | null; cotizacion_id: string | null; fecha_ingreso: string | null; fecha_limite_envio: string | null; [key: string]: unknown };
export type FiltrosPipeline = { q: string; estado: string; pais: string; asesor: string; estimador: string; direccion: 'asc' | 'desc'; pagina: number };
export function filtrosPipeline(params: Record<string, string | string[] | undefined>): FiltrosPipeline {
  const text = (key: string) => String(Array.isArray(params[key]) ? params[key][0] ?? '' : params[key] ?? '').trim().slice(0,120);
  return { q: text('pq'), estado: (ESTADOS_COTIZACION as readonly string[]).includes(text('pestado')) ? text('pestado') : '', pais: text('ppais'), asesor: text('pasesor'), estimador: text('pestimador'), direccion: text('pdireccion') === 'asc' ? 'asc' : 'desc', pagina: Math.max(1,Math.min(1000000,Math.floor(Number(text('ppagina'))) || 1)) };
}
export function enlacePipeline(f: FiltrosPipeline, pagina = f.pagina) {
  const params = new URLSearchParams({ vista: 'pipeline', ppagina: String(pagina), pq: f.q, pestado: f.estado, ppais: f.pais, pasesor: f.asesor, pestimador: f.estimador, pdireccion: f.direccion });
  return `/cotizaciones?${params}`;
}
export const CAMPOS_EXTRA_PIPELINE = ['zona','estado','estado_planos','fase_cotizacion','link_planner','link_tarea_planos','monto_fob_usd','monto_fob_cop','nuevo_valor_usd','nuevo_valor_cop','trm','fecha_ingreso'] as const;
export const NUMEROS_PIPELINE = ['tarifa','monto_fob_usd','monto_fob_cop','nuevo_valor_usd','nuevo_valor_cop','trm'];
export const ETIQUETAS_EXTRA_PIPELINE: Record<string, string> = { codigo:'Código', zona:'Zona', estado:'Estado', estado_planos:'Estado de planos', fase_cotizacion:'Fase de cotización', link_planner:'Link Planner', link_tarea_planos:'Link tarea de planos', monto_fob_usd:'Monto FOB USD', monto_fob_cop:'Monto FOB COP', nuevo_valor_usd:'Nuevo valor USD', nuevo_valor_cop:'Nuevo valor COP', trm:'TRM', fecha_ingreso:'Fecha de ingreso' };
