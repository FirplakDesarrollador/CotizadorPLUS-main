import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { getCotizacion } from '@/lib/cotizaciones';
import { createClient } from '@/lib/supabase/server';

type Linea = { pref: string | null; codigo_modulo: string | null; grupo_id: string | null; posicion_grupo: number; grupo?: { orden: number; etiqueta: string; codigo_grupo: string | null; total_cop: number; total_usd: number } | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_unit_cop: number; precio_total_usd: number; precio_total_cop: number };
type Cocina = { nombre: string; cantidad?: number; total_cop: number; total_usd: number; lineas: Linea[] };

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
    { width: 10 }, { width: 18 }, { width: 34 }, { width: 48 }, { width: 8 }, { width: 14 }, { width: 14 }, { width: 16 },
  ];

  const money = (n: number) => Number(n || 0);

  // Encabezado
  ws.mergeCells('A1:H1');
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

  const header = ['Grupo', 'Módulo', 'Código agrupado', 'Descripción', 'Cant', 'Unit USD', 'Total USD', 'Total COP'];

  for (const c of (cocinas as Cocina[])) {
    const cantLabel = c.cantidad && c.cantidad > 1 ? ` (Cant: ${c.cantidad})` : '';
    const titleRow = ws.addRow([`🍳 ${c.nombre}${cantLabel}`]);
    titleRow.font = { bold: true, size: 12 };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFEF' } };
    const hr = ws.addRow(header);
    hr.font = { bold: true };
    hr.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F7' } }; });
    for (const l of c.lineas) {
      const count = c.lineas.filter((x) => x.grupo_id === l.grupo_id).length;
      const groupLabel = count > 1 ? `${l.grupo?.etiqueta ?? ''}${l.posicion_grupo}` : (l.grupo?.etiqueta ?? '');
      const row = ws.addRow([groupLabel, l.codigo_modulo || l.pref || '', count > 1 ? (l.grupo?.codigo_grupo ?? '') : '', l.descripcion_es || '', Number(l.cantidad),
        money(l.precio_unit_usd), money(l.precio_total_usd), money(l.precio_total_cop)]);
      row.getCell(6).numFmt = '"$"#,##0.00';
      row.getCell(7).numFmt = '"$"#,##0.00';
      row.getCell(8).numFmt = '"$"#,##0';
      const colors = ['FFEFF6FF','FFECFDF5','FFFFFBEB','FFF5F3FF','FFFFF1F2','FFECFEFF'];
      row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[(l.grupo?.orden ?? 0) % colors.length] } }; });
      if (count > 1 && l.posicion_grupo === count) {
        const gs = ws.addRow(['', `Subtotal grupo ${l.grupo?.etiqueta ?? ''} · ${l.grupo?.codigo_grupo ?? ''}`, '', '', '', '', Number(l.grupo?.total_usd ?? 0), Number(l.grupo?.total_cop ?? 0)]);
        gs.font = { bold: true };
        gs.getCell(7).numFmt = '"$"#,##0.00';
        gs.getCell(8).numFmt = '"$"#,##0';
      }
    }
    const sub = ws.addRow(['', '', '', 'Subtotal cocina', '', '', Number(c.total_usd || 0), Number(c.total_cop || 0)]);
    sub.font = { bold: true };
    sub.getCell(7).numFmt = '"$"#,##0.00';
    sub.getCell(8).numFmt = '"$"#,##0';
    ws.addRow([]);
  }

  const total = ws.addRow(['', '', '', 'TOTAL PROYECTO', '', '', Number(cabecera.total_usd || 0), Number(cabecera.total_cop || 0)]);
  total.font = { bold: true, size: 12 };
  total.getCell(7).numFmt = '"$"#,##0.00';
  total.getCell(8).numFmt = '"$"#,##0';

  const buf = await wb.xlsx.writeBuffer();
  const fileName = `Cotizacion-${(cabecera.nombre || 'proyecto').replace(/[^a-zA-Z0-9-_]+/g, '_')}.xlsx`;
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}
