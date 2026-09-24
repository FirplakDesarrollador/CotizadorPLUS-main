import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const archivoFuente = process.argv[2] ?? './materiales.xlsx';

// Leer .env manualmente
const envText = readFileSync('./.env', 'utf8');
const env = Object.fromEntries(
  envText.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function getCellValue(cell) {
  if (cell.value === null || cell.value === undefined) return null;
  if (typeof cell.value === 'object' && 'result' in cell.value) return cell.value.result;
  if (typeof cell.value === 'object' && 'text' in cell.value) return cell.value.text;
  return cell.value;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(archivoFuente);
  const sheet = wb.getWorksheet('Materiales') ?? wb.getWorksheet('MATERIALES');
  if (!sheet) throw new Error('No se encontró la hoja Materiales/MATERIALES.');

  // El archivo histórico empieza en la columna A y Mat_2309 en la B. Ubicar
  // los encabezados evita depender de la posición física de la tabla.
  const headerRow = Array.from({ length: Math.min(sheet.rowCount, 10) }, (_, index) => sheet.getRow(index + 1))
    .find((row) => row.values.some((value) => String(value ?? '').trim().toLowerCase() === 'codigo'));
  if (!headerRow) throw new Error('No se encontró la columna Codigo en la hoja de materiales.');
  const columnas = new Map(
    headerRow.values
      .map((value, index) => [String(value ?? '').trim().toLowerCase(), index])
      .filter(([nombre, index]) => nombre && index > 0)
  );
  const columna = (nombre) => {
    const index = columnas.get(nombre.toLowerCase());
    if (!index) throw new Error(`Falta la columna ${nombre} en la hoja de materiales.`);
    return index;
  };

  const excelTableros = [];
  for (let i = headerRow.number + 1; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const codigo = getCellValue(row.getCell(columna('codigo')));
    if (!codigo || String(codigo).trim().toUpperCase() === 'NA') continue;

    const descuento = getCellValue(row.getCell(columna('descuento'))) ?? 0;
    const precio_m2_raw = getCellValue(row.getCell(columna('precio por m2')));

    excelTableros.push({
      codigo: String(codigo).trim(),
      proveedor: String(getCellValue(row.getCell(columna('proveedor'))) ?? '').trim() || null,
      sustrato: String(getCellValue(row.getCell(columna('sustrato'))) ?? '').trim() || null,
      espesor_mm: Number(getCellValue(row.getCell(columna('espesor'))) || null),
      color_nombre: String(getCellValue(row.getCell(columna('color'))) ?? '').trim() || null,
      formato: String(getCellValue(row.getCell(columna('formato'))) ?? '').trim() || null,
      area_m2: Number(getCellValue(row.getCell(columna('area'))) || null),
      precio: Number(getCellValue(row.getCell(columna('precio'))) || null),
      descuento: Number(descuento) || 0,
      precio_real: Number(getCellValue(row.getCell(columna('precio real'))) || null),
      precio_m2: precio_m2_raw !== null ? Math.round(Number(precio_m2_raw)) : null,
      activo: String(getCellValue(row.getCell(columna('precio actualizado'))) ?? '').toUpperCase() === 'SI',
    });
  }

  console.log(`Tableros en Excel (${archivoFuente}):`, excelTableros.length);

  const { data: dbTableros, error: dbErr } = await supabase.from('cot_tableros').select('id, codigo');
  if (dbErr) throw new Error('DB error: ' + dbErr.message);
  console.log('Tableros en DB:   ', dbTableros.length);

  const excelCodigos = new Set(excelTableros.map(t => t.codigo));
  const dbCodigos    = new Set(dbTableros.map(t => t.codigo));

  const paraDesactivar = dbTableros.filter(t => !excelCodigos.has(t.codigo));
  const paraAgregar    = excelTableros.filter(t => !dbCodigos.has(t.codigo));
  const paraActualizar = excelTableros.filter(t =>  dbCodigos.has(t.codigo));

  console.log('\nPara ACTUALIZAR:', paraActualizar.length);
  console.log('Para INSERTAR:  ', paraAgregar.length);
  if (paraAgregar.length) console.log('  ->', paraAgregar.map(t => t.codigo).join('\n   '));
  console.log('Para DESACTIVAR:', paraDesactivar.length);
  if (paraDesactivar.length) console.log('  ->', paraDesactivar.map(t => t.codigo).join('\n   '));

  // Upsert todos los del Excel
  const { error: upsertErr } = await supabase
    .from('cot_tableros')
    .upsert(excelTableros, { onConflict: 'codigo' });
  if (upsertErr) throw new Error('Upsert error: ' + upsertErr.message);
  console.log('\nUpsert OK:', excelTableros.length, 'tableros sincronizados.');

  // Las referencias ausentes se desactivan para conservar trazabilidad de
  // cotizaciones históricas sin dejarlas disponibles para nuevos cálculos.
  if (paraDesactivar.length > 0) {
    const idsDesactivar = paraDesactivar.map(t => t.id);
    const { error: deactivateErr } = await supabase.from('cot_tableros').update({ activo: false }).in('id', idsDesactivar);
    if (deactivateErr) throw new Error('Deactivate error: ' + deactivateErr.message);
    console.log('Desactivados:', paraDesactivar.length, 'tableros.');
  } else {
    console.log('Nada que desactivar.');
  }

  const { data: final } = await supabase.from('cot_tableros').select('codigo').order('codigo');
  console.log('\nDB final:', final.length, 'tableros totales.');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
