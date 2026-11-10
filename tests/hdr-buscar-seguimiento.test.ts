import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import Module, { createRequire } from 'node:module';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calcularMueble } from '../src/lib/engine';
import { entradasSeguimiento, coincideNombreHdr, GRUPOS_SEGUIMIENTO } from '../src/app/hdr/seguimiento';
import { crearWorkbookSeguimiento, generarArchivoSeguimiento, descargarSeguimiento, ACTIVIDADES_SEGUIMIENTO, ENCABEZADOS_CODIGOS } from '../src/app/hdr/seguimientoExcel';
import { tituloModuloHdr } from '../src/app/hdr/datosHdr';
import type { ModuloHDR } from '../src/app/hdr/actions';

const calc = { dims: { L: 20, A: 30, P: 24 }, piezas: [{ nombre: 'base', rol_tablero: 'caja', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P' }], reglas: [], preset: { caja: 'C15' }, tablerosByCode: { C15: { codigo: 'C15', espesor_mm: 15, precio_m2: 100 } }, herrajesPlantilla: [], herrajesByCode: {}, cantosByCalibre: {}, consumiblesBySelector: {}, etiquetasUnd: 0, margen: 0, trm: 4000, desperdicio: 0 };
const resultado = { ...calcularMueble(calc), trm: 4000, margen: 0 };
const modulo = (codigo: string, pref: string, extra: Partial<ModuloHDR> = {}): ModuloHDR => ({ lineaId: codigo, codigoModulo: codigo, nombreDescriptivo: 'Descripción exacta', pref, cantidad: 99, cocinaNombre: 'Cocina', grupoId: null, ok: true, result: resultado, ...extra } as ModuloHDR);
const tipos = [{ pref: 'SVFDH-SMG-SF', categoria: 'vanity' }];

test('seguimiento ordena por seis familias y conserva cualquier diferencia del nombre exacto', () => {
  const modulos = [modulo('PN20', 'PN'), modulo('F20', 'F'), modulo('W30', 'W'), modulo('B20', 'B'), modulo('B10', 'B'), modulo('BAÑO', 'SVFDH-SMG-SF'), modulo('CC20', 'CC'), modulo('B20', 'B', { lineaId: 'otra-area', cocinaNombre: 'Otra cocina', cantidad: 1 }), modulo('b20', 'B'), modulo('W18-L', 'W-SM'), modulo('W18-R', 'W-SM')];
  const antes = structuredClone(modulos);
  const entradas = entradasSeguimiento(modulos, tipos);
  assert.deepEqual([...new Set(entradas.map(e => e.grupo))], [...GRUPOS_SEGUIMIENTO]);
  assert.equal(entradas.length, modulos.length - 1);
  assert.equal(entradas[0].nombre, tituloModuloHdr(modulos[4]));
  assert.equal(entradas.filter(e => e.nombre === tituloModuloHdr(modulos[3])).length, 1);
  for (const codigo of ['b20', 'W18-L', 'W18-R']) assert.ok(entradas.some(e => e.nombre === `${codigo} Descripción exacta`));
  assert.ok(entradas.every(e => Object.keys(e).sort().join() === 'grupo,nombre'));
  assert.deepEqual(modulos, antes);
});

test('clóset por sección y panel/filler conservan su clasificación propia; el grupo conserva el nombre HDR', () => {
  const grupo = modulo('GRUPO B20 + B30', '', { pref: undefined, nombreDescriptivo: 'A1: 1 PUERTA | A2: 2 PUERTAS', result: { ...resultado, piezas: resultado.piezas.map(p => ({ ...p, contextoHdr: { pref: 'B', conFondo: false } })) } });
  const entradas = entradasSeguimiento([grupo, modulo('B20', 'B', { cocinaNombre: 'Walk-in closet' }), modulo('PN20', 'PN', { cocinaNombre: 'Closet' }), modulo('F20', 'F', { cocinaNombre: 'Closet' })], []);
  assert.equal(entradas[0].nombre, tituloModuloHdr(grupo));
  assert.deepEqual(entradas.map(e => e.grupo), ['Inferiores', 'Clósets', 'Fillers', 'Paneles']);
  assert.throws(() => entradasSeguimiento([modulo('ERROR', 'B', { ok: false, error: 'Falta tablero' })], []), /muebles con error/);
});

test('dos nombres que difieren en una tilde o en un espacio interno no se fusionan', () => {
  const base = modulo('B20', 'B');
  const entradas = entradasSeguimiento([base, { ...base, lineaId: 'b', nombreDescriptivo: 'Descripcion exacta' }, { ...base, lineaId: 'c', nombreDescriptivo: 'Descripción  exacta' }], []);
  assert.equal(entradas.length, 3);
  assert.deepEqual(new Set(entradas.map(e => e.nombre)), new Set(['B20 Descripción exacta', 'B20 Descripcion exacta', 'B20 Descripción  exacta']));
});

test('la búsqueda acepta nombre completo y parcial sin perder tildes en el resultado', () => {
  const m = modulo('W18-L', 'W-SM');
  assert.equal(coincideNombreHdr(m, tituloModuloHdr(m)), true);
  assert.equal(coincideNombreHdr(m, 'descripcion W18'), true);
  assert.equal(coincideNombreHdr(m, 'W18-R'), false);
  assert.equal(coincideNombreHdr(m, 'otra cosa'), false);
});

test('cambiar de cotización cancela una descarga anterior antes de acceder al navegador', async () => {
  await assert.doesNotReject(descargarSeguimiento(entradasSeguimiento([modulo('B20', 'B')], []), 'Proyecto anterior', () => false));
});

test('Excel replica fases y actividades pendientes, asigna responsables y mantiene Códigos vacío sin cantidades', async () => {
  const entradas = entradasSeguimiento([modulo('B10', 'B'), modulo('W20', 'W'), modulo('V20', 'V'), modulo('CC20', 'CC'), modulo('F20', 'F'), modulo('PN20', 'PN')], []);
  const wb = crearWorkbookSeguimiento(entradas);
  const recargado = new ExcelJS.Workbook();
  await recargado.xlsx.load(await wb.xlsx.writeBuffer());
  assert.deepEqual(recargado.worksheets.map(w => w.name), ['Seguimiento', 'Códigos']);
  const s = recargado.getWorksheet('Seguimiento')!, c = recargado.getWorksheet('Códigos')!;
  assert.equal(s.getCell('B1').value, 'DISEÑO');
  assert.equal(s.getCell('L1').value, 'EMPAQUE');
  assert.equal(s.getCell('S1').value, 'ENTREGA');
  assert.deepEqual((s.getRow(3).values as unknown[]).slice(1), ['Actividad', ...ACTIVIDADES_SEGUIMIENTO]);
  assert.deepEqual((c.getRow(1).values as unknown[]).slice(1), ENCABEZADOS_CODIGOS);
  const nombresS: string[] = [], nombresC: string[] = [];
  for (let r = 4; r <= s.rowCount; r++) {
    const nombre = s.getCell(r, 1).value;
    if (entradas.some(e => e.nombre === nombre)) {
      nombresS.push(String(nombre));
      for (let col = 2; col <= 19; col++) { assert.equal(s.getCell(r, col).value, null); assert.equal(s.getCell(r, col).font.color?.argb, 'FF70AD47'); assert.equal(s.getCell(r, col).alignment.horizontal, 'center'); }
    }
  }
  for (let r = 2; r <= c.rowCount; r++) {
    const nombre = c.getCell(r, 2).value;
    if (entradas.some(e => e.nombre === nombre)) {
      nombresC.push(String(nombre));
      for (const col of [1, 3, 4, 5, 6, 7, 8, 9]) assert.equal(c.getCell(r, col).value, null);
    }
  }
  assert.deepEqual(nombresS, entradas.map(e => e.nombre));
  assert.deepEqual(nombresC, nombresS);
  assert.equal(s.views[0].state, 'frozen');
  for (let col = 2; col <= 7; col++) assert.equal(s.getCell(2, col).value, 'Angie/Lizeth');
  for (let col = 8; col <= 11; col++) assert.equal(s.getCell(2, col).value, 'Elias');
  for (let col = 12; col <= 18; col++) assert.equal(s.getCell(2, col).value, 'Mariana/Liz/Angie/Elias');
  assert.equal(s.getCell('S2').value, 'Angie/Liz');
  for (const ws of recargado.worksheets) ws.eachRow(r => r.eachCell(cell => { assert.notEqual(cell.type, ExcelJS.ValueType.Formula); assert.notEqual(cell.type, ExcelJS.ValueType.Error); }));
});

test('el archivo descargado deja actividades vacías para marcar manualmente sin controles ni booleanos', async () => {
  const entradas = entradasSeguimiento([modulo('B20', 'B'), modulo('W20', 'W')], []);
  const zip = await JSZip.loadAsync(await generarArchivoSeguimiento(entradas));
  assert.equal(zip.file('xl/featurePropertyBag/featurePropertyBag.xml'), null);
  const xml = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
  assert.doesNotMatch(xml, /t="b"/);
  assert.doesNotMatch(await zip.file('xl/styles.xml')!.async('string'), /xfComplement/);
  const recargado = new ExcelJS.Workbook();
  await recargado.xlsx.load(await zip.generateAsync({ type: 'arraybuffer' }));
  const hoja = recargado.getWorksheet('Seguimiento')!;
  for (const fila of [5, 7]) for (let col = 2; col <= 19; col++) assert.equal(hoja.getCell(fila, col).value, null);
  assert.equal(hoja.getCell('S2').value, 'Angie/Liz');
  assert.equal(recargado.getWorksheet('Códigos')!.getCell('B3').value, entradas[0].nombre);
});

let rol = 'admin', catalogos = 0, lecturas = 0;
const linea = (id: string, grupo_id: string | null) => ({ id, grupo_id, tipo_mueble_id: 'b', pref: 'B', codigo_modulo: 'B20', config: {}, cantidad: 1 });
const loader = Module as unknown as { _load: (name: string, ...args: unknown[]) => unknown }, old = loader._load;
loader._load = function(name, ...args) {
  if (name === 'server-only') return {};
  if (name.includes('/lib/auth')) return { getUserAndRole: async () => ({ rol }) };
  if (name.includes('admin/diseno/actions')) return { previewAction: async () => ({ ok: true, result: resultado }) };
  if (name.includes('/lib/cotizaciones')) return { listarCotizaciones: async () => [{ id: 'q1', nombre: 'Proyecto 1' }, { id: 'q2', nombre: 'Proyecto 2' }, { id: 'fallo', nombre: 'Proyecto con error' }], inputDesdeLinea: () => ({ tipoId: 'b' }), getCotizacion: async (id: string) => { lecturas++; if (id === 'fallo') throw Error('Sin acceso'); return { cocinas: [{ nombre: 'Cocina', lineas: id === 'q1' ? [linea('a', 'g'), linea('b', 'g')] : [linea('c', null)] }], lineasSinCocina: [] }; } };
  if (name.includes('/lib/cotizar')) return { cargarCatalogoPrecompilado: async () => { catalogos++; return {}; }, prepararCotizacion: async () => ({ calc, trm: 4000, margen: 0 }), cotizarGrupo: async () => ({ lineas: [0, 1].map(() => ({ ...resultado, piezas: resultado.piezas.map(p => ({ ...p, cant: 0.5, compartida: true, claveFusion: 'base' })) })), preparados: [{ calc, margen: 0 }, { calc, margen: 0 }], largoTotalIn: 40, laterales: 3, uniones: 1, piezasContinuas: ['base'] }) };
  return old.call(this, name, ...args);
};
const actions = createRequire(import.meta.url)('../src/app/hdr/actions.ts') as typeof import('../src/app/hdr/actions');
const HdrBuscador = (createRequire(import.meta.url)('../src/app/hdr/HdrBuscador.tsx') as typeof import('../src/app/hdr/HdrBuscador')).default;
loader._load = old;

test('la pantalla presenta HDR, Consumos, Seguimiento y Buscar/Crear en el orden solicitado', () => {
  const html = renderToStaticMarkup(createElement(HdrBuscador, { tipos: [], tableros: [], presetDefault: {}, cotizaciones: [] }));
  const etiquetas = ['Generar desde una cotización guardada', '>Consumos</h2>', '>Seguimiento</h2>', '>Buscar/Crear</h2>', 'Buscar mueble creado en cotizaciones', '>Buscar</button>', 'Tipo De Mueble', '>Crear</button>'];
  let anterior = -1;
  for (const texto of etiquetas) { const actual = html.indexOf(texto); assert.ok(actual > anterior, `Orden o contenido incorrecto: ${texto}`); anterior = actual; }
  assert.equal(html.includes('Buscar por tipo y medidas'), false);
});

test('buscar en cotizaciones reutiliza catálogo, conserva el grupo físico y expone errores sin escribir', async () => {
  const r = await actions.buscarMueblesHdrAction('B20');
  assert.equal(catalogos, 1); assert.equal(lecturas, 3);
  assert.equal(r.muebles.length, 2);
  const grupo = r.muebles.find(m => m.cotizacionId === 'q1')!.modulo;
  assert.ok(grupo.ok); assert.equal(grupo.origenes?.length, 2); assert.equal(grupo.result.piezas[0].cant, 1);
  assert.match(r.errores[0], /Proyecto con error/);
  assert.deepEqual(await actions.buscarMueblesHdrAction('  '), { muebles: [], errores: [] });
  assert.equal(catalogos, 1);
  rol = 'vendedor';
  try { await assert.rejects(actions.buscarMueblesHdrAction('B20'), /Solo administradores/); } finally { rol = 'admin'; }
});
