'use client';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { exportarNodoAPdf, nombreArchivoPdf } from './pdfExport';
import { construirFilas, normalizarColorHdr, type FilaHDR, type ResultadoHdr } from './datosHdr';
import { crearDestinoHdr, esCancelacionHdr, type GuardarArchivoHdr } from './destinoExportacion';
export { descripcionModulo } from './datosHdr';

export type Tablero = { codigo: string; espesor_mm: number | null };
export type DatosHdrExcel = { titulo: string; cantidad: string; color: string; proyecto: string; filas: (FilaHDR & { color: string })[] };
export type HdrTablaHandle = { exportarPdf: (guardar?: GuardarArchivoHdr) => Promise<void>; datosExcel: () => DatosHdrExcel };

const HdrTabla = forwardRef<HdrTablaHandle, { res: ResultadoHdr; pref?: string; tableros: Tablero[]; titulo: string; mostrarBotonExportar?: boolean; cantidadInicial?: number; proyectoInicial?: string; referenciaRepetida?: boolean }>(
  function HdrTabla({ res, pref, tableros, titulo, mostrarBotonExportar = true, cantidadInicial, proyectoInicial = '', referenciaRepetida }, ref) {
  const [color, setColor] = useState('Por definir');
  const [proyectoEditado, setProyecto] = useState<string>();
  const proyecto = proyectoEditado ?? proyectoInicial;
  const [cantidad, setCantidad] = useState(cantidadInicial == null ? '' : String(cantidadInicial));
  const [colorPorLetra, setColorPorLetra] = useState<Record<string, string>>({});
  const [exportando, setExportando] = useState(false);
  const [errorExportacion, setErrorExportacion] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const filas = useMemo(() => construirFilas(res, tableros, pref), [res, tableros, pref]);

  const exportarPdf = useCallback(async (guardar?: GuardarArchivoHdr) => {
    if (!contenedorRef.current) return;
    setExportando(true);
    try {
      const destino = guardar ? undefined : await crearDestinoHdr(proyecto);
      await exportarNodoAPdf(contenedorRef.current, nombreArchivoPdf(titulo), guardar ?? destino?.guardar);
      await destino?.finalizar();
    } finally {
      setExportando(false);
    }
  }, [titulo, proyecto]);

  const datosExcel = useCallback((): DatosHdrExcel => ({ titulo, cantidad, color: normalizarColorHdr(color), proyecto, filas: filas.map(f => ({ ...f, color: normalizarColorHdr(colorPorLetra[f.letra], color) })) }), [titulo, cantidad, color, proyecto, filas, colorPorLetra]);
  const informarError = (e: unknown) => { if (!esCancelacionHdr(e)) setErrorExportacion(e instanceof Error ? e.message : 'No se pudo completar la exportación.'); };
  const exportarExcel = async () => {
    setErrorExportacion(null);
    try { const destino = await crearDestinoHdr(proyecto); const { descargarExcelHdr } = await import('./excel'); await descargarExcelHdr([datosExcel()], proyecto || titulo, destino); }
    catch (e) { informarError(e); }
  };
  useImperativeHandle(ref, () => ({ exportarPdf, datosExcel }), [exportarPdf, datosExcel]);

  return (
    <div>
      {mostrarBotonExportar && (
        <div className="flex justify-end gap-2 mb-2">
          <button type="button" onClick={exportarExcel} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs">Exportar Excel</button>
          <button
            type="button"
            onClick={() => { setErrorExportacion(null); void exportarPdf().catch(informarError); }}
            disabled={exportando}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exportando ? 'Generando PDF…' : '⬇ Exportar PDF'}
          </button>
        </div>
      )}
      {errorExportacion && <p role="alert" className="mb-2 text-sm text-red-700">{errorExportacion}</p>}
      <div ref={contenedorRef} data-hdr-modulo={titulo} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-bold text-slate-900">{titulo}</div>
          {referenciaRepetida && <p className="mt-1 text-xs text-slate-600">Referencia con variantes de notas o fabricación. Materiales: {res.maderaPorRol.filter(m => m.cm2 > 0).map(m => `${m.rol}: ${m.codigo}`).join(' · ')}. Herrajes: {res.herrajes.filter(h => h.cant > 0).map(h => `${h.codigo ?? h.rol} × ${h.cant}`).join(' · ') || 'Sin herrajes'}.</p>}
          <div className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-slate-600">
            <label className="flex items-center gap-2">Color:
              <input aria-label="Color general" required value={color} onChange={(e) => setColor(e.target.value)} onBlur={() => setColor(normalizarColorHdr(color))} placeholder="Por definir" className="inp-sm" />
            </label>
            <label className="flex items-center gap-2">Proyecto:
              <input value={proyecto} onChange={(e) => setProyecto(e.target.value)} placeholder="Por definir" className="inp-sm" />
            </label>
            <label className="flex items-center gap-2">{(res.vars.modulos ?? 1) > 1 ? 'Cantidad de grupos:' : 'Cantidad:'}
              <input type="number" min={0} step={1} value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Por definir" className="inp-sm" />
            </label>
          </div>
        </div>
        <div className="relative h-12 w-[193px] shrink-0 overflow-hidden">
          <Image
            src="/Logo-Firplak-Positivo.png"
            alt="Firplak"
            fill
            sizes="193px"
            className="object-cover object-center"
            priority
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white text-left">
              <th className="py-2 px-2">Letra</th>
              <th className="px-2">Pieza</th>
              <th className="px-2 text-right">Largo</th>
              <th className="px-2 text-right">Ancho</th>
              <th className="px-2 text-right">Espesor</th>
              <th className="px-2 text-right">Canto largo<br />Color</th>
              <th className="px-2 text-right">Canto Ancho<br />Color</th>
              <th className="px-2 text-right">Canto largo<br />Blanco</th>
              <th className="px-2 text-right">Canto Ancho<br />Blanco</th>
              <th className="px-2 text-right">Espesor<br />canto</th>
              <th className="px-2">Color</th>
              {filas.some(f => f.origen) && <th className="px-2">Módulo / pieza compartida</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.letra} className={i % 2 === 1 ? 'bg-slate-100' : 'bg-white'}>
                <td className="py-1.5 px-2 font-semibold">{f.letra}</td>
                <td className="px-2">{f.pieza}</td>
                <td className="px-2 text-right">{f.largoMm.toLocaleString('es-CO', { maximumFractionDigits: 1 })}</td>
                <td className="px-2 text-right">{f.anchoMm.toLocaleString('es-CO', { maximumFractionDigits: 1 })}</td>
                <td className="px-2 text-right">{f.espesorMm ?? '—'}</td>
                <td className="px-2 text-right">{f.cantoLargoColor || 0}</td>
                <td className="px-2 text-right">{f.cantoAnchoColor || 0}</td>
                <td className="px-2 text-right">{f.cantoLargoBlanco || 0}</td>
                <td className="px-2 text-right">{f.cantoAnchoBlanco || 0}</td>
                <td className="px-2 text-right">{f.espesorCanto}</td>
                <td className="px-2">
                  <input
                    aria-label={`Color de ${f.letra} ${f.pieza}`}
                    required
                    value={colorPorLetra[f.letra] ?? normalizarColorHdr(color)}
                    onChange={(e) => setColorPorLetra((cs) => ({ ...cs, [f.letra]: e.target.value }))}
                    onBlur={() => setColorPorLetra(cs => {
                      const siguiente = { ...cs };
                      if (siguiente[f.letra]?.trim()) siguiente[f.letra] = siguiente[f.letra].trim();
                      else delete siguiente[f.letra];
                      return siguiente;
                    })}
                    placeholder="Por definir"
                    className="inp-sm"
                  />
                </td>
                {filas.some(f => f.origen) && <td className="px-2 text-xs">{f.origen}<div className="text-slate-500">{f.tableroCodigo}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`.inp-sm{border:1px solid #cbd5e1;border-radius:.375rem;padding:.2rem .4rem;font-size:.8125rem;min-width:7rem}.inp-sm:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
      </div>
    </div>
  );
});

export default HdrTabla;
