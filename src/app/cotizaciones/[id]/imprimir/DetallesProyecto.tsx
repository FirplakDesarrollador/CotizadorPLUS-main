import type { EspecificacionProyecto } from '@/lib/materiales-proyecto';
import type { AdicionalPropuesta } from '@/lib/propuesta-cotizacion';
import { formatearImporte } from '@/lib/firplak-template';

export function MaterialesProyectoPdf({ bloques }: { bloques: EspecificacionProyecto[] }) {
  return <><style>{`@media print { thead { display: table-header-group; break-after: avoid; } tfoot { display: table-row-group; } tr { break-inside: avoid; } h2, h3 { break-after: avoid; } }`}</style><div data-pdf="materiales-proyecto">{bloques.map(bloque => <div key={bloque.familia} className="mb-4 break-inside-avoid">
    <h2 className="mb-1 bg-[#253e50] p-2 text-sm font-bold text-white">{bloque.titulo}</h2>
    <table className="w-full text-[10px]"><tbody>{bloque.filas.map(([rol, material]) => <tr key={rol} className="border-b even:bg-[#e9f1f6]"><th className="w-1/3 p-2 text-left">{rol}</th><td className="p-2">{material}</td></tr>)}</tbody></table>
  </div>)}</div></>;
}

export function HerrajesOtrosPdf({ filas, moneda }: { filas: AdicionalPropuesta[]; moneda: 'COP' | 'USD' }) {
  if (!filas.length) return null;
  const cop = moneda === 'COP';
  const money = (valor: number) => formatearImporte(moneda, valor);
  return <div data-pdf="herrajes-otros" className="mt-4">
    <h2 className="mb-2 bg-[#253e50] p-2 text-sm font-bold text-white">Herrajes / otros adicionales</h2>
    <p className="mb-2 text-[10px]">Cantidades totales, incluidas las repeticiones del área. Estos artículos se contabilizan aquí y se excluyen de muebles y programación de módulos.</p>
    <table className="w-full text-[10px]"><thead className="bg-[#b9cddd]"><tr><th className="p-2 text-left">Área / referencia</th><th className="p-2 text-left">Descripción</th><th className="p-2 text-right">Cantidad</th><th className="p-2">Unidad</th><th className="p-2 text-right">Valor unitario</th><th className="p-2 text-right">Valor total</th></tr></thead>
      <tbody>{filas.map(fila => <tr key={fila.id} className="border-b"><td className="p-2">{fila.area}<br/><b>{fila.codigo}</b></td><td className="p-2">{fila.descripcion}</td><td className="p-2 text-right">{fila.cantidad.toLocaleString('es-CO', { maximumFractionDigits: 6 })}</td><td className="p-2">{fila.unidad}</td><td className="p-2 text-right">{money(cop ? fila.unitCop : fila.unitUsd)}</td><td className="p-2 text-right">{money(cop ? fila.totalCop : fila.totalUsd)}</td></tr>)}</tbody>
      <tfoot><tr className="bg-[#b9cddd] font-bold"><td className="p-2" colSpan={5}>Subtotal herrajes / otros adicionales</td><td className="p-2 text-right">{money(filas.reduce((sum, fila) => sum + (cop ? fila.totalCop : fila.totalUsd), 0))}</td></tr></tfoot>
    </table>
  </div>;
}
