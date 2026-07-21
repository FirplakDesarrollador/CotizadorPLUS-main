import Link from 'next/link';
import { getUserAndRole } from '@/lib/auth';
import { listarCotizaciones } from '@/lib/cotizaciones';
import AppHeader from '@/components/AppHeader';
import GuideButton from '@/components/GuideButton';
import { getCotizadorData } from '@/lib/cotizar';
import NuevoCotizacionForm from './NuevoCotizacionForm';
import CotizacionRowActions from './CotizacionRowActions';

const GUIA_LISTA = [
  { title: 'Cotizaciones', description: 'Aquí creas y consultas tus proyectos (cotizaciones). Cada proyecto tendrá sus cocinas y módulos.' },
  { selector: '[data-tour="nuevo"]', title: 'Nuevo proyecto', description: 'Dale un nombre (ej. el apto/cliente), elige cliente, moneda y TRM, y crea el proyecto para empezar a agregar muebles.' },
  { selector: '[data-tour="lista"]', title: 'Tus proyectos', description: 'La lista con totales en COP y USD. Haz clic en un proyecto para abrirlo, agregar muebles y exportar.' },
];

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export default async function CotizacionesPage() {
  const { user, rol } = await getUserAndRole();
  const cotizaciones = await listarCotizaciones();
  const data = await getCotizadorData();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="cotizaciones" />
      <div className="mx-auto max-w-6xl px-4 pt-4 flex justify-end"><GuideButton steps={GUIA_LISTA} label="Guía de uso" /></div>
      <main className="mx-auto max-w-6xl px-4 pb-6 grid lg:grid-cols-[320px_1fr] gap-6">
        <NuevoCotizacionForm
          tableros={data.tableros}
          cantos={data.cantos}
          presetDefault={data.presetDefault}
          trmDefault={data.trmDefault}
        />

        <div data-tour="lista" className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-fit">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-4 py-2">Cotización</th><th>Cliente</th><th>Estado</th><th className="text-right">Total USD</th><th className="text-right px-4">Total COP</th><th className="px-4"></th>
            </tr></thead>
            <tbody>
              {cotizaciones.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin cotizaciones todavía.</td></tr>}
              {cotizaciones.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2"><Link href={`/cotizaciones/${c.id}`} className="text-slate-900 font-medium hover:underline">{c.nombre || 'Sin nombre'}</Link>
                    <div className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('es-CO')}</div></td>
                  <td className="text-slate-600">{c.cliente_nombre || '—'}</td>
                  <td><span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 capitalize">{c.estado}</span></td>
                  <td className="text-right">{fmtUSD(c.total_usd)}</td>
                  <td className="text-right px-4">{fmtCOP(c.total_cop)}</td>
                  <td className="px-4 py-2"><CotizacionRowActions id={c.id} nombre={c.nombre || 'Sin nombre'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
