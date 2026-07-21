'use client';
import { useActionState, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { crearCotizacionAction } from './actions';
import Combobox from '@/components/Combobox';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; valores: Record<string, string> };

interface Props {
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  trmDefault: number;
  perfiles: Perfil[];
  perfilDefaultId: string;
}

const tableroLabel = (t: Tablero) =>
  `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

export default function NuevoCotizacionForm({
  tableros, cantos, presetDefault, trmDefault, perfiles, perfilDefaultId,
}: Props) {
  const router = useRouter();

  const [moneda, setMoneda] = useState<'USD' | 'COP'>('USD');
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

  const [margen, setMargen] = useState('');
  const [perfilId, setPerfilId] = useState(perfilDefaultId);

  function aplicarPerfil(id: string) {
    setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) setPreset({ ...p.valores });
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

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })),
    [tableros]
  );

  const configEncoded = useMemo(() => {
    const config = {
      preset: { ...preset, refuerzo: preset['caja'] ?? '' },
      cantoFrentes, cantoCaja, margen, perfilId,
    };
    return btoa(encodeURIComponent(JSON.stringify(config)));
  }, [preset, cantoFrentes, cantoCaja, margen, perfilId]);

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

      <label className="block">
        <span className="block text-xs text-slate-500 mb-1">Sistema de medidas y nomenclatura</span>
        <select name="sistema_medida" defaultValue="imperial"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="imperial">Pulgadas · nomenclatura imperial</option>
          <option value="metrico">Centímetros · nomenclatura métrica</option>
        </select>
        <span className="mt-1 block text-[11px] text-slate-400">Se fija para todo el proyecto y evita mezclar nomenclaturas.</span>
      </label>

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

        <F label="Margen (%)">
          <input type="number" min={0} max={100} step={0.5} placeholder="Auto (usa margen del sistema)"
            value={margen} onChange={(e) => setMargen(e.target.value)} className="inp" />
        </F>
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
