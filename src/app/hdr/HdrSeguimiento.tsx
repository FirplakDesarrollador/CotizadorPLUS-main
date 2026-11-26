'use client';

import { useRef, useState } from 'react';
import Combobox from '@/components/Combobox';
import Campo from '@/components/Campo';
import { abrirSeguimientoAction, guardarSeguimientoAction, listarSeguimientosAction } from './seguimientoActions';
import {
  ACTIVIDADES_SEGUIMIENTO, BLOQUES_SEGUIMIENTO, GRUPOS_SEGUIMIENTO, MAX_RESPONSABLE_SEGUIMIENTO,
  porcentajeSeguimiento, type DetalleSeguimiento, type ResumenSeguimiento,
} from './seguimiento';

type Cotizacion = { id: string; codigo: string | null; nombre: string | null };
type ListaSeguimientos = Awaited<ReturnType<typeof listarSeguimientosAction>>;

const botonSecundario = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50';
const etiquetaProyecto = (codigo: string | null, nombre: string) => [codigo, nombre].filter(Boolean).join(' · ');
const formatoPorcentaje = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 2 });
const avanceVisible = (porcentaje: number) => formatoPorcentaje.format(porcentaje / 100);

function MatrizSeguimiento({ detalle, onMarcar }: { detalle: DetalleSeguimiento; onMarcar: (fila: number, actividad: number, checked: boolean) => void }) {
  const filas = detalle.entradas.map((entrada, indice) => ({ ...entrada, indice }));
  return <div role="region" aria-label="Matriz de actividades por mueble" tabIndex={0} className="max-h-[65vh] overflow-auto rounded-lg border border-slate-200 focus-visible:outline-2 focus-visible:outline-slate-600">
    <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
      <thead className="sticky top-0 z-20 text-slate-800">
        <tr className="bg-slate-200">
          <th rowSpan={2} scope="col" className="sticky left-0 z-10 w-[min(17rem,38vw)] min-w-[min(17rem,38vw)] border-b border-r border-slate-300 bg-slate-200 px-3 text-left">Mueble</th>
          <th scope="colgroup" colSpan={BLOQUES_SEGUIMIENTO[1].fin} className="border-b border-r border-slate-300 px-2 py-2">Diseño</th>
          <th scope="colgroup" colSpan={BLOQUES_SEGUIMIENTO[2].fin - BLOQUES_SEGUIMIENTO[2].inicio} className="border-b border-r border-slate-300 px-2 py-2">Empaque</th>
          <th scope="colgroup" className="border-b border-r border-slate-300 px-2 py-2">Entrega</th>
          <th rowSpan={2} scope="col" className="border-b border-slate-300 px-3">Avance</th>
        </tr>
        <tr className="bg-slate-100 text-xs">
          {ACTIVIDADES_SEGUIMIENTO.map(actividad => <th key={actividad} scope="col" className="w-28 min-w-28 border-b border-r border-slate-200 px-2 py-3">{actividad}</th>)}
        </tr>
      </thead>
      {GRUPOS_SEGUIMIENTO.map(grupo => {
        const muebles = filas.filter(fila => fila.grupo === grupo);
        if (!muebles.length) return null;
        return <tbody key={grupo}>
          <tr className="bg-slate-100">
            <th scope="rowgroup" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-800">{grupo}</th>
            <td colSpan={ACTIVIDADES_SEGUIMIENTO.length + 1} className="border-b border-slate-200" />
          </tr>
          {muebles.map(({ nombre, indice }) => {
            const marcas = detalle.marcas[indice];
            return <tr key={nombre} className="bg-white hover:bg-slate-50">
              <th scope="row" className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium break-words">{nombre}</th>
              {ACTIVIDADES_SEGUIMIENTO.map((actividad, columna) => <td key={actividad} className="border-b border-r border-slate-200 p-0 text-center">
                <label className="flex min-h-10 w-full cursor-pointer items-center justify-center">
                  <input aria-label={`${actividad} · ${nombre}`} type="checkbox" checked={marcas.includes(columna)} onChange={e => onMarcar(indice, columna, e.target.checked)} className="size-4 accent-emerald-700" />
                </label>
              </td>)}
              <td className="border-b border-slate-200 px-3 text-center tabular-nums">{avanceVisible(porcentajeSeguimiento(marcas.length, ACTIVIDADES_SEGUIMIENTO.length))}</td>
            </tr>;
          })}
        </tbody>;
      })}
    </table>
  </div>;
}

export default function HdrSeguimiento({ cotizaciones, inicial }: { cotizaciones: Cotizacion[]; inicial: ListaSeguimientos }) {
  const [lista, setLista] = useState(inicial);
  const [detalle, setDetalle] = useState<DetalleSeguimiento | null>(null);
  const [pendiente, setPendiente] = useState(false);
  const [operacion, setOperacion] = useState<'abrir' | 'guardar' | 'descargar' | 'listar' | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const peticion = useRef(0);
  const ocupado = operacion !== null && operacion !== 'abrir';

  async function abrir(id: string) {
    if (ocupado || (pendiente && !window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos?'))) return;
    const actual = ++peticion.current;
    setOperacion('abrir');
    setError('');
    setMensaje('');
    try {
      const resultado = await abrirSeguimientoAction(id);
      if (actual !== peticion.current) return;
      if (!resultado.ok) { setError(resultado.error); return; }
      setDetalle(resultado.valor);
      setPendiente(false);
      if (resultado.valor.revision > 0) actualizarLista(resultado.valor);
    } catch {
      if (actual === peticion.current) setError('No se pudo abrir el seguimiento. Inténtalo de nuevo.');
    } finally {
      if (actual === peticion.current) setOperacion(null);
    }
  }

  function actualizarLista({ cotizacion_id, codigo, proyecto, revision, completadas, total }: ResumenSeguimiento, reciente = false) {
    const resumen = { cotizacion_id, codigo, proyecto, revision, completadas, total };
    setLista(actual => {
      if (!actual.ok) return actual;
      const existe = actual.valor.some(s => s.cotizacion_id === cotizacion_id);
      const valor = reciente || !existe
        ? [resumen, ...actual.valor.filter(s => s.cotizacion_id !== cotizacion_id)]
        : actual.valor.map(s => s.cotizacion_id === cotizacion_id ? resumen : s);
      return { ok: true, valor };
    });
  }

  async function recargarLista() {
    setOperacion('listar');
    try {
      setLista(await listarSeguimientosAction());
    } catch {
      setLista({ ok: false, error: 'No se pudieron consultar los seguimientos guardados.' });
    } finally {
      setOperacion(null);
    }
  }

  function marcar(fila: number, actividad: number, checked: boolean) {
    setDetalle(actual => {
      if (!actual || actual.marcas[fila].includes(actividad) === checked) return actual;
      const marcas = [...actual.marcas];
      marcas[fila] = checked ? [...marcas[fila], actividad] : marcas[fila].filter(a => a !== actividad);
      return { ...actual, marcas, completadas: actual.completadas + (checked ? 1 : -1) };
    });
    setPendiente(true);
    setMensaje('');
  }

  async function guardar() {
    if (!detalle?.entradas.length || operacion) return;
    setOperacion('guardar');
    setError('');
    setMensaje('');
    try {
      const resultado = await guardarSeguimientoAction(detalle);
      if (!resultado.ok) { setError(resultado.error); return; }
      setDetalle(resultado.valor);
      setPendiente(false);
      if (lista.ok) actualizarLista(resultado.valor, true);
      else {
        try { setLista(await listarSeguimientosAction()); } catch { /* La lista se puede volver a consultar. */ }
      }
      setMensaje('Seguimiento guardado.');
    } catch {
      setError('No se pudo guardar el seguimiento. Inténtalo de nuevo.');
    } finally {
      setOperacion(null);
    }
  }

  async function descargar() {
    if (!detalle?.entradas.length || operacion) return;
    setOperacion('descargar');
    setError('');
    try {
      const { descargarSeguimiento } = await import('./seguimientoExcel');
      await descargarSeguimiento(detalle.entradas, detalle.proyecto);
    } catch {
      setError('No se pudo descargar el Excel.');
    } finally {
      setOperacion(null);
    }
  }

  const avance = detalle ? porcentajeSeguimiento(detalle.completadas, detalle.total) : 0;

  return <section className="space-y-4 border-t border-slate-200 pt-6">
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold text-slate-900">Seguimientos guardados</h2>
      {!lista.ok ? <div className="flex flex-wrap items-center gap-3">
        <p role="alert" className="text-sm text-red-700">{lista.error}</p>
        <button type="button" className={botonSecundario} disabled={!!operacion} onClick={recargarLista}>Reintentar</button>
      </div> : lista.valor.length ? <ul className="grid max-h-56 gap-2 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
        {lista.valor.map(guardado => {
          const seleccionado = detalle?.cotizacion_id === guardado.cotizacion_id && detalle.revision > 0;
          return <li key={guardado.cotizacion_id}>
            <button type="button" aria-pressed={seleccionado} disabled={ocupado} onClick={() => abrir(guardado.cotizacion_id)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm disabled:opacity-50 ${seleccionado ? 'border-slate-700 bg-slate-100' : 'border-slate-200 hover:bg-slate-50'}`}>
              <span>{etiquetaProyecto(guardado.codigo, guardado.proyecto)}</span>
              <span className="font-semibold tabular-nums">{avanceVisible(porcentajeSeguimiento(guardado.completadas, guardado.total))}</span>
            </button>
          </li>;
        })}
      </ul> : <p className="text-sm text-slate-600">Aún no hay seguimientos guardados.</p>}
      <Campo label="Cotización para seguimiento" className="max-w-xl">
        <Combobox value={detalle?.cotizacion_id ?? ''} options={cotizaciones.map(c => ({ value: c.id, label: etiquetaProyecto(c.codigo, c.nombre || 'Proyecto sin nombre') }))}
          onChange={abrir} disabled={ocupado} placeholder="Selecciona una cotización guardada…" />
      </Campo>
    </div>

    {operacion === 'abrir' && <p role="status" className="text-sm text-slate-600">Cargando seguimiento…</p>}
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    {detalle && <fieldset disabled={!!operacion} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{etiquetaProyecto(detalle.codigo, detalle.proyecto)}</h2>
          <p className="text-sm text-slate-600">{detalle.entradas.length} {detalle.entradas.length === 1 ? 'mueble' : 'muebles'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={botonSecundario} disabled={!detalle.entradas.length} onClick={descargar}>{operacion === 'descargar' ? 'Preparando Excel…' : 'Descargar plantilla Excel'}</button>
          <button type="button" disabled={!detalle.entradas.length || (detalle.revision > 0 && !pendiente)} onClick={guardar}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{operacion === 'guardar' ? 'Guardando…' : 'Guardar seguimiento'}</button>
        </div>
      </div>
      {detalle.entradas.length ? <>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm text-slate-700">
            <span>Avance general</span>
            <span className="font-semibold tabular-nums">{avanceVisible(avance)} · {detalle.completadas} de {detalle.total} actividades</span>
          </div>
          <progress aria-label="Avance general" value={avance} max={100} className="block h-2 w-full overflow-hidden rounded-full accent-emerald-700" />
        </div>
        <section aria-label="Responsables" className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">Responsables</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {BLOQUES_SEGUIMIENTO.map((bloque, indice) => <Campo key={bloque.inicio} label={bloque.fase}>
              <span className="mb-1 block text-xs text-slate-600">{ACTIVIDADES_SEGUIMIENTO[bloque.inicio]}{bloque.fin - bloque.inicio > 1 && ` a ${ACTIVIDADES_SEGUIMIENTO[bloque.fin - 1]}`}</span>
              <input className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" value={detalle.responsables[indice]} maxLength={MAX_RESPONSABLE_SEGUIMIENTO}
                onChange={e => {
                  const valor = e.target.value;
                  setDetalle(actual => actual && { ...actual, responsables: actual.responsables.map((r, i) => i === indice ? valor : r) });
                  setPendiente(true);
                  setMensaje('');
                }} />
            </Campo>)}
          </div>
        </section>
        <div className="flex flex-wrap justify-between gap-1 text-xs text-slate-600">
          <p>Desplaza la tabla horizontalmente para ver todas las actividades.</p>
          <p role="status">{mensaje || (pendiente ? 'Cambios sin guardar.' : '')}</p>
        </div>
        <MatrizSeguimiento detalle={detalle} onMarcar={marcar} />
      </> : <p className="text-sm text-slate-600">Esta cotización no tiene muebles para el seguimiento.</p>}
    </fieldset>}
  </section>;
}
