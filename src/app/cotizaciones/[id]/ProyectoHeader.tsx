'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { actualizarCotizacionAction } from '../actions';

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type Cab = { id: string; nombre: string | null; cliente_nombre: string | null; moneda: string; trm: number; estado: string; total_cop: number; total_usd: number; sistema_medida?: 'imperial' | 'metrico' };

export default function ProyectoHeader({ cab }: { cab: Cab }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [nombre, setNombre] = useState(cab.nombre ?? '');
  const [cliente, setCliente] = useState(cab.cliente_nombre ?? '');
  const [moneda, setMoneda] = useState<'COP' | 'USD'>((cab.moneda as 'COP' | 'USD') ?? 'USD');
  const [trm, setTrm] = useState(Number(cab.trm));
  const [estado, setEstado] = useState(cab.estado);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true); setError(null);
    const res = await actualizarCotizacionAction(cab.id, { nombre, cliente_nombre: cliente, moneda, trm, estado });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setEdit(false); router.refresh();
  }

  if (edit) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="block lg:col-span-2"><span className="block text-xs text-slate-500 mb-1">Nombre del proyecto *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Cliente</span>
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Moneda</span>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value as 'COP' | 'USD')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>USD</option><option>COP</option></select></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">TRM</span>
            <input type="number" step="any" value={trm} onChange={(e) => setTrm(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="borrador">borrador</option><option value="enviada">enviada</option><option value="aprobada">aprobada</option><option value="rechazada">rechazada</option>
            </select></label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !nombre.trim()} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
          <button onClick={() => setEdit(false)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-100">Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <Link href="/cotizaciones" className="text-sm text-slate-500 hover:underline">← Cotizaciones</Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{cab.nombre || 'Proyecto sin nombre'}</h1>
          <button onClick={() => setEdit(true)} className="text-sm text-slate-500 hover:text-slate-900 underline">editar</button>
        </div>
        <p className="text-sm text-slate-500">
          {cab.cliente_nombre || 'Sin cliente'} · TRM {Number(cab.trm).toLocaleString('es-CO')} ·
          <span className="ml-1 text-xs rounded-full bg-slate-100 px-2 py-0.5 capitalize">{cab.estado}</span>
          <span className="ml-1 text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">{cab.sistema_medida === 'metrico' ? 'cm · métrico' : 'in · imperial'}</span>
        </p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900">{fmtUSD(cab.total_usd)}</div>
        <div className="text-sm text-slate-500">{fmtCOP(cab.total_cop)}</div>
      </div>
    </div>
  );
}
