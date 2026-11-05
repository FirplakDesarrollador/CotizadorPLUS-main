'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { CAMPOS_PIPELINE, PRODUCTOS_PIPELINE } from '@/lib/pipeline-campos';
import { PAISES_COTIZACION } from '@/lib/ubicacion-cotizacion';
import { registrarPipelineAction } from './actions';
export default function RegistroForm() {
  const [result, action, pending] = useActionState(registrarPipelineAction, { ok: false });
  const input = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
  return <section className="rounded-2xl border border-slate-200 bg-white p-6">
    <h1 className="text-2xl font-semibold">Registro CEFI</h1><p className="mt-2 text-sm text-slate-500">Registra una oportunidad. La cotización se crea después desde Pipeline.</p>
    {result.ok ? <div role="status" className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900">Registro guardado. <Link className="font-semibold underline" href={`/cotizaciones?vista=pipeline&detalle=${result.id}`}>Ver en Pipeline</Link></div> :
    <form action={action} className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Registro CEFI">
      {CAMPOS_PIPELINE.map(c => c.key === 'productos' ? <fieldset key={c.key} className="md:col-span-2 lg:col-span-3"><legend className="text-sm font-medium">5. Productos *</legend><div className="mt-2 flex flex-wrap gap-4">{PRODUCTOS_PIPELINE.map(p => <label key={p} className="flex items-center gap-2 text-sm"><input type="checkbox" name="productos" value={p}/>{p}</label>)}</div></fieldset> :
      <label key={c.key} className={`block text-sm font-medium text-slate-700 ${c.tipo === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}`}>{c.label}{c.obligatorio ? ' *' : ''}
        {c.opciones ? <select name={c.key} required={c.obligatorio} defaultValue={c.key === 'moneda' ? 'USD' : c.key === 'instalado' ? 'No' : ''} className={input}><option value="">Seleccionar</option>{c.opciones.map(o => <option key={o}>{o}</option>)}</select> : c.tipo === 'textarea' ? <textarea name={c.key} required={c.obligatorio} maxLength={10000} rows={3} className={input}/> : <input name={c.key} type={c.tipo ?? 'text'} list={c.key === 'pais' ? 'paises-cefi' : undefined} defaultValue={c.key === 'pais' ? 'Colombia' : undefined} required={c.obligatorio} maxLength={c.key === 'pais' ? 100 : 10000} step={c.tipo === 'number' ? 'any' : undefined} min={c.tipo === 'number' ? '0' : undefined} className={input}/>}
      </label>)}
      <datalist id="paises-cefi">{PAISES_COTIZACION.map(p => <option key={p} value={p}/>)}</datalist>
      <div className="md:col-span-2 lg:col-span-3">{result.error && <p role="alert" className="mb-3 text-sm text-red-700">{result.error}</p>}<button disabled={pending} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar registro'}</button></div>
    </form>}
  </section>;
}
