import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { consolidarModulosHdr, construirFilas, descripcionModulo, descripcionPiezaPlanaHdr } from '../src/app/hdr/datosHdr';
import { crearWorkbookHdr } from '../src/app/hdr/excel';
import type { ModuloHDR } from '../src/app/hdr/actions';
import { calcularMueble } from '../src/lib/engine';
import { normalizarPlantillasFabricacion } from '../src/lib/reglas-fabricacion';
import { piezasConTableroGaveta, usaTableroGaveta } from '../src/lib/gavetas';
import { especificacionesProyecto } from '../src/lib/materiales-proyecto';

const resultado = () => ({ ...calcularMueble({ dims: { L: 24, A: 30, P: 24 }, piezas: [{ nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: { largos: 2, anchos: 0 } }], reglas: [], preset: { caja: 'C18' }, tablerosByCode: { C18: { codigo: 'C18', precio_m2: 10, espesor_mm: 18 } }, herrajesPlantilla: [], herrajesByCode: {}, cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, trm: 4000, desperdicio: 0 }), trm: 4000, margen: 0 });

test('HDR consolida solo muebles equivalentes entre áreas y multiplica cantidades del área', () => {
  const base: ModuloHDR = { lineaId: 'l1', codigoModulo: 'B24', cocinaNombre: 'Cocina A', cantidad: 2, repeticionesArea: 3, grupoId: 'g1', ok: true, result: resultado() };
  const otro = { ...base, lineaId: 'l2', cocinaNombre: 'Cocina B', cantidad: 4, repeticionesArea: 1, grupoId: 'g2' };
  const distinto = { ...base, lineaId: 'l3', result: { ...resultado(), piezas: resultado().piezas.map(p => ({ ...p, cantoAnchos: 1 })) } };
  const input = structuredClone([base, otro, distinto]);
  const out = consolidarModulosHdr(input);
  assert.equal(out.length, 2);
  assert.equal(out[0].cantidad, 10);
  assert.equal(out[1].cantidad, 6);
  assert.deepEqual(input, [base, otro, distinto]);
});

test('filas HDR no llevan sufijos de material y DB-FE describe solo sus gavetas', () => {
  const res = resultado();
  res.vars = { n_cajones: 3, n_entrepanos: 2, n_puertas: 1 };
  // La descripción debe corresponder a piezas físicas, además de las variables.
  res.piezas.push({ ...res.piezas[0], pieza: 'entrepano', cant: 2 });
  assert.equal(descripcionModulo(res, 'DB-FE'), '3 GAVETAS');
  assert.match(descripcionModulo(res, 'W'), /2 ENTREPAÑOS/);
  assert.equal(construirFilas(res, [{ codigo: 'C18', espesor_mm: 18 }])[0].pieza, 'BASE');
  assert.equal(descripcionPiezaPlanaHdr('PN', 'Paneles Horizontales x12.'), 'PN - Panel Paneles Horizontales x12');
  assert.equal(descripcionPiezaPlanaHdr('F', ' lateral. '), 'F - Filler lateral');
});

test('Excel HDR es una tabla continua numérica y conserva orden, identificación y valores editados', async () => {
  const filas = construirFilas(resultado(), [{ codigo: 'C18', espesor_mm: 18 }]);
  const workbook = crearWorkbookHdr([{ titulo: 'B24 1 PUERTA', cantidad: '5', color: 'Blanco', proyecto: 'Obra', filas: filas.map(f => ({ ...f, color: 'Roble' })) }, { titulo: 'PN4470 PN - Panel lateral', cantidad: '', color: '', proyecto: '', filas: filas.map(f => ({ ...f, color: '' })) }]);
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.deepEqual(reopened.worksheets.map(s => s.name), ['HDR']);
  const sheet = reopened.worksheets[0];
  assert.equal(sheet.rowCount, 3);
  assert.equal(sheet.getCell('A2').value, 'B24 1 PUERTA');
  assert.equal(sheet.getCell('A3').value, 'PN4470 PN - Panel lateral');
  assert.equal(sheet.getCell('D2').value, 609.6);
  assert.equal(typeof sheet.getCell('D2').value, 'number');
  assert.equal(sheet.getCell('L2').value, 5);
  assert.equal(sheet.getCell('L3').value, null);
  assert.equal(sheet.getCell('O2').value, 'Roble');
  assert.ok(sheet.autoFilter);
});

test('DB de una puerta usa la cantidad calculada; DB normal enchapa base de cajón en dos largos y DB-FE usa caja', () => {
  const pieza = { nombre: 'frente', rol_tablero: 'frente', formula_cantidad: '2', formula_largo: '(L-2*RV)/2', formula_ancho: 'A-30/25.4', cantos: {} };
  for (const pref of ['BFD-SMG', 'BFD-SMG-SF', 'SBFD-SMG', 'SBFD-SMG-SF']) {
    const p = normalizarPlantillasFabricacion([pieza], pref)[0];
    assert.equal(p.formula_cantidad, 'n_puertas');
    assert.equal(p.formula_largo, '(L-n_puertas*RV)/n_puertas');
  }
  const cajon = { ...pieza, nombre: 'base_gaveta', rol_tablero: 'gaveta', cantos: { largos: 2, anchos: 2 } };
  assert.deepEqual(normalizarPlantillasFabricacion([cajon], 'DB-SMG')[0].cantos, { largos: 2, anchos: 0 });
  assert.deepEqual(normalizarPlantillasFabricacion([cajon], 'DB-2S-SMG-FE')[0].cantos, { largos: 2, anchos: 2 });
  assert.equal(usaTableroGaveta('DB-FE'), false);
  assert.equal(usaTableroGaveta('DB-SM-FE'), true);
  for (const nombre of ['base_gaveta', 'fondo_gaveta', 'contraparche', 'lateral_gaveta_der', 'lateral_gaveta_izq', 'trasero_gaveta_pequena', 'trasero_gaveta_grande']) assert.equal(piezasConTableroGaveta([{ ...cajon, nombre }], 'DB-FE')[0].rol_tablero, /^(base|fondo)_gaveta$/.test(nombre) ? 'fondo' : 'caja');
});

test('las especificaciones aclaran DB-FE con caja y omiten una personalización de gaveta que ya no aplica', () => {
  const config = { preset: { caja: 'C18', gaveta: 'G15' } };
  const bloques = especificacionesProyecto(config, [], [{ nombre: 'Cocina', lineas: [{ pref: 'DB-FE', config: { preset: config.preset, personalizacionMateriales: { preset: { gaveta: 'G15' } } } }] }]);
  assert.ok(bloques[0].filas.some(([rol]) => rol === 'Tablero Gaveta (15 mm; paredes DB-FE usan caja)'));
  assert.ok(bloques[0].filas.some(([rol]) => rol === 'Fondo de gavetas DB-FE (todas las variantes; mismo tablero del espaldar)'));
  assert.equal(bloques.some(b => b.titulo.startsWith('Selección individual')), false);
  assert.deepEqual(config.preset, { caja: 'C18', gaveta: 'G15' });
});
