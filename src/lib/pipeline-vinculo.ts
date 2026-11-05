import 'server-only';
import { getUserAndRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
export async function getPipelineParaCrear(id:string) {
 const {user,rol}=await getUserAndRole();if(!user)throw new Error('No autenticado.');
 const sb=await createClient();const {data,error}=await sb.from('cot_pipeline').select('creado_por,cotizacion_id').eq('id',id).single();
 if(error||!data||(data.creado_por!==user.id&&rol!=='admin'))throw new Error('No tienes permiso para crear esta cotización.');
 return data as {creado_por:string|null;cotizacion_id:string|null};
}
