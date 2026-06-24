'use client';
import { useTooltips, toggleTooltips } from '@/lib/useTooltips';

export default function TooltipToggle() {
  const show = useTooltips();
  return (
    <button
      type="button"
      onClick={toggleTooltips}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      title={show ? 'Desactivar tips emergentes' : 'Activar tips emergentes'}
    >
      <span aria-hidden>{show ? '💬' : '🔕'}</span> Tips
    </button>
  );
}
