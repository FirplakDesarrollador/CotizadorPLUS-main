import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPOS_COLOR_HDR, colorPiezaHdr, normalizarColorHdr, construirFilas } from '../src/app/hdr/datosHdr';
import { crearWorkbookHdr } from '../src/app/hdr/excel';
import { calcularMueble } from '../src/lib/engine';

test('color HDR hereda el general, respeta la edición y nunca queda vacío', () => {
  assert.equal(normalizarColorHdr('', ' Roble '), 'Roble');
  assert.equal(normalizarColorHdr('  ', '  '), 'Por definir');
  assert.equal(normalizarColorHdr(undefined), 'Por definir');
  assert.equal(normalizarColorHdr(' Blanco ', 'Roble'), 'Blanco');
});

test('PN80240 y PN82240 imprimen largo 2352 mm y conservan el resto de la fila', () => {
  const tablero = { codigo: 'C18', espesor_mm: 18, precio_m2: 100 };
  for (const [codigo, anchoCm] of [['PN80240', 80], ['PN82240', 82]] as const) {
    const res = { ...calcularMueble({
      dims: { L: anchoCm / 2.54, A: 240 / 2.54, P: 1.8 / 2.54 },
      piezas: [{ nombre: 'panel', rol_tablero: 'frente', formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'A', cantos: {} }],
      reglas: [], preset: { frente: tablero.codigo }, tablerosByCode: { C18: tablero },
      cantosByCalibre: {}, herrajesByCode: {}, herrajesPlantilla: [], consumiblesBySelector: {},
      etiquetasUnd: 0, margen: 0, trm: 4000, desperdicio: 0,
    }), trm: 4000, margen: 0 };
    const [original] = construirFilas(res, [tablero], 'PN', 'PN81240');
    assert.ok(Math.abs(original.largoMm - 2400) < 0.01);
    assert.ok(Math.abs(original.anchoMm - anchoCm * 10) < 0.01);
    assert.deepEqual(construirFilas(res, [tablero], 'PN', codigo), [{ ...original, largoMm: 2352 }]);
  }
});

test('la HDR y el Excel usan el color del rol real y conservan textos largos y ediciones individuales', () => {
  const largo = 'Roble precompuesto mate con veta continua para frente exterior';
  const colores = { caja: ' Blanco ', refuerzo: 'Gris', frente: largo, fondo: 'Natural' };
  const roles = CAMPOS_COLOR_HDR.map(([rol]) => rol);
  const result = { ...calcularMueble({
    dims: { L: 24, A: 30, P: 24 },
    piezas: roles.map(rol => ({ nombre: rol, rol_tablero: rol, formula_cantidad: '1', formula_largo: 'L', formula_ancho: 'P', cantos: {} })),
    reglas: [], preset: Object.fromEntries(roles.map(rol => [rol, 'C18'])),
    tablerosByCode: { C18: { codigo: 'C18', espesor_mm: 18, precio_m2: 100 } },
    cantosByCalibre: {}, herrajesByCode: {}, herrajesPlantilla: [], consumiblesBySelector: {},
    etiquetasUnd: 0, margen: 0, trm: 4000, desperdicio: 0,
  }), trm: 4000, margen: 0 };
  const filas = construirFilas(result, [{ codigo: 'C18', espesor_mm: 18 }])
    .map(fila => ({ ...fila, color: colorPiezaHdr(fila.rol, colores, 'General') }));
  assert.deepEqual(Object.fromEntries(filas.map(fila => [fila.rol, fila.color])), {
    caja: 'Blanco', refuerzo: 'Gris', frente: largo, fondo: 'Natural',
  });
  assert.equal(colorPiezaHdr('frente', colores, 'General', 'Gris pedido especial'), 'Gris pedido especial');
  assert.equal(colorPiezaHdr('gaveta', colores, 'General'), 'General');
  assert.equal(colorPiezaHdr('caja', { caja: '  ' }, 'General'), 'General');

  const hoja = crearWorkbookHdr([{ titulo: 'B24', cantidad: '1', proyecto: 'P', color: 'General', filas }]).getWorksheet('HDR')!;
  const frente = filas.findIndex(fila => fila.rol === 'frente');
  assert.equal(hoja.getCell(`O${frente + 2}`).value, largo);
});

test('Excel conserva proyecto editable y resuelve colores vacíos con la misma regla de HDR', () => {
  const result={...calcularMueble({dims:{L:24,A:30,P:24},piezas:[{nombre:'base',rol_tablero:'caja',formula_cantidad:'2',formula_largo:'L',formula_ancho:'P',cantos:{}}],reglas:[],preset:{caja:'C18'},tablerosByCode:{C18:{codigo:'C18',espesor_mm:18,precio_m2:100}},cantosByCalibre:{},herrajesByCode:{},herrajesPlantilla:[],consumiblesBySelector:{},etiquetasUnd:0,margen:0,trm:4000,desperdicio:0}),trm:4000,margen:0};
  const filas=construirFilas(result,[{codigo:'C18',espesor_mm:18}]);
  const wb=crearWorkbookHdr([{titulo:'B24',cantidad:'2',proyecto:'Proyecto editado',color:' Roble ',filas:filas.map((f,i)=>({...f,color:i===0?'  ':'Blanco'}))},{titulo:'B30',cantidad:'1',proyecto:'Otro proyecto',color:' ',filas:[{...filas[0],color:''}]}]);
  const ws=wb.getWorksheet('HDR')!;
  assert.equal(ws.getCell('N2').value,'Proyecto editado');
  assert.equal(ws.getCell('M2').value,'Roble');
  assert.equal(ws.getCell('O2').value,'Roble');
  assert.equal(ws.getCell('O3').value,'Blanco');
  assert.equal(ws.getCell('M4').value,'Por definir');
  assert.equal(ws.getCell('O4').value,'Por definir');
});
