'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarLineaAction } from '../actions';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { TIPS_COTIZADOR } from '@/lib/tooltips';
import type { ProjectDefaults } from './ProjectConfigPanel';

type Tipo = { id: string; pref: string; nombre_es: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };

const ROL_LABEL: Record<string, string> = { caja: 'Tablero caja', refuerzo: 'Tablero refuerzos', frente: 'Tablero frente', fondo: 'Tablero fondo' };

// Conversión exacta entre unidades vía milímetros.
const TO_MM: Record<'in' | 'cm' | 'mm', number> = { in: 25.4, cm: 10, mm: 1 };
const convertir = (v: number, de: 'in' | 'cm' | 'mm', a: 'in' | 'cm' | 'mm') =>
  Math.round((v * TO_MM[de]) / TO_MM[a] * 1e6) / 1e6;

function parseFraction(val: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = val.trim().replace(',', '.');
  if (s.includes(' ')) {
    const parts = s.split(' ').filter(Boolean);
    if (parts.length === 2 && parts[1].includes('/')) {
      const [num, den] = parts[1].split('/');
      return parseFloat(parts[0]) + (parseFloat(num) / parseFloat(den));
    }
  }
  if (s.includes('/')) {
    const [num, den] = s.split('/');
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(s) || 0;
}

export default function AddLineForm({ cocinaId, tipos, recargos, tableros, cantos, presetDefault, rolesByTipo, projectDefaults }:
  { cocinaId: string; tipos: Tipo[]; recargos: Recargo[]; tableros: Tablero[]; cantos: string[]; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]>; projectDefaults?: ProjectDefaults }) {
  const router = useRouter();
  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  const [tipoId, setTipoId] = useState(sbfd?.id ?? tipos[0]?.id ?? '');
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [largo, setLargo] = useState<string | number>(33);
  const [alto, setAlto] = useState<string | number>(30);
  const [prof, setProf] = useState<string | number>(24);

  // Usar los defaults del proyecto si están disponibles, si no el presetDefault del sistema
  const initialPreset = projectDefaults?.preset ?? presetDefault;
  const [preset, setPreset] = useState<Record<string, string>>(initialPreset);

  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];

  // Recargo: inicializar desde defaults del proyecto
  const [recargoId, setRecargoId] = useState(projectDefaults?.recargoId ?? '');

  const [conHerrajes, setConHerrajes] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [npuertas, setNpuertas] = useState('');
  const [ncajones, setNcajones] = useState('');
  const [modoFrentes, setModoFrentes] = useState<'normal' | 'sin_frentes' | 'solo_frentes'>('normal');

  // Margen: inicializar desde defaults del proyecto
  const [margenInput, setMargenInput] = useState(projectDefaults?.margen ?? '');

  const getCantoMatch = (target: string) =>
    cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
    cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
    target;

  // Cantos: inicializar desde defaults del proyecto
  const [cantoFrentesSel, setCantoFrentesSel] = useState(() => {
    if (projectDefaults?.cantoFrentes !== undefined) return projectDefaults.cantoFrentes;
    const board = tableros.find((t) => t.codigo === presetDefault['frente']);
    return board?.espesor_mm === 18 ? getCantoMatch('22x1') : '';
  });
  const [cantoCajaSel, setCantoCajaSel] = useState(() => {
    if (projectDefaults?.cantoCaja !== undefined) return projectDefaults.cantoCaja;
    const board = tableros.find((t) => t.codigo === presetDefault['caja']);
    return board?.espesor_mm === 15 ? getCantoMatch('19x0,45') : '';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tableroLabel = (t: Tablero) => `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;
  const tipoOptions = useMemo(() => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })), [tipos]);
  const tableroOptions = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })), [tableros]);
  const tipo = tipos.find((t) => t.id === tipoId);

  function changeUnidad(nu: 'in' | 'cm' | 'mm') {
    if (nu === unidad) return;
    setLargo((v) => convertir(parseFraction(v), unidad, nu));
    setAlto((v) => convertir(parseFraction(v), unidad, nu));
    setProf((v) => convertir(parseFraction(v), unidad, nu));
    setUnidad(nu);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const overrides: Record<string, number> = {};
    if (npuertas !== '') overrides.n_puertas = Number(npuertas);
    if (ncajones !== '') overrides.n_cajones = Number(ncajones);

    const finalPreset = { ...preset, refuerzo: preset.caja };
    const largoNum = parseFraction(largo);
    const altoNum = parseFraction(alto);
    const profNum = parseFraction(prof);
    const prefLabelCombined = tipo?.pref ? `${tipo.pref}${String(largo).trim()}` : undefined;
    const parsedMargen = margenInput ? Number(margenInput) / 100 : undefined;

    const res = await agregarLineaAction(cocinaId, {
      tipoId, largo: largoNum, alto: altoNum, prof: profNum, unidad, preset: finalPreset, conHerrajes,
      recargoPct: recargos.find((r) => r.id === recargoId)?.recargo_pct ?? 0,
      cantidad, prefLabel: prefLabelCombined, modoFrentes,
      margenOverride: parsedMargen,
      cantoFrentes: cantoFrentesSel || undefined,
      cantoCaja: cantoCajaSel || undefined,
      overrides: Object.keys(overrides).length ? overrides : undefined,
    });
    setLoading(false);
    if (!res.ok) { setError(res.error ?? 'Error'); return; }
    setNpuertas('');
    setNcajones('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-slate-900">Agregar mueble</h2>
        {projectDefaults && (
          <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
            ✓ Materiales del proyecto pre-cargados
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <L label="Tipo">
          <Combobox value={tipoId} options={tipoOptions} onChange={setTipoId} placeholder="Buscar tipo…" />
        </L>
        <div className="grid grid-cols-4 gap-1">
          <L label="Largo"><input type="text" value={largo} onChange={(e) => setLargo(e.target.value)} className="inp" /></L>
          <L label="Alto"><input type="text" value={alto} onChange={(e) => setAlto(e.target.value)} className="inp" /></L>
          <L label="Prof"><input type="text" value={prof} onChange={(e) => setProf(e.target.value)} className="inp" /></L>
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
          <L label="Margen (%)">
            <input
              type="number"
              min={0} max={100} step={0.5}
              placeholder="auto"
              value={margenInput}
              onChange={(e) => setMargenInput(e.target.value)}
              className="inp"
            />
          </L>
          <L label="Nº puertas"><input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" /></L>
          <L label="Nº cajones"><input type="number" placeholder="auto" value={ncajones} onChange={(e) => setNcajones(e.target.value)} className="inp" /></L>
        </div>

        {/* Tableros por rol */}
        {roles.filter((r) => r !== 'refuerzo').map((rol) => (
          <L key={rol} label={ROL_LABEL[rol] ?? `Tablero ${rol}`}>
            <Combobox
              value={preset[rol] ?? ''}
              options={tableroOptions}
              onChange={(v) => {
                setPreset((p) => ({ ...p, [rol]: v, ...(rol === 'caja' ? { refuerzo: v } : {}) }));
                const board = tableros.find((t) => t.codigo === v);
                if (rol === 'frente' && board?.espesor_mm === 18) {
                  setCantoFrentesSel(getCantoMatch('22x1'));
                } else if (rol === 'caja' && board?.espesor_mm === 15) {
                  setCantoCajaSel(getCantoMatch('19x0,45'));
                }
              }}
              placeholder="Buscar tablero…"
              allowEmpty
            />
          </L>
        ))}

        <L label="Frentes">
          <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
            <option value="normal">Completo</option>
            <option value="sin_frentes">Sin frentes (open)</option>
            <option value="solo_frentes">Solo kit de frentes</option>
          </select>
        </L>

        <div className="grid grid-cols-2 gap-1 md:col-span-2">
          <L label="Canto frentes">
            <select value={cantoFrentesSel} onChange={(e) => setCantoFrentesSel(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </L>
          <L label="Canto caja">
            <select value={cantoCajaSel} onChange={(e) => setCantoCajaSel(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </L>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Con herrajes
        </label>
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <button disabled={loading} className="mt-3 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        {loading ? 'Agregando…' : '+ Agregar a la cotización'}
      </button>
      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .5rem;font-size:.8rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </form>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <Campo label={label} info={TIPS_COTIZADOR[label]}>{children}</Campo>;
}
