'use client';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { CotizarResult } from '@/lib/cotizar';
import { exportarNodoAPdf, nombreArchivoPdf } from './pdfExport';
import { orientarPieza } from '@/lib/muebles';

export type Tablero = { codigo: string; espesor_mm: number | null };
export type HdrTablaHandle = { exportarPdf: () => Promise<void> };

// Letra material por rol de tablero — confirmado contra la hoja de ruta real de B12
// (BASE B, RAIL … P, DOOR … C, BACKING F): caja=Balance, refuerzo=Polar, frente=Color, fondo=Fondo/shaker.
const SUFIJO_ROL: Record<string, string> = { caja: 'B', refuerzo: 'P', frente: 'C', fondo: 'F' };

// Traducción del nombre interno de la pieza al nombre de producción. No se pudieron
// reproducir los sufijos de código de riel/bisagra de la hoja real (ej. "R17L762"):
// no hay dato en la app para derivarlos, así que se omiten.
const NOMBRE_PRODUCCION: [RegExp, string][] = [
  [/^lateral$/, 'SIDE'],
  [/^base$/, 'BASE'],
  [/trasero_gaveta/, 'TRASERO CAJON'],
  [/refuerzo_trasero/, 'RAIL TRASERO'],
  [/refuerzo_(delantero|horizontal)/, 'RAIL DELANTERO'],
  [/entrepano/, 'SHELF'],
  [/base_gaveta/, 'PIEZA CAJON'],
  // Caja de gaveta en madera (tipos con riel full extension, ej. B-FE).
  [/lateral_gaveta_der/, 'LAT DER GAV'],
  [/lateral_gaveta_izq/, 'LAT IZQ GAV'],
  [/^contraparche$/, 'CONTRAPARCHE'],
  [/^fondo_gaveta$/, 'FONDO GAV'],
  [/frente_gaveta/, 'FRENTE GAVETA'],
  [/frente_cajon/, 'FRENTE GAVETA'],
  [/gola_perfil/, 'GOLA'],
  [/^fondo$/, 'BACKING'],
];

function nombreProduccion(nombre: string, tienePuertas: boolean): string {
  if (nombre === 'frente') return tienePuertas ? 'DOOR' : 'FRENTE';
  for (const [re, label] of NOMBRE_PRODUCCION) if (re.test(nombre)) return label;
  return nombre.toUpperCase().replace(/_/g, ' ');
}

// Color vs Blanco de canto: no está guardado por pieza en cot_piezas_plantilla (solo
// hay un calibre). Regla deducida cruzando la hoja de ruta real de B12: las piezas
// visibles desde afuera van en Color, las ocultas dentro de la carcasa van en Blanco.
// Es una inferencia por nombre, no un dato confirmado pieza por pieza en todo el catálogo.
function esVisible(nombre: string): boolean {
  return !/trasero|entrepano|base_gaveta|lateral_gaveta|contraparche/.test(nombre);
}

function espesorCantoLabel(calibre: string | null): string {
  if (!calibre) return '';
  // Insensible a mayúsculas: el calibre puede llegar como `19x0,45` o `19X0,45`
  // según venga de la plantilla de la pieza o del override del formulario. Con el
  // split sensible a `x` minúscula, la columna salía vacía en el segundo caso.
  return calibre.split(/x/i)[1] ?? '';
}

type FilaHDR = {
  letra: string;
  pieza: string;
  largoMm: number;
  anchoMm: number;
  espesorMm: number | null;
  cantoLargoColor: number;
  cantoAnchoColor: number;
  cantoLargoBlanco: number;
  cantoAnchoBlanco: number;
  espesorCanto: string;
};

function construirFilas(res: CotizarResult, tableros: Tablero[]): FilaHDR[] {
  const rolToEspesor: Record<string, number | null> = {};
  for (const m of res.maderaPorRol) {
    rolToEspesor[m.rol] = tableros.find((t) => t.codigo === m.codigo)?.espesor_mm ?? null;
  }
  const tienePuertas = (res.vars.n_puertas ?? 0) > 0;

  const filas: FilaHDR[] = [];
  let letraIdx = 0;
  const siguienteLetra = () => {
    const l = String.fromCharCode(65 + (letraIdx % 26));
    letraIdx++;
    return l;
  };

  for (const p of res.piezas.filter((p) => p.cant > 0)) {
    const nombreBase = nombreProduccion(p.pieza, tienePuertas);
    const sufijo = SUFIJO_ROL[p.rol] ?? '';
    const visible = esVisible(p.pieza);
    const espesorCanto = espesorCantoLabel(p.cantoCalibre);
    const n = Math.round(p.cant);
    for (let i = 0; i < n; i++) {
      const esLateralPar = p.pieza === 'lateral' && n === 2;
      const esBaseTapa = p.pieza === 'base_tapa' && n === 2;
      const esPuertaPar = p.pieza === 'frente' && tienePuertas && n === 2;
      const esEntrepanoPar = p.pieza === 'entrepano' && n > 1;
      const nombre = esLateralPar
        ? `SIDE ${i === 0 ? 'R' : 'L'}`
        : esBaseTapa
        ? (i === 0 ? 'BASE' : 'TAPA')
        : esPuertaPar
        ? `DOOR ${i === 0 ? 'R' : 'L'}`
        : esEntrepanoPar
        ? `SHELF ${i + 1}`
        : nombreBase;
      // Orientación de presentación compartida con el despiece del Simulador.
      const orientada = orientarPieza(p);
      filas.push({
        letra: siguienteLetra(),
        pieza: sufijo ? `${nombre} ${sufijo}` : nombre,
        largoMm: orientada.largoIn * 25.4,
        anchoMm: orientada.anchoIn * 25.4,
        espesorMm: rolToEspesor[p.rol] ?? null,
        cantoLargoColor: visible ? p.cantoLargos : 0,
        cantoAnchoColor: visible ? p.cantoAnchos : 0,
        cantoLargoBlanco: visible ? 0 : p.cantoLargos,
        cantoAnchoBlanco: visible ? 0 : p.cantoAnchos,
        espesorCanto,
      });
    }
  }
  return filas;
}

export function descripcionModulo(res: CotizarResult): string {
  const partes: string[] = [];
  const n = (k: string) => Math.round(res.vars[k] ?? 0);
  if (n('n_cajones') > 0) partes.push(`${n('n_cajones')} GAVETA${n('n_cajones') > 1 ? 'S' : ''}`);
  if (n('n_puertas') > 0) partes.push(`${n('n_puertas')} PUERTA${n('n_puertas') > 1 ? 'S' : ''}`);
  if (n('n_entrepanos') > 0) partes.push(`${n('n_entrepanos')} ENTREPAÑO${n('n_entrepanos') > 1 ? 'S' : ''}`);
  return partes.join(' ');
}

const HdrTabla = forwardRef<HdrTablaHandle, { res: CotizarResult; tableros: Tablero[]; titulo: string; mostrarBotonExportar?: boolean }>(
  function HdrTabla({ res, tableros, titulo, mostrarBotonExportar = true }, ref) {
  const [color, setColor] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [cantidad, setCantidad] = useState('');
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

  useImperativeHandle(ref, () => ({ exportarPdf }), [exportarPdf]);

  return (
    <div>
      {mostrarBotonExportar && (
        <div className="flex justify-end mb-2">
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
      <div ref={contenedorRef} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
              <input value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="Por definir" className="inp-sm" />
            </label>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Image
            src="/firplak-logo.png"
            alt="Firplak - Inspirando Hogares"
            width={960}
            height={239}
            className="h-12 w-auto object-contain"
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

      <p className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100">
        Canto Color/Blanco: inferido por pieza (visible → Color, oculta → Blanco), no es un dato guardado en el catálogo — ver notas del código de riel/bisagra omitidas en el nombre de pieza.
      </p>

      <style>{`.inp-sm{border:1px solid #cbd5e1;border-radius:.375rem;padding:.2rem .4rem;font-size:.8125rem;min-width:7rem}.inp-sm:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
      </div>
    </div>
  );
});

export default HdrTabla;
