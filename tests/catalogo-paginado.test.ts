import test from 'node:test';
import assert from 'node:assert/strict';
import { leerCatalogoPaginado } from '../src/lib/catalogo-paginado';

test('recupera las piezas posteriores al límite de mil sin duplicados', async()=>{
  const rows=Array.from({length:1013},(_,id)=>({id}));
  const calls:number[][]=[];
  const result=await leerCatalogoPaginado(async(desde,hasta)=>{
    calls.push([desde,hasta]);
    return {data:rows.slice(desde,hasta+1),error:null};
  });
  assert.deepEqual(result.data,rows);
  assert.deepEqual(calls,[[0,999],[1000,1999]]);
});
test('página exacta y catálogo vacío terminan sin omitir filas',async()=>{
  for(const length of [0,1000,2000]) {
    const rows=Array.from({length},(_,id)=>id);
    const result=await leerCatalogoPaginado(async(a,b)=>({data:rows.slice(a,b+1),error:null}));
    assert.deepEqual(result.data,rows);
  }
});
test('un error en otra página falla en vez de cotizar con datos parciales',async()=>{
  await assert.rejects(()=>leerCatalogoPaginado(async(desde)=>desde===0
    ?{data:Array.from({length:1000},(_,id)=>id),error:null}
    :{data:null,error:{message:'fallo de red'}}),/fallo de red/);
});
