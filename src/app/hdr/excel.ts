import ExcelJS from 'exceljs';
import type { DatosHdrExcel } from './HdrTabla';
import { normalizarColorHdr } from './datosHdr';

/** Una fila por pieza, sin bloques por área, en el mismo orden de las HDR visibles. */
export function crearWorkbookHdr(modulos: readonly DatosHdrExcel[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('HDR');
  ws.addRow(['Módulo', 'Letra', 'Pieza', 'Largo (mm)', 'Ancho (mm)', 'Espesor (mm)', 'Canto largo Color', 'Canto ancho Color', 'Canto largo Blanco', 'Canto ancho Blanco', 'Espesor canto (mm)', 'Cantidad módulos', 'Color general', 'Proyecto', 'Color pieza']);
  for (const m of modulos) for (const f of m.filas) {
    const espesor = f.espesorCanto === '' ? null : Number(f.espesorCanto.replace(',', '.'));
    ws.addRow([m.titulo, f.letra, f.pieza, Number(f.largoMm.toFixed(1)), Number(f.anchoMm.toFixed(1)), f.espesorMm, f.cantoLargoColor, f.cantoAnchoColor, f.cantoLargoBlanco, f.cantoAnchoBlanco, espesor != null && Number.isFinite(espesor) ? espesor : null, m.cantidad.trim() === '' ? null : Number(m.cantidad), normalizarColorHdr(m.color), m.proyecto, normalizarColorHdr(f.color, m.color)]);
  }
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 65 : i === 2 ? 25 : i >= 12 ? 24 : 19; });
  for (const index of [4, 5, 6]) ws.getColumn(index).numFmt = '0.0';
  ws.getColumn(11).numFmt = '0.00';
  ws.getColumn(12).numFmt = '0.###';
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF253E50' } };
  ws.getRow(1).alignment = { wrapText: true };
  ws.getRow(1).height = 30;
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: 'A1', to: { row: ws.rowCount, column: 15 } };
  return workbook;
}

export async function descargarExcelHdr(modulos: readonly DatosHdrExcel[], nombre: string): Promise<void> {
  const buffer = await crearWorkbookHdr(modulos).xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `HDR_${nombre.replace(/[^\p{L}\p{N}_. -]/gu, '_').slice(0, 120) || 'muebles'}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
