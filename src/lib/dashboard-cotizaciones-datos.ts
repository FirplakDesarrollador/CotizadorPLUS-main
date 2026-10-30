import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getUserAndRole } from '@/lib/auth';
import { argumentosDashboard, ORDEN_DASHBOARD, type FiltrosDashboard, type FilaDashboard, type ResumenDashboard } from './dashboard-cotizaciones';

export type OpcionesDashboard = { paises: string[]; estados: string[]; anios: number[] };

async function clienteDashboard() {
  const { user } = await getUserAndRole();
  if (!user) throw new Error('No autenticado');
  return createClient();
}

export async function cargarDashboardCotizaciones(filtros: FiltrosDashboard) {
  const sb = await clienteDashboard();
  const args = argumentosDashboard(filtros);
  const inicio = (filtros.pagina - 1) * filtros.tamano;
  const [resumen, opciones, tabla] = await Promise.all([
    sb.rpc('cot_dashboard_resumen', args),
    sb.rpc('cot_dashboard_opciones'),
    sb.rpc('cot_dashboard_filtradas', args).order(ORDEN_DASHBOARD[filtros.orden], { ascending: filtros.direccion === 'asc', nullsFirst: false }).order('id', { ascending: true }).range(inicio, inicio + filtros.tamano - 1),
  ]);
  for (const resultado of [resumen, opciones, tabla]) if (resultado.error) throw new Error('No se pudo cargar el dashboard de cotizaciones.');
  return { resumen: resumen.data as ResumenDashboard, opciones: opciones.data as OpcionesDashboard, filas: (tabla.data ?? []) as FilaDashboard[] };
}

/** Mismo RPC, filtros, orden y RLS. range() evita el límite por respuesta de PostgREST. */
export async function filasDashboardParaExportar(filtros: FiltrosDashboard): Promise<FilaDashboard[]> {
  const sb = await clienteDashboard();
  const filas: FilaDashboard[] = [];
  const lote = 1000;
  for (let desde = 0; ; desde += lote) {
    const { data, error } = await sb.rpc('cot_dashboard_filtradas', argumentosDashboard(filtros))
      .order(ORDEN_DASHBOARD[filtros.orden], { ascending: filtros.direccion === 'asc', nullsFirst: false }).order('id', { ascending: true }).range(desde, desde + lote - 1);
    if (error) throw new Error('No se pudieron exportar las cotizaciones.');
    const pagina = (data ?? []) as FilaDashboard[];
    filas.push(...pagina);
    if (pagina.length < lote) return filas;
  }
}
