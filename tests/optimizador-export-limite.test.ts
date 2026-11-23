import assert from 'node:assert/strict';
import test from 'node:test';
import {fixtureSnapshot} from './guardados.test';
import {MAX_IMAGENES,validarImagenes,diasExportables} from '../src/app/optimizador/guardados';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
test('el límite autorizado admite 150 imágenes, rechaza 151 y conserva 6 MB',()=>{
  assert.equal(MAX_IMAGENES,150);
  const snapshot=fixtureSnapshot();const material=snapshot.planCorte.dias[0].materiales[0];const patron=material.esquema.plan.patrones[0];material.esquema.plan.patrones=Array.from({length:149},()=>structuredClone(patron));
  const imagenes=()=>Object.fromEntries(diasExportables(snapshot).flatMap(d=>d.materiales.flatMap(m=>m.esquema.plan.patrones.map((_,i)=>[`${d.dia}-${m.material}-${i}`,png]))));
  assert.equal(Object.keys(validarImagenes(imagenes(),snapshot)).length,150);
  material.esquema.plan.patrones.push(structuredClone(patron));assert.throws(()=>validarImagenes(imagenes(),snapshot),/150/);
  assert.throws(()=>validarImagenes({'1-G15-0':'data:image/png;base64,'+'A'.repeat(6*1024*1024+1)},snapshot),/6 MB/);
});
