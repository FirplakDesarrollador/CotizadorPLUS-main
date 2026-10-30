'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { opcionesFiltro, type FiltrosDashboard } from '@/lib/dashboard-cotizaciones';
import type { OpcionesDashboard } from '@/lib/dashboard-cotizaciones-datos';

const control = 'mt-1 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500';
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function Aplicar() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">{pending ? 'Aplicando…' : 'Aplicar filtros'}</button>;
}

export default function FiltrosDashboardForm({ filtros: f, opciones }: { filtros: FiltrosDashboard; opciones: OpcionesDashboard }) {
  const [rango, setRango] = useState(f.rango);
  return <form action="/cotizaciones/dashboard" method="get" aria-label="Filtros del dashboard" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
      <label className="text-xs font-medium text-slate-600">Rango rápido<select name="rango" value={rango} onChange={e => setRango(e.target.value as FiltrosDashboard['rango'])} className={control}><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="anio">Este año</option><option value="personalizado">Personalizado</option></select></label>
      <label className="text-xs font-medium text-slate-600">Desde<input name="desde" type="date" defaultValue={f.desde} disabled={rango !== 'personalizado'} required className={control}/></label>
      <label className="text-xs font-medium text-slate-600">Hasta<input name="hasta" type="date" defaultValue={f.hasta} disabled={rango !== 'personalizado'} required className={control}/></label>
      <label className="text-xs font-medium text-slate-600">País<select name="pais" defaultValue={f.pais} className={control}><option value="">Todos</option>{opcionesFiltro(opciones.paises, f.pais).map(p => <option key={p}>{p}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-600">Mes<select name="mes" defaultValue={f.mes} className={control}><option value="">Todos</option>{meses.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-600">Año<select name="anio" defaultValue={f.anio} className={control}><option value="">Todos</option>{opcionesFiltro(opciones.anios.map(String), f.anio).map(a => <option key={a}>{a}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-600">Cotizado por<select name="cotizador" defaultValue={f.cotizador} className={control}><option value="">Todos</option><option>FIRPLAK</option><option>CEMA</option></select></label>
      <label className="text-xs font-medium text-slate-600">Estado<select name="estado" defaultValue={f.estado} className={`${control} capitalize`}><option value="">Todos</option>{opcionesFiltro(opciones.estados, f.estado).map(e => <option key={e}>{e}</option>)}</select></label>
    </div>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 text-xs font-medium text-slate-600">Proyecto, cliente o código<input name="q" type="search" maxLength={120} defaultValue={f.q} placeholder="Buscar cotizaciones…" className={control}/></label>
      <label className="text-xs font-medium text-slate-600">Por página<select name="tamano" defaultValue={f.tamano} className={control}><option>25</option><option>50</option><option>100</option></select></label>
      <input type="hidden" name="orden" value={f.orden}/><input type="hidden" name="direccion" value={f.direccion}/>
      <div className="flex items-center gap-2"><Aplicar/><Link href="/cotizaciones/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Limpiar</Link></div>
    </div>
  </form>;
}
