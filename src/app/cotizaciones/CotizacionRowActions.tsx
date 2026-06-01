'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { borrarCotizacionAction, renombrarCotizacionAction } from './actions';

// Acciones por fila en la lista de cotizaciones: renombrar y eliminar.
export default function CotizacionRowActions({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [valor, setValor] = useState(nombre);
  const [busy, setBusy] = useState(false);

  async function guardar() {
    setBusy(true);
    const res = await renombrarCotizacionAction(id, valor.trim() || nombre);
    setBusy(false);
    if (!res.ok) { alert(res.error); return; }
    setEditing(false); router.refresh();
  }
  async function borrar() {
    if (!confirm(`¿Eliminar la cotización "${nombre}" y todo su contenido? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    const res = await borrarCotizacionAction(id);
    setBusy(false);
    if (!res.ok) { alert(res.error); return; }
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-end">
        <input value={valor} onChange={(e) => setValor(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-xs w-40" autoFocus />
        <button onClick={guardar} disabled={busy} className="text-xs text-slate-900 font-medium hover:underline">Guardar</button>
        <button onClick={() => { setEditing(false); setValor(nombre); }} className="text-xs text-slate-400 hover:underline">Cancelar</button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 justify-end">
      <button onClick={() => setEditing(true)} disabled={busy} className="text-xs text-slate-500 hover:text-slate-900">Renombrar</button>
      <button onClick={borrar} disabled={busy} className="text-xs text-slate-400 hover:text-red-600" title="Eliminar cotización">✕</button>
    </div>
  );
}
