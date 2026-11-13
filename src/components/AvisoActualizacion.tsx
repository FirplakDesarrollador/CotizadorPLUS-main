'use client';

import { useSyncExternalStore } from 'react';

// Identificador del aviso. Cambiarlo cuando se publique una versión nueva para
// que el mensaje vuelva a mostrarse a quienes ya lo cerraron.
const AVISO_VERSION = '2026-11-13';
const CLAVE = `cotizador-plus:aviso-version:${AVISO_VERSION}`;
const MENSAJE = 'Hola, existe una nueva versión, por favor actualiza';

const oyentes = new Set<() => void>();

function leerVisible(): boolean {
  try {
    return window.localStorage.getItem(CLAVE) !== 'visto';
  } catch {
    // Si el navegador bloquea el almacenamiento, se muestra igual.
    return true;
  }
}

function suscribir(callback: () => void) {
  oyentes.add(callback);
  const alCambiarAlmacenamiento = () => callback();
  window.addEventListener('storage', alCambiarAlmacenamiento);
  return () => {
    oyentes.delete(callback);
    window.removeEventListener('storage', alCambiarAlmacenamiento);
  };
}

function recordarVisto() {
  try {
    window.localStorage.setItem(CLAVE, 'visto');
  } catch {
    // Sin almacenamiento disponible: el aviso se oculta solo en esta vista.
  }
  for (const oyente of oyentes) oyente();
}

export default function AvisoActualizacion() {
  const visible = useSyncExternalStore(suscribir, leerVisible, () => false);

  if (!visible) return null;

  const actualizar = () => {
    recordarVisto();
    window.location.reload();
  };

  return (
    <div
      role="alert"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-900"
    >
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
        <span className="font-medium">{MENSAJE}</span>
        <button
          type="button"
          onClick={actualizar}
          className="rounded-lg bg-amber-600 px-3 py-1 font-semibold text-white hover:bg-amber-700 focus:outline-2 focus:outline-offset-2 focus:outline-amber-700"
        >
          Actualizar ahora
        </button>
        <button
          type="button"
          onClick={recordarVisto}
          aria-label="Cerrar aviso de actualización"
          className="rounded-lg px-2 py-1 font-semibold text-amber-800 hover:bg-amber-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
