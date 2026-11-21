import { useState } from 'react';
import DetalleFlotante from '@/components/DetalleFlotante';
import { conceptosInstalacion, GRUPOS_INSTALACION, normalizarTarifasInstalacion, ZONAS_INSTALACION, type GrupoInstalacion, type TarifaInstalacion, type ZonaInstalacion } from '@/lib/instalacion-cotizacion';
import { guardarTarifasInstalacionAction } from './actions';

const COLUMNAS = [['costo', 'Costo/Unidad (USD)'], ['precio', 'Precio/Unidad (USD)'], ['margen', 'Margen (%)']] as const;
const SIN_TARIFA: TarifaInstalacion = { costo: 0, precio: 0, margen: 0 };

export default function InstalacionParametros({ inicial }: { inicial: unknown }) {
  const [tarifas, setTarifas] = useState(() => normalizarTarifasInstalacion(inicial));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  async function guardar() {
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await guardarTarifasInstalacionAction(tarifas);
      setMensaje({ ok: res.ok, texto: res.ok ? 'Tarifas guardadas.' : res.error ?? 'No se pudieron guardar las tarifas.' });
    } catch {
      setMensaje({ ok: false, texto: 'No se pudieron guardar las tarifas.' });
    } finally {
      setGuardando(false);
    }
  }

  return <section className="space-y-2">
    <h3 className="text-sm font-medium text-slate-900">Instalación</h3>
    <DetalleFlotante titulo="Tarifas de instalación" etiqueta="Editar tarifas de instalación">
      <form className="space-y-5" onSubmit={e => { e.preventDefault(); void guardar(); }}>
        <fieldset disabled={guardando} className="space-y-6">
          {(Object.keys(ZONAS_INSTALACION) as ZonaInstalacion[]).map(zona => <section key={zona} className="space-y-3">
            <h4 className="font-semibold">{ZONAS_INSTALACION[zona]}</h4>
            {(Object.keys(GRUPOS_INSTALACION) as GrupoInstalacion[]).map(grupo => <div key={grupo} className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="pb-1 text-left font-medium">{GRUPOS_INSTALACION[grupo]}</caption>
                <thead className="bg-slate-100"><tr><th scope="col" className="p-2 text-left">Concepto</th>{COLUMNAS.map(([campo, nombre]) => <th scope="col" key={campo} className="p-2 text-left">{nombre}</th>)}</tr></thead>
                <tbody>{conceptosInstalacion(zona, grupo).map(([clave, etiqueta]) => <tr key={clave} className="border-b border-slate-100">
                  <th scope="row" className="p-2 text-left font-normal">{etiqueta}</th>
                  {COLUMNAS.map(([campo, nombre]) => <td key={campo} className="p-2">
                    <input type="number" step="any" min={campo === 'margen' ? undefined : 0}
                      aria-label={`${ZONAS_INSTALACION[zona]} · ${etiqueta} · ${nombre}`}
                      value={tarifas[zona][clave]?.[campo] ?? ''} placeholder="—" className="w-24 rounded border border-slate-300 px-2 py-1"
                      onChange={e => {
                        const valor = Number(e.target.value);
                        if (!Number.isFinite(valor)) return;
                        setTarifas(actual => ({ ...actual, [zona]: { ...actual[zona], [clave]: { ...(actual[zona][clave] ?? SIN_TARIFA), [campo]: valor } } }));
                      }} />
                  </td>)}
                </tr>)}</tbody>
              </table>
            </div>)}
          </section>)}
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{guardando ? 'Guardando…' : 'Guardar tarifas'}</button>
        </fieldset>
        {mensaje && <p role="status" className={mensaje.ok ? 'text-sm text-emerald-700' : 'text-sm text-red-700'}>{mensaje.texto}</p>}
      </form>
    </DetalleFlotante>
  </section>;
}
