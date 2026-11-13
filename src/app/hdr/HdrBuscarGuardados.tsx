'use client';
import { useState } from 'react';
import Campo from '@/components/Campo';
import { buscarMueblesHdrAction, type MuebleEncontradoHdr } from './actions';
import { tituloModuloHdr } from './datosHdr';
import HdrTabla, { type Tablero } from './HdrTabla';

export default function HdrBuscarGuardados({ tableros, prefijoHrj = false }: { tableros: Tablero[]; prefijoHrj?: boolean }) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<MuebleEncontradoHdr[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<MuebleEncontradoHdr | null>(null);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim()) { setErrores(['Escribe el nombre completo o parcial del mueble.']); return; }
    setLoading(true); setErrores([]); setResultados(null); setSeleccionado(null);
    try { const r = await buscarMueblesHdrAction(texto); setResultados(r.muebles); setErrores(r.errores); }
    catch (e) { setErrores([e instanceof Error ? e.message : 'No se pudo buscar el mueble.']); }
    finally { setLoading(false); }
  }
  return <div className="space-y-3 mb-4">
    <form onSubmit={buscar} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
      <Campo label="Buscar mueble creado en cotizaciones"><input value={texto} maxLength={200} onChange={e => setTexto(e.target.value)} placeholder="Nombre parcial o completo, por ejemplo W96.27867-SM-PUSH" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></Campo>
      <button disabled={loading} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? 'Buscando…' : 'Buscar'}</button>
    </form>
    {errores.length > 0 && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{errores.map((error, i) => <p key={i}>{error}</p>)}</div>}
    {resultados && <div className="space-y-2"><p className="text-sm text-slate-600">{resultados.length ? `${resultados.length} coincidencias. Selecciona un mueble para ver su HDR.` : 'No se encontraron muebles con ese nombre.'}</p>
      <div className="max-h-80 overflow-y-auto space-y-2">{resultados.map(r => <button type="button" key={`${r.cotizacionId}-${r.modulo.lineaId}`} onClick={() => setSeleccionado(r)} className="block w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:bg-slate-50"><span className="font-semibold">{tituloModuloHdr(r.modulo, prefijoHrj)}</span><span className="block text-slate-500">{r.proyecto} · {r.modulo.cocinaNombre}</span></button>)}</div>
    </div>}
    {seleccionado && (seleccionado.modulo.ok ? <div className="space-y-2">
      {!!seleccionado.modulo.avisosValidacion?.length && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{seleccionado.modulo.avisosValidacion.map((a, i) => <p key={i}>{a}</p>)}<a className="underline" href={`/cotizaciones/${seleccionado.cotizacionId}`}>Abrir cotización para revisar</a></div>}
      <HdrTabla key={`${seleccionado.cotizacionId}-${seleccionado.modulo.lineaId}`} res={seleccionado.modulo.result} pref={seleccionado.modulo.pref} tableros={tableros} titulo={tituloModuloHdr(seleccionado.modulo, prefijoHrj)} proyectoInicial={seleccionado.proyecto} cantidadInicial={seleccionado.modulo.cantidad} mostrarBotonExportar={!seleccionado.modulo.avisosValidacion?.length && !seleccionado.modulo.aperturaPendiente} />
    </div> : <p role="alert" className="text-sm text-red-700">{seleccionado.modulo.error}</p>)}
  </div>;
}
