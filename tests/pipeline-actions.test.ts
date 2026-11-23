import assert from 'node:assert/strict';
import test from 'node:test';
import Module,{createRequire} from 'node:module';
import {CAMPOS_PIPELINE,PRODUCTOS_PIPELINE} from '../src/lib/pipeline-campos';
type Row=Record<string,unknown>;
let rows:Row[]=[];let userId:string|null='dueño';let rol='vendedor';const tablas:string[]=[];let fallo=false;
class Query{
 filtros:Array<[string,unknown]>=[];nuevo?:Row;patch?:Row;
 select(){return this;}eq(k:string,v:unknown){this.filtros.push([k,v]);return this;}single(){return this;}
 insert(v:Row){this.nuevo=v;return this;}update(v:Row){this.patch=v;return this;}
 then(resolve:(r:{data:Row|null;error:{message:string}|null})=>unknown){
  if(fallo)return Promise.resolve({data:null,error:{message:'Error DB'}}).then(resolve);
  if(this.nuevo)rows.push({id:'nuevo',...this.nuevo});
  const row=this.nuevo?rows.at(-1):rows.find(r=>this.filtros.every(([k,v])=>r[k]===v));
  if(row&&this.patch)Object.assign(row,this.patch);
  return Promise.resolve({data:row??null,error:null}).then(resolve);
 }
}
const loader=Module as unknown as {_load:(id:string,...args:unknown[])=>unknown};const original=loader._load;
loader._load=function(id,...args){const n=id.replace(/\\/g,'/');if(n==='server-only')return{};if(n==='next/cache')return{revalidatePath:()=>{}};if(n.includes('/lib/auth'))return{getUserAndRole:async()=>({user:userId?{id:userId}:null,rol})};if(n.includes('/lib/supabase/server'))return{createClient:async()=>({from:(table:string)=>{tablas.push(table);return new Query();}})};return original.call(this,id,...args);};
const api=createRequire(import.meta.url)('../src/app/cotizaciones/pipeline/actions.ts') as typeof import('../src/app/cotizaciones/pipeline/actions');loader._load=original;
function form(){const f=new FormData();for(const c of CAMPOS_PIPELINE)f.set(c.key,c.key==='productos'?PRODUCTOS_PIPELINE[0]:c.opciones?.[0]??(c.tipo==='url'?'https://example.com':c.tipo==='date'?'2026-12-31':c.tipo==='number'?'10':'QA'));return f;}
test('Registrar solo inserta Pipeline, con creador de sesión y estado borrador',async()=>{
 rows=[];tablas.length=0;userId='dueño';rol='vendedor';const r=await api.registrarPipelineAction(null,form());assert.equal(r.ok,true);assert.ok(tablas.every(t=>t==='cot_pipeline'));assert.equal(rows[0].creado_por,'dueño');assert.equal(rows[0].estado,'borrador');assert.equal(rows[0].cotizacion_id,undefined);
});
test('la edición ajena, los campos privilegiados y la sincronización inversa son rechazados',async()=>{
 rows=[{id:'fila',creado_por:'dueño',cliente:'Original',cotizacion_id:null,origen_excel:{original:true},clave_importacion:'INMUTABLE'}];
 userId='otro';assert.equal((await api.editarPipelineAction('fila',{cliente:'Intruso'})).ok,false);assert.equal(rows[0].cliente,'Original');
 userId='dueño';for(const key of ['creado_por','origen_excel','clave_importacion','cotizacion_id'])assert.equal((await api.editarPipelineAction('fila',{[key]:'intruso'})).ok,false);
 rows[0].cotizacion_id='vinculada';assert.equal((await api.editarPipelineAction('fila',{estado:'aprobada'})).ok,false);
 assert.equal(rows[0].clave_importacion,'INMUTABLE');
});
test('se guardan cambios válidos sin perder identidad histórica ni origen; errores no confirman éxito',async()=>{
 rows=[{id:'fila',creado_por:'dueño',cliente:'Original',cotizacion_id:null,origen_excel:{original:true},clave_importacion:'INMUTABLE'}];userId='dueño';rol='vendedor';
 assert.equal((await api.editarPipelineAction('fila',{cliente:'',fecha_ingreso:'',notas:'Edición manual'})).ok,true);assert.equal(rows[0].cliente,null);assert.equal(rows[0].fecha_ingreso,null);assert.equal(rows[0].notas,'Edición manual');assert.deepEqual(rows[0].origen_excel,{original:true});
 fallo=true;assert.equal((await api.editarPipelineAction('fila',{notas:'No persistir'})).ok,false);fallo=false;assert.equal(rows[0].notas,'Edición manual');
 userId=null;assert.equal((await api.registrarPipelineAction(null,form())).ok,false);userId='dueño';
});

test('editar un campo desconocido lo mantiene nulo hasta recibir un valor conocido',async()=>{
 rows=[{id:'fila',creado_por:'dueño',cotizacion_id:null,campos_desconocidos:[]}];userId='dueño';rol='vendedor';
 assert.equal((await api.editarPipelineAction('fila',{instalado:'__desconocido__'})).ok,true);assert.equal(rows[0].instalado,null);assert.deepEqual(rows[0].campos_desconocidos,['instalado']);
 assert.equal((await api.editarPipelineAction('fila',{instalado:'false'})).ok,true);assert.equal(rows[0].instalado,false);assert.deepEqual(rows[0].campos_desconocidos,[]);
 assert.equal((await api.editarPipelineAction('fila',{moneda:'__desconocido__'})).ok,false);
});
