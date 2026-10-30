'use client';
import { useId } from 'react';
import { PAISES_COTIZACION } from '@/lib/ubicacion-cotizacion';

export default function UbicacionCotizacion({ pais, ciudad, onPaisChange, onCiudadChange }: {
  pais: string; ciudad: string; onPaisChange: (pais: string) => void; onCiudadChange: (ciudad: string) => void;
}) {
  const id = useId();
  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400';
  return <div className="grid gap-3 sm:grid-cols-2 md:col-span-2">
    <label className="block"><span className="mb-1 block text-xs text-slate-500">País *</span>
      <input name="pais" list={id} value={pais} onChange={e => onPaisChange(e.target.value)} required maxLength={100} placeholder="Elige o escribe un país" className={input}/>
      <datalist id={id}>{PAISES_COTIZACION.map(p => <option key={p} value={p}/>)}</datalist>
    </label>
    <label className="block"><span className="mb-1 block text-xs text-slate-500">Ciudad (opcional)</span>
      <input name="ciudad" value={ciudad} onChange={e => onCiudadChange(e.target.value)} disabled={!pais.trim()} maxLength={160} placeholder="Ciudad del proyecto" className={input}/>
      {!pais.trim() && <span className="mt-1 block text-xs text-slate-400">Primero elige un país.</span>}
    </label>
  </div>;
}
