import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getUserAndRole } from '@/lib/auth';
import { type FiltrosPipeline, type RegistroPipeline } from './pipeline';
import { fechaBogota, type DistribucionDashboard } from './dashboard-cotizaciones';
import {referenciaCotizacion} from './referencia-cotizacion';
import {nombreProyectoPipeline} from './pipeline-referencias';
export type ResumenPipeline={total:number;pendientes:number;en_pausa:number;vencidas:number;fobUsd:number;fobCop:number;conteos:Record<string,number>;estados:DistribucionDashboard[]};
export function argumentosPipeline(f:FiltrosPipeline){return {p_q:f.q||null,p_estado:f.estado||null,p_pais:f.pais||null,p_asesor:f.asesor||null,p_estimador:f.estimador||null};}
export async function cargarPipeline(f: FiltrosPipeline, detalle?: string) {
 const {user,rol}=await getUserAndRole();if(!user)throw new Error('No autenticado.');
 const sb=await createClient();const args=argumentosPipeline(f);
 const [resumen,opciones,pagina,seleccion]=await Promise.all([
  sb.rpc('cot_pipeline_resumen',{...args,p_hoy:fechaBogota()}),sb.rpc('cot_pipeline_opciones'),
  sb.rpc('cot_pipeline_filtradas',args).order('fecha_ingreso',{ascending:f.direccion==='asc',nullsFirst:false}).order('id').range((f.pagina-1)*25,f.pagina*25-1),
  detalle&&/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(detalle)?sb.from('cot_pipeline').select('*').eq('id',detalle).maybeSingle():Promise.resolve({data:null,error:null}),
 ]);
 for(const result of [resumen,opciones,pagina,seleccion])if(result.error)throw new Error('No se pudo cargar Pipeline.');
 const r=resumen.data as ResumenPipeline;
 const filas=pagina.data as RegistroPipeline[];const seleccionado=seleccion.data as RegistroPipeline|null;
 const ids=[...new Set([...filas,...(seleccionado?[seleccionado]:[])].flatMap(row=>row.cotizacion_id?[row.cotizacion_id]:[]))];
 const referencias=new Map<string,string>();
 if(ids.length){const quotes=await sb.from('cot_cotizaciones').select('id,codigo,cotizador_por,plantilla_cema').in('id',ids);if(quotes.error)throw new Error('No se pudieron cargar las referencias.');for(const q of quotes.data??[])referencias.set(q.id,referenciaCotizacion(q));}
 const presentar=(row:RegistroPipeline)=>({...row,nombre_proyecto:nombreProyectoPipeline(row.nombre_proyecto,row.codigo),referencia_cotizacion:row.cotizacion_id?referencias.get(row.cotizacion_id)??null:null});
 return {filas:filas.map(presentar),count:r.total,total:r.total,conteos:r.conteos,resumen:r,opciones:opciones.data as Record<string,string[]>,seleccionado:seleccionado?presentar(seleccionado):null,userId:user.id,admin:rol==='admin'};
}
