import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { crearWorkbook, MAX_BYTES_IMAGENES, nombreArchivo, type GuardadoOptimizador } from '../guardados';

export const runtime='nodejs';
export async function POST(req:Request){
  const sb=await createClient();const {data:{user}}=await sb.auth.getUser();
  if(!user)return new Response('No autorizado',{status:403});
  const max=MAX_BYTES_IMAGENES+64*1024;
  if(Number(req.headers.get('content-length'))>max)return new Response('Las imágenes superan el límite total de 6 MB.',{status:413});
  try{
    const reader=req.body?.getReader();if(!reader)return new Response('Cuerpo requerido',{status:400});
    const chunks:Uint8Array[]=[];let bytes=0;
    for(;;){const {value,done}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max){await reader.cancel();return new Response('Las imágenes superan el límite total de 6 MB.',{status:413});}chunks.push(value);}
    const body=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {id?:unknown;imagenes?:unknown};
    if(!body||typeof body!=='object'||typeof body.id!=='string'||Object.keys(body).some(k=>k!=='id'&&k!=='imagenes'))return new Response('Solo se admite id e imágenes.',{status:400});
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))return new Response('No encontrado',{status:404});
    const {data,error}=await sb.from('optimizador_guardados').select('*').eq('id',body.id).maybeSingle();
    if(error)return new Response('No autorizado o guardado no disponible',{status:error.code==='42501'?403:404});
    if(!data)return new Response('No encontrado',{status:404});
    const workbook:ExcelJS.Workbook=await crearWorkbook(data as GuardadoOptimizador,body.imagenes);
    const buffer=await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="${nombreArchivo(data as GuardadoOptimizador)}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }catch(e){return new Response(e instanceof Error?e.message:'Exportación inválida',{status:400});}
}
