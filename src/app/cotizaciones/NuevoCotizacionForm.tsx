'use client';
import { useActionState, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { crearCotizacionAction } from './actions';
import Combobox from '@/components/Combobox';

type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };

interface Props {
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  trmDefault: number;
}

const tableroLabel = (t: Tablero) =>
  `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

export default function NuevoCotizacionForm({ tableros, cantos, presetDefault, trmDefault }: Props) {
  const router = useRouter();

  // Campos básicos del proyecto
  const [moneda, setMoneda] = useState<'USD' | 'COP'>('USD');

  // Tableros por rol
  const [presetCaja, setPresetCaja] = useState(presetDefault['caja'] ?? '');
  const [presetFrente, setPresetFrente] = useState(presetDefault['frente'] ?? '');
  const [presetFondo, setPresetFondo] = useState(presetDefault['fondo'] ?? '');

  // Cantos — inicializar según espesores del preset
  const [cantoFrentes, setCantoFrentes] = useState(() => {
    const b = tableros.find((t) => t.codigo === presetDefault['frente']);
    return b?.espesor_mm === 18 ? getCantoMatch(cantos, '22x1') : '';
  });
  const [cantoCaja, setCantoCaja] = useState(() => {
    const b = tableros.find((t) => t.codigo === presetDefault['caja']);
    return b?.espesor_mm === 15 ? getCantoMatch(cantos, '19x0,45') : '';
  });

  // Recargo y margen
  // const [recargoId, setRecargoId] = useState(''); // DESACTIVADO
  const [margen, setMargen] = useState('');

  const tableroOptions = useMemo(
    () => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)).map((t) => ({ value: t.codigo, label: tableroLabel(t) })),
    [tableros]
  );

  function handleTableroChange(rol: 'caja' | 'frente' | 'fondo', value: string) {
    const board = tableros.find((t) => t.codigo === value);
    if (rol === 'caja') {
      setPresetCaja(value);
      if (board?.espesor_mm === 15) setCantoCaja(getCantoMatch(cantos, '19x0,45'));
    } else if (rol === 'frente') {
      setPresetFrente(value);
      if (board?.espesor_mm === 18) setCantoFrentes(getCantoMatch(cantos, '22x1'));
    } else {
      setPresetFondo(value);
    }
  }

  // useActionState para manejar el resultado del server action
  const [state, formAction, pending] = useActionState(crearCotizacionAction, null);

  // Cuando el action retorna { ok: true, id }, redirigir con config como query param
  const configEncoded = useMemo(() => {
    const config = {
      preset: { caja: presetCaja, frente: presetFrente, fondo: presetFondo, refuerzo: presetCaja },
      cantoFrentes,
      cantoCaja,
      // recargoId,
      margen,
    };
    return btoa(encodeURIComponent(JSON.stringify(config)));
  }, [presetCaja, presetFrente, presetFondo, cantoFrentes, cantoCaja, /* recargoId, */ margen]);

  // Redirigir cuando el action tenga éxito
  useEffect(() => {
    if (state?.ok && state.id) {
      router.push(`/cotizaciones/${state.id}?cfg=${configEncoded}`);
    }
  }, [state, configEncoded, router]);

  return (
    <form action={formAction} data-tour="nuevo" className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 h-fit">
      <h2 className="font-semibold text-slate-900">Nuevo proyecto / cotización</h2>

      {/* ── Datos básicos ── */}
      <label className="block">
        <span className="block text-xs text-slate-500 mb-1">Nombre del proyecto *</span>
        <input name="nombre" required placeholder="Ej. Cocina Torre A — Apto 502"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </label>

      <input name="cliente_nombre" placeholder="Cliente"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />

      <div className="grid grid-cols-2 gap-2">
        <select name="moneda" value={moneda} onChange={(e) => setMoneda(e.target.value as 'USD' | 'COP')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="USD">USD</option>
          <option value="COP">COP</option>
        </select>
        <input name="trm" type="number" step="any" defaultValue={trmDefault}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="TRM" />
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

      {/* ── Materiales del proyecto ── */}
      <div className="border-t border-slate-100 pt-3 space-y-2">

        <F label="Tablero caja">
          <Combobox value={presetCaja} options={tableroOptions}
            onChange={(v) => handleTableroChange('caja', v)}
            placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>

        <F label="Tablero frente">
          <Combobox value={presetFrente} options={tableroOptions}
            onChange={(v) => handleTableroChange('frente', v)}
            placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>

        <F label="Tablero fondo">
          <Combobox value={presetFondo} options={tableroOptions}
            onChange={(v) => handleTableroChange('fondo', v)}
            placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
        </F>

        <div className="grid grid-cols-2 gap-2">
          <F label="Canto frentes">
            <select value={cantoFrentes} onChange={(e) => setCantoFrentes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
          <F label="Canto caja">
            <select value={cantoCaja} onChange={(e) => setCantoCaja(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
        </div>

        {/* <F label="Cliente (recargo)">
          <select value={recargoId} onChange={(e) => setRecargoId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="">Sin recargo</option>
            {recargos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.cliente_nombre} (+{(r.recargo_pct * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </F> */}

        <F label="Margen (%)">
          <input type="number" min={0} max={100} step={0.5}
            placeholder="Auto (usa margen del sistema)"
            value={margen}
            onChange={(e) => setMargen(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
        </F>
      </div>

      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error ?? 'Error al crear el proyecto'}</p>
      )}

      <button disabled={pending}
        className="w-full rounded-lg bg-slate-900 text-white py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
        {pending ? 'Creando…' : 'Crear y agregar muebles'}
      </button>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
