import assert from 'node:assert/strict';
import test from 'node:test';
import { dimensionesRaster, svgDePatron } from '../src/app/optimizador/imagenes';
test('el SVG de Patron mínimo incluye piezas y sobrantes sin recursos externos',()=>{
  const svg=svgDePatron({repeticiones:1,areaPiezasMm2:200,desperdicioPct:50,colocaciones:[{id:'p',etiqueta:'A & B',grupo:1,x:5,y:6,largoMm:20,anchoMm:10,girada:false}],sobrantes:[{x:30,y:6,largoMm:10,anchoMm:10,reutilizable:true}]},100,80);
  assert(svg.includes('A &amp; B'));assert(svg.includes('viewBox="0 0 100 80"'));assert(svg.includes('x="30"'));assert(svg.includes('(1)'));assert(!/href|<image|<script|foreignObject/.test(svg));assert.deepEqual(dimensionesRaster(100,80),{ancho:200,alto:160});
});
