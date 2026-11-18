import { useState } from 'react';
import type { AreaEntrega, ConfigEntrega, EntregaParcial, ImporteEntrega, TamanoContenedor } from '@/lib/entrega-cotizacion';
import { CAPACIDAD_ENTREGA, modulosDeEntrega, modulosDelParcial, type resumirEntrega } from '@/lib/entrega-cotizacion';

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

export default function EntregaPanel({ config, areas, resultados, onChange, onSave }: {
  config: ConfigEntrega;
  areas: readonly AreaEntrega[];
  resultados: ReturnType<typeof resumirEntrega>;
  onChange: (valor: ConfigEntrega) => void;
  onSave: (valor: ConfigEntrega) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const asignadas = new Set(config.parciales.flatMap(parcial => parcial.areas));
  const areaUnica = areas.length === 1 ? areas[0] : undefined;
  const modulos = areaUnica ? modulosDeEntrega(areaUnica) : [];
  const modulosPorParcial = areaUnica ? config.parciales.map(parcial => modulosDelParcial(parcial, areaUnica)) : [];
  const modulosAsignados = new Set(modulosPorParcial.flat());
  const maxParciales = Math.min(100, Math.max(1, areaUnica ? modulos.length : areas.length, config.parciales.length));

  function cambiarParcial(i: number, parcial: EntregaParcial) {
    onChange({ ...config, parciales: config.parciales.map((actual, j) => i === j ? parcial : actual) });
  }

  async function guardar() {
    setGuardando(true);
    const resultado = await onSave(config);
    setMensaje(resultado.ok ? 'Entrega guardada.' : resultado.error ?? 'No se pudo guardar la entrega.');
    setGuardando(false);
  }

  return <section className="mt-4 rounded-md border border-slate-200 p-4">
    <h3 className="font-semibold text-slate-900">Entrega</h3>
    <fieldset disabled={guardando} className="mt-3 space-y-3">
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
        {config.parciales.map((parcial, i) => <fieldset key={i} className="space-y-2 rounded border border-slate-200 p-3">
          <legend className="px-1 text-sm font-semibold">Entrega parcial {i + 1}</legend>
          <Contenedor valor={parcial.contenedor} onChange={contenedor => cambiarParcial(i, { ...parcial, contenedor })} />
          {areaUnica ? <fieldset className="grid gap-1 text-sm sm:grid-cols-2">
            <legend className="font-medium">Módulos de {areaUnica.nombre}</legend>
            {modulos.length === 0 && <p className="text-slate-600">Esta área aún no tiene módulos.</p>}
            {modulos.map((linea, indice) => {
              const ids = modulosPorParcial[i];
              const incluido = ids.includes(linea.id);
              const codigo = linea.codigo_modulo || linea.pref || `Módulo ${indice + 1}`;
              return <label key={linea.id} className="flex items-start gap-2">
                <input type="checkbox" className="mt-1" checked={incluido} disabled={!incluido && modulosAsignados.has(linea.id)}
                  onChange={e => cambiarParcial(i, { ...parcial, areas: [], modulos: e.target.checked ? [...ids, linea.id] : ids.filter(id => id !== linea.id) })} />
                <span>{codigo}{linea.descripcion_es ? ` · ${linea.descripcion_es}` : ''} · {cantidad.format(Number(linea.cantidad ?? 1))} por área</span>
              </label>;
            })}
          </fieldset> : <fieldset className="grid gap-1 text-sm sm:grid-cols-2">
            <legend className="font-medium">Áreas de la cotización</legend>
            {areas.map(area => {
              const incluida = parcial.areas.includes(area.id);
              const pendientes = modulosDeEntrega(area).filter(linea => parcial.modulos?.includes(linea.id));
              const asignadaPorModulo = modulosDeEntrega(area).some(linea =>
                config.parciales.some((otro, j) => j !== i && otro.modulos?.includes(linea.id)));
              return <label key={area.id} className="flex items-center gap-2">
                <input type="checkbox" checked={incluida} disabled={!incluida && (asignadas.has(area.id) || asignadaPorModulo)}
                  onChange={e => cambiarParcial(i, { ...parcial, areas: e.target.checked ? [...parcial.areas, area.id] : parcial.areas.filter(id => id !== area.id) })} />
                {area.nombre}{pendientes.length > 0 && ` · ${pendientes.length} módulos asignados`}
              </label>;
            })}
          </fieldset>}
          <p className="text-sm font-medium">{decimal.format(resultados[i]?.porcentaje ?? 0)} % de las unidades del proyecto</p>
          {resultados[i] && <Resumen resultado={resultados[i]} />}
        </fieldset>)}
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
