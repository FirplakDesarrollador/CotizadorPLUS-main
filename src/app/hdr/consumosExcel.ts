import ExcelJS from 'exceljs';
import { ordenarConsumos, normalizarDesperdicio, type ConsumoMueble } from './consumos';

export type ContextoConsumosExcel = { proyecto: string; desperdicioPct: number; filtro?: string; fecha?: Date };

export function fechaConsumos(fecha = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

export function nombreExcelConsumos(proyecto: string, fecha = new Date()): string {
  return `Consumos_${proyecto.replace(/[^\p{L}\p{N}_. -]/gu, '_').slice(0, 100).trim() || 'muebles'}_${fechaConsumos(fecha)}.xlsx`;
}

/** Una fila por mueble; cada rol/tablero, calibre y consumible tiene columnas numéricas propias. */
export function crearWorkbookConsumos(filas: readonly ConsumoMueble[], contexto: ContextoConsumosExcel): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Consumos');
  ws.addRow([`Consumos · ${contexto.proyecto}`]);
  ws.addRow(['Generado (Bogotá)', fechaConsumos(contexto.fecha), 'Desperdicio tableros (%)', normalizarDesperdicio(contexto.desperdicioPct)]);
  ws.addRow(['Búsqueda', contexto.filtro || 'Todos los muebles']);
  ws.addRow(['Cantidades editadas en Consumos. Canto incluye su merma; consumibles en unidades.']);
  const ordenadas = ordenarConsumos(filas);
  const comparar = new Intl.Collator('es', { sensitivity: 'base', numeric: true }).compare;
  const materiales = [...new Map(ordenadas.flatMap(f => f.materiales.map(m => [`${m.rol}\u0000${m.codigo}`, { rol: m.rol, codigo: m.codigo }] as const))).values()]
    .sort((a, b) => comparar(a.rol, b.rol) || comparar(a.codigo, b.codigo));
  const calibres = [...new Set(ordenadas.flatMap(f => f.cantos.map(c => c.calibre)))].sort(comparar);
  const consumibles = [...new Map(ordenadas.flatMap(f => f.consumibles.map(c => [c.clave, c.nombre] as const))).entries()].sort((a, b) => comparar(a[1], b[1]));
  const cabeceras = ['Código', 'Descripción', 'Área', 'Cantidad consumo', 'Cantidad cotización (referencia)', 'Piezas',
    ...materiales.flatMap(m => [`${m.rol} · ${m.codigo} · neto (m²)`, `${m.rol} · ${m.codigo} · con desperdicio (m²)`]),
    ...calibres.map(c => `Canto ${c} (m)`), ...consumibles.map(([, nombre]) => `${nombre} (unidades)`)];
  const rows = ordenadas.map(f => [f.codigo, f.descripcion, f.area, f.cantidad, f.cantidadCotizacion, f.piezas,
    ...materiales.flatMap(m => { const dato = f.materiales.find(x => x.rol === m.rol && x.codigo === m.codigo); return [dato?.m2Neto ?? 0, dato?.m2Tableros ?? 0]; }),
    ...calibres.map(c => f.cantos.find(x => x.calibre === c)?.metros ?? 0),
    ...consumibles.map(([clave]) => f.consumibles.find(x => x.clave === clave)?.valor ?? 0)]);
  ws.addTable({ name: 'ConsumosMuebles', ref: 'A5', headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: cabeceras.map(name => ({ name, filterButton: true })), rows });
  ws.columns.forEach((c, i) => { c.width = i === 0 ? 30 : i === 1 ? 60 : i === 2 ? 28 : 24; if (i >= 3) c.numFmt = i >= 6 ? '0.000' : '0.###'; });
  ws.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF253E50' } };
  ws.getRow(5).height = 58;
  ws.getRow(5).alignment = { wrapText: true, vertical: 'middle' };
  ws.views = [{ state: 'frozen', ySplit: 5, xSplit: 1 }];
  return workbook;
}

export async function descargarExcelConsumos(filas: readonly ConsumoMueble[], contexto: ContextoConsumosExcel): Promise<void> {
  const fecha = contexto.fecha ?? new Date();
  const buffer = await crearWorkbookConsumos(filas, { ...contexto, fecha }).xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreExcelConsumos(contexto.proyecto, fecha);
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
