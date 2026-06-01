import { notFound } from 'next/navigation';
import { getCotizacion } from '@/lib/cotizaciones';
import PrintButton from './PrintButton';

const fmtCOP = (n: number) => Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type Linea = { id: string; pref: string | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_total_usd: number; precio_total_cop: number };
type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };

export default async function ImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cabecera, cocinas } = await getCotizacion(id);
  if (!cabecera) notFound();

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <style>{`@media print { .no-print { display:none !important; } @page { margin: 1.5cm; } } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`}</style>
      <div className="mx-auto max-w-3xl p-8">
        <PrintButton />

        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cotización</h1>
            <p className="text-lg font-semibold">{cabecera.nombre}</p>
            <p className="text-sm text-slate-500">Cliente: {cabecera.cliente_nombre || '—'} · Estado: {cabecera.estado}</p>
          </div>
          <div className="text-right text-sm text-slate-500">
            <div>Fecha: {new Date().toLocaleDateString('es-CO')}</div>
            <div>TRM: {Number(cabecera.trm).toLocaleString('es-CO')}</div>
          </div>
        </div>

        {(cocinas as Cocina[]).map((c) => (
          <div key={c.id} className="mb-5">
            <h2 className="font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">🍳 {c.nombre}</h2>
            <table className="w-full text-sm mt-1">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-300">
                  <th className="py-1">Módulo</th><th>Descripción</th><th className="text-right">Cant</th>
                  <th className="text-right">Unit USD</th><th className="text-right">Total USD</th><th className="text-right">Total COP</th>
                </tr>
              </thead>
              <tbody>
                {c.lineas.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="py-1 font-medium">{l.pref}</td>
                    <td className="text-slate-600">{l.descripcion_es}</td>
                    <td className="text-right">{l.cantidad}</td>
                    <td className="text-right">{fmtUSD(l.precio_unit_usd)}</td>
                    <td className="text-right">{fmtUSD(l.precio_total_usd)}</td>
                    <td className="text-right">{fmtCOP(l.precio_total_cop)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={4} className="text-right py-1">Subtotal {c.nombre}</td>
                  <td className="text-right">{fmtUSD(c.total_usd)}</td>
                  <td className="text-right">{fmtCOP(c.total_cop)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <div className="flex justify-end border-t-2 border-slate-800 pt-3 mt-4">
          <table className="text-sm">
            <tbody>
              <tr><td className="pr-6 font-bold text-lg">TOTAL</td>
                <td className="text-right font-bold text-lg">{fmtUSD(cabecera.total_usd)}</td>
                <td className="text-right font-bold text-lg pl-6">{fmtCOP(cabecera.total_cop)}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-8">Generado por Cotizador PLUS · {new Date().toLocaleString('es-CO')}</p>
      </div>
    </div>
  );
}
