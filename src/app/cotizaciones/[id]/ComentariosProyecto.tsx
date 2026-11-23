'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { agregarComentarioCotizacionAction } from '../actions';
import type { ComentarioCotizacion } from '@/lib/comentarios-cotizacion';

const fechaComentario = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export default function ComentariosProyecto({
  cotizacionId,
  comentarios,
}: {
  cotizacionId: string;
  comentarios: ComentarioCotizacion[];
}) {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar() {
    const limpio = texto.trim();
    if (!limpio || guardando) return;
    setGuardando(true);
    setError(null);
    const result = await agregarComentarioCotizacionAction(cotizacionId, limpio);
    setGuardando(false);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo agregar el comentario.');
      return;
    }
    setTexto('');
    router.refresh();
  }

  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3" open>
      <summary className="cursor-pointer select-none text-sm font-semibold text-slate-800">
        Comentarios{comentarios.length ? ` (${comentarios.length})` : ''}
      </summary>

      <div className="mt-3 space-y-3">
        {comentarios.length > 0 ? (
          <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
            {[...comentarios].reverse().map((comentario) => (
              <article key={comentario.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                <p className="whitespace-pre-wrap text-sm text-slate-700">{comentario.texto}</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {fechaComentario.format(new Date(comentario.creadoEn))}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Esta versión todavía no tiene comentarios.</p>
        )}

        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs text-slate-500">Nuevo comentario</span>
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Escribe un comentario para esta versión…"
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={agregar}
            disabled={guardando || !texto.trim()}
            className="rounded-lg border border-slate-900 bg-white px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:opacity-50"
          >
            {guardando ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">Después de agregarlo no se puede editar.</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </details>
  );
}
