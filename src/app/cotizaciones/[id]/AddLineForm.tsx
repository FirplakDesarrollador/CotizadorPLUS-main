'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarLineaAction } from '../actions';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { TIPS_COTIZADOR } from '@/lib/tooltips';

type Tipo = { id: string; pref: string; nombre_es: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

const ROL_LABEL: Record<string, string> = { caja: 'Tablero caja', refuerzo: 'Tablero refuerzos', frente: 'Tablero frente', fondo: 'Tablero fondo' };

// Conversión exacta entre unidades vía milímetros.
const TO_MM: Record<'in' | 'cm' | 'mm', number> = { in: 25.4, cm: 10, mm: 1 };
const convertir = (v: number, de: 'in' | 'cm' | 'mm', a: 'in' | 'cm' | 'mm') =>
  Math.round((v * TO_MM[de]) / TO_MM[a] * 1e6) / 1e6;

export default function AddLineForm({ cocinaId, tipos, recargos, tableros, presetDefault, rolesByTipo, perfiles, perfilDefaultId, herrajesByTipo }:
  { cocinaId: string; tipos: Tipo[]; recargos: Recargo[]; tableros: Tablero[]; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]>; perfiles: Perfil[]; perfilDefaultId: string; herrajesByTipo: Record<string, HerrajeTipo[]> }) {
  const router = useRouter();
  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  const [tipoId, setTipoId] = useState(sbfd?.id ?? tipos[0]?.id ?? '');
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [largo, setLargo] = useState(33);
  const [alto, setAlto] = useState(30);
  const [prof, setProf] = useState(24);
  const [perfilId, setPerfilId] = useState(perfilDefaultId);
  const [preset, setPreset] = useState<Record<string, string>>(presetDefault);

  function aplicarPerfil(id: string) {
    setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) setPreset({ ...p.valores });
  }
  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];
  const herrajesTipo = herrajesByTipo[tipoId] ?? [];
  const toggleHerraje = (rol: string) => setHerrajesExcl((xs) => xs.includes(rol) ? xs.filter((x) => x !== rol) : [...xs, rol]);
  const [recargoId, setRecargoId] = useState('');
  const [conHerrajes, setConHerrajes] = useState(true);
  const [herrajesExcl, setHerrajesExcl] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [npuertas, setNpuertas] = useState('');
  const [ncajones, setNcajones] = useState('');
  const [nentrepanos, setNentrepanos] = useState('');
  const [modoFrentes, setModoFrentes] = useState<'normal' | 'sin_frentes' | 'solo_frentes'>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tableroLabel = (t: Tablero) => `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;
  const tipoOptions = useMemo(() => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })), [tipos]);
  const tableroOptions = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })), [tableros]);
  const tipo = tipos.find((t) => t.id === tipoId);

  function changeUnidad(nu: 'in' | 'cm' | 'mm') {
    if (nu === unidad) return;
    setLargo((v) => convertir(v, unidad, nu));
    setAlto((v) => convertir(v, unidad, nu));
    setProf((v) => convertir(v, unidad, nu));
    setUnidad(nu);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const overrides: Record<string, number> = {};
    if (npuertas !== '') overrides.n_puertas = Number(npuertas);
    if (ncajones !== '') overrides.n_cajones = Number(ncajones);
    if (nentrepanos !== '') overrides.n_entrepanos = Number(nentrepanos);
    const res = await agregarLineaAction(cocinaId, {
      tipoId, largo, alto, prof, unidad, preset, conHerrajes,
      recargoPct: recargos.find((r) => r.id === recargoId)?.recargo_pct ?? 0,
      cantidad, prefLabel: tipo?.pref, modoFrentes,
      overrides: Object.keys(overrides).length ? overrides : undefined,
      herrajesExcluidos: conHerrajes && herrajesExcl.length ? herrajesExcl : undefined,
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
          <L label="Un"><select value={unidad} onChange={(e) => changeUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp"><option>in</option><option>cm</option><option>mm</option></select></L>
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
          <L label="Nº cajones"><input type="number" placeholder="auto" value={ncajones} onChange={(e) => setNcajones(e.target.value)} className="inp" /></L>
          <L label="Nº entrepaños"><input type="number" placeholder="auto" value={nentrepanos} onChange={(e) => setNentrepanos(e.target.value)} className="inp" /></L>
        </div>
        {perfiles.length > 0 && (
          <L label="Perfil de material">
            <Combobox value={perfilId} options={perfiles.map((p) => ({ value: p.id, label: p.nombre }))} onChange={aplicarPerfil} placeholder="Elegir perfil…" />
          </L>
        )}
        {roles.map((rol) => (
          <L key={rol} label={ROL_LABEL[rol] ?? `Tablero ${rol}`}>
            <Combobox value={preset[rol] ?? ''} options={tableroOptions}
              onChange={(v) => setPreset((p) => ({ ...p, [rol]: v }))}
              placeholder="Buscar tablero…" allowEmpty />
          </L>
        ))}
        <L label="Frentes">
          <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
            <option value="normal">Completo</option>
            <option value="sin_frentes">Sin frentes (open)</option>
            <option value="solo_frentes">Solo kit de frentes</option>
          </select>
        </L>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Con herrajes
        </label>
        {conHerrajes && herrajesTipo.length > 0 && (
          <div className="col-span-full rounded-lg border border-slate-200 p-2.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase mb-1.5">Herrajes incluidos (destilda para excluir)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {herrajesTipo.map((h) => (
                <label key={h.rol} className="flex items-center gap-1.5 text-sm text-slate-700 capitalize">
                  <input type="checkbox" checked={!herrajesExcl.includes(h.rol)} onChange={() => toggleHerraje(h.rol)} />
                  {h.rol}{h.codigo ? <span className="text-slate-400 normal-case">· {h.codigo}</span> : null}
                </label>
              ))}
            </div>
          </div>
        )}
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
  return <Campo label={label} info={TIPS_COTIZADOR[label]}>{children}</Campo>;
}
