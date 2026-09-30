'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CotizacionVersion } from '@/lib/cotizaciones';
import { guardarVersionCotizacionAction, restaurarVersionCotizacionAction } from '../actions';

const fechaFormat = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeZone: 'America/Bogota',
});

const horaFormat = new Intl.DateTimeFormat('es-CO', {
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

  // Ordenar de forma defensiva: más reciente primero
  const versionesOrdenadas = [...versiones].sort((a, b) => {
    const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return diff !== 0 ? diff : b.numero - a.numero;
  });

  async function guardar() {
    if (guardando || restaurandoId !== null) return;

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError('El nombre de la versión es obligatorio.');
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);

    try {
      const result = await guardarVersionCotizacionAction(cotizacionId, nombreLimpio);
      if (!result.ok) {
        setError(result.error ?? 'No se pudo guardar la versión');
        setGuardando(false);
        return;
      }
      setNombre('');
      setMensaje('Versión guardada correctamente.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar la versión');
    } finally {
      setGuardando(false);
    }
  }

  async function restaurar(version: CotizacionVersion) {
    if (guardando || restaurandoId !== null) return;

    const etiqueta = version.nombre?.trim() || `Versión ${version.numero}`;
    if (!window.confirm(`¿Cargar la versión “${etiqueta}”? Los datos del proyecto se reemplazarán con este snapshot.`)) {
      return;
    }

    setRestaurandoId(version.id);
    setError(null);
    setMensaje(null);

    try {
      const result = await restaurarVersionCotizacionAction(cotizacionId, version.id);
      if (!result.ok) {
        setError(result.error ?? 'No se pudo cargar la versión');
        setRestaurandoId(null);
        return;
      }
      // Limpia cualquier estado residual del frontend recargando de forma autocontenida
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar la versión');
      setRestaurandoId(null);
    }
  }

  const nombreValido = nombre.trim().length > 0;

  return (
    <div className="relative" data-tour="versiones">
      <button
        type="button"
        onClick={() => {
          setAbierto((valor) => !valor);
          setError(null);
          setMensaje(null);
        }}
        aria-expanded={abierto}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Versiones{versionesOrdenadas.length > 0 ? ` (${versionesOrdenadas.length})` : ''}
      </button>

      {abierto && (
        <div className="absolute left-0 z-30 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-3">
            <h2 className="font-semibold text-slate-900">Versiones guardadas</h2>
            <p className="text-xs text-slate-500">Crea manualmente un snapshot inmutable de todo el proyecto.</p>
          </div>

          <div className="flex gap-2">
            <input
              value={nombre}
              onChange={(event) => {
                setNombre(event.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !guardando && nombreValido) {
                  void guardar();
                }
              }}
              maxLength={120}
              placeholder="Nombre de la versión (ej. Propuesta inicial)"
              aria-label="Nombre de la versión"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || restaurandoId !== null || !nombreValido}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar versión'}
            </button>
          </div>

          {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
          {mensaje && <p role="status" className="mt-2 text-sm text-emerald-700">{mensaje}</p>}

          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {versionesOrdenadas.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                Aún no hay versiones guardadas para este proyecto.
              </p>
            ) : (
              versionesOrdenadas.map((version) => {
                const fecha = fechaFormat.format(new Date(version.created_at));
                const hora = horaFormat.format(new Date(version.created_at));
                const estaRestaurando = restaurandoId === version.id;

                return (
                  <div
                    key={version.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 hover:bg-slate-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {version.nombre?.trim() || `Versión ${version.numero}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        <span>{fecha}</span> · <span>{hora}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => restaurar(version)}
                      disabled={guardando || restaurandoId !== null}
                      className="shrink-0 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {estaRestaurando ? 'Cargando…' : 'Cargar'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
