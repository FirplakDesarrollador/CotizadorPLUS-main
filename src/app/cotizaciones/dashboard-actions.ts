'use server';
import { getUserAndRole } from '@/lib/auth';
import { filtrosDashboardExportacion, type ParametrosDashboard } from '@/lib/dashboard-cotizaciones';
import { filasDashboardParaExportar } from '@/lib/dashboard-cotizaciones-datos';
import { construirDashboardCsv } from '@/lib/dashboard-csv';

export async function exportarDashboardAction(parametros: ParametrosDashboard) {
  try {
    const { user } = await getUserAndRole();
    if (!user) throw new Error('No autenticado');
    const filtros = filtrosDashboardExportacion(parametros);
    const filas = await filasDashboardParaExportar(filtros);
    return { ok: true as const, csv: construirDashboardCsv(filas), nombre: `Cotizaciones-${filtros.desde}-${filtros.hasta}.csv`, cantidad: filas.length };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : 'No se pudo exportar el CSV.' }; }
}
