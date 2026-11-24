'use client';

import { useEffect, useState, useTransition } from 'react';
import { calcularMeson, medidasMesonDesdeMuebles, mueblesDelTipo, parametrosParaMeson, TIPOS_MESON, type TipoMeson, type MesonGuardado, type ConfiguracionMeson, type IslaMeson } from '@/lib/mesones';
import { agregarMesonAction, catalogoMesonesAction } from '../actions';

const input = 'mt-1 w-full rounded border border-slate-300 px-2 py-1.5';
const islaInicial: IslaMeson = { largo: 0, voladizoFrontal: 0, voladizoLateral: 0, cantosPulidos: 0, waterfalls: 0, mueblesIds: [] };
type Datos = Extract<Awaited<ReturnType<typeof catalogoMesonesAction>>, { catalogo: unknown }>;

function Medida({ label, value, change, min = 0, max, entero = false }: {
  label: string; value: number; change: (value: number) => void; min?: number; max?: number; entero?: boolean;
}) {
  return <label className="text-xs">{label}
    <input required type="number" step={entero ? 1 : 'any'} min={min} max={max} value={min > 0 && value === 0 ? '' : value}
      className={input} onChange={e => change(Number(e.target.value))} />
  </label>;
}

type Props = {
  cocinaId: string; veces: number; trm: number; onDone: () => void;
  editar?: { id: string; meson: MesonGuardado };
};

export default function AgregarMesonForm({ cocinaId, veces, trm, onDone, editar }: Props) {
  const [tipo, setTipo] = useState<TipoMeson | ''>(editar?.meson.medidas.opciones?.tipo ?? (editar ? 'cocina' : ''));
  const [guardando, setGuardando] = useState(false);
  const [datos, setDatos] = useState<Datos>();
  const [error, setError] = useState('');
  useEffect(() => {
    let vigente = true;
    catalogoMesonesAction(cocinaId).then(r => {
      if (!vigente) return;
      if (r.catalogo) setDatos(r);
      else setError(r.error);
    }).catch(() => { if (vigente) setError('No se pudo cargar el catálogo.'); });
    return () => { vigente = false; };
  }, [cocinaId]);

  return <section className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold">{editar ? 'Editar mesón' : 'Agregar mesón'}</h3>
      <button type="button" className="text-sm text-slate-600" disabled={guardando} onClick={onDone}>Cerrar</button>
    </div>
    <label className="mb-4 block max-w-xs text-sm">Tipo de mesón
      <select className={input} value={tipo} disabled={guardando} onChange={e => setTipo(e.target.value as TipoMeson | '')}>
        <option value="" disabled>Selecciona un tipo</option>
        {Object.entries(TIPOS_MESON).map(([id, etiqueta]) => <option key={id} value={id}>{etiqueta}</option>)}
      </select>
    </label>
    {tipo && (datos ? <MesonCampos key={tipo} {...{ cocinaId, veces, trm, onDone, datos, tipo, editar, setGuardando }} />
      : <p role="status" className="text-sm">{error || 'Cargando catálogo y medidas…'}</p>)}
  </section>;
}

function MesonCampos({ cocinaId, veces, trm, onDone, tipo, editar, setGuardando, datos: { catalogo, muebles: mueblesArea, descuento } }: Props & {
  datos: Datos; tipo: TipoMeson; setGuardando: (valor: boolean) => void;
}) {
  const p = parametrosParaMeson(catalogo, tipo);
  const anterior = editar?.meson.medidas.opciones;
  const conservar = anterior && (anterior.tipo ?? 'cocina') === tipo;
  const tipoGuardado = conservar ? anterior.tipo : tipo;
  const muebles = mueblesDelTipo(mueblesArea, tipoGuardado);
  const [materialId, setMaterialId] = useState(editar?.meson.material.id ?? '');
  const [error, setError] = useState('');
  const [pendiente, iniciar] = useTransition();
  const [opciones, setOpciones] = useState<ConfiguracionMeson>(() => conservar ? {
    ...anterior,
    perforacionesEn: anterior.perforacionesEn ?? 'fabricacion',
    refuerzo: anterior.refuerzo ?? anterior.espesor === (editar?.meson.parametros ?? p).espesorReforzado,
  } : {
    tipo, perforacionesEn: 'fabricacion', refuerzo: false,
    profundidad: p.profundidad, backsplash: p.backsplash, espesor: p.espesor,
    dishwasher: null, equipo: 'ninguno', anchoRange: 30, murosLaterales: 0,
    cantosPulidos: 0, waterfalls: 0, isla: tipo === 'isla' ? islaInicial : null, huecos: 0, pulirHuecos: false,
  });
  const cambiar = <K extends keyof ConfiguracionMeson>(key: K, value: ConfiguracionMeson[K]) =>
    setOpciones(d => ({ ...d, [key]: value }));
  const cambiarIsla = (patch: Partial<IslaMeson>) =>
    setOpciones(d => ({ ...d, isla: d.isla ? { ...d.isla, ...patch } : null }));
  const { isla } = opciones;
  const material = catalogo.materiales.find(m => m.id === materialId);
  let medidas: ReturnType<typeof medidasMesonDesdeMuebles> | undefined;
  let calculo: ReturnType<typeof calcularMeson> | undefined;
  let errorCalculo = '';
  try {
    medidas = medidasMesonDesdeMuebles(mueblesArea, opciones);
    if (material) calculo = calcularMeson(medidas, material, p, trm, descuento);
  } catch (e) { errorCalculo = e instanceof Error ? e.message : 'Revisa las medidas.'; }
  const fmt = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 2 });

  return <form className="space-y-4" onSubmit={e => {
    e.preventDefault();
    if (!calculo) return;
    setError('');
    iniciar(async () => {
      setGuardando(true);
      try {
        const r = await agregarMesonAction(cocinaId, materialId, opciones, editar?.id);
        if (r.ok) onDone();
        else setError(r.error ?? 'No se pudo guardar el mesón.');
      } catch {
        setError('No se pudo guardar el mesón.');
      } finally {
        setGuardando(false);
      }
    });
  }}>
    <p className="text-sm text-slate-600">Configura el mesón por unidad del área. Registra la instalación y las perforaciones en obra en Entrega.</p>
    <fieldset disabled={pendiente} className="space-y-4">
      {tipo === 'cocina' && !isla && muebles.length > 0 && <details>
        <summary className="cursor-pointer text-sm">Excluir muebles de la isla o península</summary>
        <div className="mt-2 flex flex-wrap gap-3">
          {muebles.map(m => <label key={m.id} className="flex items-center gap-1 text-xs">
            <input type="checkbox" checked={opciones.mueblesExcluidos?.includes(m.id) ?? false} onChange={e => {
              const ids = opciones.mueblesExcluidos ?? [];
              cambiar('mueblesExcluidos', e.target.checked ? [...ids, m.id] : ids.filter(id => id !== m.id));
            }} /> {m.etiqueta} · {fmt(m.largo)} in
          </label>)}
        </div>
      </details>}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <label className="text-xs sm:col-span-2">Material
          <select required value={materialId} onChange={e => setMaterialId(e.target.value)} className={input}>
            <option value="">Selecciona un material</option>
            {(['COL', 'US'] as const).map(origen => <optgroup key={origen} label={origen === 'COL' ? 'Colombia' : 'USA'}>
              {catalogo.materiales.filter(m => m.origen === origen).map(m => <option key={m.id} value={m.id} disabled={m.material === null}>
                {m.nombre}{m.material === null && ' · Sin tarifa'}
              </option>)}
            </optgroup>)}
          </select>
        </label>
        <Medida label="Profundidad (in)" value={opciones.profundidad} min={0.01} change={v => cambiar('profundidad', v)} />
        <Medida label="Espesor (in)" value={opciones.espesor} min={0.01} change={v => cambiar('espesor', v)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={opciones.refuerzo} onChange={e => {
            const refuerzo = e.target.checked;
            setOpciones(d => ({ ...d, refuerzo, espesor: refuerzo ? p.espesorReforzado : p.espesor }));
          }} /> Refuerzo ({fmt(p.espesorReforzado)} in)
        </label>
        <Medida label="Altura del backsplash (in)" value={opciones.backsplash} change={v => cambiar('backsplash', v)} />
        {tipo === 'cocina' && <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={opciones.dishwasher !== null} onChange={e => cambiar('dishwasher', e.target.checked ? 24 : null)} /> Lavavajillas (Dishwasher)
        </label>}
        {opciones.dishwasher !== null && <Medida label="Ancho del dishwasher (in)" value={opciones.dishwasher} min={0.01} change={v => cambiar('dishwasher', v)} />}
        {tipo !== 'bano' && <label className="text-xs">Equipo de cocción
          <select value={opciones.equipo} onChange={e => cambiar('equipo', e.target.value as ConfiguracionMeson['equipo'])} className={input}>
            <option value="ninguno">Ninguno</option>
            {tipo === 'cocina' && <option value="range">Estufa (Range)</option>}
            <option value="cooktop">Cubierta (Cooktop)</option>
          </select>
        </label>}
        {opciones.equipo === 'range' && <Medida label="Ancho de la estufa (in)" min={0.01} value={opciones.anchoRange} change={v => cambiar('anchoRange', v)} />}
      </div>
      <div className="grid gap-3 border-t pt-3 sm:grid-cols-3 lg:grid-cols-4">
        {tipo !== 'isla' && <>
          <Medida label="Muros laterales (0–2)" value={opciones.murosLaterales} max={2} entero change={v => cambiar('murosLaterales', v)} />
          <Medida label="Cantidad de cantos laterales pulidos" value={opciones.cantosPulidos} entero change={v => cambiar('cantosPulidos', v)} />
          <Medida label="Cascadas (Waterfall) cocina/baño (0–2)" value={opciones.waterfalls} max={2} entero change={v => cambiar('waterfalls', v)} />
        </>}
        <label className="text-xs">Perforaciones en
          <select className={input} value={opciones.perforacionesEn} onChange={e => cambiar('perforacionesEn', e.target.value as ConfiguracionMeson['perforacionesEn'])}>
            <option value="fabricacion">Fabricación</option>
            <option value="instalacion">Instalación</option>
          </select>
        </label>
        <Medida label="Otras perforaciones" value={opciones.huecos} entero change={v => cambiar('huecos', v)} />
        {opciones.equipo === 'cooktop' && <p className="text-xs text-slate-600">La cubierta añade una perforación.</p>}
        {opciones.perforacionesEn !== 'instalacion' && material?.origen === 'COL' && <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={opciones.pulirHuecos} onChange={e => cambiar('pulirHuecos', e.target.checked)} /> Pulir perforaciones
        </label>}
      </div>
      {(tipo === 'isla' || conservar && anterior.tipo === undefined) && <div className="space-y-3 border-t pt-3">
        {tipo !== 'isla' && <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isla !== null} onChange={e => cambiar('isla', e.target.checked ? islaInicial : null)} /> Isla / península
        </label>}
        {isla && <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Medida label="Largo de la isla (in)" value={isla.largo} min={0.01} change={v => cambiarIsla({ largo: v })} />
            <Medida label="Voladizo frontal (in)" value={isla.voladizoFrontal} change={v => cambiarIsla({ voladizoFrontal: v })} />
            <Medida label="Voladizo lateral total (in)" value={isla.voladizoLateral} change={v => cambiarIsla({ voladizoLateral: v })} />
            <Medida label="Cantidad de cantos laterales pulidos" value={isla.cantosPulidos} entero change={v => cambiarIsla({ cantosPulidos: v })} />
            <Medida label="Cascadas (Waterfall) de isla (0–2)" value={isla.waterfalls} max={2} entero change={v => cambiarIsla({ waterfalls: v })} />
          </div>
          {muebles.length > 0 && <details>
            <summary className="cursor-pointer text-sm">Muebles que pertenecen a la isla ({isla.mueblesIds.length})</summary>
            <p className="mt-1 text-xs text-slate-600">Selecciona los que ya están incluidos en el largo de la isla.</p>
            <div className="mt-1 flex flex-wrap gap-3">
              {muebles.map(m => <label key={m.id} className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={isla.mueblesIds.includes(m.id)} onChange={e => cambiarIsla({
                  mueblesIds: e.target.checked ? [...isla.mueblesIds, m.id] : isla.mueblesIds.filter(id => id !== m.id),
                })} /> {m.etiqueta} · {fmt(m.largo)} in
              </label>)}
            </div>
          </details>}
        </>}
      </div>}
    </fieldset>
    {medidas && tipo !== 'isla' && <p className="text-sm text-slate-600">Largo del mesón principal {fmt(medidas.largo)} in · Largo de backsplash {fmt(medidas.backsplash > 0 ? medidas.largoBacksplash : 0)} in</p>}
    {calculo && <p className="text-sm font-semibold">
      {fmt(calculo.areaSqft * veces)} ft² · {veces} {veces === 1 ? 'unidad' : 'unidades'} · {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(calculo.precioCop * veces)} · {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculo.precioUsd * veces)} USD
    </p>}
    {(error || errorCalculo) && <p role="alert" className="text-sm text-red-700">{error || errorCalculo}</p>}
    <button disabled={!calculo || pendiente} className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50">
      {pendiente ? 'Guardando…' : editar ? 'Guardar mesón' : 'Agregar mesón'}
    </button>
  </form>;
}
