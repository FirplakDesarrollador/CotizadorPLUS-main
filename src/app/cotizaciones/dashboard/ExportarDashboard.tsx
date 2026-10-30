'use client';
import { useState, useTransition } from 'react';
import { enlaceDashboard, type FiltrosDashboard } from '@/lib/dashboard-cotizaciones';
import { exportarDashboardAction } from './actions';
import { normalizarBomCsv } from '@/lib/dashboard-csv';

export default function ExportarDashboard({ filtros }: { filtros: FiltrosDashboard }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState('');
  return <div className="max-w-xs"><button type="button" disabled={pendiente} onClick={() => iniciar(async () => {
    setMensaje('');
    try {
      const parametros = Object.fromEntries(new URLSearchParams(enlaceDashboard(filtros).split('?')[1]));
      const resultado = await exportarDashboardAction(parametros);
      if (!resultado.ok) { setMensaje(resultado.error); return; }
      const url = URL.createObjectURL(new Blob([normalizarBomCsv(resultado.csv)], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a'); a.href = url; a.download = resultado.nombre; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMensaje(`${resultado.cantidad} cotizaciones exportadas.`);
    } catch { setMensaje('No se pudo descargar el CSV. Intenta nuevamente.'); }
  })} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/></svg>{pendiente ? 'Exportando…' : 'Exportar CSV'}
  </button>{mensaje && <p role="status" className="mt-1 text-xs text-slate-500">{mensaje}</p>}</div>;
}
