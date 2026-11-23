/** Solo cot_pipeline. Sin --apply es de lectura; vínculos explícitos en --relaciones archivo.json. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createClient} from '../src/lib/supabase/server';
import {nombreProyectoPipeline} from '../src/lib/pipeline-referencias';
async function main(){
 const sb=await createClient();
 async function leer(tabla:string){const rows=[];for(let n=0;;n+=1000){const {data,error}=await sb.from(tabla).select('*').order('id').range(n,n+999);if(error)throw new Error(error.message);rows.push(...data);if(data.length<1000)return rows;}}
 const [pipeline,cotizaciones]=await Promise.all([leer('cot_pipeline'),leer('cot_cotizaciones')]);
 const index=process.argv.indexOf('--relaciones');
 const relaciones:Array<{pipelineId:string;cotizacionId:string}>=index>=0?JSON.parse(fs.readFileSync(process.argv[index+1],'utf8').replace(/^\uFEFF/,'')):[];
 if(new Set(relaciones.map(r=>r.pipelineId)).size!==relaciones.length||new Set(relaciones.map(r=>r.cotizacionId)).size!==relaciones.length)throw new Error('Vínculos duplicados en la propuesta');
 for(const r of relaciones){const p=pipeline.find(p=>p.id===r.pipelineId),q=cotizaciones.find(q=>q.id===r.cotizacionId);if(!p||!q)throw new Error('Relación inexistente');if(p.cotizacion_id&&p.cotizacion_id!==q.id)throw new Error('La oportunidad ya tiene otra cotización');if(pipeline.some(p=>p.cotizacion_id===q.id&&p.id!==r.pipelineId))throw new Error('La cotización ya pertenece a otra oportunidad');}
 const cambios=pipeline.flatMap(row=>{const nombre=nombreProyectoPipeline(row.nombre_proyecto,row.codigo);const relacion=relaciones.find(r=>r.pipelineId===row.id);const q=relacion?cotizaciones.find(q=>q.id===relacion.cotizacionId):null;const patch:Record<string,unknown>={};if(nombre!==row.nombre_proyecto)patch.nombre_proyecto=nombre;if(q){if(row.cotizacion_id!==q.id)patch.cotizacion_id=q.id;if(row.estado!==q.estado)patch.estado=q.estado;}return Object.keys(patch).length?[{row,patch}]:[];});
 console.log(JSON.stringify({pipeline:pipeline.length,cotizaciones:cotizaciones.length,nombres: cambios.filter(c=>'nombre_proyecto'in c.patch).length,vinculos:relaciones.length}));
 if(!process.argv.includes('--apply'))return;
 const backup=path.join(os.tmpdir(),`cotizador-pipeline-referencias-${Date.now()}.json`);fs.writeFileSync(backup,JSON.stringify({pipeline,cotizaciones,relaciones}),{flag:'wx'});console.log(`Respaldo: ${backup}`);
 for(const {row,patch}of cambios){const {data,error}=await sb.from('cot_pipeline').update(patch).eq('id',row.id).eq('updated_at',row.updated_at).select('id');if(error||data?.length!==1)throw new Error(`Se detuvo por conflicto de guardado en ${row.id}`);}
 const finalQuotes=await leer('cot_cotizaciones');if(JSON.stringify(finalQuotes)!==JSON.stringify(cotizaciones))throw new Error('Las cotizaciones cambiaron durante la operación; revisar sin reparar automáticamente');
 console.log(JSON.stringify({actualizadas:cambios.length,cotizacionesIntactas:true}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
