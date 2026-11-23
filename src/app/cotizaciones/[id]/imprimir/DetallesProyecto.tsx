import type { EspecificacionProyecto } from '@/lib/materiales-proyecto';
import type { AdicionalPropuesta, MesonPropuesta } from '@/lib/propuesta-cotizacion';
import type { IdiomaPropuesta } from '@/lib/propuesta-ingles';
import type { TamanoContenedor } from '@/lib/entrega-cotizacion';

export type ParcialPdf = { contenedores: number | null; tamano: TamanoContenedor | null };

export function EntregaPdf({ contenedores, parciales, idioma }: { contenedores: number | null; parciales?: ParcialPdf[]; idioma: 'es' | 'en' }) {
  const en = idioma === 'en';
  const cantidad = (valor: number | null) => valor?.toLocaleString(en ? 'en-US' : 'es-CO') ?? '—';
  return <div data-pdf="entrega" className="break-inside-avoid">
    <dl className="flex items-center justify-between gap-4 bg-slate-100 px-3 py-2 text-sm">
      <dt>{en ? 'Containers' : 'Contenedores'}</dt>
      <dd className="text-right font-semibold tabular-nums">{cantidad(contenedores)}</dd>
    </dl>
    {!!parciales?.length && <dl className="divide-y divide-slate-200 border-b border-slate-200 text-xs">
      {parciales.map(({ contenedores, tamano }, i) => <div key={i} className="flex justify-between gap-4 px-3 py-2">
        <dt>{en ? 'Partial delivery' : 'Entrega parcial'} {i + 1}</dt>
        <dd className="text-right tabular-nums">{cantidad(contenedores)}{tamano && ` · ${tamano === '20T' ? 20 : 40} ${en ? 'ft' : 'pies'}`}</dd>
      </div>)}
    </dl>}
  </div>;
}

export function MaterialesProyectoPdf({ bloques }: { bloques: EspecificacionProyecto[] }) {
  return <><style>{`@media print { thead { display: table-header-group; break-after: avoid; } tfoot { display: table-row-group; } tr { break-inside: avoid; } h2, h3 { break-after: avoid; } }`}</style><div data-pdf="materiales-proyecto">{bloques.map((bloque, indice) => <div key={`${bloque.familia}-${indice}`} className="mb-4 break-inside-avoid">
    <h2 className="mb-1 bg-[#253e50] p-2 text-sm font-bold text-white">{bloque.titulo}</h2>
    <table className="w-full text-[10px]"><tbody>{bloque.filas.map(([rol, material]) => <tr key={rol} className="border-b even:bg-[#e9f1f6]"><th className="w-1/3 p-2 text-left">{rol}</th><td className="p-2">{material}</td></tr>)}</tbody></table>
  </div>)}</div></>;
}

export function HerrajesOtrosPdf({ filas, idioma = 'es' }: { filas: AdicionalPropuesta[]; moneda: 'COP' | 'USD'; idioma?: IdiomaPropuesta }) {
  const en = idioma === 'en';
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
        descripcion: fila.descripcion.replace(/\s*·\s*[\d.,]+\s*(?:und|pcs|m²|m)\s*$/u, ''),
        unidad: fila.unidad,
        cantidad: fila.cantidad,
        areas: new Set([fila.area]),
      });
    }
  }
  return <div data-pdf="herrajes-otros" className="mt-4">
    <h2 className="mb-2 bg-[#253e50] p-2 text-sm font-bold text-white">{en ? 'Additional hardware / other items' : 'Herrajes / otros adicionales'}</h2>
    <p className="mb-2 text-[10px]">{en ? 'Total quantities, including area repetitions. These items are counted here and excluded from cabinets and the cabinet schedule.' : 'Cantidades totales, incluidas las repeticiones del área. Estos artículos se contabilizan aquí y se excluyen de muebles y programación de módulos.'}</p>
    <table className="w-full text-[10px]"><thead className="bg-[#b9cddd]"><tr><th className="p-2 text-left">{en ? 'Areas / reference' : 'Áreas / referencia'}</th><th className="p-2 text-left">{en ? 'Description' : 'Descripción'}</th><th className="p-2 text-right">{en ? 'Total quantity' : 'Cantidad total'}</th><th className="p-2">{en ? 'Unit' : 'Unidad'}</th></tr></thead>
      <tbody>{Array.from(agrupadas, ([clave, fila]) => <tr key={clave} className="border-b break-inside-avoid"><td className="p-2">{Array.from(fila.areas).join(', ')}<br/><b>{fila.codigo}</b></td><td className="p-2">{fila.descripcion}</td><td className="p-2 text-right">{fila.cantidad.toLocaleString(en ? 'en-US' : 'es-CO', { maximumFractionDigits: 6 })}</td><td className="p-2">{fila.unidad}</td></tr>)}</tbody>
    </table>
  </div>;
}

export function MesonesPdf({ filas, moneda, idioma }: {
  filas?: MesonPropuesta[]; moneda: 'COP' | 'USD'; idioma?: IdiomaPropuesta;
}) {
  if (!filas?.length) return null;
  const en = idioma === 'en';
  const locale = en ? 'en-US' : 'es-CO';
  const fmt = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 });
  return <section data-pdf="mesones" className="my-4">
    <h2 className="mb-2 bg-[#253e50] p-2 text-sm font-bold text-white">{en ? 'Countertops' : 'Mesones'}</h2>
    <table className="w-full text-xs">
      <thead className="border-b"><tr>
        <th className="p-2 text-left">{en ? 'Area / material' : 'Área / material'}</th>
        <th className="p-2 text-left">{en ? 'Dimensions per unit' : 'Medidas por unidad'}</th>
        <th className="p-2 text-right">{en ? 'Qty' : 'Cant.'}</th>
        <th className="p-2 text-right">{en ? 'Area' : 'Superficie'}</th>
        <th className="p-2 text-right">{en ? 'Amount' : 'Valor'} {moneda}</th>
      </tr></thead>
      <tbody>{filas.map(m => {
        const d = m.medidas;
        const o = d.opciones;
        const isla = o?.isla;
        return <tr key={m.id} className="break-inside-avoid border-b">
          <td className="p-2">{m.area}<br /><strong>{m.material}</strong> · {m.origen === 'COL' ? 'Colombia' : 'USA'}</td>
          <td className="p-2">
            {d.largo > 0 && <div>{fmt(d.largo + d.extensionLateral)} × {fmt(d.profundidad + d.voladizo)} in · {fmt(d.espesor)} in</div>}
            {d.largoBacksplash > 0 && d.backsplash > 0 && <div>Backsplash {fmt(d.largoBacksplash)} × {fmt(d.backsplash)} in</div>}
            {d.waterfalls > 0 && <div>Waterfall × {d.waterfalls}</div>}
            {isla && <div>{en ? 'Island / peninsula' : 'Isla / península'} {fmt(isla.largo + isla.voladizoLateral)} × {fmt(d.profundidad + isla.voladizoFrontal)} in
              {d.largo === 0 && ` · ${fmt(d.espesor)} in`}{isla.waterfalls > 0 && ` · Waterfall × ${isla.waterfalls}`}</div>}
            {o?.dishwasher && <div>Dishwasher {fmt(o.dishwasher)} in</div>}
            {o?.equipo === 'range' && <div>Range {fmt(o.anchoRange)} in</div>}
            {o?.equipo === 'cooktop' && <div>Cooktop</div>}
          </td>
          <td className="p-2 text-right">{fmt(m.cantidad)}</td>
          <td className="p-2 text-right whitespace-nowrap">{fmt(m.areaSqft)} ft²</td>
          <td className="p-2 text-right whitespace-nowrap">{(moneda === 'USD' ? m.totalUsd : m.totalCop).toLocaleString(locale, { style: 'currency', currency: moneda })}</td>
        </tr>;
      })}</tbody>
    </table>
  </section>;
}
