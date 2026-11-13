'use client';
import { useMemo, useRef, useState } from 'react';
import { previewAction } from '../admin/diseno/actions';
import { modulosDeCotizacionAction, type ModuloHDR } from './actions';
import { etiquetaTipologiaDb, esTipologiaDbFe, tipologiasDbParaPrefijo, DB_SM_FE_TIPOLOGIAS, SISTEMAS_FRENTE, esTipologiaDbSmFe, esTipologiaDbSmFeSf, obtenerTipologiasDbSmFeSf, permiteTipologiaDb, usaPuertaParametrica, type SistemaFrente } from '@/lib/muebles';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { codigoComercial, parseMedida } from '@/lib/module-groups';
import { presetMaterialesTipologia, resolverCodigoTablero } from '@/lib/materiales-proyecto';
import type { CotizarResult } from '@/lib/cotizar';
import { usaFrentesDosPequenosGola } from '@/lib/frentes-gaveta';
import { esPanel, etiquetaTipoModulo } from '@/lib/nombres-modulos';
import type { CotizacionHeader } from '@/lib/cotizaciones';
import HdrTabla, { descripcionModulo, type Tablero, type HdrTablaHandle } from './HdrTabla';
import HdrConsumos from './HdrConsumos';
import HdrSeguimiento from './HdrSeguimiento';
import HdrBuscarGuardados from './HdrBuscarGuardados';
import { consolidarModulosHdr, descripcionPiezaPlanaHdr, prefijarHrj, tituloModuloHdr } from './datosHdr';
import { crearDestinoHdr, esCancelacionHdr } from './destinoExportacion';
import { exigirRevisionHdr } from './validacion';

type Tipo = { id: string; pref: string; pref_imperial: string | null; pref_metrico: string | null; nombre_es: string | null; categoria: string | null };
const DB_SM_FE_GROUP_VALUE = '__DB_SM_FE__';
const DB_SM_FE_SF_GROUP_VALUE = '__DB_SM_FE_SF__';

export default function HdrBuscador({ tipos, presetDefault, tableros, cotizaciones }:
  { tipos: Tipo[]; presetDefault: Record<string, string>; tableros: Tablero[]; cotizaciones: CotizacionHeader[] }) {
  const [revisionConfirmada, setRevisionConfirmada] = useState(false);
  const presetResuelto = Object.fromEntries(Object.entries(presetDefault).map(([rol, codigo]) => [rol, resolverCodigoTablero(codigo, tableros)]));
  const [tipoId, setTipoId] = useState('');
  const [largo, setLargo] = useState(30);
  const [alto, setAlto] = useState(30);
  const [prof, setProf] = useState(24);
  const [unidad, setUnidad] = useState<'in' | 'cm' | 'mm'>('in');
  const [dbTipo, setDbTipo] = useState('');
  const [sistemaFrente, setSistemaFrente] = useState<SistemaFrente>('manija');
  const [door, setDoor] = useState('');
  const [doorHand, setDoorHand] = useState<'L' | 'R'>('R');
  const [notaPanel, setNotaPanel] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<CotizarResult | null>(null);

  const [cotizacionId, setCotizacionId] = useState('');
  const [proyectoHdr, setProyectoHdr] = useState('');
  const [prefijoHrj, setPrefijoHrj] = useState(false);
  const [prefijoHrjBuscar, setPrefijoHrjBuscar] = useState(false);
  const [modLoading, setModLoading] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [modulos, setModulos] = useState<ModuloHDR[] | null>(null);
  const [exportandoTodas, setExportandoTodas] = useState<{ hecho: number; total: number } | null>(null);
  const [exportandoExcel, setExportandoExcel] = useState(false);
  const tablasRef = useRef(new Map<string, HdrTablaHandle>());
  const referencias = useMemo(() => { const conteo = new Map<string, number>(); for (const m of modulos ?? []) conteo.set(m.codigoModulo, (conteo.get(m.codigoModulo) ?? 0) + 1); return conteo; }, [modulos]);
  const totalMuebles = (modulos ?? []).reduce((n, m) => n + (m.origenes ?? []).reduce((s, o) => s + o.cantidad * o.repeticionesArea, 0), 0);

  const tipoOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    let dbSmFeAgregado = false;
    let dbSmFeSfAgregado = false;
    for (const t of tipos) {
      if (esTipologiaDbSmFeSf(t.pref)) {
        if (!dbSmFeSfAgregado) {
          options.push({ value: DB_SM_FE_SF_GROUP_VALUE, label: 'DB-SM-FE-SF — Cajoneras con Gola, riel Full Extension y sin fondo' });
          dbSmFeSfAgregado = true;
        }
        continue;
      }
      if (esTipologiaDbSmFe(t.pref)) {
        if (!dbSmFeAgregado) {
          options.push({ value: DB_SM_FE_GROUP_VALUE, label: 'DB-SM-FE — Cajoneras con Gola y riel Full Extension' });
          dbSmFeAgregado = true;
        }
        continue;
      }
      options.push({ value: t.id, label: etiquetaTipoModulo(t.pref, t.nombre_es) });
    }
    return options;
  }, [tipos]);
  const tipoSel = tipos.find((t) => t.id === tipoId);
  const esDB = permiteTipologiaDb(tipoSel?.pref);
  const esDbTradicional = (tipoSel?.pref === 'DB' || esTipologiaDbFe(tipoSel?.pref));
  const usaTipologiaDbSmFe = esTipologiaDbSmFe(tipoSel?.pref);
  const usaTipologiaDbSmFeSf = esTipologiaDbSmFeSf(tipoSel?.pref);
  const tipologiasDbSmFeSf = obtenerTipologiasDbSmFeSf(tipos);
  const usaDoor = usaPuertaParametrica(tipoSel?.pref);
  const tipoSelectorValue = usaTipologiaDbSmFeSf
    ? DB_SM_FE_SF_GROUP_VALUE
    : usaTipologiaDbSmFe ? DB_SM_FE_GROUP_VALUE : tipoId;

  const cotizacionOptions = useMemo(
    () => cotizaciones.map((c) => ({
      value: c.id,
      label: `${c.codigo ?? '—'} · ${c.nombre ?? 'sin nombre'}${c.cliente_nombre ? ` (${c.cliente_nombre})` : ''}`,
    })),
    [cotizaciones],
  );

  function handleTipoChange(v: string) {
    const resolvedId = v === DB_SM_FE_SF_GROUP_VALUE
      ? tipologiasDbSmFeSf[0]?.id
      : v === DB_SM_FE_GROUP_VALUE
      ? tipos.find((t) => t.pref === DB_SM_FE_TIPOLOGIAS[0].pref)?.id
      : v;
    if (!resolvedId) return;
    setTipoId(resolvedId);
    const pref = tipos.find((t) => t.id === resolvedId)?.pref ?? '';
    if (!pref.startsWith('DB')) setDbTipo('');
    if (pref === 'W') setProf(unidad === 'in' ? 12 : unidad === 'cm' ? 30.48 : 304.8);
    if (pref === 'WSM') setProf(unidad === 'in' ? 14 : unidad === 'cm' ? 35.56 : 355.6);
    if (pref === 'F' || (pref === 'DB' || esTipologiaDbFe(pref))) setSistemaFrente('manija');
    if (esTipologiaDbSmFeSf(pref) || usaFrentesDosPequenosGola(pref)) setSistemaFrente('gola');
  }

  function aplicarDbSmFeTipo(pref: string) {
    const tipo = tipos.find((item) => item.pref === pref);
    if (tipo) handleTipoChange(tipo.id);
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoId) { setError('Elige un tipo de mueble.'); return; }
    if (usaDoor && !(parseMedida(door) > 0)) { setError('Escribe una medida válida para Puerta.'); return; }
    setError(null);
    setLoading(true);
    const overrides: Record<string, number> = { gola: usaFrentesDosPequenosGola(tipoSel?.pref) ? 1 : esDbTradicional ? 0 : sistemaFrente === 'gola' ? 1 : 0 };
    if (esDB && dbTipo) {
      const t = tipologiasDbParaPrefijo(tipoSel?.pref).find((x) => x.key === dbTipo);
      if (t) {
        overrides.n_cajones = t.nc;
        overrides.n_cajones_pequenos = t.npeq;
      }
    }
    const r = await previewAction({
      tipoId, largo, alto, prof, unidad, preset: presetResuelto, conHerrajes: false, overrides, dbTipo: esDB ? dbTipo : undefined,
      door: usaDoor ? parseMedida(door) : undefined,
      doorHand: usaDoor ? doorHand : undefined,
    });
    setLoading(false);
    if (!r.ok) { setError(r.error); setRes(null); return; }
    setRes(r.result);
  }

  async function handleCotizacionChange(id: string) {
    setRevisionConfirmada(false);
    setCotizacionId(id);
    setProyectoHdr(cotizaciones.find(c => c.id === id)?.nombre ?? '');
    setModulos(null);
    setModError(null);
    tablasRef.current.clear();
    if (!id) return;
    setModLoading(true);
    try {
      const r = await modulosDeCotizacionAction(id);
      setModulos(consolidarModulosHdr(r));
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
    setModError(null);
    try {
      exigirRevisionHdr(modulos ?? [], revisionConfirmada);
      if (modulos?.some(m => !m.ok)) throw new Error('Hay muebles con errores. Corrígelos antes de exportar para no omitirlos.');
      const handles = okModulos.map(m => { const handle = tablasRef.current.get(m.lineaId); if (!handle) throw new Error(`La HDR de ${m.codigoModulo} aún no está lista.`); return handle; });
      const destino = await crearDestinoHdr(proyectoHdr);
      for (let i = 0; i < handles.length; i++) { await handles[i].exportarPdf(destino.guardar); setExportandoTodas({ hecho: i + 1, total: handles.length }); }
      await destino.finalizar();
    } catch (e) { if (!esCancelacionHdr(e)) setModError(e instanceof Error ? e.message : 'No se pudo completar la exportación de todas las HDR.'); }
    finally { setExportandoTodas(null); }
  }

  async function exportarExcel() {
    setExportandoExcel(true);
    setModError(null);
    try {
      exigirRevisionHdr(modulos ?? [], revisionConfirmada);
      if (modulos?.some(m => !m.ok)) throw new Error('Hay muebles con errores. Corrígelos antes de exportar para no omitirlos.');
      const datos = (modulos ?? []).map(m => { const tabla = tablasRef.current.get(m.lineaId); if (!tabla) throw new Error(`La HDR de ${m.codigoModulo} aún no está lista.`); return tabla.datosExcel(); });
      const destino = await crearDestinoHdr(proyectoHdr);
      const { descargarExcelHdr } = await import('./excel');
      await descargarExcelHdr(datos, proyectoHdr, destino);
    } catch (e) { if (!esCancelacionHdr(e)) setModError(e instanceof Error ? e.message : 'No se pudo exportar el Excel.'); }
    finally { setExportandoExcel(false); }
  }

  const materialesCodigo = presetMaterialesTipologia(presetResuelto, tipoSel?.pref);
  const codigo = tipoSel
    ? codigoComercial({
        pref: tipoSel.pref, largo, alto, prof, unidad, sistema: unidad === 'in' ? 'imperial' : 'metrico', sistemaFrente, dbTipo: esDB ? dbTipo : null,
        door: usaDoor && door !== '' ? parseMedida(door) : null,
        doorHand: usaDoor ? doorHand : null,
        espesorCajaMm: tableros.find((tablero) => tablero.codigo === materialesCodigo.caja)?.espesor_mm,
        espesorFrenteMm: tableros.find((tablero) => tablero.codigo === materialesCodigo.frente)?.espesor_mm,
      })
    : '';
  const tituloCreado = res
    ? (() => {
        const nombre = `${codigo} ${descripcionPiezaPlanaHdr(tipoSel?.pref, notaPanel) ?? descripcionModulo(res, tipoSel?.pref)}`;
        return prefijoHrjBuscar ? prefijarHrj(nombre, tipoSel?.pref, codigo) : nombre;
      })()
    : '';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <h2 className="font-semibold text-slate-900">Generar desde una cotización guardada</h2>
        <Campo label="Cotización">
          <Combobox value={cotizacionId} options={cotizacionOptions} onChange={handleCotizacionChange} placeholder="Buscar cotización por código, nombre o cliente…" />
        </Campo>
        <Campo label="Nombre del proyecto">
          <input value={proyectoHdr} onChange={e => setProyectoHdr(e.target.value)} placeholder="Nombre para las hojas de ruta" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </Campo>
        <label className="flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-slate-700">
          <span>Prefijo HRJ</span>
          <input type="checkbox" role="switch" aria-label="Agregar prefijo HRJ al nombre del mueble" checked={prefijoHrj} onChange={e => setPrefijoHrj(e.target.checked)} className="peer sr-only" />
          <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-700" />
          <span>Agregar HRJ al nombre del mueble</span>
        </label>
        {modLoading && <p className="text-slate-400 text-sm">Cargando módulos…</p>}
        {modError && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{modError}</div>}
        {modulos && modulos.length === 0 && <p className="text-slate-400 text-sm">Esta cotización no tiene módulos.</p>}
      </div>

      {modulos && modulos.length > 0 && (
        <div className="space-y-4">
          {modulos.some(m => m.avisosValidacion?.length) && (
            <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 space-y-2">
              <p className="font-semibold">Revisión de hojas de ruta pendiente</p>
              <ul className="list-disc pl-5">{modulos.flatMap(m => (m.avisosValidacion ?? []).map((aviso, i) => <li key={`${m.lineaId}-${i}`}>{m.codigoModulo}: {aviso}</li>))}</ul>
              <a href={`/cotizaciones/${cotizacionId}`} className="underline">Abrir cotización para corregir las cantidades</a>
              <p>Después de guardar la corrección, vuelve a seleccionar la cotización para validar las HDR.</p>
              {modulos.some(m => m.aperturaPendiente) ? <p>La apertura L/R es obligatoria. Complétala en la cotización para poder exportar.</p> : <label className="flex items-start gap-2"><input type="checkbox" checked={revisionConfirmada} onChange={e => setRevisionConfirmada(e.target.checked)} />He revisado todos los avisos y confirmo que las cantidades guardadas son intencionales.</label>}
            </div>
          )}
          <p className="text-sm text-slate-600">Al exportar, elige Descargas: se creará «{proyectoHdr.trim() || 'Proyecto'} - HDR». Si tu navegador no admite carpetas, se descargará un ZIP con esa carpeta.</p>
          <p className="text-sm text-slate-600">Muebles contabilizados: {totalMuebles.toLocaleString('es-CO')} · HDR: {modulos.length}. Los grupos físicos se muestran completos, con sus piezas compartidas contadas una sola vez.</p>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={exportarExcel} disabled={exportandoExcel || !modulos.some(m => m.ok)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50">{exportandoExcel ? 'Generando Excel…' : 'Exportar Excel'}</button>
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
                  pref={m.pref}
                  tableros={tableros}
                  titulo={tituloModuloHdr(m, prefijoHrj)}
                  cantidadInicial={m.cantidad}
                  proyectoInicial={proyectoHdr}
                  referenciaRepetida={(referencias.get(m.codigoModulo) ?? 0) > 1}
                  mostrarBotonExportar={false}
                />
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {m.codigoModulo}: {m.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <HdrConsumos cotizaciones={cotizaciones} />
      <HdrSeguimiento cotizaciones={cotizaciones} tipos={tipos} />

      <div className="border-t border-slate-200 pt-6">
        <h2 className="font-semibold text-slate-900 mb-3">Buscar/Crear</h2>
        <label className="mb-3 flex w-fit cursor-pointer items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-slate-700">
          <span>Prefijo HRJ</span>
          <input type="checkbox" role="switch" aria-label="Agregar prefijo HRJ al nombre del mueble buscado o creado" checked={prefijoHrjBuscar} onChange={e => setPrefijoHrjBuscar(e.target.checked)} className="peer sr-only" />
          <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-slate-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-emerald-600 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-700" />
          <span>Agregar HRJ al nombre del mueble</span>
        </label>
        <HdrBuscarGuardados tableros={tableros} prefijoHrj={prefijoHrjBuscar} />
        <form onSubmit={buscar} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-12 gap-2 items-end">
            <Campo label="Tipo De Mueble" className="col-span-12 sm:col-span-5">
              <Combobox value={tipoSelectorValue} options={tipoOptions} onChange={handleTipoChange} placeholder="Buscar tipo…" />
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

          {usaDoor && (
            <div className="grid grid-cols-2 gap-2">
              <Campo label={tipoSel?.pref === 'BBLFD' ? 'Door' : 'Puerta'}>
                <input type="text" required value={door} onChange={(e) => setDoor(e.target.value)} placeholder="22 7/8" className="inp" />
              </Campo>
              <Campo label="Apertura">
                <select value={doorHand} onChange={(e) => setDoorHand(e.target.value as 'L' | 'R')} className="inp">
                  <option value="L">L · Bisagras izquierda</option>
                  <option value="R">R · Bisagras derecha</option>
                </select>
              </Campo>
            </div>
          )}

          {esDB && (
            <Campo label={`Tipología ${tipoSel?.pref || 'DB'}`}>
              <select value={dbTipo} onChange={(e) => setDbTipo(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {tipologiasDbParaPrefijo(tipoSel?.pref).map((t) => <option key={t.key} value={t.key} title={t.desc}>{etiquetaTipologiaDb(t.key, tipoSel?.pref)}</option>)}
              </select>
            </Campo>
          )}

          {usaTipologiaDbSmFe && (
            <Campo label="Tipología DB-SM-FE">
              <select value={tipoSel?.pref ?? ''} onChange={(e) => aplicarDbSmFeTipo(e.target.value)} className="inp">
                {DB_SM_FE_TIPOLOGIAS.map((tipologia) => (
                  <option key={tipologia.pref} value={tipologia.pref}>{tipologia.pref} · {tipologia.desc}</option>
                ))}
              </select>
            </Campo>
          )}

          {usaTipologiaDbSmFeSf && (
            <Campo label="Tipología DB-SM-FE-SF">
              <select value={tipoSel?.pref ?? ''} onChange={(e) => aplicarDbSmFeTipo(e.target.value)} className="inp">
                {tipologiasDbSmFeSf.map((tipologia) => (
                  <option key={tipologia.pref} value={tipologia.pref}>{tipologia.pref} · {tipologia.nombre_es ?? 'Cajonera con Gola, Full Extension y sin fondo'}</option>
                ))}
              </select>
            </Campo>
          )}

          {!esDbTradicional && (
            <Campo label="Sistema de frente">
              <select value={sistemaFrente} disabled={usaFrentesDosPequenosGola(tipoSel?.pref)} title={usaFrentesDosPequenosGola(tipoSel?.pref) ? 'Esta tipología usa dos espacios de gola de 30 mm' : undefined} onChange={(e) => setSistemaFrente(e.target.value as SistemaFrente)} className="inp">
                {SISTEMAS_FRENTE.map((s) => <option key={s.key} value={s.key} title={s.desc}>{s.label}</option>)}
              </select>
            </Campo>
          )}

          {(esPanel(tipoSel?.pref) || tipoSel?.pref === 'F') && <Campo label={esPanel(tipoSel?.pref) ? 'Notas del panel' : 'Notas del filler'}><input value={notaPanel} onChange={e => setNotaPanel(e.target.value)} placeholder="Ej. lateral" className="inp" /></Campo>}
          <button disabled={loading} className="rounded-lg bg-slate-900 text-white px-5 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Crear</button>

          <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.5rem .6rem;font-size:.875rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}.inp::-webkit-outer-spin-button,.inp::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.inp[type=number]{-moz-appearance:textfield}`}</style>
        </form>

        {error && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {loading && <p className="mt-3 text-slate-400 text-sm">Calculando…</p>}

        {res && (
          <div className="mt-4">
            <HdrTabla key={`${codigo}-${JSON.stringify(res.piezas)}`} res={res} pref={tipoSel?.pref} tableros={tableros} proyectoInicial={proyectoHdr} titulo={tituloCreado} />
          </div>
        )}
      </div>

    </div>
  );
}
