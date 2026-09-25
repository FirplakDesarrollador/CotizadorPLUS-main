'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CotizacionVersion } from '@/lib/cotizaciones';
import { guardarVersionCotizacionAction, restaurarVersionCotizacionAction } from '../actions';

const fechaVersion = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
});

export default function VersionesCotizacion({
  cotizacionId,
  versiones,
}: {
  cotizacionId: string;
  versiones: CotizacionVersion[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    setMensaje(null);
    const result = await guardarVersionCotizacionAction(cotizacionId, nombre);
    setGuardando(false);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo guardar la versión');
      return;
    }
    setNombre('');
    setMensaje('Versión guardada.');
    router.refresh();
  }

  async function restaurar(version: CotizacionVersion) {
    const etiqueta = version.nombre?.trim() || `Versión ${version.numero}`;
    if (!window.confirm(`¿Restaurar “${etiqueta}”? Se guardará primero un respaldo automático del estado actual.`)) return;

    setRestaurandoId(version.id);
    setError(null);
    setMensaje(null);
    const result = await restaurarVersionCotizacionAction(cotizacionId, version.id);
    setRestaurandoId(null);
    if (!result.ok) {
      setError(result.error ?? 'No se pudo restaurar la versión');
      return;
    }
    setMensaje(`Versión ${version.numero} restaurada.`);
    router.refresh();
  }

  return (
    <div className="relative" data-tour="versiones">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-expanded={abierto}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Versiones{versiones.length > 0 ? ` (${versiones.length})` : ''}
      </button>

      {abierto && (
        <div className="absolute left-0 z-30 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">Versiones guardadas</h2>
            <p className="text-xs text-slate-500">Crea un punto de retorno con todos los datos del proyecto.</p>
          </div>

          <div className="flex gap-2">
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !guardando) void guardar();
              }}
              maxLength={120}
              placeholder="Nota opcional, ej. Propuesta enviada"
              aria-label="Nombre de la versión"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || restaurandoId !== null}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar versión'}
            </button>
          </div>

          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          {mensaje && <p role="status" className="mt-2 text-sm text-emerald-700">{mensaje}</p>}

          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {versiones.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">Aún no hay versiones guardadas.</p>
            ) : versiones.map((version) => (
              <div key={version.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    v{version.numero} · {version.nombre?.trim() || 'Sin nota'}
                  </p>
                  <p className="text-xs text-slate-500">{fechaVersion.format(new Date(version.created_at))}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restaurar(version)}
                  disabled={guardando || restaurandoId !== null}
                  className="shrink-0 rounded-lg border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {restaurandoId === version.id ? 'Restaurando…' : 'Restaurar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
