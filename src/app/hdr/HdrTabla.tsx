'use client';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { CotizarResult } from '@/lib/cotizar';
import { exportarNodoAPdf, nombreArchivoPdf } from './pdfExport';
import { construirFilas, type FilaHDR } from './datosHdr';
export { descripcionModulo } from './datosHdr';

export type Tablero = { codigo: string; espesor_mm: number | null };
export type DatosHdrExcel = { titulo: string; cantidad: string; color: string; proyecto: string; filas: (FilaHDR & { color: string })[] };
export type HdrTablaHandle = { exportarPdf: () => Promise<void>; datosExcel: () => DatosHdrExcel };

const HdrTabla = forwardRef<HdrTablaHandle, { res: CotizarResult; tableros: Tablero[]; titulo: string; mostrarBotonExportar?: boolean; cantidadInicial?: number }>(
  function HdrTabla({ res, tableros, titulo, mostrarBotonExportar = true, cantidadInicial }, ref) {
  const [color, setColor] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [cantidad, setCantidad] = useState(cantidadInicial == null ? '' : String(cantidadInicial));
  const [colorPorLetra, setColorPorLetra] = useState<Record<string, string>>({});
  const [exportando, setExportando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const filas = useMemo(() => construirFilas(res, tableros), [res, tableros]);

  const exportarPdf = useCallback(async () => {
    if (!contenedorRef.current) return;
    setExportando(true);
    try {
      await exportarNodoAPdf(contenedorRef.current, nombreArchivoPdf(titulo));
    } finally {
      setExportando(false);
    }
  }, [titulo]);

  const datosExcel = useCallback((): DatosHdrExcel => ({ titulo, cantidad, color, proyecto, filas: filas.map(f => ({ ...f, color: colorPorLetra[f.letra] ?? '' })) }), [titulo, cantidad, color, proyecto, filas, colorPorLetra]);
  const exportarExcel = async () => { const { descargarExcelHdr } = await import('./excel'); await descargarExcelHdr([datosExcel()], titulo); };
  useImperativeHandle(ref, () => ({ exportarPdf, datosExcel }), [exportarPdf, datosExcel]);

  return (
    <div>
      {mostrarBotonExportar && (
        <div className="flex justify-end gap-2 mb-2">
          <button type="button" onClick={exportarExcel} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs">Exportar Excel</button>
          <button
            type="button"
            onClick={exportarPdf}
            disabled={exportando}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exportando ? 'Generando PDF…' : '⬇ Exportar PDF'}
          </button>
        </div>
      )}
      <div ref={contenedorRef} data-hdr-modulo={titulo} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-bold text-slate-900">{titulo}</div>
          <div className="mt-2 grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-slate-600">
            <label className="flex items-center gap-2">Color:
              <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Por definir" className="inp-sm" />
            </label>
            <label className="flex items-center gap-2">Proyecto:
              <input value={proyecto} onChange={(e) => setProyecto(e.target.value)} placeholder="Por definir" className="inp-sm" />
            </label>
            <label className="flex items-center gap-2">Cantidad:
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
                    value={colorPorLetra[f.letra] ?? ''}
                    onChange={(e) => setColorPorLetra((cs) => ({ ...cs, [f.letra]: e.target.value }))}
                    placeholder="Por definir"
                    className="inp-sm"
                  />
                </td>
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
