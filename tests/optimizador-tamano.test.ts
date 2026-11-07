import assert from 'node:assert/strict';
import test from 'node:test';
import {MAX_BYTES_GUARDADO,validarTamanoGuardado} from '../src/app/optimizador/guardados';
test('mantiene margen bajo 1 MB y mide bytes UTF-8 antes del envío',()=>{
  assert(MAX_BYTES_GUARDADO<1024*1024);assert.doesNotThrow(()=>validarTamanoGuardado({nombre:'Pequeña',snapshot:{datos:'x'.repeat(1000)}}));
  assert.throws(()=>validarTamanoGuardado({snapshot:'x'.repeat(1024*1024)}),/límite de 1 MB/);
  assert.throws(()=>validarTamanoGuardado({snapshot:'á'.repeat(MAX_BYTES_GUARDADO/2)}),/No se guardó parcialmente/);
});
