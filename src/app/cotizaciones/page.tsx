import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserAndRole } from '@/lib/auth';
import { listarCotizaciones } from '@/lib/cotizaciones';
import { getCotizadorData } from '@/lib/cotizar';
import { COLORES_ESTADO, ETIQUETAS_ESTADO, type EstadoCotizacion } from '@/lib/pipeline-estados';
import AppHeader from '@/components/AppHeader';
import CotizacionRowActions from './CotizacionRowActions';
import NuevoCotizacionForm from './NuevoCotizacionForm';
import RegistroForm from './pipeline/RegistroForm';
import PipelineVista from './pipeline/PipelineVista';
import DashboardVista from './DashboardVista';
import CotizacionesNavegacion from './CotizacionesNavegacion';

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
export default async function CotizacionesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user, rol, nombre } = await getUserAndRole();
  if (!user) redirect('/login');
  const params = await searchParams;
  const vista = typeof params.vista === 'string' && ['registro','pipeline','dashboard'].includes(params.vista) ? params.vista : 'lista';
  function marco(children:React.ReactNode, lista=false) {
    return <div className="min-h-screen bg-slate-50">
      <AppHeader nombre={nombre} email={user?.email} rol={rol} active="cotizaciones" helpContext={vista === 'pipeline' ? 'pipeline' : 'cotizaciones'}/>
      <main className={lista?'cotizaciones-main-grid mx-auto w-full max-w-[1600px] px-4 pb-6':'mx-auto w-full min-w-0 max-w-[1600px] space-y-5 px-4 pb-6'}>
        {!lista&&<div className="flex flex-wrap items-center justify-between gap-4"><Link href="/cotizaciones" className="inline-block text-sm font-medium text-slate-600 underline">Volver</Link><CotizacionesNavegacion vista={vista}/></div>}{children}
      </main>
    </div>;
  }
  if(vista==='registro')return marco(<RegistroForm/>);
  if(vista==='pipeline')return marco(<PipelineVista params={params}/>);
  if(vista==='dashboard')return marco(<DashboardVista searchParams={Promise.resolve(params)}/>);
  const [cotizaciones,data]=await Promise.all([listarCotizaciones(),getCotizadorData()]);
  return marco(<>
    <NuevoCotizacionForm pipelineOrigen={typeof params.pipeline==='string'?params.pipeline:undefined} tableros={data.tableros} cantos={data.cantos} presetDefault={data.presetDefault} trmDefault={data.trmDefault} perfiles={data.perfiles} perfilDefaultId={data.perfilDefaultId} tipos={data.tipos} herrajesByTipo={data.herrajesByTipo}/>
    <section data-tour="lista" className="cotizaciones-lista">
      <div className="mb-4"><CotizacionesNavegacion vista={vista}/></div>
      <div className="cotizaciones-lista-scroll rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm" style={{minWidth:720}}>
          <thead className="sticky top-0 z-10 bg-white"><tr className="border-b border-slate-100 text-left text-slate-500">
            <th className="px-3 py-3">Cotización</th><th className="px-2">Constructora</th><th className="px-2">Estado</th><th className="px-2 text-right">Total USD</th><th className="px-2 text-right">Total COP</th><th className="px-2">Cotizado por</th><th className="px-2"><span className="sr-only">Acciones</span></th>
          </tr></thead><tbody>
          {!cotizaciones.length&&<tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sin cotizaciones todavía.</td></tr>}
          {cotizaciones.map(c=><tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="max-w-[200px] px-3 py-3"><Link href={`/cotizaciones/${c.id}`} className="font-medium text-slate-900 hover:underline">{c.nombre||'Sin nombre'}</Link><div className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('es-CO')}</div></td>
            <td className="max-w-[140px] break-words px-2 text-slate-600">{c.cliente_nombre||'—'}</td>
            <td className="px-2"><span className={`inline-block rounded-full px-2 py-1 text-xs ${COLORES_ESTADO[c.estado as EstadoCotizacion]??'bg-slate-100 text-slate-700'}`}>{ETIQUETAS_ESTADO[c.estado as EstadoCotizacion]??c.estado}</span></td>
            <td className="whitespace-nowrap px-2 text-right text-xs tabular-nums">{fmtUSD(c.total_usd)}</td><td className="whitespace-nowrap px-2 text-right text-xs tabular-nums">{fmtCOP(c.total_cop)}</td><td className="px-2 text-xs text-slate-600">{c.cotizado_por_usuario||'Sin nombre'}<span className="block text-slate-400">{c.cotizador_por}</span></td><td className="px-2"><CotizacionRowActions id={c.id} nombre={c.nombre||'Sin nombre'}/></td>
          </tr>)}
          </tbody>
        </table>
      </div>
    </section>
  </>,true);
}
