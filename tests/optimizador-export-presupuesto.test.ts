import assert from 'node:assert/strict';
import test from 'node:test';
import {generarImagenesConPresupuesto,dimensionesRaster} from '../src/app/optimizador/imagenes';
import {MAX_BYTES_IMAGENES} from '../src/app/optimizador/guardados';
test('reduce resolución y conserva las 129 claves cuando el máximo inicial supera 6 MB',async()=>{
  const claves=Array.from({length:129},(_,i)=>`1-M-${i}`);const resoluciones:number[]=[];
  // Simula el peso del PNG; la codificación real se verifica en navegador.
  const out=await generarImagenesConPresupuesto(claves,async(_key,max)=>{resoluciones.push(max);return 'data:image/png;base64,'+'A'.repeat(max===2400?60000:30000);});
  assert.deepEqual(Object.keys(out),claves);assert(resoluciones.includes(2400));assert(resoluciones.includes(1800));assert(Object.values(out).reduce((n,s)=>n+s.length,0)<=MAX_BYTES_IMAGENES);
  assert.deepEqual(dimensionesRaster(2440,1830,1800),{ancho:1800,alto:1350});assert.deepEqual(dimensionesRaster(2440,1830),{ancho:2400,alto:1800});
});
test('aborta sin resultado parcial si ni la menor resolución cabe, y rechaza 151 imágenes antes de rasterizar',async()=>{
  await assert.rejects(generarImagenesConPresupuesto(['1-M-0'],async()=> 'A'.repeat(MAX_BYTES_IMAGENES+1)),/6 MB/);
  let llamadas=0;await assert.rejects(generarImagenesConPresupuesto(Array.from({length:151},(_,i)=>String(i)),async()=>{llamadas++;return 'PNG';}),/150/);assert.equal(llamadas,0);
});
