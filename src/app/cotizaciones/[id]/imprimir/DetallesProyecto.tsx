import type { EspecificacionProyecto } from '@/lib/materiales-proyecto';
import type { AdicionalPropuesta } from '@/lib/propuesta-cotizacion';

export function MaterialesProyectoPdf({ bloques }: { bloques: EspecificacionProyecto[] }) {
  return <><style>{`@media print { thead { display: table-header-group; break-after: avoid; } tfoot { display: table-row-group; } tr { break-inside: avoid; } h2, h3 { break-after: avoid; } }`}</style><div data-pdf="materiales-proyecto">{bloques.map((bloque, indice) => <div key={`${bloque.familia}-${indice}`} className="mb-4 break-inside-avoid">
    <h2 className="mb-1 bg-[#253e50] p-2 text-sm font-bold text-white">{bloque.titulo}</h2>
    <table className="w-full text-[10px]"><tbody>{bloque.filas.map(([rol, material]) => <tr key={rol} className="border-b even:bg-[#e9f1f6]"><th className="w-1/3 p-2 text-left">{rol}</th><td className="p-2">{material}</td></tr>)}</tbody></table>
  </div>)}</div></>;
}

export function HerrajesOtrosPdf({ filas }: { filas: AdicionalPropuesta[]; moneda: 'COP' | 'USD' }) {
  if (!filas.length) return null;
  const agrupadas = new Map<string, { codigo: string; descripcion: string; unidad: string; cantidad: number; areas: Set<string> }>();
  for (const fila of filas) {
    // Sin referencia no hay identidad suficiente para unir dos artículos.
    const clave = JSON.stringify([fila.codigo || fila.id, fila.unidad]);
    const existente = agrupadas.get(clave);
    if (existente) {
      existente.cantidad += fila.cantidad;
      existente.areas.add(fila.area);
    } else {
      agrupadas.set(clave, {
        codigo: fila.codigo,
        descripcion: fila.descripcion.replace(/\s*·\s*[\d.,]+\s*(?:und|m²|m)\s*$/u, ''),
        unidad: fila.unidad,
        cantidad: fila.cantidad,
        areas: new Set([fila.area]),
      });
    }
  }
  return <div data-pdf="herrajes-otros" className="mt-4">
    <h2 className="mb-2 bg-[#253e50] p-2 text-sm font-bold text-white">Herrajes / otros adicionales</h2>
    <p className="mb-2 text-[10px]">Cantidades totales, incluidas las repeticiones del área. Estos artículos se contabilizan aquí y se excluyen de muebles y programación de módulos.</p>
    <table className="w-full text-[10px]"><thead className="bg-[#b9cddd]"><tr><th className="p-2 text-left">Áreas / referencia</th><th className="p-2 text-left">Descripción</th><th className="p-2 text-right">Cantidad total</th><th className="p-2">Unidad</th></tr></thead>
      <tbody>{Array.from(agrupadas, ([clave, fila]) => <tr key={clave} className="border-b break-inside-avoid"><td className="p-2">{Array.from(fila.areas).join(', ')}<br/><b>{fila.codigo}</b></td><td className="p-2">{fila.descripcion}</td><td className="p-2 text-right">{fila.cantidad.toLocaleString('es-CO', { maximumFractionDigits: 6 })}</td><td className="p-2">{fila.unidad}</td></tr>)}</tbody>
    </table>
  </div>;
}
