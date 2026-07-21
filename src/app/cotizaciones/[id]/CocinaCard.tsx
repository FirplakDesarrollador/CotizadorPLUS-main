'use client';
import { Fragment, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddLineForm, { type LineaInicial, type ProjectDefaults } from './AddLineForm';
import { actualizarCocinaAction, eliminarCocinaAction, eliminarLineaAction, duplicarLineaAction, cambiarGrupoLineaAction, desagruparGrupoAction, reordenarGruposCocinaAction } from '../actions';
import { colorGrupo, indiceALetras } from '@/lib/module-groups';


const fmtCOP = (n: number) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

type LineaConfig = {
  preset?: Record<string, string>;
  conHerrajes?: boolean;
  recargoPct?: number;
  overrides?: Record<string, number> | null;
  modoFrentes?: 'normal' | 'sin_frentes' | 'solo_frentes';
  herrajesExcluidos?: string[] | null;
  margenOverride?: number;
  cantoFrentes?: string;
  cantoCaja?: string;
};

type Linea = {
  id: string;
  pref: string | null;
  descripcion_es: string | null;
  cantidad: number;
  costo_total_cop?: number;

  precio_unit_usd: number;
  precio_total_usd: number;
  precio_total_cop: number;
  tipo_mueble_id: string;
  largo: number;
  alto: number;
  prof: number;
  unidad_dim: string;
  config: LineaConfig | null;
  grupo_id: string | null;
  posicion_grupo: number;
  codigo_modulo: string | null;
  grupo?: { id: string; orden: number; etiqueta: string; codigo_grupo: string | null; total_cop: number; total_usd: number } | null;
};

type Cocina = { id: string; nombre: string; total_cop: number; total_usd: number; lineas: Linea[] };
type Tipo = { id: string; pref: string; pref_imperial?: string | null; pref_metrico?: string | null; nombre_es: string | null };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

export default function CocinaCard({
  cotizacionId, cocina, allCocinas, tipos, tableros, cantos, presetDefault, rolesByTipo, perfiles, perfilDefaultId, herrajesByTipo, trm, sistemaMedida, projectDefaults
}: {
  cotizacionId: string;
  cocina: Cocina;
  allCocinas: Cocina[];
  tipos: Tipo[];
  tableros: Tablero[];
  cantos: string[];
  presetDefault: Record<string, string>;
  rolesByTipo: Record<string, string[]>;
  perfiles: Perfil[];
  perfilDefaultId: string;
  herrajesByTipo: Record<string, HerrajeTipo[]>;
  trm: number;
  sistemaMedida: 'imperial' | 'metrico';
  projectDefaults?: ProjectDefaults;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState(false);
  const [nombre, setNombre] = useState(cocina.nombre);
  const [groupBusy, setGroupBusy] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Estados de duplicación contextual (Andrés)
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lineaId: string } | null>(null);
  const [promptModal, setPromptModal] = useState<{ lineaId: string, cocinaDestinoId: string, cocinaNombre: string } | null>(null);
  const [promptCant, setPromptCant] = useState('1');

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toInicial = (l: Linea): LineaInicial => ({
    lineaId: l.id,
    tipoId: l.tipo_mueble_id,
    largo: l.largo,
    alto: l.alto,
    prof: l.prof,
    unidad: (l.unidad_dim as 'in' | 'cm' | 'mm') ?? 'in',
    preset: l.config?.preset ?? {},
    conHerrajes: l.config?.conHerrajes ?? true,
    recargoPct: l.config?.recargoPct ?? 0,
    cantidad: l.cantidad,
    modoFrentes: l.config?.modoFrentes ?? 'normal',
    overrides: l.config?.overrides ?? null,
    herrajesExcluidos: l.config?.herrajesExcluidos ?? null,
    // Nuevas configuraciones de Andrés
    margenOverride: l.config?.margenOverride ?? undefined,
    cantoFrentes: l.config?.cantoFrentes ?? undefined,
    cantoCaja: l.config?.cantoCaja ?? undefined,
  });

  const lineaEnEdicion = cocina.lineas.find((l) => l.id === editId) ?? null;

  async function saveName() {
    await actualizarCocinaAction(cotizacionId, cocina.id, nombre);
    setEditName(false);
    router.refresh();
  }

  async function delCocina() {
    if (!confirm(`¿Eliminar la cocina "${cocina.nombre}" y sus módulos?`)) return;
    await eliminarCocinaAction(cotizacionId, cocina.id);
    router.refresh();
  }

  async function delLinea(id: string) {
    await eliminarLineaAction(cotizacionId, id);
    router.refresh();
  }

  async function saveGroup(linea: Linea, value: string, input: HTMLInputElement) {
    const members = cocina.lineas.filter((x) => x.grupo_id === linea.grupo_id).length;
    const current = members > 1 ? `${linea.grupo?.etiqueta ?? ''}${linea.posicion_grupo}` : (linea.grupo?.etiqueta ?? '');
    if (value.trim().toUpperCase() === current) return;
    setGroupBusy(linea.id);
    setGroupError(null);
    const res = await cambiarGrupoLineaAction(linea.id, value);
    setGroupBusy(null);
    if (!res.ok) {
      input.value = current;
      setGroupError(res.error ?? 'No se pudo cambiar el grupo');
    }
    router.refresh();
  }

  async function handleDesagrupar(grupoId: string) {
    if (!grupoId) return;
    setGroupBusy(grupoId);
    setGroupError(null);
    const res = await desagruparGrupoAction(grupoId);
    setGroupBusy(null);
    if (!res.ok) {
      setGroupError(res.error ?? 'No se pudo desagrupar el grupo');
    }
    router.refresh();
  }

  // Estados para Drag and Drop de bloques de grupo

  const [draggedGroupIndex, setDraggedGroupIndex] = useState<number | null>(null);
  const [dragOverGroupIndex, setDragOverGroupIndex] = useState<number | null>(null);
  const [localGroupOrder, setLocalGroupOrder] = useState<string[] | null>(null);

  useEffect(() => {
    setLocalGroupOrder(null);
  }, [cocina.lineas]);

  type GroupBlock = {
    grupoId: string;
    orden: number;
    etiqueta: string;
    codigoGrupo?: string | null;
    totalCop?: number;
    totalUsd?: number;
    lineas: Linea[];
  };

  const rawGroupBlocks: GroupBlock[] = [];
  const groupMap = new Map<string, GroupBlock>();

  for (const l of cocina.lineas) {
    const gid = l.grupo_id ?? l.grupo?.id ?? l.id;
    if (!groupMap.has(gid)) {
      const block: GroupBlock = {
        grupoId: gid,
        orden: l.grupo?.orden ?? 0,
        etiqueta: l.grupo?.etiqueta ?? 'A',
        codigoGrupo: l.grupo?.codigo_grupo,
        totalCop: l.grupo?.total_cop,
        totalUsd: l.grupo?.total_usd,
        lineas: [],
      };
      groupMap.set(gid, block);
      rawGroupBlocks.push(block);
    }
    groupMap.get(gid)!.lineas.push(l);
  }

  const groupBlocks = [...rawGroupBlocks];
  if (localGroupOrder) {
    groupBlocks.sort((a, b) => {
      const ia = localGroupOrder.indexOf(a.grupoId);
      const ib = localGroupOrder.indexOf(b.grupoId);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }

  groupBlocks.forEach((block, idx) => {
    block.etiqueta = indiceALetras(idx);
    block.orden = idx;
  });

  async function handleDrop(targetIndex: number) {
    if (draggedGroupIndex === null || draggedGroupIndex === targetIndex) return;

    const currentIds = groupBlocks.map((g) => g.grupoId);
    const reordered = [...currentIds];
    const [removed] = reordered.splice(draggedGroupIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    setLocalGroupOrder(reordered);
    setDraggedGroupIndex(null);
    setDragOverGroupIndex(null);

    setGroupBusy('reorder');
    const res = await reordenarGruposCocinaAction(cocina.id, reordered);
    setGroupBusy(null);
    if (!res.ok) {
      setLocalGroupOrder(null);
      setGroupError(res.error ?? 'Error al reordenar los muebles');
    } else {
      router.refresh();
    }
  }

  async function handleMoveBlock(fromIndex: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (targetIndex < 0 || targetIndex >= groupBlocks.length) return;

    const currentIds = groupBlocks.map((g) => g.grupoId);
    const reordered = [...currentIds];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    setLocalGroupOrder(reordered);
    setGroupBusy('reorder');
    const res = await reordenarGruposCocinaAction(cocina.id, reordered);
    setGroupBusy(null);
    if (!res.ok) {
      setLocalGroupOrder(null);
      setGroupError(res.error ?? 'Error al reordenar los muebles');
    } else {
      router.refresh();
    }
  }

  const totalCant = cocina.lineas.reduce((acc, l) => acc + Number(l.cantidad || 0), 0);
  const totalCostoUsd = cocina.lineas.reduce((acc, l) => {
    const unitCop = l.costo_total_cop ?? (l as any).breakdown?.costoConHerrajes ?? 0;
    const unitUsd = trm > 0 ? unitCop / trm : 0;
    return acc + (unitUsd * Number(l.cantidad || 0));
  }, 0);

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
          <button onClick={delCocina} className="text-slate-300 hover:text-red-600" title="Eliminar cocina">🗑</button>
        </div>
      </div>

      {groupError && <div className="mx-4 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{groupError}</div>}
      <div className="overflow-x-auto"><table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100/90 text-slate-900 text-xs font-bold border-b border-slate-200">
            <th className="px-2 py-2 text-center w-10"></th>
            <th className="px-4 py-2 text-left uppercase text-slate-700 font-bold tracking-wider" colSpan={3}>
              Totales Cocina
            </th>
            <th className="text-right py-2 font-bold text-slate-800" title="Costo Total USD de la cocina">
              {fmtUSD(totalCostoUsd)}
            </th>
            <th className="text-right py-2 font-bold text-slate-900" title="Cantidad total de módulos">
              {totalCant}
            </th>
            <th className="text-right py-2 text-slate-400 font-normal">
              -
            </th>
            <th className="text-right py-2 font-bold text-slate-900">
              {fmtUSD(cocina.total_usd)}
            </th>
            <th className="text-right px-4 py-2 font-bold text-slate-900">
              {fmtCOP(cocina.total_cop)}
            </th>
            <th className="px-2 py-2"></th>
          </tr>
          <tr className="text-left text-slate-500 border-b border-slate-200 text-xs font-semibold bg-slate-50">
            <th className="px-2 py-2 text-center w-10" title="Arrastrar para reordenar"></th>
            <th className="px-4 py-2">Grupo</th>
            <th>Módulo</th>
            <th>Descripción</th>
            <th className="text-right">Costo USD</th>
            <th className="text-right">Cant</th>
            <th className="text-right">Unit USD</th>
            <th className="text-right">Total USD</th>
            <th className="text-right px-4">Total COP</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cocina.lineas.length === 0 && <tr><td colSpan={10} className="px-4 py-5 text-center text-slate-400 text-sm">Agrega módulos a esta cocina.</td></tr>}
          {groupBlocks.map((block, blockIdx) => {
            const members = block.lineas.length;
            const isDraggingThis = draggedGroupIndex === blockIdx;
            const isDragOverThis = dragOverGroupIndex === blockIdx;

            const groupTotalCant = block.lineas.reduce((acc, l) => acc + Number(l.cantidad || 0), 0);
            const groupTotalCostoUsd = block.lineas.reduce((acc, l) => {
              const unitCop = l.costo_total_cop ?? (l as any).breakdown?.costoConHerrajes ?? 0;
              const unitUsd = trm > 0 ? unitCop / trm : 0;
              return acc + (unitUsd * Number(l.cantidad || 0));
            }, 0);

            return (
              <Fragment key={block.grupoId}>
                {block.lineas.map((l, lineIdx) => {
                  const label = members > 1 ? `${block.etiqueta}${l.posicion_grupo}` : block.etiqueta;
                  const isFirstLine = lineIdx === 0;

                  const unitCostoCop = l.costo_total_cop ?? (l as any).breakdown?.costoConHerrajes ?? 0;
                  const unitCostoUsd = trm > 0 ? unitCostoCop / trm : 0;

                  return (
                    <tr
                      key={l.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', block.grupoId);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedGroupIndex(blockIdx);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverGroupIndex !== blockIdx) {
                          setDragOverGroupIndex(blockIdx);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedGroupIndex(null);
                        setDragOverGroupIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(blockIdx);
                      }}
                      className={`border-b border-slate-50 transition-colors ${colorGrupo(block.orden)} ${
                        isDraggingThis ? 'opacity-40 bg-blue-50' : ''
                      } ${
                        isDragOverThis ? 'border-t-2 border-t-blue-500 bg-blue-50/50' : ''
                      }`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, lineaId: l.id });
                      }}
                    >
                      <td className="px-2 py-2 text-center align-middle cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 select-none">
                        {isFirstLine && (
                          <div className="flex items-center justify-center gap-0.5" title="Arrastra sostenido para reordenar el mueble o grupo">
                            <span className="text-base font-bold leading-none">⋮⋮</span>
                            <div className="flex flex-col text-[9px] leading-tight font-bold">
                              <button
                                type="button"
                                disabled={blockIdx === 0 || groupBusy !== null}
                                onClick={(e) => { e.stopPropagation(); handleMoveBlock(blockIdx, 'up'); }}
                                className="hover:text-blue-600 disabled:opacity-20"
                                title="Mover arriba"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={blockIdx === groupBlocks.length - 1 || groupBusy !== null}
                                onClick={(e) => { e.stopPropagation(); handleMoveBlock(blockIdx, 'down'); }}
                                className="hover:text-blue-600 disabled:opacity-20"
                                title="Mover abajo"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-2">
                        <input
                          key={`${l.id}-${label}`}
                          defaultValue={label}
                          disabled={groupBusy === l.id || groupBusy === 'reorder'}
                          aria-label={`Grupo del módulo ${l.codigo_modulo ?? l.pref ?? ''}`}
                          title="A, B… para bloques; A1, A2… para unir y ordenar"
                          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                          onBlur={(e) => saveGroup(l, e.currentTarget.value, e.currentTarget)}
                          className="w-14 rounded-md border border-slate-300 bg-white/80 px-2 py-1 text-center font-semibold uppercase disabled:opacity-50"
                        />
                      </td>
                      <td className="py-2 font-medium text-slate-900 cursor-context-menu">
                        <div>{l.codigo_modulo ?? l.pref}</div>
                        {members > 1 && block.codigoGrupo && <div className="max-w-48 truncate text-[10px] font-normal text-slate-500" title={block.codigoGrupo}>{block.codigoGrupo}</div>}
                      </td>
                      <td className="text-slate-600">{l.descripcion_es}</td>
                      <td className="text-right font-medium text-slate-700">{fmtUSD(unitCostoUsd)}</td>
                      <td className="text-right">{l.cantidad}</td>
                      <td className="text-right">{fmtUSD(l.precio_unit_usd)}</td>
                      <td className="text-right">{fmtUSD(l.precio_total_usd)}</td>
                      <td className="text-right px-4">{fmtCOP(l.precio_total_cop)}</td>
                      <td className="px-2 whitespace-nowrap text-right">
                        <button onClick={() => { setEditId(l.id); setShowAdd(false); }} className="text-slate-500 hover:text-slate-900 mr-2" title="Editar módulo">Editar</button>
                        <button onClick={() => delLinea(l.id)} className="text-slate-400 hover:text-red-600" title="Eliminar módulo">✕</button>
                      </td>
                    </tr>
                  );
                })}

                {members > 1 && (
                  <tr
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', block.grupoId);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedGroupIndex(blockIdx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverGroupIndex !== blockIdx) {
                        setDragOverGroupIndex(blockIdx);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedGroupIndex(null);
                      setDragOverGroupIndex(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(blockIdx);
                    }}
                    className={`${colorGrupo(block.orden)} border-b border-slate-200 text-xs font-semibold text-slate-600 ${
                      isDraggingThis ? 'opacity-40 bg-blue-50' : ''
                    } ${
                      isDragOverThis ? 'border-b-2 border-b-blue-500 bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="px-2 py-2 text-center align-middle cursor-grab active:cursor-grabbing text-slate-400 select-none">
                      <span className="text-base font-bold leading-none">⋮⋮</span>
                    </td>
                    <td className="px-4 py-2 text-left">
                      <button
                        type="button"
                        disabled={groupBusy === block.grupoId}
                        onClick={() => handleDesagrupar(block.grupoId)}
                        className="rounded-md bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-[10px] px-2 py-1 shadow-sm transition-colors disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                        title={`Desagrupar el grupo ${block.etiqueta}`}
                      >
                        Desagrupar
                      </button>
                    </td>
                    <td colSpan={2} className="py-2 text-left">
                      Subtotal grupo {block.etiqueta} · {block.codigoGrupo}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-700">{fmtUSD(groupTotalCostoUsd)}</td>
                    <td className="py-2 text-right font-semibold text-slate-900">{groupTotalCant}</td>
                    <td className="py-2 text-right text-slate-400 font-normal">-</td>
                    <td className="py-2 text-right">{fmtUSD(Number(block.totalUsd ?? 0))}</td>
                    <td className="px-4 py-2 text-right">{fmtCOP(Number(block.totalCop ?? 0))}</td>
                    <td></td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>

      </table></div>

      <div className="p-4 border-t border-slate-100">
        {lineaEnEdicion ? (
          <AddLineForm
            key={lineaEnEdicion.id}
            cocinaId={cocina.id}
            tipos={tipos}
            tableros={tableros}
            cantos={cantos}
            presetDefault={presetDefault}
            rolesByTipo={rolesByTipo}
            perfiles={perfiles}
            perfilDefaultId={perfilDefaultId}
            herrajesByTipo={herrajesByTipo}
            trm={trm}
            sistemaMedida={sistemaMedida}
            projectDefaults={projectDefaults}
            initial={toInicial(lineaEnEdicion)}
            onDone={() => setEditId(null)}
          />
        ) : showAdd ? (
          <div className="space-y-2">
            <AddLineForm
              cocinaId={cocina.id}
              tipos={tipos}
              tableros={tableros}
              cantos={cantos}
              presetDefault={presetDefault}
              rolesByTipo={rolesByTipo}
              perfiles={perfiles}
              perfilDefaultId={perfilDefaultId}
              herrajesByTipo={herrajesByTipo}
              trm={trm}
              sistemaMedida={sistemaMedida}
              projectDefaults={projectDefaults}
            />
            <button onClick={() => setShowAdd(false)} className="text-sm text-slate-400 hover:underline">Cerrar</button>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">+ Agregar módulo</button>
        )}
      </div>

      {/* Menú contextual de click derecho (duplicación de Andrés) */}
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

      {/* Modal de confirmación de cantidad para duplicación */}
      {promptModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 p-4">
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
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
