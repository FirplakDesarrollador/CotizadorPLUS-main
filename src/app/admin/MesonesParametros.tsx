'use client';

import { useState, useTransition } from 'react';
import { type CatalogoMesones, type MaterialMeson } from '@/lib/mesones';
import { guardarMesonesAction } from './actions';

const campos: Record<keyof CatalogoMesones['parametros'], string> = {
  profundidad: 'Profundidad sugerida (in)', backsplash: 'Altura sugerida de backsplash (in)',
  espesor: 'Espesor sugerido (in)', espesorReforzado: 'Espesor que activa el refuerzo (in)',
  suplementoCanto: 'Ancho de la franja de refuerzo (in)', alturaWaterfall: 'Altura del waterfall (in)',
  merma: 'Merma (%)', margenFpk: 'Margen interno FPK Colombia (%)',
  margenMaquila: 'Margen interno maquila Colombia (%)', margenMaterial: 'Margen comercial de suministro (%)',
  margenProduccion: 'Margen comercial de producción (%)', margenAcabados: 'Margen comercial de acabados (%)',
};
const input = 'mt-1 w-full rounded border border-slate-300 px-2 py-1.5';

export default function MesonesParametros({ inicial }: { inicial: CatalogoMesones }) {
  const [draft, setDraft] = useState(inicial);
  const [mensaje, setMensaje] = useState('');
  const [pendiente, iniciar] = useTransition();
  const cambiar = (id: string, patch: Partial<MaterialMeson>) => setDraft(d => ({
    ...d, materiales: d.materiales.map(m => m.id === id ? { ...m, ...patch } : m),
  }));

  return <form className="space-y-5 rounded-xl border bg-white p-4" onSubmit={e => {
    e.preventDefault();
    iniciar(async () => {
      const r = await guardarMesonesAction(draft);
      setMensaje(r.ok ? 'Catálogo guardado.' : (r.error ?? 'No se pudo guardar.'));
    });
  }}>
    <fieldset disabled={pendiente} className="space-y-5">
      {(['COL', 'US'] as const).map(origen => {
        const col = origen === 'COL';
        const tarifas: (readonly [Exclude<keyof MaterialMeson, 'id' | 'nombre' | 'origen'>, string])[] = [
          ['material', col ? 'Material COP/m²' : 'Material USD/ft²'],
          ...(col ? [['empaque', 'Empaque COP/m²'], ['pulido', 'Pulido COP/m'], ['huecoPulido', 'Perforación pulida COP']] as const : []),
          ['produccion', col ? 'Producción COP/m²' : 'Producción USD/ft²'],
          ['hueco', col ? 'Perforación sin pulir COP' : 'Perforación USD'],
        ];
        return <section key={origen}>
          <h2 className="mb-2 font-semibold">{col ? 'Colombia' : 'USA'}</h2>
          <div className="space-y-2">
            {draft.materiales.filter(m => m.origen === origen).map(m => <div key={m.id} className="grid gap-2 rounded border p-2 sm:grid-cols-3 lg:grid-cols-4">
              <label className="text-xs">Material<input required value={m.nombre} className={input} onChange={e => cambiar(m.id, { nombre: e.target.value })} /></label>
              {tarifas.map(([key, label]) => <label className="text-xs" key={key}>{label}
                <input type="number" step="any" min={key === 'material' ? '0.01' : '0'} value={m[key] ?? ''} placeholder="Sin tarifa" className={input}
                  onChange={e => {
                    const valor = e.target.value;
                    const patch = { [key]: key === 'material' && valor === '' ? null : Number(valor) };
                    cambiar(m.id, !col && key === 'hueco' ? { ...patch, huecoPulido: Number(valor) } : patch);
                  }} />
              </label>)}
            </div>)}
          </div>
          <button type="button" className="mt-2 rounded border px-3 py-1 text-sm" onClick={() => setDraft(d => ({
            ...d, materiales: [...d.materiales, { id: crypto.randomUUID(), origen, nombre: '', material: null,
              empaque: 0, produccion: 0, pulido: 0, huecoPulido: 0, hueco: 0 }],
          }))}>+ Agregar material de {col ? 'Colombia' : 'USA'}</button>
        </section>;
      })}
      <section>
        <h2 className="mb-2 font-semibold">Parámetros de cálculo</h2>
        <p className="mb-3 text-sm text-slate-600">Se usa la TRM de cada cotización. Los cambios se aplican a los mesones que se calculen a partir del guardado.</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(campos) as (keyof typeof campos)[]).map(key => <label key={key} className="text-xs">{campos[key]}
            <input type="number" min="0" max={key.startsWith('margen') ? '99.999' : undefined} step="any" required className={input}
              value={draft.parametros[key]} onChange={e => setDraft(d => ({ ...d, parametros: { ...d.parametros, [key]: Number(e.target.value) } }))} />
          </label>)}
        </div>
      </section>
      <button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">{pendiente ? 'Guardando…' : 'Guardar mesones'}</button>
    </fieldset>
    {mensaje && <p role="status" className="text-sm">{mensaje}</p>}
  </form>;
}
