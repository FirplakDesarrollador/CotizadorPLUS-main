import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { getCotizacion } from '@/lib/cotizaciones';
import { createClient } from '@/lib/supabase/server';

type Breakdown = Record<string, unknown> | null;
type Linea = { pref: string | null; codigo_modulo: string | null; grupo_id: string | null; posicion_grupo: number; grupo?: { orden: number; etiqueta: string; codigo_grupo: string | null } | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_total_cop: number; costo_total_cop?: number; breakdown?: Breakdown };
type Cocina = { nombre: string; cantidad?: number; lineas: Linea[] };

function precios(linea: Linea, trm: number) {
  const b = linea.breakdown ?? {};
  const cant = Number(linea.cantidad || 0);
  const sinUsd = Number(b.precioUsd ?? linea.precio_unit_usd ?? 0);
  const sinCop = Number(b.precioCop ?? sinUsd * trm);
  const conUsd = Number(b.precioConHerrajesUsd ?? linea.precio_unit_usd ?? 0);
  const conCop = Number(b.precioConHerrajesCop ?? linea.precio_total_cop / Math.max(1, cant));
  return { cant, sinUsd, sinCop, conUsd, conCop };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401 });
  const { cabecera, cocinas } = await getCotizacion(id);
  if (!cabecera) return new Response('No encontrado', { status: 404 });
  const mostrarSin = req.nextUrl.searchParams.get('sinHerrajes') !== '0';
  const mostrarCon = req.nextUrl.searchParams.get('conHerrajes') !== '0';
  const mostrarUsd = req.nextUrl.searchParams.get('usd') !== '0';
  const mostrarCop = req.nextUrl.searchParams.get('cop') !== '0';
  const trm = Number(cabecera.trm || 0);
  const header = ['Grupo', 'Módulo', 'Código agrupado', 'Descripción'];
  if (mostrarUsd) header.push('Costo USD');
  if (mostrarCop) header.push('Costo COP');
  header.push('Cant');
  if (mostrarSin && mostrarUsd) header.push('Unit s/H USD', 'Total s/H USD');
  if (mostrarSin && mostrarCop) header.push('Unit s/H COP', 'Total s/H COP');
  if (mostrarCon && mostrarUsd) header.push('Unit c/H USD', 'Total c/H USD');
  if (mostrarCon && mostrarCop) header.push('Unit c/H COP', 'Total c/H COP');

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cotizador PLUS';
  const ws = wb.addWorksheet('Cotización');
  ws.columns = header.map((name) => ({ width: name === 'Descripción' ? 48 : name.includes('Código') ? 34 : 16 }));
  ws.mergeCells(1, 1, 1, Math.max(1, header.length));
  ws.getCell('A1').value = 'COTIZACIÓN — Cotizador PLUS';
  ws.getCell('A1').font = { bold: true, size: 16 };
  ws.addRow([]); ws.addRow(['Proyecto', cabecera.nombre || '']); ws.addRow(['Constructora', cabecera.cliente_nombre || '']); ws.addRow(['Comprador', cabecera.comprador_nombre || '']); ws.addRow(['Estado', cabecera.estado]); ws.addRow(['TRM', trm]); ws.addRow(['Fecha', new Date().toLocaleDateString('es-CO')]); ws.addRow([]);
  for (let r = 3; r <= 7; r++) ws.getCell(`A${r}`).font = { bold: true };

  const totals = { sinUsd: 0, sinCop: 0, conUsd: 0, conCop: 0 };
  for (const c of cocinas as Cocina[]) {
    const mult = Number(c.cantidad ?? 1);
    const title = ws.addRow([`Cocina: ${c.nombre}${mult > 1 ? ` (Cant: ${mult})` : ''}`]); title.font = { bold: true, size: 12 };
    const hr = ws.addRow(header); hr.font = { bold: true };
    const sub = { sinUsd: 0, sinCop: 0, conUsd: 0, conCop: 0 };
    for (const l of c.lineas) {
      const p = precios(l, trm); const count = c.lineas.filter((x) => x.grupo_id === l.grupo_id).length;
      const costoCop = Number(l.costo_total_cop ?? l.breakdown?.costoConHerrajes ?? 0);
      const row: (string | number)[] = [count > 1 ? `${l.grupo?.etiqueta ?? ''}${l.posicion_grupo}` : (l.grupo?.etiqueta ?? ''), l.codigo_modulo || l.pref || '', count > 1 ? (l.grupo?.codigo_grupo ?? '') : '', l.descripcion_es || ''];
      if (mostrarUsd) row.push(trm > 0 ? costoCop / trm : 0);
      if (mostrarCop) row.push(costoCop);
      row.push(p.cant);
      if (mostrarSin && mostrarUsd) row.push(p.sinUsd, p.sinUsd * p.cant);
      if (mostrarSin && mostrarCop) row.push(p.sinCop, p.sinCop * p.cant);
      if (mostrarCon && mostrarUsd) row.push(p.conUsd, p.conUsd * p.cant);
      if (mostrarCon && mostrarCop) row.push(p.conCop, p.conCop * p.cant);
      const excelRow = ws.addRow(row);
      for (let col = 5; col <= header.length; col++) if (header[col - 1] !== 'Cant') excelRow.getCell(col).numFmt = header[col - 1].endsWith('COP') ? '"$"#,##0' : '"$"#,##0.00';
      sub.sinUsd += p.sinUsd * p.cant; sub.sinCop += p.sinCop * p.cant; sub.conUsd += p.conUsd * p.cant; sub.conCop += p.conCop * p.cant;
    }
    const subtotal: (string | number)[] = ['', '', '', 'Subtotal cocina'];
    if (mostrarUsd) subtotal.push(''); if (mostrarCop) subtotal.push(''); subtotal.push('');
    if (mostrarSin && mostrarUsd) subtotal.push('', sub.sinUsd * mult);
    if (mostrarSin && mostrarCop) subtotal.push('', sub.sinCop * mult);
    if (mostrarCon && mostrarUsd) subtotal.push('', sub.conUsd * mult);
    if (mostrarCon && mostrarCop) subtotal.push('', sub.conCop * mult);
    const sr = ws.addRow(subtotal); sr.font = { bold: true }; ws.addRow([]);
    totals.sinUsd += sub.sinUsd * mult; totals.sinCop += sub.sinCop * mult; totals.conUsd += sub.conUsd * mult; totals.conCop += sub.conCop * mult;
  }
  const total: (string | number)[] = ['', '', '', 'TOTAL PROYECTO'];
  if (mostrarUsd) total.push(''); if (mostrarCop) total.push(''); total.push('');
  if (mostrarSin && mostrarUsd) total.push('', totals.sinUsd);
  if (mostrarSin && mostrarCop) total.push('', totals.sinCop);
  if (mostrarCon && mostrarUsd) total.push('', totals.conUsd);
  if (mostrarCon && mostrarCop) total.push('', totals.conCop);
  const totalRow = ws.addRow(total); totalRow.font = { bold: true, size: 12 };
  const buf = await wb.xlsx.writeBuffer();
  const fileName = `Cotizacion-${(cabecera.nombre || 'proyecto').replace(/[^a-zA-Z0-9-_]+/g, '_')}.xlsx`;
  return new Response(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': `attachment; filename="${fileName}"` } });
}
