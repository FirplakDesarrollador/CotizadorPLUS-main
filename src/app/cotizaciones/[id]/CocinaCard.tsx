'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddLineForm from './AddLineForm';
import { actualizarCocinaAction, eliminarCocinaAction, eliminarLineaAction, duplicarLineaAction } from '../actions';
import { useEffect } from 'react';
import type { ProjectDefaults } from './ProjectConfigPanel';

const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type Linea = { id: string; pref: string | null; descripcion_es: string | null; cantidad: number; precio_unit_usd: number; precio_total_usd: number; precio_total_cop: number };
type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };
type Tipo = { id: string; pref: string; nombre_es: string | null };
type Recargo = { id: string; cliente_nombre: string; recargo_pct: number };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };

export default function CocinaCard({ cotizacionId, cocina, allCocinas, tipos, recargos, tableros, cantos, presetDefault, rolesByTipo, projectDefaults }:
  { cotizacionId: string; cocina: Cocina; allCocinas: Cocina[]; tipos: Tipo[]; recargos: Recargo[]; tableros: Tablero[]; cantos: string[]; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]>; projectDefaults?: ProjectDefaults }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nombre, setNombre] = useState(cocina.nombre);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lineaId: string } | null>(null);
  const [promptModal, setPromptModal] = useState<{ lineaId: string, cocinaDestinoId: string, cocinaNombre: string } | null>(null);
  const [promptCant, setPromptCant] = useState('1');

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

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
            <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50" onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, lineaId: l.id });
            }}>
              <td className="px-4 py-2 font-medium text-slate-900 cursor-context-menu">{l.pref}</td>
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
            <AddLineForm cocinaId={cocina.id} tipos={tipos} recargos={recargos} tableros={tableros} cantos={cantos} presetDefault={presetDefault} rolesByTipo={rolesByTipo} projectDefaults={projectDefaults} />
            <button onClick={() => setShowAdd(false)} className="text-sm text-slate-400 hover:underline">Cerrar</button>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">+ Agregar módulo</button>
        )}
      </div>
      {contextMenu && (
        <div
          className="fixed z-50 bg-white border border-slate-200 shadow-xl rounded-lg py-1 text-sm w-48"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase">Copiar a:</div>
          {allCocinas.filter(c => c.id !== cocina.id).length === 0 && <div className="px-3 py-2 text-slate-400">No hay otras cocinas</div>}
          {allCocinas.filter(c => c.id !== cocina.id).map(c => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
              onClick={(e) => {
                 e.stopPropagation();
                 setContextMenu(null);
                 setPromptCant('1');
                 setPromptModal({ lineaId: contextMenu.lineaId, cocinaDestinoId: c.id, cocinaNombre: c.nombre });
              }}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}
      
      {promptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-5 space-y-4 border border-slate-100">
            <h3 className="font-semibold text-slate-900 text-sm">
              ¿Qué cantidad de este mueble deseas enviar a {promptModal.cocinaNombre}?
            </h3>
            <input 
              type="number" 
              min="1"
              value={promptCant} 
              onChange={e => setPromptCant(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              autoFocus
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const cant = parseInt(promptCant, 10);
                  if (!isNaN(cant) && cant > 0) {
                     setPromptModal(null);
                     await duplicarLineaAction(promptModal.lineaId, promptModal.cocinaDestinoId, cotizacionId, cant);
                     router.refresh();
                  }
                }
              }}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPromptModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
              <button 
                onClick={async () => {
                  const cant = parseInt(promptCant, 10);
                  if (!isNaN(cant) && cant > 0) {
                     setPromptModal(null);
                     await duplicarLineaAction(promptModal.lineaId, promptModal.cocinaDestinoId, cotizacionId, cant);
                     router.refresh();
                  }
                }} 
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
