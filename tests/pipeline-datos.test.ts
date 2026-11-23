import assert from 'node:assert/strict';
import test from 'node:test';
import Module,{createRequire} from 'node:module';
import {filtrosPipeline,enlacePipeline} from '../src/lib/pipeline';
let filasSimuladas:Record<string,unknown>[]=[];let autenticado=true;let errorDb=false;const llamadas:Array<{nombre:string;args:unknown;rango?:number[];orden:string[]}> = [];
class Query{
 llamada:typeof llamadas[number];constructor(nombre:string,args:unknown){this.llamada={nombre,args,orden:[]};llamadas.push(this.llamada);}
 order(key:string){this.llamada.orden.push(key);return this;}range(a:number,b:number){this.llamada.rango=[a,b];return this;}
 then(resolve:(r:{data:unknown;error:{message:string}|null})=>unknown){const data=this.llamada.nombre==='cot_pipeline_resumen'?{total:437,conteos:{borrador:4}}:this.llamada.nombre==='cot_pipeline_opciones'?{pais:['Colombia'],asesor:[],estimador:[]}:filasSimuladas;return Promise.resolve({data,error:errorDb?{message:'Error DB'}:null}).then(resolve);}
}
const loader=Module as unknown as {_load:(id:string,...args:unknown[])=>unknown};const original=loader._load;
loader._load=function(id,...args){const n=id.replace(/\\/g,'/');if(n==='server-only')return{};if(n.includes('/lib/auth'))return{getUserAndRole:async()=>({user:autenticado?{id:'dueño'}:null,rol:'vendedor'})};if(n.includes('/lib/supabase/server'))return{createClient:async()=>({rpc:(name:string,args:unknown)=>new Query(name,args),from:(tabla:string)=>{assert.equal(tabla,'cot_cotizaciones');return{select:()=>({in:(key:string,ids:string[])=>{assert.equal(key,'id');assert.deepEqual(ids,['d91c087e-9125-493d-8dfa-fade3340b8cf']);return Promise.resolve({data:[{id:ids[0],codigo:null,cotizador_por:'FIRPLAK'}],error:null});}})};}})};return original.call(this,id,...args);};
const api=createRequire(import.meta.url)('../src/lib/pipeline-datos.ts') as typeof import('../src/lib/pipeline-datos');loader._load=original;
test('filtros, monitor y página comparten argumentos seguros; orden y rango son estables',async()=>{
 const f=filtrosPipeline({pq:' Cliente 100% ',ppais:'Colombia',pestado:'en_pausa',pasesor:'Asesor',pestimador:'Estimador',ppagina:'2'});llamadas.length=0;
 const r=await api.cargarPipeline(f);assert.equal(r.total,437);
 const tabla=llamadas.find(c=>c.nombre==='cot_pipeline_filtradas')!;assert.deepEqual(tabla.rango,[25,49]);assert.deepEqual(tabla.orden,['fecha_ingreso','id']);assert.deepEqual(tabla.args,{p_q:'Cliente 100%',p_estado:'en_pausa',p_pais:'Colombia',p_asesor:'Asesor',p_estimador:'Estimador'});
 const resumen=llamadas.find(c=>c.nombre==='cot_pipeline_resumen')!.args as Record<string,unknown>;const {p_hoy,...otros}=resumen;assert.match(String(p_hoy),/^\d{4}-\d{2}-\d{2}$/);assert.deepEqual(otros,tabla.args);
 const url=new URL(enlacePipeline(f,3),'https://test.local');assert.equal(url.searchParams.get('vista'),'pipeline');assert.equal(filtrosPipeline(Object.fromEntries(url.searchParams)).pagina,3);
});
test('sin sesión no se consulta Pipeline y los fallos de BD no se muestran como un monitor vacío',async()=>{
 autenticado=false;llamadas.length=0;await assert.rejects(api.cargarPipeline(filtrosPipeline({})),/No autenticado/);assert.equal(llamadas.length,0);autenticado=true;
 errorDb=true;await assert.rejects(api.cargarPipeline(filtrosPipeline({})),/No se pudo cargar/);errorDb=false;
 assert.equal(filtrosPipeline({ppagina:'-1',pestado:'cerrada',pdireccion:'drop table'}).pagina,1);assert.equal(filtrosPipeline({pestado:'cerrada'}).estado,'');
});

test('el Código es la referencia PLUS vinculada o null; el origen no se modifica',async()=>{
 filasSimuladas=[{id:'p',codigo:'26098',nombre_proyecto:'26098 - Proyecto',cotizacion_id:'d91c087e-9125-493d-8dfa-fade3340b8cf'},{id:'otra',codigo:'26000',nombre_proyecto:'26000 - Pendiente',cotizacion_id:null}];
 const original=structuredClone(filasSimuladas);const r=await api.cargarPipeline(filtrosPipeline({}));
 assert.equal(r.filas[0].referencia_cotizacion,'D91C087E');assert.equal(r.filas[0].nombre_proyecto,'Proyecto');assert.equal(r.filas[1].referencia_cotizacion,null);assert.deepEqual(filasSimuladas,original);filasSimuladas=[];
});