'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { actualizarCotizacionAction } from '../actions';
import UndoRedoButtons from '@/components/UndoRedoButtons';

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type Cab = { id: string; nombre: string | null; cliente_nombre: string | null; comprador_nombre?: string | null; moneda: string; trm: number; estado: string; total_cop: number; total_usd: number; sistema_medida?: 'imperial' | 'metrico' };

export default function ProyectoHeader({
  cab,
  editing = false,
  onClose,
  margen = '',
  onMargenChange,
  onMargenBlur,
  onSave,
  children,
  margenGlobal,
}: {
  cab: Cab;
  editing?: boolean;
  onClose?: () => void;
  margen?: string;
  onMargenChange?: (value: string) => void;
  onMargenBlur?: () => void;
  onSave?: () => Promise<{ ok: boolean; error?: string } | void>;
  children?: React.ReactNode;
  margenGlobal?: { sinHerrajes: number | null; conHerrajes: number | null } | null;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(cab.nombre ?? '');
  const [cliente, setCliente] = useState(cab.cliente_nombre ?? '');
  const [comprador, setComprador] = useState(cab.comprador_nombre ?? '');
  const [moneda, setMoneda] = useState<'COP' | 'USD'>((cab.moneda as 'COP' | 'USD') ?? 'USD');
  const [trm, setTrm] = useState(Number(cab.trm));
  const [estado, setEstado] = useState(cab.estado);
  const [prevMargen, setPrevMargen] = useState(margen);
  const [margenLocal, setMargenLocal] = useState(margen);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (margen !== prevMargen) {
    setPrevMargen(margen);
    setMargenLocal(margen);
  }

  async function saveTrm() {
    if (!Number.isFinite(trm) || trm <= 0 || trm === Number(cab.trm)) return;
    setSaving(true); setError(null);
    const res = await actualizarCotizacionAction(cab.id, { trm });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'No se pudo actualizar la TRM'); return; }
    router.refresh();
  }

  function saveMargen() {
    if (margenLocal === margen) return;
    onMargenChange?.(margenLocal);
    onMargenBlur?.();
  }

  async function save() {
    setSaving(true); setError(null);
    if (margenLocal !== margen) {
      onMargenChange?.(margenLocal);
    }
    if (onSave) {
      const resCustom = await onSave();
      if (resCustom && !resCustom.ok) {
        setSaving(false);
        setError(resCustom.error ?? 'Error al guardar');
        return;
      }
    }
    const res = await actualizarCotizacionAction(cab.id, { nombre, cliente_nombre: cliente, comprador_nombre: comprador, moneda, trm, estado });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    onClose?.(); router.refresh();
  }

  if (editing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Nombre del proyecto *</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Constructora</span>
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Comprador</span>
            <input value={comprador} onChange={(e) => setComprador(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Moneda</span>
            <select value={moneda} onChange={(e) => setMoneda(e.target.value as 'COP' | 'USD')} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>USD</option><option>COP</option></select></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">TRM</span>
            <input type="number" min="0.01" step="any" value={trm} onChange={(e) => setTrm(Number(e.target.value))} onBlur={saveTrm} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <label className="block"><span className="block text-xs text-slate-500 mb-1">Margen del proyecto (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              placeholder="auto (sistema)"
              value={margenLocal}
              onChange={(e) => setMargenLocal(e.target.value)}
              onBlur={saveMargen}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {margenGlobal && (margenGlobal.sinHerrajes != null || margenGlobal.conHerrajes != null) && (
              <span className="block mt-1 text-[11px] text-slate-500">
                Margen ponderado: {margenGlobal.sinHerrajes != null && <>s/H <strong className="text-slate-800 font-semibold">{margenGlobal.sinHerrajes.toFixed(1)}%</strong></>}
                {margenGlobal.sinHerrajes != null && margenGlobal.conHerrajes != null && ' · '}
                {margenGlobal.conHerrajes != null && <>c/H <strong className="text-emerald-700 font-semibold">{margenGlobal.conHerrajes.toFixed(1)}%</strong></>}
              </span>
            )}
          </label>
        </div>
        {children}
        <label className="block max-w-xs"><span className="block text-xs text-slate-500 mb-1">Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="borrador">borrador</option><option value="enviada">enviada</option><option value="aprobada">aprobada</option><option value="rechazada">rechazada</option>
          </select></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={save} disabled={saving || !nombre.trim()} className="rounded-lg bg-slate-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar'}</button>
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm hover:bg-slate-100">Cancelar</button>
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
          <UndoRedoButtons />
        </div>
        <p className="text-sm text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
          <span>{cab.cliente_nombre || 'Sin constructora'}</span>
          {cab.comprador_nombre ? <span>· Comprador: {cab.comprador_nombre}</span> : null}
          <span>·</span>
          <span>TRM {Number(cab.trm).toLocaleString('es-CO')}</span>
          <span>·</span>
          <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 capitalize">{cab.estado}</span>
          <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">{cab.sistema_medida === 'metrico' ? 'cm · métrico' : 'in · imperial'}</span>
          {margenGlobal?.sinHerrajes != null && Number.isFinite(margenGlobal.sinHerrajes) && (
            <>
              <span>·</span>
              <span
                className="inline-flex items-center gap-1 text-xs rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 border border-slate-200"
                title="Margen global ponderado sin herrajes: (Precio s/H - Costo s/H) / Precio s/H"
              >
                Margen s/H: {margenGlobal.sinHerrajes.toFixed(1)}%
              </span>
            </>
          )}
          {margenGlobal?.conHerrajes != null && Number.isFinite(margenGlobal.conHerrajes) && (
            <>
              <span>·</span>
              <span
                className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 font-semibold border ${
                  margenGlobal.conHerrajes >= 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
                title="Margen global ponderado con herrajes: (Precio c/H - Costo c/H) / Precio c/H"
              >
                Margen c/H: {margenGlobal.conHerrajes.toFixed(1)}%
              </span>
            </>
          )}
        </p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900">{fmtUSD(cab.total_usd)}</div>
        <div className="text-sm text-slate-500">{fmtCOP(cab.total_cop)}</div>
      </div>
    </div>
  );
}
