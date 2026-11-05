import assert from 'node:assert/strict';
import test from 'node:test';
import {fechaSerialExcel,montoExcel,mapearFilaPipeline,pendientesImportacion} from '../src/lib/pipeline-importar.mjs';
test('seriales Excel usan origen 1899-12-30, ignoran hora y preservan fecha desconocida',()=>{
 assert.equal(fechaSerialExcel(0),'1899-12-30');assert.equal(fechaSerialExcel(45714),'2025-02-26');assert.equal(fechaSerialExcel(45714.9),'2025-02-26');assert.equal(fechaSerialExcel(null),null);assert.throws(()=>fechaSerialExcel('Sep'),/inválida/);
 assert.equal(fechaSerialExcel('27/04/02026'),'2026-04-27');assert.equal(fechaSerialExcel('-'),null);
});
test('mapeo conserva fuente íntegra, tipo de origen, cliente desconocido y tasas auxiliares',()=>{
 const r:Array<unknown>=Array(39).fill(null);Object.assign(r,{0:45714,3:'25028',4:'Proyecto',5:'En Pausa',11:'USA',19:'USD 28.678,5',27:'Si',31:'TEOWIN',37:'Sep',38:4100});const origen={valores:r};
 const out=mapearFilaPipeline(r,origen)!;assert.equal(out.cliente,null);assert.equal(out.trm,null);assert.equal(out.estado,'en_pausa');assert.equal(out.monto_fob_usd,28678.5);assert.equal(out.tipo_cotizacion,null);assert.equal(out.tipo_origen,'TEOWIN');assert.equal(out.origen_excel,origen);assert.equal(out.fase_cotizacion,true);
 assert.equal(mapearFilaPipeline(Array(39).fill(null),{}),null);assert.equal(montoExcel(null),0);assert.throws(()=>montoExcel('por confirmar'),/ambiguo/);
});
test('la segunda corrida inserta cero incluso después de editar los datos importados',()=>{
 const r:Array<unknown>=Array(39).fill(null);Object.assign(r,{3:'X',4:'Proyecto',9:'Cliente'});const one=mapearFilaPipeline(r,{valores:r})!;
 const primera=pendientesImportacion([one],[]);assert.equal(primera.pendientes.length,1);
 const editado={...one,nombre_proyecto:'Cambio manual',cliente:'Nuevo cliente'};
 const segunda=pendientesImportacion([one],[editado]);assert.equal(segunda.pendientes.length,0);assert.equal(segunda.duplicados,1);
 assert.deepEqual(editado,{...one,nombre_proyecto:'Cambio manual',cliente:'Nuevo cliente'});
});
