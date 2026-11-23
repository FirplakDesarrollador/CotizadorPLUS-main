'use client';
import { useMemo, useState } from 'react';
import Campo from '@/components/Campo';
import Combobox from '@/components/Combobox';
import type { CotizacionHeader } from '@/lib/cotizaciones';
import { modulosDeCotizacionAction, type ModuloHDR } from './actions';
import { consolidarModulosHdr } from './datosHdr';
import { calcularConsumos, fmtM2, fmtMl, fmtUnidad, normalizarDesperdicio, parseCantidad } from './consumos';

/**
 * Sección Consumos de la página HDR.
 *
 * Tiene SU PROPIO selector de cotización, independiente del de «Generar desde una
 * cotización guardada» de arriba: elegir una aquí no mueve las HDR de arriba ni al
 * revés. Sobre esos muebles busca por código/descripción/área y muestra el consumo
 * discriminado por rol y código de tablero (m²), por calibre de canto (m lineal) y
 * por consumible, con el conteo de muebles y piezas.
 *
 * Las filas replican la tabla «Materiales» del Simulador (mismo orden, mismo
 * desglose), de modo que ambos se puedan comparar directamente.
 *
 * No suma la cotización completa: cada fila es un mueble individual, tal como se
 * pidió, para poder revisar el consumo mueble por mueble.
 */
export default function HdrConsumos({ cotizaciones }: { cotizaciones: CotizacionHeader[] }) {
  const [cotizacionId, setCotizacionId] = useState('');
  const [modulos, setModulos] = useState<ModuloHDR[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [texto, setTexto] = useState('');
  const [desperdicio, setDesperdicio] = useState('0');
  /** Cantidad editada por fila (`lineaId` → texto del input). Sin entrada = 1. */
  const [cantidades, setCantidades] = useState<Record<string, string>>({});

  const cotizacionOptions = useMemo(
    () => cotizaciones.map((c) => ({
      value: c.id,
      label: `${c.codigo ?? '—'} · ${c.nombre ?? 'sin nombre'}${c.cliente_nombre ? ` (${c.cliente_nombre})` : ''}`,
    })),
    [cotizaciones],
  );

  const pct = useMemo(() => {
    const n = Number(desperdicio.replace(',', '.'));
    return normalizarDesperdicio(Number.isFinite(n) ? n : 0);
  }, [desperdicio]);

  const cantidadesResueltas = useMemo(
    () => Object.fromEntries(Object.entries(cantidades).map(([clave, v]) => [clave, parseCantidad(v)])),
    [cantidades],
  );

  const { filas, conError } = useMemo(
    () => calcularConsumos(modulos ?? [], pct, texto, cantidadesResueltas),
    [modulos, pct, texto, cantidadesResueltas],
  );
  const unidades = useMemo(() => filas.reduce((s, f) => s + f.cantidad, 0), [filas]);

  async function exportarExcel() {
    setError(null);
    setExportando(true);
    try {
      if (conError > 0) throw new Error('Corrige los muebles con error antes de exportar el listado de consumos.');
      const { descargarExcelConsumos } = await import('./consumosExcel');
      await descargarExcelConsumos(filas, { proyecto: cotizaciones.find(c => c.id === cotizacionId)?.nombre ?? 'muebles', desperdicioPct: pct, filtro: texto });
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo exportar el listado de consumos.'); }
    finally { setExportando(false); }
  }

  async function handleCotizacionChange(id: string) {
    setCotizacionId(id);
    setModulos(null);
    setError(null);
    if (!id) return;
    setLoading(true);
    try {
      const r = await modulosDeCotizacionAction(id);
      setModulos(consolidarModulosHdr(r));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los módulos de la cotización.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-t border-slate-200 pt-6">
      <h2 className="font-semibold text-slate-900 mb-3">Consumos</h2>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <Campo label="Cotización" className="sm:col-span-6">
            <Combobox
              value={cotizacionId}
              options={cotizacionOptions}
              onChange={handleCotizacionChange}
              placeholder="Buscar cotización por código, nombre o cliente…"
              allowEmpty
              emptyLabel="— Quitar cotización —"
            />
          </Campo>
          <Campo label="Buscar mueble" className="sm:col-span-4">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Código, descripción o área…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Campo>
          <Campo
            label="Desperdicio tableros (%)"
            className="sm:col-span-2"
            info={{
              fn: 'Desperdicio aproximado que se aplica SOLO al tablero (m²) de los muebles que coincidan con la búsqueda. Arranca en 0 (medida neta).',
              tip: 'Se calcula sobre la medida neta del despiece, así que reemplaza la merma del proyecto: escribe 15 para ver exactamente los mismos m² que la tabla Materiales del Simulador. El canto y los consumibles no lo reciben.',
            }}
          >
            <input
              type="number"
              min={0}
              max={100}
              step="any"
              value={desperdicio}
              onChange={(e) => setDesperdicio(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Campo>
        </div>

        <p className="text-xs text-slate-500">
          Tablero en m² <b>por rol y código</b> (las mismas filas que la tabla Materiales del Simulador) con el{' '}
          {pct.toLocaleString('es-CO', { maximumFractionDigits: 1 })}% de desperdicio aplicado sobre el neto · Canto en
          metro lineal <b>por calibre</b> (ya incluye 5 cm por arista) · <b>Consumibles</b> en unidades (tarugos,
          soportes, cartón, etiquetas) · Cantidad editable por mueble, arranca en <b>1</b> · Piezas físicas de esa
          cantidad.
        </p>

        {loading && <p className="text-slate-400 text-sm">Cargando módulos…</p>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {!loading && modulos === null && !error && (
          <p className="text-sm text-slate-500 py-3">
            Elige una cotización para buscar sus muebles y ver el consumo por rol, calibre y consumible.
          </p>
        )}

        {!loading && modulos !== null && modulos.length === 0 && (
          <p className="text-sm text-slate-500 py-3">Esta cotización no tiene muebles.</p>
        )}

        {!loading && modulos !== null && modulos.length > 0 && filas.length === 0 && (
          <p className="text-sm text-slate-500 py-3">
            {texto.trim()
              ? <>Sin muebles que coincidan con «<span className="text-slate-700">{texto.trim()}</span>».</>
              : 'Sin muebles para consumir en esta cotización.'}
          </p>
        )}

        {conError > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {conError} mueble{conError > 1 ? 's' : ''} con error de despiece no {conError > 1 ? 'están incluidos' : 'está incluido'} en el consumo.
          </div>
        )}

        {filas.length > 0 && (
          <>
            <div className="flex justify-end">
              <button type="button" onClick={exportarExcel} disabled={exportando || loading || conError > 0} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50">{exportando ? 'Generando Excel…' : 'Exportar consumos a Excel'}</button>
            </div>
            <p className="text-sm font-medium text-slate-700">
              {filas.length} mueble{filas.length > 1 ? 's' : ''} · {unidades.toLocaleString('es-CO')} unidad
              {unidades === 1 ? '' : 'es'}
              {texto.trim() ? ' en la búsqueda' : ''} · {filas.reduce((s, f) => s + f.piezas, 0).toLocaleString('es-CO')} piezas
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white text-left">
                    <th className="py-2 px-2">Mueble</th>
                    <th className="px-2 text-right" title="Editable. Por defecto 1; la cantidad de la cotización no se usa.">Cantidad</th>
                    <th className="px-2 text-right">Piezas</th>
                    <th className="px-2">Tableros por rol y código (m²)</th>
                    <th className="px-2">Cantos por calibre (m)</th>
                    <th className="px-2">Consumibles</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f, i) => (
                    <tr key={`${f.clave}-${i}`} className={i % 2 === 1 ? 'bg-slate-100' : 'bg-white'}>
                      <td className="py-1.5 px-2 align-top">
                        <span className="font-medium text-slate-900">{f.codigo}</span>
                        {f.descripcion && <span className="text-slate-700"> {f.descripcion}</span>}
                        {f.area && f.area !== '—' && <div className="text-xs text-slate-500">{f.area}</div>}
                      </td>
                      <td className="px-2 text-right align-top">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          aria-label={`Cantidad de ${f.titulo}`}
                          title={`En la cotización: ${f.cantidadCotizacion} · aquí arranca en 1 y se edita para este consumo`}
                          value={cantidades[f.clave] ?? '1'}
                          onChange={(e) => setCantidades((c) => ({ ...c, [f.clave]: e.target.value }))}
                          onBlur={(e) => setCantidades((c) => ({ ...c, [f.clave]: String(parseCantidad(e.target.value)) }))}
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                        />
                      </td>
                      <td className="px-2 text-right align-top">{f.piezas.toLocaleString('es-CO')}</td>
                      <td className="px-2 align-top">
                        {f.materiales.length === 0 && <span className="text-slate-400">—</span>}
                        {f.materiales.map((m) => (
                          <div
                            key={`${m.rol}-${m.codigo}`}
                            className="whitespace-nowrap"
                            title={`${m.rol} · ${m.codigo}: ${fmtM2(m.m2Neto)} m² netos + ${pct.toLocaleString('es-CO', { maximumFractionDigits: 1 })}% de desperdicio`}
                          >
                            <span className="capitalize text-slate-500">{m.rol}</span>{' '}
                            <span className="text-slate-600">{m.codigo}</span>{' '}
                            <span className="font-medium text-slate-900">{fmtM2(m.m2Tableros)}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-2 align-top">
                        {f.cantos.length === 0 && <span className="text-slate-400">—</span>}
                        {f.cantos.map((c) => (
                          <div key={c.calibre} className="whitespace-nowrap" title={`${c.calibre}: incluye 5 cm de desperdicio por arista`}>
                            <span className="text-slate-600">{c.calibre}</span>{' '}
                            <span className="font-medium text-slate-900">{fmtMl(c.metros)}</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-2 align-top">
                        {f.consumibles.length === 0 && <span className="text-slate-400">—</span>}
                        {f.consumibles.map((c) => (
                          <div key={c.clave} className="whitespace-nowrap" title={`${c.nombre}: conteo del mueble, sin merma`}>
                            <span className="text-slate-600">{c.nombre}</span>{' '}
                            <span className="font-medium text-slate-900">{fmtUnidad(c.valor)}</span>
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
