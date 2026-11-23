'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLAVE_PRESELECCION_PIPELINE, serializarPreseleccionPipeline } from '@/lib/pipeline-preseleccion';
import type { RegistroPipeline } from '@/lib/pipeline';
export default function CrearDesdePipeline({row}:{row:RegistroPipeline}) {
 const router=useRouter();const [error,setError]=useState('');
 function crear(){try{localStorage.setItem(CLAVE_PRESELECCION_PIPELINE,serializarPreseleccionPipeline({pipelineId:row.id,cliente:row.cliente??'',pais:row.pais,ciudad:row.ciudad??'',nombre_proyecto:row.nombre_proyecto??''}));window.dispatchEvent(new Event('pipeline-preseleccion'));router.push(`/cotizaciones?pipeline=${row.id}`);}catch{setError('No se pudo guardar la preselección en este navegador.');}}
 return <div><button type="button" onClick={crear} className="rounded border border-slate-300 px-4 py-2 text-sm">Crear cotización</button>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
