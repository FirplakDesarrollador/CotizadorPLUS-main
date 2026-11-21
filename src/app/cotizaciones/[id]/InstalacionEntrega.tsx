import DetalleFlotante from '@/components/DetalleFlotante';
import {
  calcularInstalacion, conceptosManualesInstalacion, GRUPOS_INSTALACION, ZONAS_INSTALACION,
  type cantidadesInstalacion, type ConfigInstalacion, type GrupoInstalacion, type TarifasInstalacion, type ZonaInstalacion,
} from '@/lib/instalacion-cotizacion';

export type DatosInstalacion = {
  tarifas: TarifasInstalacion;
  cantidades: ReturnType<typeof cantidadesInstalacion>;
  moneda: 'COP' | 'USD';
  trm: number;
};

export default function InstalacionEntrega({ config, datos, onChange }: {
  config: ConfigInstalacion;
  datos: DatosInstalacion;
  onChange: (config: ConfigInstalacion) => void;
}) {
  const { zona } = config;
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
  </section>;
}
