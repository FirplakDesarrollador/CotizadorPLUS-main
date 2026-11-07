import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarColorHdr, construirFilas } from '../src/app/hdr/datosHdr';
import { crearWorkbookHdr } from '../src/app/hdr/excel';
import { calcularMueble } from '../src/lib/engine';

test('color HDR hereda el general, respeta la edición y nunca queda vacío', () => {
  assert.equal(normalizarColorHdr('', ' Roble '), 'Roble');
  assert.equal(normalizarColorHdr('  ', '  '), 'Por definir');
  assert.equal(normalizarColorHdr(undefined), 'Por definir');
  assert.equal(normalizarColorHdr(' Blanco ', 'Roble'), 'Blanco');
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
