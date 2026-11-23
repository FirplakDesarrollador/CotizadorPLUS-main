import assert from 'node:assert/strict';
import test from 'node:test';
import {leerPreseleccionPipeline,serializarPreseleccionPipeline} from '../src/lib/pipeline-preseleccion';
test('round trip de preselección solo conserva los cinco datos autorizados',()=>{
 const original={pipelineId:'f2390000-0000-4000-8000-000000000001',cliente:'Cliente & Cía',pais:'México',ciudad:'León',nombre_proyecto:'Proyecto CEFI',moneda:'COP',trm:9999,preset:{caja:'NO'}};
 assert.deepEqual(leerPreseleccionPipeline(serializarPreseleccionPipeline(original)),{pipelineId:original.pipelineId,cliente:original.cliente,pais:original.pais,ciudad:original.ciudad,nombre_proyecto:original.nombre_proyecto});
});
test('datos locales corruptos no precargan ni cambian el formulario normal',()=>{
 assert.equal(leerPreseleccionPipeline('{'),null);assert.equal(leerPreseleccionPipeline('{"pipelineId":"no uuid"}'),null);assert.equal(leerPreseleccionPipeline(null),null);
});
