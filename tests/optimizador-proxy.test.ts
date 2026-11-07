import assert from 'node:assert/strict';
import test from 'node:test';
import Module,{createRequire} from 'node:module';
import {NextRequest} from 'next/server';
let llamadas=0;
const loader=Module as unknown as {_load:(id:string,...args:unknown[])=>unknown};const original=loader._load;
loader._load=function(id,...args){if(id.replace(/\\/g,'/').includes('/lib/supabase/middleware'))return{updateSession:async()=>{llamadas++;return new Response('Protegido',{status:307});}};return original.call(this,id,...args);};
const {proxy}=createRequire(import.meta.url)('../src/proxy.ts') as typeof import('../src/proxy');loader._load=original;
test('solo POST exacto del exportador deja autenticar al handler; otras rutas siguen protegidas',async()=>{
  assert.equal((await proxy(new NextRequest('http://localhost/optimizador/export',{method:'POST'}))).status,200);assert.equal(llamadas,0);
  for(const [url,method]of [['/optimizador/export','GET'],['/optimizador','POST'],['/cotizaciones','POST'],['/optimizador/export/otro','POST']])assert.equal((await proxy(new NextRequest('http://localhost'+url,{method}))).status,307);
  assert.equal(llamadas,4);
});
