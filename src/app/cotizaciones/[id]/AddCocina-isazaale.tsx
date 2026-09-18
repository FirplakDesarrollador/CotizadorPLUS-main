'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearCocinaAction } from '../actions';

export default function AddCocina({ cotizacionId }: { cotizacionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);

  async function add() {
    setSaving(true);
    await crearCocinaAction(cotizacionId, nombre.trim());
    setSaving(false); setNombre(''); setOpen(false); router.refresh();
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 w-full">
      + Agregar cocina
    </button>
  );
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
      <input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la cocina (ej. Cocina principal)"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <button onClick={add} disabled={saving} className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50">{saving ? 'Agregando…' : 'Agregar'}</button>
      <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100">Cancelar</button>
    </div>
  );
}
