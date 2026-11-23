import assert from 'node:assert/strict';
import test from 'node:test';
import {prepararGuardado,leerSnapshotTransportado,validarTamanoGuardado,MAX_BYTES_GUARDADO} from '../src/app/optimizador/guardados';
import {fixtureSnapshot} from './guardados.test';

test('comprime sin pérdida una corrida mayor a 1 MB y conserva toda su información al reconstruirla',async()=>{
  const snapshot=fixtureSnapshot();
  const patron=snapshot.planCorte.proyectoCompleto.materiales[0].esquema.plan.patrones[0];
  snapshot.planCorte.proyectoCompleto.materiales[0].esquema.plan.patrones=Array.from({length:5000},(_,i)=>({...structuredClone(patron),colocaciones:patron.colocaciones.map(c=>({...c,id:`pieza-${i}`,etiqueta:`Gaveta áéíóú ${i}`}))}));
  const datos={nombre:'Optimización grande',snapshot,esquemasAlDia:true,clave:'clave intacta'};
  const original=JSON.stringify(datos);assert(new TextEncoder().encode(original).byteLength>1024*1024);
  assert.throws(()=>validarTamanoGuardado(datos),/1 MB/);
  const envio=await prepararGuardado(datos);assert(new TextEncoder().encode(JSON.stringify(envio)).byteLength<MAX_BYTES_GUARDADO);assert.doesNotThrow(()=>validarTamanoGuardado(envio));
  assert.equal(envio.nombre,datos.nombre);assert.equal(envio.clave,datos.clave);assert.equal(envio.esquemasAlDia,true);
  assert.deepEqual(await leerSnapshotTransportado(envio.snapshot),snapshot);assert.equal(JSON.stringify(datos),original,'no muta ni recorta la corrida original');
});
test('los guardados pequeños y los clientes anteriores siguen usando su snapshot normal',async()=>{
  const snapshot=fixtureSnapshot();const datos={nombre:'Pequeña',snapshot,esquemasAlDia:true,clave:'original'};
  const envio=await prepararGuardado(datos);assert.strictEqual(envio.snapshot,snapshot);assert.strictEqual(await leerSnapshotTransportado(snapshot),snapshot);
});
test('rechaza gzip corrupto y limita los datos descomprimidos para no aceptar expansiones sin límite',async()=>{
  await assert.rejects(leerSnapshotTransportado({transporte:'gzip-base64-v1',contenido:'AAAA'}),/comprimid|gzip/i);
  const bytes=new TextEncoder().encode('"'+'x'.repeat(16*1024*1024)+'"');
  const zipped=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const b64=Buffer.from(zipped).toString('base64');await assert.rejects(leerSnapshotTransportado({transporte:'gzip-base64-v1',contenido:b64}),/15 MB/);
});
