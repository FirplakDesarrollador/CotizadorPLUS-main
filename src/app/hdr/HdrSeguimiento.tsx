'use client';
import { useRef, useState } from 'react';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import type { CotizacionHeader } from '@/lib/cotizaciones';
import { modulosDeCotizacionAction } from './actions';
import { entradasSeguimiento, type EntradaSeguimiento, type TipoSeguimiento } from './seguimiento';

export default function HdrSeguimiento({ cotizaciones, tipos }: { cotizaciones: CotizacionHeader[]; tipos: TipoSeguimiento[] }) {
  const [cotizacionId, setCotizacionId] = useState('');
  const [entradas, setEntradas] = useState<EntradaSeguimiento[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const peticion = useRef(0);
  const proyecto = (id: string) => cotizaciones.find(c => c.id === id)?.nombre || 'Proyecto';

  async function seleccionar(id: string) {
    const actual = ++peticion.current;
    setCotizacionId(id); setEntradas(null); setError(null); setLoading(!!id);
    if (!id) return;
    try {
      const modulos = await modulosDeCotizacionAction(id);
      if (actual !== peticion.current) return;
      const filas = entradasSeguimiento(modulos, tipos);
      setEntradas(filas);
      if (!filas.length) return;
      const { descargarSeguimiento } = await import('./seguimientoExcel');
      if (actual === peticion.current) await descargarSeguimiento(filas, proyecto(id), () => actual === peticion.current);
    } catch (e) { if (actual === peticion.current) setError(e instanceof Error ? e.message : 'No se pudo generar el seguimiento.'); }
    finally { if (actual === peticion.current) setLoading(false); }
  }

  async function descargar() {
    if (!entradas?.length) return;
    const actual = peticion.current;
    setLoading(true); setError(null);
    try { const { descargarSeguimiento } = await import('./seguimientoExcel'); await descargarSeguimiento(entradas, proyecto(cotizacionId), () => actual === peticion.current); }
    catch (e) { if (actual === peticion.current) setError(e instanceof Error ? e.message : 'No se pudo descargar el Excel.'); }
    finally { if (actual === peticion.current) setLoading(false); }
  }

  return <section className="border-t border-slate-200 pt-6 space-y-3">
    <h2 className="font-semibold text-slate-900">Seguimiento</h2>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <Campo label="Cotización para seguimiento"><Combobox value={cotizacionId} options={cotizaciones.map(c => ({ value: c.id, label: `${c.codigo ?? '—'} · ${c.nombre ?? 'Sin nombre'}` }))} onChange={seleccionar} placeholder="Selecciona una cotización…" allowEmpty /></Campo>
      <p className="text-sm text-slate-600">Al seleccionar una cotización se descarga un Excel con las hojas Seguimiento y Códigos. Los campos quedan vacíos para diligenciarlos; los muebles se listan una vez por nombre exacto, sin cantidades.</p>
      {loading && <p role="status" className="text-sm text-slate-500">Generando seguimiento…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {entradas && !loading && <p className="text-sm text-slate-600">{entradas.length ? `${entradas.length} nombres únicos incluidos.` : 'Esta cotización no tiene muebles para el seguimiento.'}</p>}
      {entradas && entradas.length > 0 && <button type="button" disabled={loading} onClick={descargar} className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50">Descargar Excel de seguimiento</button>}
    </div>
  </section>;
}
