'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddLineForm from './AddLineForm';
import { actualizarCocinaAction, eliminarCocinaAction, eliminarLineaAction } from '../actions';

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type Linea = { id: string; pref: string | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_total_usd: number; precio_total_cop: number };
type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };
type Tipo = { id: string; pref: string; nombre_es: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

export default function CocinaCard({ cotizacionId, cocina, tipos, recargos, tableros, presetDefault, rolesByTipo, perfiles, perfilDefaultId, herrajesByTipo }:
  { cotizacionId: string; cocina: Cocina; tipos: Tipo[]; recargos: Recargo[]; tableros: Tablero[]; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]>; perfiles: Perfil[]; perfilDefaultId: string; herrajesByTipo: Record<string, HerrajeTipo[]> }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nombre, setNombre] = useState(cocina.nombre);

  async function saveName() {
    await actualizarCocinaAction(cotizacionId, cocina.id, nombre);
    setEditName(false); router.refresh();
  }
  async function delCocina() {
    if (!confirm(`¿Eliminar la cocina "${cocina.nombre}" y sus módulos?`)) return;
    await eliminarCocinaAction(cotizacionId, cocina.id); router.refresh();
  }
  async function delLinea(id: string) {
    await eliminarLineaAction(cotizacionId, id); router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {editName ? (
            <>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm font-semibold" />
              <button onClick={saveName} className="text-sm text-slate-900 font-medium hover:underline">Guardar</button>
              <button onClick={() => { setEditName(false); setNombre(cocina.nombre); }} className="text-sm text-slate-400 hover:underline">Cancelar</button>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-slate-900">🍳 {cocina.nombre}</h3>
              <button onClick={() => setEditName(true)} className="text-xs text-slate-400 hover:text-slate-700 underline">renombrar</button>
              <span className="text-xs text-slate-400">· {cocina.lineas.length} módulo(s)</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <span className="font-semibold text-slate-900">{fmtUSD(cocina.total_usd)}</span>
            <span className="text-slate-400"> · {fmtCOP(cocina.total_cop)}</span>
          </div>
          <button onClick={delCocina} className="text-slate-300 hover:text-red-600" title="Eliminar cocina">🗑</button>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead><tr className="text-left text-slate-400 border-b border-slate-100">
          <th className="px-4 py-2">Módulo</th><th>Descripción</th><th className="text-right">Cant</th>
          <th className="text-right">Unit USD</th><th className="text-right">Total USD</th><th className="text-right px-4">Total COP</th><th></th>
        </tr></thead>
        <tbody>
          {cocina.lineas.length === 0 && <tr><td colSpan={7} className="px-4 py-5 text-center text-slate-400 text-sm">Agrega módulos a esta cocina.</td></tr>}
          {cocina.lineas.map((l) => (
            <tr key={l.id} className="border-b border-slate-50">
              <td className="px-4 py-2 font-medium text-slate-900">{l.pref}</td>
              <td className="text-slate-600">{l.descripcion_es}</td>
              <td className="text-right">{l.cantidad}</td>
              <td className="text-right">{fmtUSD(l.precio_unit_usd)}</td>
              <td className="text-right">{fmtUSD(l.precio_total_usd)}</td>
              <td className="text-right px-4">{fmtCOP(l.precio_total_cop)}</td>
              <td className="px-2"><button onClick={() => delLinea(l.id)} className="text-slate-400 hover:text-red-600" title="Eliminar módulo">✕</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-4 border-t border-slate-100">
        {showAdd ? (
          <div className="space-y-2">
            <AddLineForm cocinaId={cocina.id} tipos={tipos} recargos={recargos} tableros={tableros} presetDefault={presetDefault} rolesByTipo={rolesByTipo} perfiles={perfiles} perfilDefaultId={perfilDefaultId} herrajesByTipo={herrajesByTipo} />
            <button onClick={() => setShowAdd(false)} className="text-sm text-slate-400 hover:underline">Cerrar</button>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">+ Agregar módulo</button>
        )}
      </div>
    </div>
  );
}
