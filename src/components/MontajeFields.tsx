'use client';
import { FUNCIONES_MONTAJE, type MontajeConfig } from '@/lib/visualizacion-config';

const input='w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm';
export default function MontajeFields({value,onChange}:{value:MontajeConfig;onChange:(v:MontajeConfig)=>void}) {
  const set=(patch:Partial<MontajeConfig>)=>onChange({...value,...patch,version:1});
  return <fieldset className="col-span-full border-t border-slate-200 pt-3 mt-2">
    <legend className="text-sm font-medium text-slate-800">Montaje del visualizador</legend>
    <p className="text-xs text-slate-500 mb-2">Coordenadas en mm: X derecha, Y hacia atrás, Z arriba. Cada repetición usa I desde 0 y N como cantidad. X/Y/Z mayúsculas conservan la posición automática. L/A/P son dimensiones del módulo; LP/AP/EP son largo, ancho y espesor de corte; W/D/H son dimensiones orientadas. TC/TF/TB son espesores de caja, frente y fondo.</p>
    <div className="grid sm:grid-cols-3 gap-2">
      <label className="text-xs text-slate-600">Función<select aria-label="Función de montaje" className={input} value={value.funcion??'automatico'} onChange={e=>set({funcion:e.target.value as MontajeConfig['funcion']})}>{FUNCIONES_MONTAJE.map(f=><option key={f} value={f}>{f.replaceAll('_',' ')}</option>)}</select></label>
      <label className="text-xs text-slate-600">Plano<select aria-label="Plano de montaje" className={input} value={value.plano??'XZ'} onChange={e=>set({plano:e.target.value as MontajeConfig['plano']})}><option value="XY">Horizontal (XY)</option><option value="XZ">Frontal / posterior (XZ)</option><option value="YZ">Lateral (YZ)</option></select></label>
      <label className="text-xs text-slate-600">Giro en planta (0/90/180/270°)<input className={input} value={value.giro??0} placeholder="I==0?0:90" onChange={e=>set({giro:e.target.value})}/></label>
      {(['x','y','z'] as const).map(axis=><label key={axis} className="text-xs text-slate-600">Posición {axis.toUpperCase()} (mm)<input aria-label={`Posición ${axis.toUpperCase()} de montaje`} className={input} maxLength={240} placeholder={axis.toUpperCase()} value={value[axis]??''} onChange={e=>set({[axis]:e.target.value})}/></label>)}
      <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={value.intercambiar??false} onChange={e=>set({intercambiar:e.target.checked})}/>Intercambiar largo y ancho en el plano</label>
      <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={value.confirmado??false} onChange={e=>set({confirmado:e.target.checked})}/>Montaje confirmado</label>
      <label className="text-xs text-slate-600 sm:col-span-3">Referencia o nota de montaje<input className={input} maxLength={600} value={value.nota??''} onChange={e=>set({nota:e.target.value})}/></label>
    </div>
  </fieldset>;
}
