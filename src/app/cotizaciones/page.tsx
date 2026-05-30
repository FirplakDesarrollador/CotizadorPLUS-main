import Link from 'next/link';
import { getUserAndRole } from '@/lib/auth';
import { listarCotizaciones } from '@/lib/cotizaciones';
import AppHeader from '@/components/AppHeader';
import { crearCotizacionAction } from './actions';

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export default async function CotizacionesPage() {
  const { user, rol } = await getUserAndRole();
  const cotizaciones = await listarCotizaciones();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader email={user?.email} rol={rol} active="cotizaciones" />
      <main className="mx-auto max-w-6xl px-4 py-6 grid lg:grid-cols-[320px_1fr] gap-6">
        <form action={crearCotizacionAction} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 h-fit">
          <h2 className="font-semibold text-slate-900">Nuevo proyecto / cotización</h2>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Nombre del proyecto *</span>
            <input name="nombre" required placeholder="Ej. Cocina Torre A — Apto 502" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <input name="cliente_nombre" placeholder="Cliente" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select name="moneda" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" defaultValue="USD">
              <option value="USD">USD</option><option value="COP">COP</option>
            </select>
            <input name="trm" type="number" step="any" defaultValue={4200} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="TRM" />
          </div>
          <button className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800">Crear y agregar muebles</button>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden h-fit">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="px-4 py-2">Cotización</th><th>Cliente</th><th>Estado</th><th className="text-right">Total USD</th><th className="text-right px-4">Total COP</th>
            </tr></thead>
            <tbody>
              {cotizaciones.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin cotizaciones todavía.</td></tr>}
              {cotizaciones.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-2"><Link href={`/cotizaciones/${c.id}`} className="text-slate-900 font-medium hover:underline">{c.nombre || 'Sin nombre'}</Link>
                    <div className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('es-CO')}</div></td>
                  <td className="text-slate-600">{c.cliente_nombre || '—'}</td>
                  <td><span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 capitalize">{c.estado}</span></td>
                  <td className="text-right">{fmtUSD(c.total_usd)}</td>
                  <td className="text-right px-4">{fmtCOP(c.total_cop)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
