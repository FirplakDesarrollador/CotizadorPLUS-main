import { useSyncExternalStore } from 'react';

/**
 * Los tips emergentes arrancan **apagados** en cada carga de la app: quien ya
 * conoce el simulador no quiere burbujas al pasar el mouse por los campos, y
 * quien las necesita las enciende con el botón.
 *
 * La preferencia **no se guarda** a propósito. Encenderlos vale para la sesión en
 * curso, y al volver a abrir la app vuelven a estar apagados.
 */
export const TIPS_ACTIVOS_POR_DEFECTO = false;

let globalShowTooltips: boolean = TIPS_ACTIVOS_POR_DEFECTO;
const listeners = new Set<(val: boolean) => void>();

export function toggleTooltips() {
  globalShowTooltips = !globalShowTooltips;
  listeners.forEach((l) => l(globalShowTooltips));
}

/** Estado actual, fuera de React. */
export function tooltipsActivos(): boolean {
  return globalShowTooltips;
}

/** Deja los tips como al abrir la app. Para pruebas y para el arranque. */
export function resetTooltips() {
  globalShowTooltips = TIPS_ACTIVOS_POR_DEFECTO;
  listeners.forEach((l) => l(globalShowTooltips));
}

/** Avisa de cada cambio. Devuelve la funcion para darse de baja. */
export function suscribirTooltips(fn: (val: boolean) => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/**
 * El estado vive fuera de React —lo cambia un boton desde cualquier pantalla— asi
 * que se lee con `useSyncExternalStore`: se suscribe, lee el valor actual al
 * montar y no necesita un efecto que llame a setState.
 */
export function useTooltips(): boolean {
  return useSyncExternalStore(suscribirTooltips, tooltipsActivos, () => TIPS_ACTIVOS_POR_DEFECTO);
}

