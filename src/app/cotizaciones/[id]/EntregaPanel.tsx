import { useState } from 'react';
import DetalleFlotante from '@/components/DetalleFlotante';
import InstalacionEntrega, { type DatosInstalacion } from './InstalacionEntrega';
import type { AreaEntrega, ConfigEntrega, EntregaParcial, ImporteEntrega, TamanoContenedor } from '@/lib/entrega-cotizacion';
import { CAPACIDAD_ENTREGA, cantidadProyecto, cantidadesDeParciales, modulosDeEntrega, type resumirEntrega } from '@/lib/entrega-cotizacion';

const decimal = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cantidad = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 6 });

function Resumen({ resultado }: { resultado: ReturnType<typeof resumirEntrega>[number] }) {
  const datos = [
    ['Unidades del proyecto (derivadas)', cantidad.format(resultado.unidades)],
    ['Peso estimado', `${decimal.format(resultado.pesoKg)} kg`],
    ['Capacidad por contenedor', resultado.capacidadKg === null ? '—' : `${cantidad.format(resultado.capacidadKg)} kg`],
    ['Contenedores', resultado.contenedores === null ? '—' : cantidad.format(resultado.contenedores)],
    ['Ocupación', resultado.contenedores === null ? '—' : `${decimal.format(resultado.ocupacionPct)} %`],
  ];

  return <>
    <dl className="my-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {datos.map(([etiqueta, valor]) => <div key={etiqueta}>
        <dt className="text-xs text-slate-600">{etiqueta}</dt>
        <dd className="font-semibold tabular-nums text-slate-900">{valor}</dd>
      </div>)}
    </dl>
    {resultado.advertencias.length > 0 && <div className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">Advertencias</p>
      <ul className="list-disc pl-5">
        {resultado.advertencias.map(aviso => <li key={aviso}>{aviso}</li>)}
      </ul>
    </div>}
  </>;
}

const selector = 'rounded border border-slate-300 px-2 py-1 text-sm';

function Importe({ etiqueta, valor, onChange }: { etiqueta: string; valor: ImporteEntrega; onChange: (valor: ImporteEntrega) => void }) {
  return <div className="flex flex-wrap gap-3 text-sm">
    <label>{etiqueta} <input className={selector} type="number" min="0" step="0.01" value={valor.importe}
      onChange={e => onChange({ ...valor, importe: Math.max(0, Number(e.target.value)) })} /></label>
    <label>Moneda <select className={selector} value={valor.moneda}
      onChange={e => onChange({ ...valor, moneda: e.target.value === 'COP' ? 'COP' : 'USD' })}><option>USD</option><option>COP</option></select></label>
  </div>;
}

function Contenedor({ valor, onChange }: { valor: TamanoContenedor | null; onChange: (valor: TamanoContenedor | null) => void }) {
  return <div>
    <label className="flex flex-wrap items-center gap-2 text-sm">Contenedor
      <select className={selector} value={valor ?? ''} onChange={e => onChange((e.target.value || null) as TamanoContenedor | null)}>
        <option value="">Seleccionar tamaño</option>
        <option value="20T">20 pies · {cantidad.format(CAPACIDAD_ENTREGA['20T'])} kg</option>
        <option value="40T">40 pies · {cantidad.format(CAPACIDAD_ENTREGA['40T'])} kg</option>
      </select>
    </label>
  </div>;
}

export default function EntregaPanel({ config, areas, resultados, instalacion, onChange, onSave }: {
  config: ConfigEntrega;
  areas: readonly AreaEntrega[];
  resultados: ReturnType<typeof resumirEntrega>;
  instalacion?: DatosInstalacion;
  onChange: (valor: ConfigEntrega) => void;
  onSave: (valor: ConfigEntrega) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const asignaciones = cantidadesDeParciales(config.parciales, areas);
  const totalesAsignados = new Map<string, number>();
  for (const parcial of asignaciones) for (const [id, total] of parcial) {
    totalesAsignados.set(id, (totalesAsignados.get(id) ?? 0) + total);
  }
  const unidadesProyecto = areas.reduce((total, area) => total + modulosDeEntrega(area).reduce((n, linea) => n + cantidadProyecto(area, linea), 0), 0);
  const maxParciales = Math.min(100, Math.max(1, Math.ceil(unidadesProyecto), config.parciales.length));

  function cambiarParcial(i: number, parcial: EntregaParcial) {
    onChange({ ...config, parciales: config.parciales.map((actual, j) => i === j ? parcial : actual) });
  }

  function cambiarCantidades(i: number, cantidades: Map<string, number>) {
    onChange({ ...config, parciales: config.parciales.map((parcial, j) => ({
      contenedor: parcial.contenedor,
      areas: [],
      cantidades: Object.fromEntries(j === i ? cantidades : asignaciones[j]),
    })) });
  }

  async function guardar() {
    setGuardando(true);
    try {
      const resultado = await onSave(config);
      setMensaje(resultado.ok ? 'Entrega guardada.' : resultado.error ?? 'No se pudo guardar la entrega.');
    } catch {
      setMensaje('No se pudo guardar la entrega.');
    } finally {
      setGuardando(false);
    }
  }

  return <section className="mt-4 rounded-md border border-slate-200 p-4">
    <h3 className="font-semibold text-slate-900">Entrega</h3>
    <fieldset disabled={guardando} className="mt-3 space-y-3">
      {instalacion && <InstalacionEntrega config={config.instalacion} datos={instalacion} onChange={instalacion => onChange({ ...config, instalacion })} />}
      <fieldset className="flex gap-4 text-sm">
        <legend className="mb-1 font-medium">Incoterm</legend>
        {(['FOB', 'CIF', 'DDP'] as const).map(incoterm => <label key={incoterm} className="flex items-center gap-1">
          <input type="radio" name="incoterm-entrega" checked={config.incoterm === incoterm} onChange={() => onChange({ ...config, incoterm })} /> {incoterm}
        </label>)}
      </fieldset>
      {config.incoterm === 'CIF' && <Importe etiqueta="Importe CIF" valor={config.cif} onChange={cif => onChange({ ...config, cif })} />}
      {config.incoterm === 'DDP' && <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={config.ddp.aplicarTarifas} onChange={e => onChange({ ...config, ddp: { ...config.ddp, aplicarTarifas: e.target.checked } })} />
          Aplicar tarifas DDP de Materiales-Parámetros
        </label>
        <Importe etiqueta="Valor del transporte" valor={config.ddp.transporte}
          onChange={transporte => onChange({ ...config, ddp: { ...config.ddp, transporte } })} />
      </div>}
      <fieldset className="flex gap-4 text-sm">
        <legend className="mb-1 font-medium">Modalidad de entrega</legend>
        {(['parcial', 'total'] as const).map(modo => <label key={modo} className="flex items-center gap-1 capitalize">
          <input type="radio" name="modo-entrega" checked={config.modo === modo} onChange={() => onChange({ ...config, modo, parciales: modo === 'parcial' && !config.parciales.length ? [{ contenedor: null, areas: [] }] : config.parciales })} /> {modo}
        </label>)}
      </fieldset>
      {config.modo === 'total' && <div className="rounded border border-slate-200 p-3">
        <Contenedor valor={config.contenedor} onChange={contenedor => onChange({ ...config, contenedor })} />
        {resultados[0] && <Resumen resultado={resultados[0]} />}
      </div>}
      {config.modo === 'parcial' && <>
        <label className="flex items-center gap-2 text-sm">Cantidad de entregas parciales
          <select className={selector} value={config.parciales.length} onChange={e => onChange({ ...config, parciales: Array.from({ length: Number(e.target.value) }, (_, i) => config.parciales[i] ?? { contenedor: null, areas: [] }) })}>
            {Array.from({ length: maxParciales }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        {config.parciales.map((parcial, i) => <section key={i} className="space-y-2 rounded border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Entrega parcial {i + 1}</h4>
            <DetalleFlotante icono etiqueta={`Ver módulos de entrega parcial ${i + 1}`} titulo={`Contenido de entrega parcial ${i + 1}`}>
            {() => areas.map(area => {
              const filas = modulosDeEntrega(area).map(linea => {
                const total = cantidadProyecto(area, linea);
                const asignada = asignaciones[i].get(linea.id) ?? 0;
                const maximo = Math.max(0, total - ((totalesAsignados.get(linea.id) ?? 0) - asignada));
                return { linea, total, asignada, maximo };
              });
              function actualizar(id: string, valor: number, maximo: number) {
                const siguiente = new Map(asignaciones[i]);
                if (Number.isFinite(valor) && valor > 0) siguiente.set(id, Math.min(valor, maximo));
                else siguiente.delete(id);
                cambiarCantidades(i, siguiente);
              }
              return <section key={area.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold">Módulos de {area.nombre}</h4>
                  {filas.some(fila => fila.maximo > fila.asignada) && <button type="button" className="text-sm underline" onClick={() => {
                    const siguiente = new Map(asignaciones[i]);
                    for (const fila of filas) if (fila.maximo > 0) siguiente.set(fila.linea.id, fila.maximo);
                    cambiarCantidades(i, siguiente);
                  }}>Asignar disponibles</button>}
                </div>
                {!filas.length ? <p className="text-sm text-slate-600">Esta área aún no tiene módulos.</p> : <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left"><tr><th className="p-2">Módulo</th><th className="p-2 text-right">Total proyecto</th><th className="p-2 text-right">Disponible aquí</th><th className="p-2">Cantidad en entrega</th></tr></thead>
                    <tbody>{filas.map(({ linea, total, asignada, maximo }, indice) => {
                      const codigo = linea.codigo_modulo || linea.pref || `Módulo ${indice + 1}`;
                      return <tr key={linea.id} className="border-b border-slate-100">
                        <td className="p-2"><label className="flex items-start gap-2">
                          <input type="checkbox" className="mt-1" checked={asignada > 0} disabled={!maximo}
                            aria-label={`Incluir ${codigo}`} onChange={e => actualizar(linea.id, e.target.checked ? maximo : 0, maximo)} />
                          <span>{codigo}{linea.descripcion_es ? ` · ${linea.descripcion_es}` : ''}</span>
                        </label></td>
                        <td className="p-2 text-right tabular-nums">{cantidad.format(total)}</td>
                        <td className="p-2 text-right tabular-nums">{cantidad.format(maximo)}</td>
                        <td className="p-2"><input type="number" min="0" max={maximo} step={Number.isInteger(total) ? 1 : 'any'}
                          className={`${selector} w-24`} aria-label={`Cantidad de ${codigo}`} disabled={!maximo}
                          value={asignada || ''} placeholder="0" onFocus={e => e.target.select()}
                          onChange={e => actualizar(linea.id, Number.isInteger(total) ? Math.trunc(e.target.valueAsNumber) : e.target.valueAsNumber, maximo)} /></td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div>}
              </section>;
            })}
            </DetalleFlotante>
          </div>
          <Contenedor valor={parcial.contenedor} onChange={contenedor => cambiarParcial(i, { ...parcial, contenedor })} />
          <p className="text-sm font-medium">{decimal.format(resultados[i]?.porcentaje ?? 0)} % de las unidades del proyecto</p>
          {resultados[i] && <Resumen resultado={resultados[i]} />}
        </section>)}
      </>}
      {config.modo && <div className="space-y-1 text-xs text-slate-600">
        <p>Unidades = cantidad de cada módulo × veces que se repite su área</p>
        <p>Estimación con tablero. No incluye herrajes, empaque ni mesones.</p>
      </div>}
      <button type="button" className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar entrega'}</button>
      {mensaje && <p role="status" className="text-sm">{mensaje}</p>}
    </fieldset>
  </section>;
}
