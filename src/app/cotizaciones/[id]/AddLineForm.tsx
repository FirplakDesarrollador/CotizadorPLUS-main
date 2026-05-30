'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarLineaAction } from '../actions';
import Combobox from '@/components/Combobox';

type Tipo = { id: string; pref: string; nombre_es: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };

const ROL_LABEL: Record<string, string> = { caja: 'Tablero caja', refuerzo: 'Tablero refuerzos', frente: 'Tablero frente', fondo: 'Tablero fondo' };

export default function AddLineForm({ cocinaId, tipos, recargos, tableros, presetDefault, rolesByTipo }:
  { cocinaId: string; tipos: Tipo[]; recargos: Recargo[]; tableros: Tablero[]; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]> }) {
  const router = useRouter();
  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  const [tipoId, setTipoId] = useState(sbfd?.id ?? tipos[0]?.id ?? '');
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [largo, setLargo] = useState(33);
  const [alto, setAlto] = useState(30);
  const [prof, setProf] = useState(24);
  const [preset, setPreset] = useState<Record<string, string>>(presetDefault);
  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];
  const [recargoId, setRecargoId] = useState('');
  const [conHerrajes, setConHerrajes] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [npuertas, setNpuertas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tableroLabel = (t: Tablero) => `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;
  const tipoOptions = useMemo(() => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })), [tipos]);
  const tableroOptions = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })), [tableros]);
  const tipo = tipos.find((t) => t.id === tipoId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const overrides: Record<string, number> = {};
    if (npuertas !== '') overrides.n_puertas = Number(npuertas);
    const res = await agregarLineaAction(cocinaId, {
      tipoId, largo, alto, prof, unidad, preset, conHerrajes,
      recargoPct: recargos.find((r) => r.id === recargoId)?.recargo_pct ?? 0,
      cantidad, prefLabel: tipo?.pref,
      overrides: Object.keys(overrides).length ? overrides : undefined,
    });
    setLoading(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 p-5">
      <h2 className="font-semibold text-slate-900 mb-3">Agregar mueble</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <L label="Tipo">
          <Combobox value={tipoId} options={tipoOptions} onChange={setTipoId} placeholder="Buscar tipo…" />
        </L>
        <div className="grid grid-cols-4 gap-1">
          <L label="Largo"><input type="number" step="any" value={largo} onChange={(e) => setLargo(+e.target.value)} className="inp" /></L>
          <L label="Alto"><input type="number" step="any" value={alto} onChange={(e) => setAlto(+e.target.value)} className="inp" /></L>
          <L label="Prof"><input type="number" step="any" value={prof} onChange={(e) => setProf(+e.target.value)} className="inp" /></L>
          <L label="Un"><select value={unidad} onChange={(e) => setUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp"><option>in</option><option>cm</option><option>mm</option></select></L>
        </div>
        <L label="Cliente (recargo)">
          <select value={recargoId} onChange={(e) => setRecargoId(e.target.value)} className="inp">
            <option value="">Sin recargo</option>
            {recargos.map((r) => <option key={r.id} value={r.id}>{r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)</option>)}
          </select>
        </L>
        <div className="grid grid-cols-2 gap-1">
          <L label="Cantidad"><input type="number" min={1} value={cantidad} onChange={(e) => setCantidad(+e.target.value)} className="inp" /></L>
          <L label="Nº puertas"><input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" /></L>
        </div>
        {roles.map((rol) => (
          <L key={rol} label={ROL_LABEL[rol] ?? `Tablero ${rol}`}>
            <Combobox value={preset[rol] ?? ''} options={tableroOptions}
              onChange={(v) => setPreset((p) => ({ ...p, [rol]: v }))}
              placeholder="Buscar tablero…" allowEmpty />
          </L>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Con herrajes
        </label>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button disabled={loading} className="mt-3 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        {loading ? 'Agregando…' : '+ Agregar a la cotización'}
      </button>
      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .5rem;font-size:.8rem}`}</style>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs text-slate-500 mb-1">{label}</span>{children}</label>;
}
