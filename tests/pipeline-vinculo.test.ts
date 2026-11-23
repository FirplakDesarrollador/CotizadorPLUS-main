import assert from 'node:assert/strict';
import test from 'node:test';
import Module,{createRequire} from 'node:module';
let userId:string|null='dueño';let rol='vendedor';let errorDb=false;let fila:{creado_por:string|null;cotizacion_id:string|null}|null={creado_por:'dueño',cotizacion_id:null};let consultas=0;
const loader=Module as unknown as {_load:(id:string,...args:unknown[])=>unknown};const original=loader._load;
loader._load=function(id,...args){const n=id.replace(/\\/g,'/');if(n==='server-only')return{};if(n.includes('/lib/auth'))return{getUserAndRole:async()=>({user:userId?{id:userId}:null,rol})};if(n.includes('/lib/supabase/server'))return{createClient:async()=>({from:(table:string)=>{assert.equal(table,'cot_pipeline');consultas++;return{select:()=>({eq:(key:string,id:string)=>{assert.equal(key,'id');assert.equal(id,'oportunidad');return{single:async()=>({data:fila,error:errorDb?{message:'Error DB'}:null})};}})};}})};return original.call(this,id,...args);};
const api=createRequire(import.meta.url)('../src/lib/pipeline-vinculo.ts') as typeof import('../src/lib/pipeline-vinculo');loader._load=original;
test('el dueño puede crear y un reintento devuelve el vínculo existente',async()=>{
 userId='dueño';rol='vendedor';fila={creado_por:'dueño',cotizacion_id:null};assert.deepEqual(await api.getPipelineParaCrear('oportunidad'),fila);
 fila={creado_por:'dueño',cotizacion_id:'cotizacion-existente'};assert.equal((await api.getPipelineParaCrear('oportunidad')).cotizacion_id,'cotizacion-existente');
});
test('un vendedor ajeno no puede vincular; admin puede gestionar un histórico sin creador',async()=>{
 userId='otro';rol='vendedor';fila={creado_por:'dueño',cotizacion_id:null};await assert.rejects(api.getPipelineParaCrear('oportunidad'),/No tienes permiso/);
 rol='admin';fila={creado_por:null,cotizacion_id:null};assert.deepEqual(await api.getPipelineParaCrear('oportunidad'),fila);
});
test('sin sesión no se consulta; registros ausentes y errores no se convierten en autorización',async()=>{
 userId=null;consultas=0;await assert.rejects(api.getPipelineParaCrear('oportunidad'),/No autenticado/);assert.equal(consultas,0);
 userId='dueño';rol='vendedor';fila=null;await assert.rejects(api.getPipelineParaCrear('oportunidad'),/No tienes permiso/);
 fila={creado_por:'dueño',cotizacion_id:null};errorDb=true;await assert.rejects(api.getPipelineParaCrear('oportunidad'),/No tienes permiso/);errorDb=false;
});
