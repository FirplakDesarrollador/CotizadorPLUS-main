/** Auditoría de solo lectura del material efectivo y de todas las plantillas DB. */
import { createClient } from '../src/lib/supabase/server';
import { usaTableroGaveta } from '../src/lib/gavetas';
async function main(){
  const sb=await createClient();
  async function leer(tabla:string){const rows=[];for(let n=0;;n+=500){const {data,error}=await sb.from(tabla).select('*').order('id').range(n,n+499);if(error)throw error;rows.push(...data);if(data.length<500)return rows;}}
  const [proyectos,lineas,tipos,piezas,tableros]=await Promise.all(['cot_cotizaciones','cot_cotizacion_lineas','cot_tipos_mueble','cot_piezas_plantilla','cot_tableros'].map(leer));
  const errores:unknown[]=[];const objetivo=new Set(['base_gaveta','trasero_gaveta_pequena','trasero_gaveta_grande']);
  const es15=(codigo:string)=>Number(tableros.find(t=>t.codigo===codigo)?.espesor_mm)===15;
  for(const p of proyectos){const c=p.config_default??{};for(const [key,preset]of [['general',c.preset],...['materialesInferiores','materialesSuperiores','materialesCloset','materialesBanos'].map(key=>[key,c[key]?.preset])])if(preset?.caja&&!es15(preset.gaveta))errores.push({proyecto:p.id,key,gaveta:preset.gaveta});}
  const tiposDB=tipos.filter(t=>usaTableroGaveta(t.pref));const dbIds=new Set(tiposDB.map(t=>t.id));
  const plantillas=piezas.filter(p=>dbIds.has(p.tipo_mueble_id)&&objetivo.has(p.nombre));
  for(const p of plantillas)if(p.rol_tablero!=='gaveta')errores.push({plantilla:p.id,rol:p.rol_tablero});
  const modulos=lineas.filter(l=>dbIds.has(l.tipo_mueble_id));let piezasRevisadas=0;
  for(const l of modulos){
    if(!es15(l.config?.preset?.gaveta))errores.push({linea:l.id,error:'Preset sin 15 mm'});
    const efectivas=(l.breakdown?.piezas??[]).filter((p:{pieza:string;cant:number})=>objetivo.has(p.pieza)&&p.cant>0);
    piezasRevisadas+=efectivas.length;
    if(efectivas.some((p:{rol:string})=>p.rol!=='gaveta'))errores.push({linea:l.id,error:'Pieza con otro rol'});
    if(efectivas.length&&!(l.breakdown?.maderaPorRol??[]).some((m:{rol:string;codigo:string;costo:number})=>m.rol==='gaveta'&&m.codigo===l.config.preset.gaveta&&es15(m.codigo)&&Number.isFinite(m.costo)))errores.push({linea:l.id,error:'Consumo o material calculado incoherente'});
  }
  console.log(JSON.stringify({proyectos:proyectos.length,tipologiasDB:tiposDB.length,plantillas:plantillas.length,modulos:modulos.length,piezasRevisadas,errores},null,2));
  if(errores.length)throw new Error('Hay inconsistencias en Tablero Gaveta.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
