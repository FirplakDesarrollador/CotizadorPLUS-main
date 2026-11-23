#!/usr/bin/env node
// Solo INSERT. --apply escribe; sin el flag muestra el preflight completo.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import xlsx from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { mapearFilaPipeline, pendientesImportacion } from '../src/lib/pipeline-importar.mjs';
export async function importarPipeline({archivo='Pipeline CEFI.xlsx',aplicar=false}={}) {
 if(!fs.existsSync(archivo))throw new Error(`No existe ${archivo}. El Excel fuente no está en Git; colócalo en la raíz del proyecto.`);
 for(const filename of ['.env.local','.env'])if(fs.existsSync(filename))for(const line of fs.readFileSync(filename,'utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
 const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const workbook=xlsx.readFile(archivo);const sheet=workbook.Sheets.Cotizaciones;if(!sheet)throw new Error('Falta la hoja Cotizaciones.');
 const values=xlsx.utils.sheet_to_json(sheet,{header:1,defval:null});const encabezados=values[0];const datos=[];const errores=[];let vacias=0;
 for(let i=1;i<values.length;i++){
  const fila=i+1;const celdas=values[i].map((v,col)=>{const c=sheet[xlsx.utils.encode_cell({r:i,c:col})];return c?{columna:col,valor:c.v??null,tipo:c.t,formula:c.f??null,texto:c.w??null,enlace:c.l??null,comentarios:c.c??null}:null;});
  try{const row=mapearFilaPipeline(values[i],{archivo:path.basename(archivo),hoja:'Cotizaciones',fila,encabezados,valores:values[i],celdas});if(row)datos.push(row);else vacias++;}catch(e){errores.push({fila,error:e.message});}
 }
 if(errores.length)throw new Error(JSON.stringify({leidas:values.length-1,errores,insertadas:0}));
 const existentes=[];
 for(let n=0;;n+=1000){const {data,error}=await sb.from('cot_pipeline').select('clave_importacion,codigo,nombre_proyecto,fecha_ingreso,cliente').order('id').range(n,n+999);if(error)throw new Error(error.message);existentes.push(...data);if(data.length<1000)break;}
 const {pendientes,duplicados}=pendientesImportacion(datos,existentes);let insertadas=0;
 if(aplicar)for(let n=0;n<pendientes.length;n+=50){const batch=pendientes.slice(n,n+50);const {error}=await sb.from('cot_pipeline').insert(batch);if(error)throw new Error(JSON.stringify({error:error.message,leidas:values.length-1,insertadas,omitidasDuplicado:duplicados,omitidasVacias:vacias}));insertadas+=batch.length;}
 return {modo:aplicar?'aplicacion':'preflight',leidas:values.length-1,registros:datos.length,insertadas,porInsertar:aplicar?0:pendientes.length,omitidasDuplicado:duplicados,omitidasVacias:vacias,conError:errores.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){importarPipeline({aplicar:process.argv.includes('--apply')}).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e.message);process.exitCode=1;});}
