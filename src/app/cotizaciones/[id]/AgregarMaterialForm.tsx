'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarLineaMaterialAction, getMaterialesDisponiblesAction } from '../actions';
import { ETIQUETA_MATERIAL, UNIDAD_MATERIAL, type TipoMaterial } from '@/lib/materiales-linea';
import type { MaterialDisponible } from '@/lib/cotizaciones';
import Combobox from '@/components/Combobox';

const TIPOS: TipoMaterial[] = ['herraje', 'tablero', 'canto'];
const fmtCOP = (n: number) => Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/**
 * Agrega a la cocina un tablero, canto o herraje suelto, tomado de los
 * catálogos de Materiales-Parámetros. La cantidad va en la unidad de cada uno
 * (m², metros lineales o unidades) porque su tarifa ya está en esa unidad.
 */
export default function AgregarMaterialForm({ cocinaId, onDone }: { cocinaId: string; onDone: () => void }) {
  const router = useRouter();
  const [catalogo, setCatalogo] = useState<Record<TipoMaterial, MaterialDisponible[]> | null>(null);
  const [tipo, setTipo] = useState<TipoMaterial>('herraje');
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getMaterialesDisponiblesAction().then(setCatalogo).catch(() => setError('No se pudo cargar el catálogo.')); }, []);

  const items = catalogo?.[tipo] ?? [];
  const elegido = items.find((m) => m.codigo === codigo);
  const total = elegido ? elegido.precio * (Number(cantidad) || 0) : 0;

  async function guardar() {
    const n = Number(cantidad);
    if (!codigo) { setError('Elige un material.'); return; }
    if (!(Number.isFinite(n) && n > 0)) { setError('La cantidad debe ser mayor que cero.'); return; }
    setGuardando(true); setError('');
    const r = await agregarLineaMaterialAction(cocinaId, { tipo, codigo, cantidad: n });
    setGuardando(false);
    if (!r.ok) { setError(r.error ?? 'No se pudo agregar'); return; }
    router.refresh();
    onDone();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Agregar herrajes y materiales</h3>
        <button onClick={onDone} className="text-sm text-slate-400 hover:underline">Cerrar</button>
      </div>

      <div className="grid gap-3 md:grid-cols-[160px_1fr_140px_auto] md:items-end">
        <label className="block text-xs text-slate-500">
          <span className="mb-1 block">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value as TipoMaterial); setCodigo(''); }}
            className="w-full rounded-lg border border-slate-300 px-2 py-[0.4rem] text-[0.8rem]"
          >
            {TIPOS.map((t) => <option key={t} value={t}>{ETIQUETA_MATERIAL[t]}</option>)}
          </select>
        </label>

        <label className="block text-xs text-slate-500">
          <span className="mb-1 block">{ETIQUETA_MATERIAL[tipo]} · {items.length} en catálogo</span>
          <Combobox
            value={codigo}
            options={items.map((m) => ({ value: m.codigo, label: m.etiqueta, searchText: m.codigo }))}
            onChange={setCodigo}
            placeholder={catalogo ? 'Buscar…' : 'Cargando catálogo…'}
            disabled={!catalogo}
            allowEmpty
            emptyLabel="— seleccionar —"
          />
        </label>

        <label className="block text-xs text-slate-500">
          <span className="mb-1 block">Cantidad ({UNIDAD_MATERIAL[tipo]})</span>
          <input
            type="number" min="0" step="any" value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-slate-300 px-2 py-[0.4rem] text-[0.8rem]"
          />
        </label>

        <button
          disabled={guardando || !codigo}
          onClick={guardar}
          className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          {guardando ? 'Agregando…' : 'Agregar'}
        </button>
      </div>

      {elegido && (
        <p className="mt-2 text-xs text-slate-500">
          {fmtCOP(elegido.precio)} por {UNIDAD_MATERIAL[tipo]} · costo {fmtCOP(total)}
          {tipo === 'herraje' ? ' · lleva el margen de herraje' : ' · lleva el margen de muebles'}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
