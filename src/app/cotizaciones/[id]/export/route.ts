import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { getCotizacion } from '@/lib/cotizaciones';
import { createClient } from '@/lib/supabase/server';

type Linea = { pref: string | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_unit_cop: number; precio_total_usd: number; precio_total_cop: number };
type Cocina = { nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response('No autorizado', { status: 401 });

  const { cabecera, cocinas } = await getCotizacion(id);
  if (!cabecera) return new Response('No encontrado', { status: 404 });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Cotizador PLUS';
  const ws = wb.addWorksheet('Cotización');
  ws.columns = [
    { width: 14 }, { width: 48 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 16 },
  ];

  const money = (n: number, c: 'USD' | 'COP') => Number(n || 0);

  // Encabezado
  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = 'COTIZACIÓN — Cotizador PLUS';
  ws.getCell('A1').font = { bold: true, size: 16 };
  ws.addRow([]);
  ws.addRow(['Proyecto', cabecera.nombre || '']);
  ws.addRow(['Cliente', cabecera.cliente_nombre || '']);
  ws.addRow(['Estado', cabecera.estado]);
  ws.addRow(['TRM', Number(cabecera.trm)]);
  ws.addRow(['Fecha', new Date().toLocaleDateString('es-CO')]);
  ws.addRow([]);
  for (let r = 3; r <= 7; r++) ws.getCell(`A${r}`).font = { bold: true };

  const header = ['Módulo', 'Descripción', 'Cant', 'Unit USD', 'Total USD', 'Total COP'];

  for (const c of (cocinas as Cocina[])) {
    const titleRow = ws.addRow([`🍳 ${c.nombre}`]);
    titleRow.font = { bold: true, size: 12 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    const hr = ws.addRow(header);
    hr.font = { bold: true };
    hr.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } }; });
    for (const l of c.lineas) {
      const row = ws.addRow([l.pref || '', l.descripcion_es || '', Number(l.cantidad),
        money(l.precio_unit_usd, 'USD'), money(l.precio_total_usd, 'USD'), money(l.precio_total_cop, 'COP')]);
      row.getCell(4).numFmt = '"$"#,##0.00';
      row.getCell(5).numFmt = '"$"#,##0.00';
      row.getCell(6).numFmt = '"$"#,##0';
    }
    const sub = ws.addRow(['', 'Subtotal cocina', '', '', Number(c.total_usd || 0), Number(c.total_cop || 0)]);
    sub.font = { bold: true };
    sub.getCell(5).numFmt = '"$"#,##0.00';
    sub.getCell(6).numFmt = '"$"#,##0';
    ws.addRow([]);
  }

  const total = ws.addRow(['', 'TOTAL PROYECTO', '', '', Number(cabecera.total_usd || 0), Number(cabecera.total_cop || 0)]);
  total.font = { bold: true, size: 12 };
  total.getCell(5).numFmt = '"$"#,##0.00';
  total.getCell(6).numFmt = '"$"#,##0';

  const buf = await wb.xlsx.writeBuffer();
  const fileName = `Cotizacion-${(cabecera.nombre || 'proyecto').replace(/[^a-zA-Z0-9-_]+/g, '_')}.xlsx`;
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
