import Link from 'next/link';
import { redirect } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { getUserAndRole } from '@/lib/auth';
import { cargarDashboardCotizaciones } from '@/lib/dashboard-cotizaciones-datos';
import { enlaceDashboard, normalizarFiltrosDashboard, variacionPorcentual, type FiltrosDashboard, type ParametrosDashboard } from '@/lib/dashboard-cotizaciones';
import FiltrosDashboardForm from './FiltrosDashboard';
import { BarrasDashboard, DistribucionEmpresas, LineaMensual } from './GraficasDashboard';
import ExportarDashboard from './ExportarDashboard';

const cop = (v: number) => Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const usd = (v: number) => Number(v).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
const entero = (v: number) => Number(v).toLocaleString('es-CO');
const tarjeta = 'min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

function Grafica({ titulo, detalle, children }: { titulo: string; detalle?: string; children: React.ReactNode }) {
  return <section className={tarjeta}><h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>{detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}<div className="mt-5">{children}</div></section>;
}

function EncabezadoOrden({ titulo, campo, filtros }: { titulo: string; campo: FiltrosDashboard['orden']; filtros: FiltrosDashboard }) {
  const activo = filtros.orden === campo;
  return <th scope="col" className="whitespace-nowrap px-4 py-3 text-left font-medium" aria-sort={activo ? filtros.direccion === 'asc' ? 'ascending' : 'descending' : 'none'}>
    <Link href={enlaceDashboard(filtros, { orden: campo, direccion: activo && filtros.direccion === 'asc' ? 'desc' : 'asc', pagina: 1 })} className={`inline-flex items-center gap-1.5 hover:text-slate-950 ${activo ? 'text-slate-900' : ''}`}>
      {titulo}<svg width="12" height="14" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 5 3-3 3 3M3 9l3 3 3-3"/></svg>
    </Link>
  </th>;
}

export default async function DashboardCotizacionesPage({ searchParams }: { searchParams: Promise<ParametrosDashboard> }) {
  const { user, rol, nombre } = await getUserAndRole();
  if (!user) redirect('/login');
  const filtros = normalizarFiltrosDashboard(await searchParams);
  const { resumen: r, opciones, filas } = await cargarDashboardCotizaciones(filtros);
  const paginas = Math.max(1, Math.ceil(Number(r.total) / filtros.tamano));
  if (filtros.pagina > paginas) redirect(enlaceDashboard(filtros, { pagina: paginas }));
  const variacion = variacionPorcentual(Number(r.mesActual), Number(r.mesAnterior));
  const primero = r.total ? (filtros.pagina - 1) * filtros.tamano + 1 : 0;
  const ultimo = Math.min(filtros.pagina * filtros.tamano, Number(r.total));
  return <div className="min-h-screen bg-slate-50 text-slate-900">
    <div className="sticky top-0 z-40 max-w-full overflow-x-auto bg-white"><div className="min-w-[1150px]"><AppHeader nombre={nombre} email={user.email} rol={rol} active="cotizaciones"/></div></div>
    <main className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-7 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold tracking-tight">Dashboard de cotizaciones</h1>
        <div className="flex flex-wrap items-center gap-3"><Link href="/cotizaciones" className="text-sm font-medium text-slate-600 hover:text-slate-900">Volver a cotizaciones</Link><ExportarDashboard filtros={filtros}/></div>
      </div>
      <FiltrosDashboardForm key={enlaceDashboard(filtros)} filtros={filtros} opciones={opciones}/>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores de cotizaciones">
        <section className={tarjeta}><h2 className="text-xs font-medium text-slate-500">Total de cotizaciones</h2><p className="mt-3 text-3xl font-semibold tracking-tight" data-kpi="total">{entero(r.total)}</p><p className="mt-2 text-xs text-slate-400">Con los filtros seleccionados</p></section>
        <section className={tarjeta}><h2 className="text-xs font-medium text-slate-500">Valor total COP</h2><p className="mt-3 break-words text-xl font-semibold tracking-tight tabular-nums" data-kpi="cop">{cop(r.cop)}</p><p className="mt-2 text-xs text-slate-400">Pesos colombianos</p></section>
        <section className={tarjeta}><h2 className="text-xs font-medium text-slate-500">Valor total USD</h2><p className="mt-3 break-words text-xl font-semibold tracking-tight tabular-nums" data-kpi="usd">{usd(r.usd)}</p><p className="mt-2 text-xs text-slate-400">Dólares estadounidenses</p></section>
        <section className={tarjeta}><h2 className="text-xs font-medium text-slate-500">Ticket promedio</h2><p className="mt-3 break-words text-xl font-semibold tracking-tight">{cop(r.ticketCop)}</p><p className="mt-2 text-xs text-slate-500">{usd(r.ticketUsd)} USD</p></section>
        <section className={tarjeta}><h2 className="text-xs font-medium text-slate-500">Estado de cotizaciones</h2><div className="mt-3 flex items-center gap-4"><div><p className="text-2xl font-semibold">{entero(r.borradores)}</p><p className="mt-1 text-[11px] text-slate-500">Borrador</p></div><div className="border-l border-slate-200 pl-4"><p className="text-2xl font-semibold">{entero(r.enviadasCerradas)}</p><p className="mt-1 text-[11px] text-slate-500">Enviadas / aprobadas</p></div></div></section>
        <section className={tarjeta}><h2 className="text-xs font-medium text-slate-500">Este mes vs. mes anterior</h2><p className="mt-3 text-2xl font-semibold">{entero(r.mesActual)} <span className="text-sm font-normal text-slate-400">vs. {entero(r.mesAnterior)}</span></p><p className={`mt-2 text-xs ${variacion !== null && variacion > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{variacion === null ? 'Sin base de comparación' : `${variacion > 0 ? '+' : ''}${variacion.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`} · con filtros aplicados</p></section>
      </div>
      {Number(r.total) === 0 && <p role="status" className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center text-sm text-slate-500">Sin cotizaciones para los filtros seleccionados.</p>}
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <Grafica titulo="Valor por mes (COP)" detalle="12 meses hasta el final del rango · filtros aplicados"><LineaMensual datos={r.mensual}/></Grafica>
        <Grafica titulo="Cotizaciones por país" detalle="Top 5 y otros países"><BarrasDashboard datos={r.paises} titulo="Cotizaciones por país"/></Grafica>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2"><Grafica titulo="FIRPLAK vs. CEMA" detalle="Distribución de cotizaciones"><DistribucionEmpresas datos={r.empresas}/></Grafica><Grafica titulo="Estado del pipeline"><BarrasDashboard datos={r.estados} titulo="Estado del pipeline"/></Grafica></div>
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-semibold">Detalle de cotizaciones</h2><span className="text-xs text-slate-500">{entero(r.total)} resultados · {filtros.tamano} por página</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-sm" data-dashboard="tabla"><thead className="bg-slate-50 text-xs text-slate-500"><tr>
          <EncabezadoOrden titulo="Fecha" campo="fecha" filtros={filtros}/><EncabezadoOrden titulo="Cotización" campo="nombre" filtros={filtros}/><EncabezadoOrden titulo="Cliente" campo="cliente" filtros={filtros}/><EncabezadoOrden titulo="País / ciudad" campo="pais" filtros={filtros}/><EncabezadoOrden titulo="Cotizado por" campo="cotizado" filtros={filtros}/><EncabezadoOrden titulo="Estado" campo="estado" filtros={filtros}/><EncabezadoOrden titulo="Total COP" campo="cop" filtros={filtros}/><EncabezadoOrden titulo="Total USD" campo="usd" filtros={filtros}/>
        </tr></thead><tbody className="divide-y divide-slate-100">
          {!filas.length && <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Sin cotizaciones para los filtros seleccionados.</td></tr>}
          {filas.map(fila => <tr key={fila.id} className="hover:bg-slate-50/80"><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{new Date(`${fila.fecha_local}T12:00:00Z`).toLocaleDateString('es-CO', { timeZone: 'UTC' })}</td><td className="max-w-[260px] px-4 py-3"><Link href={`/cotizaciones/${fila.id}`} className="font-medium text-slate-800 underline-offset-4 hover:underline">{fila.nombre || 'Sin nombre'}</Link>{fila.codigo && <span className="mt-0.5 block text-xs text-slate-400">{fila.codigo}</span>}</td><td className="max-w-[220px] px-4 py-3 text-slate-600">{fila.cliente_nombre || '—'}</td><td className="px-4 py-3 text-slate-600">{fila.pais}<span className="mt-0.5 block text-xs text-slate-400">{fila.ciudad || '—'}</span></td><td className="px-4 py-3 text-xs font-medium text-slate-600">{fila.cotizador_por}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">{fila.estado}</span></td><td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums">{cop(fila.total_cop)}</td><td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums">{usd(fila.total_usd)}</td></tr>)}
        </tbody></table></div>
        <nav aria-label="Paginación de cotizaciones" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>Mostrando {primero}–{ultimo} de {entero(r.total)}</span><div className="flex items-center gap-3">{filtros.pagina > 1 ? <Link className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50" href={enlaceDashboard(filtros, { pagina: filtros.pagina - 1 })}>Anterior</Link> : <span aria-disabled="true" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-300">Anterior</span>}<span>Página {filtros.pagina} de {paginas}</span>{filtros.pagina < paginas ? <Link className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50" href={enlaceDashboard(filtros, { pagina: filtros.pagina + 1 })}>Siguiente</Link> : <span aria-disabled="true" className="rounded-lg border border-slate-200 px-3 py-2 text-slate-300">Siguiente</span>}</div></nav>
      </section>
    </main>
  </div>;
}
