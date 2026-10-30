'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UbicacionCotizacion from '@/components/UbicacionCotizacion';
import { actualizarUbicacionCotizacionAction } from '../actions';

export default function UbicacionEditor({ id, pais, ciudad }: { id: string; pais: string; ciudad: string | null }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [paisActual, setPais] = useState(pais);
  const [ciudadActual, setCiudad] = useState(ciudad ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  return <section className="rounded-xl border border-slate-200 bg-white px-4 py-3" aria-label="Ubicación del proyecto">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><p className="text-slate-600">{pais}{ciudad ? ` · ${ciudad}` : ''}</p>
      <button type="button" className="text-xs font-medium text-slate-600 underline hover:text-slate-900" onClick={() => { setPais(pais); setCiudad(ciudad ?? ''); setError(''); setEditando(!editando); }}>{editando ? 'Cancelar' : 'Editar ubicación'}</button></div>
    {editando && <form className="mt-3 space-y-3" onSubmit={async e => {
      e.preventDefault(); setGuardando(true); setError('');
      try {
        const resultado = await actualizarUbicacionCotizacionAction(id, paisActual, ciudadActual);
        if (!resultado.ok) { setError(resultado.error ?? 'No se pudo guardar'); return; }
        setEditando(false); router.refresh();
      } catch { setError('No se pudo guardar la ubicación. Intenta nuevamente.'); }
      finally { setGuardando(false); }
    }}>
      <UbicacionCotizacion pais={paisActual} ciudad={ciudadActual} onPaisChange={setPais} onCiudadChange={setCiudad}/>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={guardando} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{guardando ? 'Guardando…' : 'Guardar ubicación'}</button>
    </form>}
  </section>;
}
