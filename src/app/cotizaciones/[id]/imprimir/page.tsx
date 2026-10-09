import { notFound } from 'next/navigation';
import { getCotizacion, proveedoresDeTableros } from '@/lib/cotizaciones';
import PrintButton from './PrintButton';
import CemaPrintEditor, { type CemaScheduleRow } from './CemaPrintEditor';
import { normalizarCemaTemplate, type CemaTemplate } from '@/lib/cema-template';
import FirplakPrintEditor, { type FirplakKitchenRow, type FirplakScheduleRow } from './FirplakPrintEditor';
import { normalizarFirplakTemplate, type FirplakTemplate, type ProveedoresPropuesta } from '@/lib/firplak-template';

const fmtCOP = (n: number) => Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
type Linea = { id: string; pref: string | null; codigo_modulo: string | null; grupo_id: string | null; posicion_grupo: number; grupo?: { orden: number; etiqueta: string; codigo_grupo: string | null } | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_total_cop: number; costo_total_cop?: number; breakdown?: Record<string, unknown> | null };
type Cocina = { id: string; nombre: string; cantidad?: number; lineas: Linea[] };
function precios(l: Linea, trm: number) { const b = l.breakdown ?? {}; const cant = Number(l.cantidad || 0); const sinUsd = Number(b.precioUsd ?? l.precio_unit_usd ?? 0); const sinCop = Number(b.precioCop ?? sinUsd * trm); const conUsd = Number(b.precioConHerrajesUsd ?? l.precio_unit_usd ?? 0); const conCop = Number(b.precioConHerrajesCop ?? l.precio_total_cop / Math.max(1, cant)); return { cant, sinUsd, sinCop, conUsd, conCop }; }

export default async function ImprimirPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params; const query = await searchParams;
  const { cabecera, cocinas } = await getCotizacion(id); if (!cabecera) notFound();
  if (cabecera.cotizador_por === 'CEMA') {
    const stored = normalizarCemaTemplate(cabecera.plantilla_cema as Partial<CemaTemplate> | null);
    const created = new Date(cabecera.created_at);
    const template: CemaTemplate = {
      ...stored,
      quoteReference: stored.quoteReference || cabecera.codigo || id.slice(0, 8).toUpperCase(),
      proposalDate: stored.proposalDate || created.toISOString().slice(0, 10),
    };
    const scheduleMap = new Map<string, CemaScheduleRow>();
    let kitchens = 0;
    for (const cocina of cocinas as Cocina[]) {
      const multiplier = Number(cocina.cantidad ?? 1);
      kitchens += multiplier;
      for (const line of cocina.lineas) {
        const sku = line.codigo_modulo ?? line.pref ?? 'SIN SKU';
        const current = scheduleMap.get(sku);
        const quantity = Number(line.cantidad || 0) * multiplier;
        if (current) current.quantity += quantity;
        else scheduleMap.set(sku, { sku, description: line.descripcion_es ?? '', quantity });
      }
    }
    return <CemaPrintEditor initialData={{
      id,
      projectName: cabecera.nombre || 'Untitled Project',
      preparedFor: cabecera.cliente_nombre || '—',
      contact: cabecera.comprador_nombre || '',
      kitchens,
      totalUsd: Number(cabecera.total_usd || 0),
      template,
      schedule: [...scheduleMap.values()].sort((a, b) => a.sku.localeCompare(b.sku)),
    }} />;
  }
  if (cabecera.cotizador_por === 'FIRPLAK') {
    const stored = normalizarFirplakTemplate(cabecera.plantilla_firplak as Partial<FirplakTemplate> | null);
    const template: FirplakTemplate = { ...stored, proposalDate: stored.proposalDate || new Date(cabecera.created_at).toISOString().slice(0, 10) };
    // Proveedor de cada tablero elegido en el proyecto, para las tablas de
    // especificaciones. Si el proyecto no trae presets se pasan vacios y las
    // filas quedan como estaban.
    const cfg = (cabecera.config_default ?? {}) as { conFondo?: boolean } & Record<string, { preset?: Record<string, string> } | undefined | boolean>;
    const presetSup = (cfg.materialesSuperiores as { preset?: Record<string, string> } | undefined)?.preset ?? {};
    const presetInf = (cfg.materialesInferiores as { preset?: Record<string, string> } | undefined)?.preset ?? {};
    // Con "Sin fondo" los inferiores no llevan espaldar, asi que su fila no debe
    // anunciar proveedor. Los superiores siempre lo llevan (ver
    // `ajustarPiezasSinFondo` en muebles.ts), de modo que conservan el suyo.
    const inferioresConFondo = cfg.conFondo !== false;
    const mapa = await proveedoresDeTableros([
      presetSup.caja, presetSup.frente, presetSup.fondo,
      presetInf.caja, presetInf.frente, presetInf.fondo,
    ].filter((c): c is string => typeof c === 'string' && c.length > 0));
    const proveedor = (codigo?: string) => (codigo ? mapa[codigo] ?? '' : '');
    const proveedores: ProveedoresPropuesta = {
      superiores: { caja: proveedor(presetSup.caja), frente: proveedor(presetSup.frente), fondo: proveedor(presetSup.fondo) },
      inferiores: { caja: proveedor(presetInf.caja), frente: proveedor(presetInf.frente), fondo: inferioresConFondo ? proveedor(presetInf.fondo) : '' },
    };
    const scheduleMap = new Map<string, FirplakScheduleRow>();
    const kitchenRows: FirplakKitchenRow[] = (cocinas as Cocina[]).map((cocina) => {
      const quantity = Number(cocina.cantidad ?? 1);
      const unitUsd = cocina.lineas.reduce((sum, line) => { const p=precios(line,Number(cabecera.trm||0)); return sum+p.conUsd*p.cant; },0);
      for (const line of cocina.lineas) { const sku=line.codigo_modulo??line.pref??'SIN SKU'; const lineQuantity=Number(line.cantidad||0)*quantity; const current=scheduleMap.get(sku); if(current) current.quantity+=lineQuantity; else scheduleMap.set(sku,{sku,description:line.descripcion_es??'',quantity:lineQuantity}); }
      return { name:cocina.nombre, quantity, unitUsd, totalUsd:unitUsd*quantity };
    });
    return <FirplakPrintEditor initialData={{ id, projectName:cabecera.nombre||'Proyecto sin nombre', builder:cabecera.cliente_nombre||'', buyer:cabecera.comprador_nombre||'', reference:cabecera.codigo||id.slice(0,8).toUpperCase(), totalUsd:kitchenRows.reduce((sum,row)=>sum+row.totalUsd,0), template, kitchens:kitchenRows, schedule:[...scheduleMap.values()].sort((a,b)=>a.sku.localeCompare(b.sku)), proveedores }} />;
  }
  const mostrarSin = query.sinHerrajes !== '0'; const mostrarCon = query.conHerrajes !== '0'; const mostrarUsd = query.usd !== '0'; const mostrarCop = query.cop !== '0'; const trm = Number(cabecera.trm || 0);
  const proyecto = { sinUsd: 0, sinCop: 0, conUsd: 0, conCop: 0 };
  const cocinasCalculadas = (cocinas as Cocina[]).map((c) => { const sub = { sinUsd: 0, sinCop: 0, conUsd: 0, conCop: 0 }; c.lineas.forEach((l) => { const p = precios(l, trm); sub.sinUsd += p.sinUsd * p.cant; sub.sinCop += p.sinCop * p.cant; sub.conUsd += p.conUsd * p.cant; sub.conCop += p.conCop * p.cant; }); const mult = Number(c.cantidad ?? 1); proyecto.sinUsd += sub.sinUsd * mult; proyecto.sinCop += sub.sinCop * mult; proyecto.conUsd += sub.conUsd * mult; proyecto.conCop += sub.conCop * mult; return { c, sub, mult }; });
  return <div className="min-h-screen bg-white text-slate-800"><style>{`@media print { .no-print { display:none !important; } @page { margin: 1.2cm; } } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`}</style><div className="mx-auto max-w-6xl p-8"><PrintButton />
    <div className="mb-4 flex items-start justify-between border-b-2 border-slate-800 pb-3"><div><h1 className="text-2xl font-bold text-slate-900">Cotización</h1><p className="text-lg font-semibold">{cabecera.nombre}</p><p className="text-sm text-slate-500">Constructora: {cabecera.cliente_nombre || '—'} · Comprador: {cabecera.comprador_nombre || '—'} · Estado: {cabecera.estado}</p></div><div className="text-right text-sm text-slate-500"><div>Fecha: {new Date().toLocaleDateString('es-CO')}</div><div>TRM: {trm.toLocaleString('es-CO')}</div></div></div>
    {cocinasCalculadas.map(({ c, sub, mult }) => <div key={c.id} className="mb-5"><h2 className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-900">Cocina: {c.nombre} {mult > 1 ? `(Cant: ${mult})` : ''}</h2><table className="mt-1 w-full text-xs"><thead><tr className="border-b border-slate-300 text-left text-slate-500"><th className="py-1">Grupo</th><th>Módulo</th><th>Descripción</th>{mostrarUsd && <th className="text-right">Costo USD</th>}{mostrarCop && <th className="text-right">Costo COP</th>}<th className="text-right">Cant</th>{mostrarSin && mostrarUsd && <><th className="text-right">Unit s/H USD</th><th className="text-right">Total s/H USD</th></>}{mostrarSin && mostrarCop && <><th className="text-right">Unit s/H COP</th><th className="text-right">Total s/H COP</th></>}{mostrarCon && mostrarUsd && <><th className="text-right">Unit c/H USD</th><th className="text-right">Total c/H USD</th></>}{mostrarCon && mostrarCop && <><th className="text-right">Unit c/H COP</th><th className="text-right">Total c/H COP</th></>}</tr></thead><tbody>
      {c.lineas.map((l) => { const p = precios(l, trm); const costoCop = Number(l.costo_total_cop ?? l.breakdown?.costoConHerrajes ?? 0); const count = c.lineas.filter((x) => x.grupo_id === l.grupo_id).length; const label = count > 1 ? `${l.grupo?.etiqueta ?? ''}${l.posicion_grupo}` : (l.grupo?.etiqueta ?? ''); return <tr key={l.id} className="border-b border-slate-100"><td className="py-1 font-semibold">{label}</td><td className="font-medium">{l.codigo_modulo ?? l.pref}</td><td className="text-slate-600">{l.descripcion_es}</td>{mostrarUsd && <td className="text-right">{fmtUSD(trm > 0 ? costoCop / trm : 0)}</td>}{mostrarCop && <td className="text-right">{fmtCOP(costoCop)}</td>}<td className="text-right">{p.cant}</td>{mostrarSin && mostrarUsd && <><td className="text-right">{fmtUSD(p.sinUsd)}</td><td className="text-right">{fmtUSD(p.sinUsd * p.cant)}</td></>}{mostrarSin && mostrarCop && <><td className="text-right">{fmtCOP(p.sinCop)}</td><td className="text-right">{fmtCOP(p.sinCop * p.cant)}</td></>}{mostrarCon && mostrarUsd && <><td className="text-right">{fmtUSD(p.conUsd)}</td><td className="text-right">{fmtUSD(p.conUsd * p.cant)}</td></>}{mostrarCon && mostrarCop && <><td className="text-right">{fmtCOP(p.conCop)}</td><td className="text-right">{fmtCOP(p.conCop * p.cant)}</td></>}</tr>; })}
      <tr className="font-semibold"><td colSpan={3 + Number(mostrarUsd) + Number(mostrarCop) + 1} className="py-1 text-right">Subtotal {c.nombre}</td>{mostrarSin && mostrarUsd && <><td></td><td className="text-right">{fmtUSD(sub.sinUsd * mult)}</td></>}{mostrarSin && mostrarCop && <><td></td><td className="text-right">{fmtCOP(sub.sinCop * mult)}</td></>}{mostrarCon && mostrarUsd && <><td></td><td className="text-right">{fmtUSD(sub.conUsd * mult)}</td></>}{mostrarCon && mostrarCop && <><td></td><td className="text-right">{fmtCOP(sub.conCop * mult)}</td></>}</tr>
    </tbody></table></div>)}
    <div className="mt-4 border-t-2 border-slate-800 pt-3"><table className="ml-auto text-sm"><tbody>{mostrarSin && <tr><td className="pr-6 font-bold">TOTAL SIN HERRAJES</td>{mostrarUsd && <td className="text-right font-bold">{fmtUSD(proyecto.sinUsd)}</td>}{mostrarCop && <td className="pl-6 text-right font-bold">{fmtCOP(proyecto.sinCop)}</td>}</tr>}{mostrarCon && <tr><td className="pr-6 font-bold">TOTAL CON HERRAJES</td>{mostrarUsd && <td className="text-right font-bold">{fmtUSD(proyecto.conUsd)}</td>}{mostrarCop && <td className="pl-6 text-right font-bold">{fmtCOP(proyecto.conCop)}</td>}</tr>}</tbody></table></div>
    {!mostrarSin && !mostrarCon && <p className="text-sm text-slate-500">La cotización fue generada sin columnas de precio.</p>}<p className="mt-8 text-xs text-slate-400">Generado por Cotizador PLUS · {new Date().toLocaleString('es-CO')}</p></div></div>;
}
