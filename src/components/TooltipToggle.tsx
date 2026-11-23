'use client';
import { useTooltips, toggleTooltips } from '@/lib/useTooltips';

/**
 * Enciende y apaga los tips emergentes de los campos.
 *
 * Arranca **apagado** en cada carga de la app (`TIPS_ACTIVOS_POR_DEFECTO`) y el
 * botón muestra en cuál de los dos estados está: en oscuro cuando está encendido,
 * delineado cuando no. Antes se veía igual en ambos —solo cambiaba el emoji— y no
 * había forma de saber si los tips estaban puestos sin pasar el mouse por un campo.
 */
export default function TooltipToggle() {
  const show = useTooltips();
  return (
    <button
      type="button"
      onClick={toggleTooltips}
      aria-pressed={show}
      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        show
          ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-700'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
      }`}
      title={show ? 'Tips activos: pasa el mouse por un campo para verlos. Clic para desactivarlos.' : 'Activar los tips emergentes de los campos'}
    >
      <span aria-hidden>{show ? '💬' : '🔕'}</span> Tips
    </button>
  );
}
