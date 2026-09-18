import ExcelJS from 'exceljs';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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
  await wb.xlsx.readFile('./materiales.xlsx');
  const sheet = wb.getWorksheet('Materiales');

  const excelTableros = [];
  for (let i = 3; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const codigo = getCellValue(row.getCell(1));
    if (!codigo) continue;

    const descuento = getCellValue(row.getCell(9)) ?? 0;
    const precio_m2_raw = getCellValue(row.getCell(11));

    excelTableros.push({
      codigo: String(codigo).trim(),
      proveedor: String(getCellValue(row.getCell(2)) ?? '').trim() || null,
      sustrato: String(getCellValue(row.getCell(3)) ?? '').trim() || null,
      espesor_mm: Number(getCellValue(row.getCell(4))) || null,
      color_nombre: String(getCellValue(row.getCell(5)) ?? '').trim() || null,
      formato: String(getCellValue(row.getCell(6)) ?? '').trim() || null,
      area_m2: Number(getCellValue(row.getCell(7))) || null,
      precio: Number(getCellValue(row.getCell(8))) || null,
      descuento: Number(descuento) || 0,
      precio_real: Number(getCellValue(row.getCell(10))) || null,
      precio_m2: precio_m2_raw !== null ? Math.round(Number(precio_m2_raw)) : null,
      activo: String(getCellValue(row.getCell(12)) ?? '').toUpperCase() === 'SI',
    });
  }

  console.log('Tableros en Excel:', excelTableros.length);

  const { data: dbTableros, error: dbErr } = await supabase.from('cot_tableros').select('id, codigo');
  if (dbErr) throw new Error('DB error: ' + dbErr.message);
  console.log('Tableros en DB:   ', dbTableros.length);

  const excelCodigos = new Set(excelTableros.map(t => t.codigo));
  const dbCodigos    = new Set(dbTableros.map(t => t.codigo));

  const paraEliminar   = dbTableros.filter(t => !excelCodigos.has(t.codigo));
  const paraAgregar    = excelTableros.filter(t => !dbCodigos.has(t.codigo));
  const paraActualizar = excelTableros.filter(t =>  dbCodigos.has(t.codigo));

  console.log('\nPara ACTUALIZAR:', paraActualizar.length);
  console.log('Para INSERTAR:  ', paraAgregar.length);
  if (paraAgregar.length) console.log('  ->', paraAgregar.map(t => t.codigo).join('\n   '));
  console.log('Para ELIMINAR:  ', paraEliminar.length);
  if (paraEliminar.length) console.log('  ->', paraEliminar.map(t => t.codigo).join('\n   '));

  // Upsert todos los del Excel
  const { error: upsertErr } = await supabase
    .from('cot_tableros')
    .upsert(excelTableros, { onConflict: 'codigo' });
  if (upsertErr) throw new Error('Upsert error: ' + upsertErr.message);
  console.log('\nUpsert OK:', excelTableros.length, 'tableros sincronizados.');

  // Eliminar los que no están en el Excel
  if (paraEliminar.length > 0) {
    const idsEliminar = paraEliminar.map(t => t.id);
    const { error: delErr } = await supabase.from('cot_tableros').delete().in('id', idsEliminar);
    if (delErr) throw new Error('Delete error: ' + delErr.message);
    console.log('Eliminados:', paraEliminar.length, 'tableros.');
  } else {
    console.log('Nada que eliminar.');
  }

  const { data: final } = await supabase.from('cot_tableros').select('codigo').order('codigo');
  console.log('\nDB final:', final.length, 'tableros totales.');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
