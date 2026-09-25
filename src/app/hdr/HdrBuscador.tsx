'use client';
import { useMemo, useRef, useState } from 'react';
import { previewAction } from '../admin/diseno/actions';
import { modulosDeCotizacionAction, type ModuloHDR } from './actions';
import { DB_TIPOLOGIAS, SISTEMAS_FRENTE, type SistemaFrente } from '@/lib/muebles';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { codigoComercial } from '@/lib/module-groups';
import type { CotizarResult } from '@/lib/cotizar';
import type { CotizacionHeader } from '@/lib/cotizaciones';
import HdrTabla, { descripcionModulo, type Tablero, type HdrTablaHandle } from './HdrTabla';

type Tipo = { id: string; pref: string; pref_imperial: string | null; pref_metrico: string | null; nombre_es: string | null; categoria: string | null };

export default function HdrBuscador({ tipos, presetDefault, tableros, cotizaciones }:
  { tipos: Tipo[]; presetDefault: Record<string, string>; tableros: Tablero[]; cotizaciones: CotizacionHeader[] }) {
  const [tipoId, setTipoId] = useState('');
  const [largo, setLargo] = useState(30);
  const [alto, setAlto] = useState(30);
  const [prof, setProf] = useState(24);
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [dbTipo, setDbTipo] = useState('');
  const [sistemaFrente, setSistemaFrente] = useState<SistemaFrente>('manija');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<CotizarResult | null>(null);

  const [cotizacionId, setCotizacionId] = useState('');
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [modulos, setModulos] = useState<ModuloHDR[] | null>(null);
  const [exportandoTodas, setExportandoTodas] = useState<{ hecho: number; total: number } | null>(null);
  const tablasRef = useRef(new Map<string, HdrTablaHandle>());

  const tipoOptions = useMemo(
    () => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })),
    [tipos],
  );
  const tipoSel = tipos.find((t) => t.id === tipoId);
  const esDB = (tipoSel?.pref ?? '').startsWith('DB');

  const cotizacionOptions = useMemo(
    () => cotizaciones.map((c) => ({
      value: c.id,
      label: `${c.codigo ?? '—'} · ${c.nombre ?? 'sin nombre'}${c.cliente_nombre ? ` (${c.cliente_nombre})` : ''}`,
    })),
    [cotizaciones],
  );

  function handleTipoChange(v: string) {
    setTipoId(v);
    const pref = tipos.find((t) => t.id === v)?.pref ?? '';
    if (!pref.startsWith('DB')) setDbTipo('');
    if (pref === 'W') setProf(unidad === 'in' ? 12 : unidad === 'cm' ? 30.48 : 304.8);
    if (pref === 'WSM') setProf(unidad === 'in' ? 14 : unidad === 'cm' ? 35.56 : 355.6);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoId) { setError('Elige un tipo de mueble.'); return; }
    setError(null);
    setLoading(true);
    const overrides: Record<string, number> = { gola: sistemaFrente === 'gola' ? 1 : 0 };
    if (esDB && dbTipo) {
      const t = DB_TIPOLOGIAS.find((x) => x.key === dbTipo);
      if (t) {
        overrides.n_cajones = t.nc;
        overrides.n_cajones_pequenos = t.npeq;
      }
    }
    const r = await previewAction({ tipoId, largo, alto, prof, unidad, preset: presetDefault, conHerrajes: false, overrides });
    setLoading(false);
    if (!r.ok) { setError(r.error); setRes(null); return; }
    setRes(r.result);
  }

  async function handleCotizacionChange(id: string) {
    setCotizacionId(id);
    setModulos(null);
    setModError(null);
    tablasRef.current.clear();
    if (!id) return;
    setModLoading(true);
    try {
      const r = await modulosDeCotizacionAction(id);
      setModulos(r);
    } catch (e) {
      setModError(e instanceof Error ? e.message : 'Error al cargar los módulos de la cotización.');
    } finally {
      setModLoading(false);
    }
  }

  // Un solo botón, un PDF independiente por módulo (no un PDF combinado). Secuencial,
  // no en paralelo: cada exportación usa html2canvas (pesado) y varios navegadores
  // bloquean descargas múltiples disparadas de golpe si no van una detrás de otra.
  async function exportarTodasPdf() {
    const okModulos = (modulos ?? []).filter((m) => m.ok);
    if (okModulos.length === 0) return;
    setExportandoTodas({ hecho: 0, total: okModulos.length });
    for (let i = 0; i < okModulos.length; i++) {
      const handle = tablasRef.current.get(okModulos[i].lineaId);
      if (handle) await handle.exportarPdf();
      setExportandoTodas({ hecho: i + 1, total: okModulos.length });
      if (i < okModulos.length - 1) await new Promise((r) => setTimeout(r, 300));
    }
    setExportandoTodas(null);
  }

  const codigo = tipoSel
    ? codigoComercial({ pref: tipoSel.pref, largo, alto, prof, unidad, sistema: 'imperial', sistemaFrente })
    : '';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Generar desde una cotización guardada</h2>
        <Campo label="Cotización">
          <Combobox value={cotizacionId} options={cotizacionOptions} onChange={handleCotizacionChange} placeholder="Buscar cotización por código, nombre o cliente…" />
        </Campo>
        {modLoading && <p className="text-slate-400 text-sm">Cargando módulos…</p>}
        {modError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{modError}</div>}
        {modulos && modulos.length === 0 && <p className="text-slate-400 text-sm">Esta cotización no tiene módulos.</p>}
      </div>

      {modulos && modulos.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={exportarTodasPdf}
              disabled={exportandoTodas !== null || !modulos.some((m) => m.ok)}
              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {exportandoTodas ? `Generando ${exportandoTodas.hecho}/${exportandoTodas.total}…` : '⬇ Exportar todas en PDF'}
            </button>
          </div>
          {modulos.map((m) => (
            <div key={m.lineaId}>
              {m.ok ? (
                <HdrTabla
                  ref={(handle) => {
                    if (handle) tablasRef.current.set(m.lineaId, handle);
                    else tablasRef.current.delete(m.lineaId);
                  }}
                  res={m.result}
                  tableros={tableros}
                  titulo={`${m.codigoModulo} ${descripcionModulo(m.result)} · ${m.cocinaNombre}${m.cantidad > 1 ? ` · ×${m.cantidad}` : ''}`}
                  mostrarBotonExportar={false}
                />
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {m.codigoModulo} ({m.cocinaNombre}): {m.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 pt-6">
        <h2 className="font-semibold text-slate-900 mb-3">Buscar por tipo y medidas</h2>
        <form onSubmit={buscar} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-12 gap-2 items-end">
            <Campo label="Tipo De Mueble" className="col-span-12 sm:col-span-5">
              <Combobox value={tipoId} options={tipoOptions} onChange={handleTipoChange} placeholder="Buscar tipo…" />
            </Campo>
            <Campo label="Largo" className="col-span-4 sm:col-span-2">
              <input type="number" step="any" value={largo} onChange={(e) => setLargo(+e.target.value)} className="inp" />
            </Campo>
            <Campo label="Alto" className="col-span-4 sm:col-span-2">
              <input type="number" step="any" value={alto} onChange={(e) => setAlto(+e.target.value)} className="inp" />
            </Campo>
            <Campo label="Prof" className="col-span-4 sm:col-span-2">
              <input type="number" step="any" value={prof} onChange={(e) => setProf(+e.target.value)} className="inp" />
            </Campo>
            <Campo label="Unidad" className="col-span-12 sm:col-span-1">
              <select value={unidad} onChange={(e) => setUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp">
                <option value="in">in</option><option value="cm">cm</option><option value="mm">mm</option>
              </select>
            </Campo>
          </div>

          {esDB && (
            <Campo label="Tipología DB">
              <select value={dbTipo} onChange={(e) => setDbTipo(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {DB_TIPOLOGIAS.map((t) => <option key={t.key} value={t.key} title={t.desc}>{t.key}</option>)}
              </select>
            </Campo>
          )}

          <Campo label="Sistema de frente">
            <select value={sistemaFrente} onChange={(e) => setSistemaFrente(e.target.value as SistemaFrente)} className="inp">
              {SISTEMAS_FRENTE.map((s) => <option key={s.key} value={s.key} title={s.desc}>{s.label}</option>)}
            </select>
          </Campo>

          <button className="rounded-lg bg-slate-900 text-white px-5 py-2 text-sm font-medium hover:bg-slate-800">Buscar</button>

          <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.5rem .6rem;font-size:.875rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}.inp::-webkit-outer-spin-button,.inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.inp[type=number]{-moz-appearance:textfield}`}</style>
        </form>

        {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loading && <p className="mt-3 text-slate-400 text-sm">Calculando…</p>}

        {res && (
          <div className="mt-4">
            <HdrTabla res={res} tableros={tableros} titulo={`${codigo} ${descripcionModulo(res)}`} />
          </div>
        )}
      </div>
    </div>
  );
}
