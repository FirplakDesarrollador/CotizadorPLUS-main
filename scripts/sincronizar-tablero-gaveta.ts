/** Preflight por defecto; --apply respalda y modifica solo materiales de gaveta y grupos afectados. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createClient } from '../src/lib/supabase/server';
import { tableroGaveta15, usaTableroGaveta } from '../src/lib/gavetas';
import { cargarCatalogoPrecompilado, cotizarGrupo } from '../src/lib/cotizar';
import { recalcularGrupo, recomputarTotales, inputDesdeLinea, type LineaPersistida } from '../src/lib/cotizaciones';
async function main() {
  const sb = await createClient();
  async function leer(tabla: string) { const rows = []; for (let n=0;;n+=500) { const {data,error}=await sb.from(tabla).select('*').order('id').range(n,n+499); if(error)throw error; rows.push(...data); if(data.length<500)return rows; } }
  const [proyectos,lineas,tipos,tableros,areas,grupos] = await Promise.all(['cot_cotizaciones','cot_cotizacion_lineas','cot_tipos_mueble','cot_tableros','cot_cocinas','cot_grupos_modulos'].map(leer));
  const errores: unknown[]=[];
  const indice=process.argv.indexOf('--equivalencias');
  const equivalencias: Record<string,string>=indice>=0?JSON.parse(fs.readFileSync(process.argv[indice+1],'utf8').replace(/^\uFEFF/,'')):{};
  function elegir(preset: Record<string,string>, contexto: string) {
    const codigo = preset.gaveta || equivalencias[preset.caja] || tableroGaveta15(preset.caja,tableros);
    if (!codigo || Number(tableros.find(t=>t.codigo===codigo)?.espesor_mm)!==15) errores.push({contexto,caja:preset.caja,gaveta:preset.gaveta});
    return codigo;
  }
  const proyectosNuevos=proyectos.map(p=>{
    const config=structuredClone(p.config_default??{});
    if(config.preset?.caja) config.preset.gaveta=elegir(config.preset,p.nombre+' / general');
    for(const key of ['materialesInferiores','materialesSuperiores','materialesCloset','materialesBanos'])if(config[key]?.preset?.caja)config[key].preset.gaveta=elegir(config[key].preset,p.nombre+' / '+key);
    return {original:p,config};
  });
  const afectadas=lineas.filter(l=>usaTableroGaveta(tipos.find(t=>t.id===l.tipo_mueble_id)?.pref));
  const cambios=afectadas.map(l=>({original:l,config:{...l.config,preset:{...l.config?.preset,gaveta:elegir(l.config?.preset??{},l.codigo_modulo||l.id)}}}));
  for(const l of afectadas)if(!l.grupo_id)errores.push({linea:l.id,error:'Sin grupo para recalcular'});
  console.log(JSON.stringify({proyectos:proyectos.length,modulosDB:afectadas.length,errores},null,2));
  if(errores.length)throw new Error('Resolver equivalencias antes de aplicar.');
  const catalogo=await cargarCatalogoPrecompilado();
  for(const id of new Set(afectadas.map(l=>l.grupo_id))){
    const inputs=lineas.filter(l=>l.grupo_id===id).sort((a,b)=>a.posicion_grupo-b.posicion_grupo).map(l=>inputDesdeLinea({...l,config:cambios.find(c=>c.original.id===l.id)?.config??l.config} as LineaPersistida));
    await cotizarGrupo(inputs,catalogo);
  }
  if(!process.argv.includes('--apply'))return;
  const backup=path.join(os.tmpdir(),`cotizador-gavetas-${Date.now()}.json`); fs.writeFileSync(backup,JSON.stringify({proyectos,lineas,areas,grupos}),{flag:'wx'});console.log('Respaldo: '+backup);
  for(const p of proyectosNuevos){const {data,error}=await sb.from('cot_cotizaciones').update({config_default:p.config}).eq('id',p.original.id).eq('updated_at',p.original.updated_at).select('id');if(error||data?.length!==1)throw new Error('Conflicto en proyecto '+p.original.id);}
  for(const c of cambios){const {error}=await sb.from('cot_cotizacion_lineas').update({config:c.config}).eq('id',c.original.id);if(error)throw error;}
  for(const id of new Set(afectadas.map(l=>l.grupo_id)))await recalcularGrupo(id,catalogo);
  for(const id of new Set(afectadas.map(l=>l.cotizacion_id)))await recomputarTotales(id);
  console.log(JSON.stringify({actualizadas:proyectosNuevos.length,recalculados:afectadas.length}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
