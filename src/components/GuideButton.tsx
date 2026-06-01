'use client';
import { useState } from 'react';
import 'driver.js/dist/driver.css';

export type GuideStep = { selector?: string; title: string; description: string };

// Botón que lanza una guía interactiva paso a paso (resalta elementos de la UI con tooltips).
export default function GuideButton({ steps, label = 'Guía', className }: { steps: GuideStep[]; label?: string; className?: string }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const { driver } = await import('driver.js');
    setLoading(false);
    const d = driver({
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Listo',
      progressText: '{{current}} de {{total}}',
      steps: steps.map((s) => ({
        element: s.selector,
        popover: { title: s.title, description: s.description, side: 'bottom', align: 'start' },
      })),
    });
    d.drive();
  }

  return (
    <button onClick={start} disabled={loading}
      className={className ?? 'inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100'}>
      <span aria-hidden>💡</span> {loading ? 'Cargando…' : label}
    </button>
  );
}
