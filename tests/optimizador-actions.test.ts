import assert from 'node:assert/strict';
import test from 'node:test';
import Module,{createRequire} from 'node:module';
import { fixtureSnapshot } from './guardados.test';
type Row=Record<string,unknown>;
let user:{id:string;email:string}|null={id:'usuario-real',email:'real@example.com'};
let insertado:Row|null=null;let columnas='';let visible=true;let permiteBorrar=false;
const id='94daaa25-b226-47e5-9ce8-4a2956bf3a87';
class Query{
  modo='leer';constructor(private tabla:string){}select(c:string){columnas=c;return this;}eq(){return this;}order(){return this;}range(){return this;}maybeSingle(){return this;}single(){return this;}
  insert(r:Row){insertado=r;this.modo='insertar';return this;}delete(){this.modo='borrar';return this;}
  then(resolve:(r:{data:unknown;error:null})=>unknown){let data:unknown=null;if(this.tabla==='cot_cotizaciones')data={id,nombre:'Proyecto real de BD',codigo:'PLUS-42'};else if(this.tabla==='optimizador_guardados')data=this.modo==='insertar'?{...insertado,id:'nuevo',created_at:'2026-11-06T16:17:18.123Z'}:this.modo==='borrar'?(permiteBorrar?[{id}]:[]):visible?{id,resultado:fixtureSnapshot()}:null;return Promise.resolve({data,error:null}).then(resolve);}
}
const loader=Module as unknown as {_load:(id:string,...args:unknown[])=>unknown};const original=loader._load;
loader._load=function(name,...args){const n=name.replace(/\\/g,'/');if(n==='server-only')return{};if(n.includes('/lib/auth'))return{getUserAndRole:async()=>({user,rol:'admin'})};if(n.includes('/lib/supabase/server'))return{createClient:async()=>({auth:{getUser:async()=>({data:{user}})},from:(t:string)=>new Query(t)})};if(n==='../hdr/actions')return{modulosDeCotizacionAction:async()=>[]};return original.call(this,name,...args);};
const req=createRequire(import.meta.url);const api=req('../src/app/optimizador/actions.ts') as typeof import('../src/app/optimizador/actions');const {POST}=req('../src/app/optimizador/export/route.ts') as typeof import('../src/app/optimizador/export/route');loader._load=original;
test('guardado usa identidad real y fecha de BD, valida esquemas vigentes y toma proyecto de la BD',async()=>{
  const snapshot=fixtureSnapshot();const datos={nombre:'Guardado',snapshot,esquemasAlDia:true,clave:JSON.stringify([snapshot.cotizacionId,snapshot.cfg,snapshot.texturaPorMaterial]),autor_id:'falso',autor_email:'falso@example.com',created_at:'1999-01-01'};
  const saved=await api.guardarOptimizacionAction(datos);assert.equal(saved.autor_id,'usuario-real');assert.equal(saved.autor_email,'real@example.com');assert.equal(saved.created_at,'2026-11-06T16:17:18.123Z');assert.equal(saved.proyecto_nombre,'Proyecto real de BD');assert.equal(saved.resultado.cotizacionCodigo,'PLUS-42');assert(!Object.hasOwn(insertado!,'created_at'));
  await assert.rejects(api.guardarOptimizacionAction({...datos,esquemasAlDia:false}),/pendientes/);await assert.rejects(api.guardarOptimizacionAction({...datos,clave:'otra'}),/pendientes/);
  user=null;await assert.rejects(api.guardarOptimizacionAction(datos),/autorizado/);user={id:'usuario-real',email:'real@example.com'};
});
test('eliminar no declara éxito si RLS no devuelve ninguna fila y la exportación exige sesión',async()=>{
  await assert.rejects(api.eliminarOptimizacionAction(id),/No puedes eliminar/);permiteBorrar=true;assert.deepEqual(await api.eliminarOptimizacionAction(id),{ok:true});permiteBorrar=false;
  user=null;assert.equal((await POST(new Request('http://localhost/optimizador/export',{method:'POST'}))).status,403);user={id:'usuario-real',email:'real@example.com'};
  visible=false;assert.equal((await POST(new Request('http://localhost/optimizador/export',{method:'POST',body:JSON.stringify({id,imagenes:{}})}))).status,404);visible=true;
  assert.equal((await POST(new Request('http://localhost/optimizador/export',{method:'POST',body:JSON.stringify({id,imagenes:{},resultado:{autor_email:'falso'}})}))).status,400);
  assert.equal((await POST(new Request('http://localhost/optimizador/export',{method:'POST',headers:{'content-length':String(7*1024*1024)},body:'{}'}))).status,413);
  assert(!columnas.includes('resultado->')||columnas!=='resultado');
});
