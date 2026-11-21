import { useState } from 'react';
import Campo from '@/components/Campo';
import Combobox from '@/components/Combobox';
import { m2Estimados, type ResumenConsumos } from './consumos';

export default function ConsumosAproximados({ cotizacionId, opciones, seleccionar, resumen, cargando, error, errores }: {
  cotizacionId: string;
  opciones: { value: string; label: string }[];
  seleccionar: (id: string) => void;
  resumen?: ResumenConsumos;
  cargando: boolean;
  error: string | null;
  errores: number;
}) {
  const [desperdicio, setDesperdicio] = useState('');
  const porcentaje = Number(desperdicio.replace(',', '.'));
  const formato = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 4 });
  const grupos = resumen ? [
    ['Tableros', 'm²', resumen.tableros.map(fila => ({ codigo: fila.codigo, nombre: '', cantidad: m2Estimados(fila, porcentaje) }))],
    ['Cantos', 'm', resumen.cantos.map(fila => ({ ...fila, nombre: '' }))],
    ['Herrajes', 'und', resumen.herrajes],
  ] as const : [];
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
    <h2 className="font-semibold text-slate-900">Consumos aproximados</h2>
    <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Campo label="Cotización para consumos">
        <Combobox value={cotizacionId} options={opciones} onChange={seleccionar} placeholder="Buscar cotización para consumos…" />
      </Campo>
      <Campo label="Desperdicio de tablero (%)">
        <input className="inp" type="number" min="0" max="100" step="any" placeholder="0" value={desperdicio} onChange={e => setDesperdicio(e.target.value)} />
      </Campo>
    </div>
    {cargando && <p role="status" className="text-sm text-slate-600">Calculando consumos…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {!cargando && !error && !resumen && cotizacionId && <p className="text-sm text-slate-600">Selecciona la cotización para calcular sus consumos actuales.</p>}
    {resumen && errores > 0 && <p role="status" className="text-sm text-amber-800">Resultado parcial. {errores} módulo(s) sin despiece quedaron fuera del cálculo.</p>}
    {resumen && <div className="grid items-start gap-4 lg:grid-cols-3">
      {grupos.map(([nombre, unidad, filas]) => <div key={nombre} className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <caption className="px-3 py-2 text-left font-semibold">{nombre}</caption>
          <thead className="bg-slate-100 text-slate-700"><tr><th scope="col" className="px-3 py-2 text-left">Referencia</th><th scope="col" className="whitespace-nowrap px-3 py-2 text-right">Cantidad ({unidad})</th></tr></thead>
          <tbody>{filas.length ? filas.map(fila => <tr key={fila.codigo} className="border-t border-slate-200">
            <th scope="row" className="break-all px-3 py-2 text-left font-normal">{fila.codigo}{fila.nombre && <span className="block text-xs text-slate-600">{fila.nombre}</span>}</th>
            <td className="px-3 py-2 text-right tabular-nums">{formato.format(fila.cantidad)}</td>
          </tr>) : <tr><td colSpan={2} className="px-3 py-2 text-slate-600">Sin consumo registrado.</td></tr>}</tbody>
        </table>
      </div>)}
    </div>}
  </section>;
}
