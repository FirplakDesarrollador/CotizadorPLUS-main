'use client';
import Link from 'next/link';
import { useActionState,useState } from 'react';
import { CAMPOS_PIPELINE, PRODUCTOS_PIPELINE } from '@/lib/pipeline-campos';
import { PAISES_COTIZACION } from '@/lib/ubicacion-cotizacion';
import { registrarPipelineAction } from './actions';
const input='mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400';
export default function RegistroForm() {
 const [result,action,pending]=useActionState(registrarPipelineAction,{ok:false});
 const [productos,setProductos]=useState<string[]>([]);
 const [pais,setPais]=useState('Colombia');
 const paisEsEstadosUnidos=/^(usa|united states|estados unidos)$/i.test(pais.trim());
 const limpiarTarifa=()=>{const input=document.querySelector<HTMLInputElement>('[name="tarifa"]');if(input)input.value='';};
 return <section className="rounded-2xl border border-slate-200 bg-white p-6"><h1 className="text-2xl font-semibold">Registro CEFI</h1><p className="mt-2 text-sm text-slate-500">Registra una oportunidad. Puedes dejar campos sin completar; te pediremos confirmar antes de guardar.</p>
 {result.ok?<div role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">Registro guardado. <Link className="font-semibold underline" href={`/cotizaciones?vista=pipeline&detalle=${result.id}`}>Ver en Pipeline</Link></div>:<form action={action} onSubmit={e=>{if(!window.confirm('¿Está seguro de guardar el registro con esta información? Los campos vacíos se guardarán sin dato.'))e.preventDefault();}} className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Registro CEFI">
 {CAMPOS_PIPELINE.map(c=>{
   if(c.key==='productos')return <fieldset key={c.key} className="md:col-span-2 lg:col-span-3"><legend className="text-sm font-medium">{c.label}</legend><div className="mt-2 flex flex-wrap gap-4">{PRODUCTOS_PIPELINE.map(p=><label key={p} className="flex items-center gap-2 text-sm"><input type="checkbox" name="productos" value={p} checked={productos.includes(p)} onChange={e=>setProductos(current=>e.target.checked?[...current,p]:current.filter(x=>x!==p))}/>{p}</label>)}</div></fieldset>;
   if(c.key==='tipo_tablero')return <div key={c.key} className="md:col-span-2 lg:col-span-3"><p className="text-sm font-medium">{c.label}</p>{productos.map(p=>{const index=PRODUCTOS_PIPELINE.indexOf(p);return <label key={p} className="mb-2 block text-sm">{p}<select name={`tipo_tablero_${index}`} className={input}><option value="">Seleccionar</option>{c.opciones?.map(o=><option key={o}>{o}</option>)}</select></label>})}</div>;
   return <div key={c.key} className={c.tipo==='textarea'?'md:col-span-2 lg:col-span-3':''}><label className="block text-sm font-medium text-slate-700">{c.label}{c.opciones?<select name={c.key} value={c.key==='pais'?pais:undefined} onChange={c.key==='pais'?e=>{setPais(e.target.value);if(!/^(usa|united states|estados unidos)$/i.test(e.target.value.trim()))limpiarTarifa();}:undefined} className={input}><option value="">Seleccionar</option>{(c.key==='pais'?PAISES_COTIZACION:c.opciones).map(o=><option key={o}>{o}</option>)}</select>:c.tipo==='textarea'?<textarea name={c.key} maxLength={10000} rows={3} className={input}/>:<input name={c.key} type={c.tipo??'text'} list={c.key==='pais'?'paises-cefi':undefined} value={c.key==='pais'?pais:undefined} onChange={c.key==='pais'?e=>{setPais(e.target.value);if(!/^(usa|united states|estados unidos)$/i.test(e.target.value.trim()))limpiarTarifa();}:undefined} maxLength={c.key==='pais'?100:10000} step={c.tipo==='number'?'any':undefined} min={c.tipo==='number'?'0':undefined} disabled={c.key==='tarifa'&&!paisEsEstadosUnidos} className={input}/>}</label></div>;
 })}
 <datalist id="paises-cefi">{PAISES_COTIZACION.map(p=><option key={p} value={p}/>)}</datalist><div className="md:col-span-2 lg:col-span-3">{result.error&&<p role="alert" className="mb-3 text-sm text-red-700">{result.error}</p>}<button disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{pending?'Guardando…':'Guardar registro'}</button></div></form>}
 </section>;
}
