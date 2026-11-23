import assert from 'node:assert/strict';
import test from 'node:test';
import {referenciaCotizacion} from '../src/lib/referencia-cotizacion';
test('usa el código o la referencia ya impresa por Cotizador PLUS sin generar uno nuevo',()=>{
 assert.equal(referenciaCotizacion({id:'d91c087e-9125-493d-8dfa-fade3340b8cf',codigo:null}),'D91C087E');
 assert.equal(referenciaCotizacion({id:'irrelevante',codigo:' PLUS-25 '}),'PLUS-25');
 assert.equal(referenciaCotizacion({id:'irrelevante',codigo:'PLUS',cotizador_por:'CEMA',plantilla_cema:{quoteReference:' CEMA-40 '}}),'CEMA-40');
});
