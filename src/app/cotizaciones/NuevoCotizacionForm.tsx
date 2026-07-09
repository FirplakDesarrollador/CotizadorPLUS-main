'use client';
import { useActionState, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { crearCotizacionAction } from './actions';
import Combobox from '@/components/Combobox';
import { DB_TIPOLOGIAS } from '@/lib/muebles';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tipo = { id: string; pref: string; nombre_es: string | null };
type Perfil = { id: string; nombre: string; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

interface Props {
  tableros: Tablero[];
  recargos: Recargo[];
  cantos: string[];
  presetDefault: Record<string, string>;
  trmDefault: number;
  tipos: Tipo[];
  rolesByTipo: Record<string, string[]>;
  perfiles: Perfil[];
  perfilDefaultId: string;
  herrajesByTipo: Record<string, HerrajeTipo[]>;
}

const tableroLabel = (t: Tablero) =>
  `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

const TO_MM: Record<'in' | 'cm' | 'mm', number> = { in: 25.4, cm: 10, mm: 1 };
const conv = (v: number, de: 'in' | 'cm' | 'mm', a: 'in' | 'cm' | 'mm') =>
  Math.round((v * TO_MM[de]) / TO_MM[a] * 1e6) / 1e6;

export default function NuevoCotizacionForm({
  tableros, recargos, cantos, presetDefault, trmDefault,
  tipos, perfiles, perfilDefaultId, herrajesByTipo,
}: Props) {
  const router = useRouter();

  // ── Datos del proyecto ──
  const [moneda, setMoneda] = useState<'USD' | 'COP'>('USD');

  // ── Materiales globales ──
  const [preset, setPreset] = useState<Record<string, string>>({ ...presetDefault });

  const [cantoFrentes, setCantoFrentes] = useState(() => {
    const b = tableros.find((t) => t.codigo === presetDefault['frente']);
    if (b?.espesor_mm === 18) return getCantoMatch(cantos, '22x1');
    if (b?.espesor_mm === 15) return getCantoMatch(cantos, '19x0,45');
    return '';
  });
  const [cantoCaja, setCantoCaja] = useState(() => {
    const b = tableros.find((t) => t.codigo === presetDefault['caja']);
    if (b?.espesor_mm === 18) return getCantoMatch(cantos, '22x1');
    if (b?.espesor_mm === 15) return getCantoMatch(cantos, '19x0,45');
    return '';
  });

  const [recargoId, setRecargoId] = useState('');
  const [margen, setMargen] = useState('');
  const [perfilId, setPerfilId] = useState(perfilDefaultId);

  // ── Primer mueble ──
  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  const [tipoId, setTipoId] = useState(sbfd?.id ?? tipos[0]?.id ?? '');
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [largo, setLargo] = useState('33');
  const [alto, setAlto] = useState('30');
  const [prof, setProf] = useState('24');
  const [modoFrentes, setModoFrentes] = useState<'normal' | 'sin_frentes' | 'solo_frentes'>('normal');
  const [conHerrajes, setConHerrajes] = useState(true);
  const [herrajesExcl, setHerrajesExcl] = useState<string[]>([]);
  const [npuertas, setNpuertas] = useState('');
  const [ncajones, setNcajones] = useState('');
  const [nentrepanos, setNentrepanos] = useState('');
  const [dbTipo, setDbTipo] = useState('');
  const [nbarras, setNbarras] = useState('');

  const esDB = (tipos.find((t) => t.id === tipoId)?.pref ?? '').startsWith('DB');
  const herrajesTipo = herrajesByTipo[tipoId] ?? [];
  const toggleHerraje = (rol: string) =>
    setHerrajesExcl((p) => p.includes(rol) ? p.filter((x) => x !== rol) : [...p, rol]);

  function aplicarPerfil(id: string) {
    setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) setPreset({ ...p.valores });
  }

  function aplicarDbTipo(k: string) {
    setDbTipo(k);
    const t = DB_TIPOLOGIAS.find((x) => x.key === k);
    if (t) { setNcajones(String(t.nc)); setNbarras(String(t.nb)); }
  }

  function handleTablero(rol: string, value: string) {
    const board = tableros.find((t) => t.codigo === value);
    setPreset((p) => ({ ...p, [rol]: value, ...(rol === 'caja' ? { refuerzo: value } : {}) }));
    if (rol === 'caja') {
      if (board?.espesor_mm === 18) setCantoCaja(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoCaja(getCantoMatch(cantos, '19x0,45'));
    } else if (rol === 'frente') {
      if (board?.espesor_mm === 18) setCantoFrentes(getCantoMatch(cantos, '22x1'));
      else if (board?.espesor_mm === 15) setCantoFrentes(getCantoMatch(cantos, '19x0,45'));
    }
  }

  function changeUnidad(nu: 'in' | 'cm' | 'mm') {
    if (nu === unidad) return;
    setLargo(String(conv(Number(largo), unidad, nu)));
    setAlto(String(conv(Number(alto), unidad, nu)));
    setProf(String(conv(Number(prof), unidad, nu)));
    setUnidad(nu);
  }

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })),
    [tableros]
  );
  const tipoOptions = useMemo(
    () => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })),
    [tipos]
  );

  const configEncoded = useMemo(() => {
    const config = {
      preset: { ...preset, refuerzo: preset['caja'] ?? '' },
      cantoFrentes, cantoCaja, recargoId, margen,
      tipoId, largo, alto, prof, unidad, perfilId,
      modoFrentes, conHerrajes, herrajesExcl,
      npuertas, ncajones, nentrepanos,
    };
    return btoa(encodeURIComponent(JSON.stringify(config)));
  }, [preset, cantoFrentes, cantoCaja, recargoId, margen, tipoId, largo, alto, prof, unidad, perfilId, modoFrentes, conHerrajes, herrajesExcl, npuertas, ncajones, nentrepanos]);

  const [state, formAction, pending] = useActionState(crearCotizacionAction, null);

  useEffect(() => {
    if (state?.ok && state.id) {
      router.push(`/cotizaciones/${state.id}?cfg=${configEncoded}`);
    }
  }, [state, configEncoded, router]);

  return (
    <form action={formAction} data-tour="nuevo" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 h-fit">
      <h2 className="font-semibold text-slate-900">Nuevo proyecto / cotización</h2>

      {/* ── Datos del proyecto ── */}
      <F label="Nombre del proyecto *">
        <input name="nombre" required placeholder="Ej. Cocina Torre A — Apto 502" className="inp" />
      </F>
      <F label="Cliente">
        <input name="cliente_nombre" placeholder="Cliente" className="inp" />
      </F>
      <div className="grid grid-cols-2 gap-2">
        <F label="Moneda">
          <select name="moneda" value={moneda} onChange={(e) => setMoneda(e.target.value as 'USD' | 'COP')} className="inp">
            <option value="USD">USD</option>
            <option value="COP">COP</option>
          </select>
        </F>
        <F label="TRM">
          <input name="trm" type="number" step="any" defaultValue={trmDefault} className="inp" />
        </F>
      </div>

      {/* ── Materiales globales ── */}
      <div className="border-t border-slate-100 pt-2 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Materiales globales</p>

        {perfiles.length > 0 && (
          <F label="Perfil de material">
            <Combobox value={perfilId} options={perfiles.map((p) => ({ value: p.id, label: p.nombre }))} onChange={aplicarPerfil} placeholder="Elegir perfil…" />
          </F>
        )}

        <F label="Tablero caja / refuerzos">
          <Combobox value={preset['caja'] ?? ''} options={tableroOptions}
            onChange={(v) => handleTablero('caja', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>
        <F label="Tablero frente">
          <Combobox value={preset['frente'] ?? ''} options={tableroOptions}
            onChange={(v) => handleTablero('frente', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>
        <F label="Tablero fondo">
          <Combobox value={preset['fondo'] ?? ''} options={tableroOptions}
            onChange={(v) => handleTablero('fondo', v)} placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>

        <div className="grid grid-cols-2 gap-2">
          <F label="Canto frentes">
            <select value={cantoFrentes} onChange={(e) => setCantoFrentes(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
          <F label="Canto caja">
            <select value={cantoCaja} onChange={(e) => setCantoCaja(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>

        <F label="Cliente (recargo)">
          <select value={recargoId} onChange={(e) => setRecargoId(e.target.value)} className="inp">
            <option value="">Sin recargo</option>
            {recargos.map((r) => (
              <option key={r.id} value={r.id}>{r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)</option>
            ))}
          </select>
        </F>

        <F label="Margen (%)">
          <input type="number" min={0} max={100} step={0.5} placeholder="Auto (usa margen del sistema)"
            value={margen} onChange={(e) => setMargen(e.target.value)} className="inp" />
        </F>
      </div>

      {/* ── Primer mueble ── */}
      <div className="border-t border-slate-100 pt-2 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Primer mueble</p>

        <F label="Tipo">
          <Combobox value={tipoId} options={tipoOptions} onChange={setTipoId} placeholder="Buscar tipo…" />
        </F>

        <div className="grid grid-cols-4 gap-1">
          <F label="Largo"><input type="text" value={largo} onChange={(e) => setLargo(e.target.value)} className="inp" /></F>
          <F label="Alto"><input type="text" value={alto} onChange={(e) => setAlto(e.target.value)} className="inp" /></F>
          <F label="Prof"><input type="text" value={prof} onChange={(e) => setProf(e.target.value)} className="inp" /></F>
          <F label="Un">
            <select value={unidad} onChange={(e) => changeUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp">
              <option>in</option><option>cm</option><option>mm</option>
            </select>
          </F>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <F label="Nº puertas"><input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" /></F>
          <F label="Nº cajones"><input type="number" placeholder="auto" value={ncajones} onChange={(e) => setNcajones(e.target.value)} className="inp" /></F>
          <F label="Nº entrepaños"><input type="number" placeholder="auto" value={nentrepanos} onChange={(e) => setNentrepanos(e.target.value)} className="inp" /></F>
        </div>

        {esDB && (
          <div className="grid grid-cols-2 gap-1">
            <F label="Tipología DB">
              <select value={dbTipo} onChange={(e) => aplicarDbTipo(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {DB_TIPOLOGIAS.map((t) => <option key={t.key} value={t.key} title={t.desc}>{t.key}</option>)}
              </select>
            </F>
            <F label="Nº barras">
              <input type="number" placeholder="0" value={nbarras} onChange={(e) => setNbarras(e.target.value)} className="inp" />
            </F>
          </div>
        )}

        <F label="Frentes">
          <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
            <option value="normal">Completo</option>
            <option value="sin_frentes">Sin frentes (open)</option>
            <option value="solo_frentes">Solo kit de frentes</option>
          </select>
        </F>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={conHerrajes} onChange={(e) => setConHerrajes(e.target.checked)} /> Con herrajes
        </label>

        {conHerrajes && herrajesTipo.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-2.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase mb-1.5">Herrajes (destilda para excluir)</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {herrajesTipo.map((h) => (
                <label key={h.rol} className="flex items-center gap-1 text-xs text-slate-700 capitalize">
                  <input type="checkbox" checked={!herrajesExcl.includes(h.rol)} onChange={() => toggleHerraje(h.rol)} />
                  {h.rol}{h.codigo ? <span className="text-slate-400 normal-case"> · {h.codigo}</span> : null}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error ?? 'Error al crear el proyecto'}</p>
      )}

      <button disabled={pending}
        className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        {pending ? 'Creando…' : 'Crear y agregar muebles'}
      </button>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.35rem .5rem;font-size:.8rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-0.5">{label}</span>
      {children}
    </label>
  );
}
