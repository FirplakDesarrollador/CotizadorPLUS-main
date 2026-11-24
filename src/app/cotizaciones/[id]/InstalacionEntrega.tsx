import DetalleFlotante from '@/components/DetalleFlotante';
import {
  calcularInstalacion, calcularSupervisionEntrega, CAMPOS_SUPERVISION, conceptosManualesInstalacion, GRUPOS_INSTALACION, ZONAS_INSTALACION,
  type cantidadesInstalacion, type ConfigInstalacion, type GrupoInstalacion, type TarifasInstalacion, type ZonaInstalacion,
} from '@/lib/instalacion-cotizacion';

export type DatosInstalacion = {
  tarifas: TarifasInstalacion;
  cantidades: ReturnType<typeof cantidadesInstalacion>;
  moneda: 'COP' | 'USD';
  trm: number;
};

export default function InstalacionEntrega({ config, datos, onChange, unidadesProyecto }: {
  config: ConfigInstalacion;
  unidadesProyecto: number;
  datos: DatosInstalacion;
  onChange: (config: ConfigInstalacion) => void;
}) {
  const { zona } = config;
  const supervision = config.supervisionEntrega ?? { moneda: datos.moneda };
  const formatoSupervision = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  const valorManual = (input: HTMLInputElement) => input.value === '' ? undefined : input.valueAsNumber;

  const moneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: datos.moneda, currencyDisplay: 'code' });
  const decimal = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  const importe = (valor: number | null) => valor == null ? '—' : moneda.format(valor);
  const tablas = calcularInstalacion(config, datos.tarifas, datos.cantidades, datos.moneda, datos.trm);
  return <section className="space-y-2 rounded border border-slate-200 p-3">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <label className="flex items-center gap-2 font-semibold">
        <input type="checkbox" checked={config.activa} onChange={e => onChange({ ...config, activa: e.target.checked })} />
        Instalación
      </label>
      <DetalleFlotante icono etiqueta="Ver cálculo de instalación" titulo={zona ? `Instalación · ${ZONAS_INSTALACION[zona]}` : 'Instalación'}
        disabled={!config.activa || !zona}>
        {!tablas.length && <p className="text-sm text-slate-600">Selecciona Muebles, Mesones o ambos para ver el cálculo.</p>}
        {tablas.map(({ grupo, filas }) => <section key={grupo} className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="pb-2 text-left font-semibold">{GRUPOS_INSTALACION[grupo]}</caption>
              <thead className="bg-slate-100"><tr>
                <th scope="col" className="p-2 text-left">Concepto</th>
                <th scope="col" className="p-2 text-right">Costo</th>
                <th scope="col" className="p-2 text-right">Precio</th>
                <th scope="col" className="p-2 text-right">Margen</th>
              </tr></thead>
              <tbody>{filas.map(fila => <tr key={fila.clave} className="border-b border-slate-100">
                <th scope="row" className="p-2 text-left font-normal">{fila.etiqueta}</th>
                <td className="p-2 text-right tabular-nums">{importe(fila.costo)}</td>
                <td className="p-2 text-right tabular-nums">{importe(fila.precio)}</td>
                <td className="p-2 text-right tabular-nums">{fila.margen == null ? '—' : `${decimal.format(fila.margen)} %`}</td>
              </tr>)}</tbody>
            </table>
          </div>
          {zona && conceptosManualesInstalacion(zona, grupo).length > 0 && <details className="rounded border border-slate-200 p-2 text-sm">
            <summary className="cursor-pointer font-medium">Cantidades manuales de {GRUPOS_INSTALACION[grupo].toLowerCase()}</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {conceptosManualesInstalacion(zona, grupo).map(([clave, etiqueta]) => <label key={clave} className="grid gap-1">
                <span>{etiqueta}</span>
                <input type="number" min="0" step="any" className="rounded border border-slate-300 px-2 py-1"
                  value={config.cantidades[clave] ?? ''} onChange={e => {
                    const cantidades = { ...config.cantidades };
                    if (e.target.value === '') delete cantidades[clave];
                    else if (Number.isFinite(e.target.valueAsNumber)) cantidades[clave] = Math.max(0, e.target.valueAsNumber);
                    onChange({ ...config, cantidades });
                  }} />
              </label>)}
            </div>
          </details>}
        </section>)}
      </DetalleFlotante>
      {(Object.keys(GRUPOS_INSTALACION) as GrupoInstalacion[]).map(grupo => <label key={grupo} className="flex items-center gap-1">
        <input type="checkbox" disabled={!config.activa} checked={config[grupo]} onChange={e => onChange({ ...config, [grupo]: e.target.checked })} />
        {GRUPOS_INSTALACION[grupo]}
      </label>)}
    </div>
    <div className="flex flex-wrap gap-4 text-sm" role="group" aria-label="Zona de instalación">
      {(Object.keys(ZONAS_INSTALACION) as ZonaInstalacion[]).map(opcion => <label key={opcion} className="flex items-center gap-1">
        <input type="checkbox" disabled={!config.activa} checked={zona === opcion} onChange={e => onChange({ ...config, zona: e.target.checked ? opcion : null })} />
        {ZONAS_INSTALACION[opcion]}
      </label>)}
    </div>
    {config.activa && zona === 'miami' && <div className="overflow-x-auto rounded border border-slate-200">
      <table className="w-full text-sm">
        <caption className="px-2 py-1 text-left text-xs text-slate-600">Borra un valor manual para volver a la sugerencia o al cálculo.</caption>
        <thead className="bg-slate-800 text-white"><tr>
          <th scope="col" className="p-2 text-left">Supervisión y entrega ({supervision.moneda})</th>
          {CAMPOS_SUPERVISION.map(([, etiqueta]) =>
            <th scope="col" key={etiqueta} className="whitespace-nowrap p-2 text-right">{etiqueta}</th>)}
        </tr></thead>
        <tbody>
          {calcularSupervisionEntrega(unidadesProyecto, supervision).map(fila => <tr key={fila.clave} className="border-b">
            <th scope="row" className="bg-slate-100 p-2 text-left font-medium">{fila.etiqueta}</th>
            {CAMPOS_SUPERVISION.map(([campo, etiqueta]) => {
              const capacidad = fila.clave === 'trailer' && campo === 'unidades';
              const calculado = fila.valores[campo];
              const automatico = (fila.precioAutomatico && (campo === 'precioUnit' || campo === 'precio'))
                || (fila.costoDesdeTrailer && (campo === 'costoUnit' || campo === 'costo'));
              const nombre = capacidad ? 'Unidades por tráiler' : `${fila.etiqueta} · ${etiqueta}`;
              return <td key={campo} className="p-2 text-right">
                {automatico ? (
                  <output aria-label={nombre} className="inline-block w-28 px-2 py-1 tabular-nums">
                    {calculado == null ? '—' : formatoSupervision.format(calculado)}
                  </output>
                ) : <input type="number" step={capacidad ? 1 : "any"} min={capacidad ? 1 : campo === 'margen' ? undefined : 0}
                  aria-label={nombre}
                  className="w-28 rounded border border-slate-300 px-2 py-1 text-right tabular-nums placeholder:text-slate-600"
                  value={(capacidad ? supervision.capacidadTrailer : fila.manual[campo]) ?? ''}
                  placeholder={calculado == null ? '—' : formatoSupervision.format(calculado)}
                  onChange={e => {
                    const valor = valorManual(e.currentTarget);
                    if (capacidad) {
                      if (valor != null && (!Number.isInteger(valor) || valor <= 0)) return;
                      onChange({ ...config, supervisionEntrega: { ...supervision, capacidadTrailer: valor } });
                      return;
                    }
                    if (valor != null && (!Number.isFinite(valor) || (campo === 'margen' ? valor >= 100 : valor < 0))) return;
                    onChange({ ...config, supervisionEntrega: {
                      ...supervision, [fila.clave]: { ...fila.manual, [campo]: valor },
                    } });
                  }} />}
                {capacidad && <span className="block text-xs text-slate-600">Unidades por tráiler</span>}
              </td>;
            })}
          </tr>)}
          <tr>
            <th scope="row" className="bg-slate-100 p-2 text-left font-medium">Costo por tráiler</th>
            <td colSpan={6} className="p-2">
              <input type="number" step="any" min={0} aria-label="Costo por tráiler"
                className="w-28 rounded border border-slate-300 px-2 py-1 text-right tabular-nums"
                value={supervision.costoTrailer ?? ''} placeholder="—" onChange={e => {
                  const valor = valorManual(e.currentTarget);
                  if (valor != null && (!Number.isFinite(valor) || valor < 0)) return;
                  onChange({ ...config, supervisionEntrega: { ...supervision, costoTrailer: valor } });
                }} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>}
  </section>;
}
