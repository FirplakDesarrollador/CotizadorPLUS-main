'use server';
import { revalidatePath } from 'next/cache';
import { getUserAndRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CAMPOS_PIPELINE, DESCONOCIDO_PIPELINE, validarRegistroPipeline, validarUrlPipeline, validarFechaPipeline } from '@/lib/pipeline-campos';
import { CAMPOS_EXTRA_PIPELINE, NUMEROS_PIPELINE } from '@/lib/pipeline';
import { ESTADOS_COTIZACION } from '@/lib/pipeline-estados';
export async function registrarPipelineAction(_prev: unknown, form: FormData): Promise<{ ok: boolean; error?: string; id?: string }> {
  try {
    const { user } = await getUserAndRole();
    if (!user) throw new Error('No autenticado.');
    const datos = validarRegistroPipeline(form);
    const sb = await createClient();
    const { data, error } = await sb.from('cot_pipeline').insert({ ...datos, creado_por: user.id }).select('id').single();
    if (error) throw new Error('No se pudo guardar el registro.');
    revalidatePath('/cotizaciones');
    return { ok: true, id: data.id };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'No se pudo guardar.' }; }
}

export async function editarPipelineAction(id: string, cambios: Record<string,string>) {
  try {
    const { user,rol }=await getUserAndRole(); if(!user)throw new Error('No autenticado.');
    const sb=await createClient();
    const actual=await sb.from('cot_pipeline').select('*').eq('id',id).single();
    if(actual.error || !actual.data || (actual.data.creado_por!==user.id && rol!=='admin')) throw new Error('No tienes permiso para editar esta oportunidad.');
    const permitidos=new Set([...CAMPOS_PIPELINE.map(c=>c.key),...CAMPOS_EXTRA_PIPELINE]);
    const desconocidos=new Set<string>(actual.data.campos_desconocidos??[]);
    const patch: Record<string,string|number|boolean|null>={};
    for(const [key,raw] of Object.entries(cambios)) {
      if(!permitidos.has(key))throw new Error('Campo no editable.');
      const value=String(raw).trim();if(value.length>10000)throw new Error('Texto demasiado largo.');
      if(value===DESCONOCIDO_PIPELINE){if(!CAMPOS_PIPELINE.find(c=>c.key===key)?.permiteDesconocido)throw new Error('Este campo requiere información conocida.');patch[key]=null;desconocidos.add(key);continue;}
      if(value)desconocidos.delete(key);
      if(key==='estado' && actual.data.cotizacion_id)throw new Error('El estado se cambia desde la cotización vinculada.');
      if(key==='estado' && !(ESTADOS_COTIZACION as readonly string[]).includes(value))throw new Error('Estado inválido.');
      if(key==='moneda' && !['COP','USD'].includes(value))throw new Error('Moneda inválida.');
      if(key==='tipo_cotizacion' && value && !['FIRPLAK','CEMA'].includes(value))throw new Error('Tipo de cotización inválido.');
      if(key==='pais' && (!value || value.length>100))throw new Error('País inválido.');
      if(key==='ciudad' && value.length>160)throw new Error('Ciudad demasiado larga.');
      if(!actual.data.origen_excel && ['cliente','fecha_ingreso'].includes(key) && !value)throw new Error('Cliente y fecha son obligatorios.');
      patch[key]=value||null;
      if(NUMEROS_PIPELINE.includes(key)){const n=value?Number(value):null;if(n!==null&&!Number.isFinite(n))throw new Error('Número inválido.');patch[key]=n;}
      if(['instalado','fase_cotizacion'].includes(key)){if(!['true','false'].includes(value))throw new Error('Valor booleano inválido.');patch[key]=value==='true';}
      if(key.startsWith('link_')||key==='adjunto_url')patch[key]=validarUrlPipeline(value);
      if(key.startsWith('fecha_'))patch[key]=validarFechaPipeline(value);
    }
    if(!Object.keys(patch).length)return {ok:true,row:actual.data};
    const result=await sb.from('cot_pipeline').update({...patch,campos_desconocidos:[...desconocidos]}).eq('id',id).select('*').single();
    if(result.error)throw new Error('No se pudieron guardar los cambios.');
    revalidatePath('/cotizaciones');return {ok:true,row:result.data};
  }catch(e){return {ok:false,error:e instanceof Error?e.message:'Error al guardar.'};}
}
