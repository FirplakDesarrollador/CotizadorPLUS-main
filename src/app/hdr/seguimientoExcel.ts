import ExcelJS from 'exceljs';
import { GRUPOS_SEGUIMIENTO, type EntradaSeguimiento } from './seguimiento';
import { fechaConsumos } from './consumosExcel';

export const ACTIVIDADES_SEGUIMIENTO = ['HDR Existente', 'Modelo 3D', 'Perforado', 'Creación Hoja de Ruta', 'Revisión HDR', 'Corrección HDR', 'Crear CAM SCM', 'Crear CAM HOLZHER', 'Crear CAM HUAHUA', 'prg Tarugadora', 'Tetris', 'Planimetría', 'Crear empaque', 'Revisión de empaque', 'prg tangenciadora', 'prg láser', 'Diseño de etiqueta', 'Entrega de ruta y programas a producción'];
export const ENCABEZADOS_CODIGOS = ['REF', 'Muebles', 'Código', 'Descripción español', 'Descripción inglés', 'LdM', '% DESPERDICIO', 'Herrajes', 'Consecutivo'];
const durazno = 'FFF8CBAD';
const relleno = (color: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: color } });

/** Plantilla manual: solo nombres reales y encabezados; ninguna marca o código de ejemplo. */
export function crearWorkbookSeguimiento(entradas: readonly EntradaSeguimiento[]): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Seguimiento');
  ws.addRow(['FASE']);
  ws.mergeCells('B1:K1'); ws.getCell('B1').value = 'DISEÑO';
  ws.mergeCells('L1:R1'); ws.getCell('L1').value = 'EMPAQUE';
  ws.getCell('S1').value = 'ENTREGA';
  ws.addRow(['Responsable']);
  for (const rango of ['B2:G2', 'H2:K2', 'L2:R2']) ws.mergeCells(rango);
  ws.getCell('B2').value = 'Angie/Lizeth';
  ws.getCell('H2').value = 'Elias';
  ws.getCell('L2').value = 'Mariana/Liz/Angie/Elias';
  ws.getCell('S2').value = 'Angie/Liz';
  ws.addRow(['Actividad', ...ACTIVIDADES_SEGUIMIENTO]);
  for (const r of [1, 2]) for (let i = 1; i <= 19; i++) { const c = ws.getCell(r, i); c.fill = relleno(durazno); c.font = { bold: true }; c.alignment = { horizontal: 'center', vertical: 'middle' }; }
  ws.getRow(3).eachCell(c => { c.font = { bold: true }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }; });
  for (const columna of [6, 7]) ws.getRow(3).getCell(columna).fill = relleno('FFFF0000');
  const codigos = wb.addWorksheet('Códigos');
  codigos.addRow(ENCABEZADOS_CODIGOS);
  for (const grupo of GRUPOS_SEGUIMIENTO) {
    const muebles = entradas.filter(e => e.grupo === grupo);
    if (!muebles.length) continue;
    const cab = ws.addRow([grupo]);
    for (let i = 1; i <= 19; i++) { cab.getCell(i).fill = relleno(durazno); cab.getCell(i).font = { bold: true }; }
    const separador = codigos.addRow([grupo]);
    codigos.mergeCells(separador.number, 1, separador.number, 9);
    separador.getCell(1).fill = relleno(durazno); separador.getCell(1).font = { bold: true };
    for (const mueble of muebles) {
      const row = ws.addRow([mueble.nombre]);
      row.height = Math.max(22, Math.ceil(mueble.nombre.length / 60) * 16);
      row.getCell(1).fill = relleno(grupo === 'Fillers' || grupo === 'Paneles' ? 'FFF7D7F3' : 'FFE7E6E6');
      for (let i = 2; i <= 19; i++) {
        const celda = row.getCell(i);
        celda.value = null;
        celda.font = { name: 'Calibri', size: 12, color: { argb: 'FF70AD47' } };
      }
      codigos.addRow([null, mueble.nombre, null, null, null, null, null, null, null]).height = row.height;
    }
  }
  ws.getColumn(1).width = 76;
  for (let i = 2; i <= 19; i++) ws.getColumn(i).width = i === 19 ? 25 : 15;
  ws.getRow(1).height = 22; ws.getRow(2).height = 24; ws.getRow(3).height = 72;
  ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 3 }];
  codigos.columns.forEach((c, i) => { c.width = [18, 76, 27, 65, 65, 12, 20, 15, 18][i]; });
  codigos.getRow(1).font = { bold: true };
  codigos.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  codigos.getRow(1).height = 30;
  codigos.views = [{ state: 'frozen', ySplit: 1, xSplit: 2 }];
  for (const hoja of [ws, codigos]) {
    const columnas = hoja === ws ? 19 : 9;
    for (let r = 1; r <= hoja.rowCount; r++) for (let c = 1; c <= columnas; c++) {
      const celda = hoja.getCell(r, c);
      celda.border = { top: { style: 'thin', color: { argb: 'FF808080' } }, bottom: { style: 'thin', color: { argb: 'FF808080' } }, left: { style: 'thin', color: { argb: 'FF808080' } }, right: { style: 'thin', color: { argb: 'FF808080' } } };
      if (r > (hoja === ws ? 3 : 1)) celda.alignment = { vertical: 'middle', wrapText: true, ...(hoja === ws && c > 1 ? { horizontal: 'center' as const } : {}) };
    }
    hoja.pageSetup = { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: hoja === ws ? '1:3' : '1:1' };
  }
  return wb;
}

export async function generarArchivoSeguimiento(entradas: readonly EntradaSeguimiento[]): Promise<Uint8Array> {
  const wb = crearWorkbookSeguimiento(entradas);
  return new Uint8Array(await wb.xlsx.writeBuffer());
}

export async function descargarSeguimiento(entradas: readonly EntradaSeguimiento[], proyecto: string, vigente: () => boolean = () => true): Promise<void> {
  const buffer = await generarArchivoSeguimiento(entradas);
  if (!vigente()) return;
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `Seguimiento_${proyecto.replace(/[^\p{L}\p{N}_. -]/gu, '_').slice(0, 100) || 'proyecto'}_${fechaConsumos()}.xlsx`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
