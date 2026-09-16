'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { cotizarGrupoAction } from './actions';
import {
  getModuloValues,
  moduloFromValues,
  useSimuladorStore,
  type SimuladorModulo,
  type SimuladorModuloValues,
} from '@/store/simuladorStore';
import type { CotizarGrupoResult, CotizarInput } from '@/lib/cotizar';
import GuideButton from '@/components/GuideButton';
import TooltipToggle from '@/components/TooltipToggle';
import UndoRedoButtons from '@/components/UndoRedoButtons';
import Campo from '@/components/Campo';
import Combobox from '@/components/Combobox';
import MuebleVisualizer from '@/components/MuebleVisualizer';
import { TIPS_COTIZADOR } from '@/lib/tooltips';
import { DB_TIPOLOGIAS, DB_RIELES, PCFD_CONFIGURACIONES, SISTEMAS_FRENTE, permiteRemovible, orientarPieza, nombrePieza, type SistemaFrente } from '@/lib/muebles';
import { codigoComercial, codigoGrupo, type SistemaMedida } from '@/lib/module-groups';

// Conversión exacta entre unidades vía milímetros.
const TO_MM: Record<'in' | 'cm' | 'mm', number> = { in: 25.4, cm: 10, mm: 1 };
const convertir = (v: number, de: 'in' | 'cm' | 'mm', a: 'in' | 'cm' | 'mm') =>
  Math.round((v * TO_MM[de]) / TO_MM[a] * 1e6) / 1e6;

type Tipo = { id: string; pref: string; nombre_es: string | null; categoria: string | null; margen_key: string | null };
type Tablero = { codigo: string; proveedor: string | null; sustrato: string | null; espesor_mm: number | null; color_nombre: string | null; precio_m2: number | null };
type Perfil = { id: string; nombre: string; descripcion: string | null; valores: Record<string, string> };
type HerrajeTipo = { rol: string; codigo: string | null };

const fmtCOP = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const fmtUSD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

const ROL_LABEL: Record<string, string> = { caja: 'caja', refuerzo: 'refuerzos', frente: 'frente', fondo: 'fondo' }

const getCantoMatch = (cantos: string[], target: string) =>
  cantos.find((c) => c.toLowerCase() === target.toLowerCase()) ??
  cantos.find((c) => c.replace(',', '.').toLowerCase() === target.replace(',', '.').toLowerCase()) ??
  target;

const subscribeHydration = () => () => {};
const clientHydrationSnapshot = () => true;
const serverHydrationSnapshot = () => false;

const GUIA_SIMULADOR = [
  { title: 'Simulador de muebles', description: 'Calcula un módulo individual o varios módulos fabricados como un solo mueble combinado.' },
  { selector: '[data-tour="tipo"]', title: '1. Tipo de mueble', description: 'Elige el tipo (base, superior, vanity, torre…). Cada tipo tiene su despiece propio validado.' },
  { selector: '[data-tour="dims"]', title: '2. Dimensiones', description: 'Ingresa Largo, Alto y Profundidad, y elige la unidad (pulgadas, cm o mm).' },
  { selector: '[data-tour="tableros"]', title: '3. Tableros', description: 'Elige el material por rol: caja, refuerzos, frente y fondo. Define el costo de la madera.' },
  { selector: '[data-tour="opciones"]', title: '4. Opciones', description: 'Ajusta puertas, cajones, modo de frentes y herrajes para este módulo.' },
  { selector: '[data-tour="calcular"]', title: '5. Calcular o combinar', description: 'Calcula el conjunto actual o usa “+ Agregar módulo” para confirmar este y abrir el siguiente con la configuración heredada.' },
  { selector: '[data-tour="resultado"]', title: '6. Resultado', description: 'Verás un solo precio y desglose consolidado para todo el mueble combinado.' },
];

export default function CotizadorForm({ tipos, tableros, trmDefault, presetDefault, rolesByTipo, perfiles, perfilDefaultId, herrajesByTipo, cantos }:
  { tipos: Tipo[]; tableros: Tablero[]; trmDefault: number; presetDefault: Record<string, string>; rolesByTipo: Record<string, string[]>; perfiles: Perfil[]; perfilDefaultId: string; herrajesByTipo: Record<string, HerrajeTipo[]>; cantos: string[] }) {

  const sbfd = tipos.find((t) => t.pref === 'SBFD');
  
  const store = useSimuladorStore();
  const rawSetStore = store.setSimuladorState;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const isMounted = useSyncExternalStore(subscribeHydration, clientHydrationSnapshot, serverHydrationSnapshot);
  const setStore: typeof rawSetStore = (nextState) => {
    setError(null);
    rawSetStore(nextState);
  };

  const tipoId = store.tipoId || (sbfd?.id ?? tipos[0]?.id ?? '');
  const setTipoId = (v: string) => setStore({ tipoId: v });
  
  const unidad = store.unidad;
  const setUnidad = (v: 'in' | 'cm' | 'mm') => setStore({ unidad: v });
  
  const largo = store.largo;
  const setLargo = (v: number | ((prev: number) => number)) => setStore({ largo: typeof v === 'function' ? v(largo) : v });
  
  const alto = store.alto;
  const setAlto = (v: number | ((prev: number) => number)) => setStore({ alto: typeof v === 'function' ? v(alto) : v });
  
  const prof = store.prof;
  const setProf = (v: number | ((prev: number) => number)) => setStore({ prof: typeof v === 'function' ? v(prof) : v });
  
  const perfilId = store.perfilId || perfilDefaultId;
  const setPerfilId = (v: string) => setStore({ perfilId: v });
  // Validar que los códigos del store persisten contra los tableros disponibles.
  // Si un código fue eliminado del catálogo, usar el preset por defecto.
  const validCodes = new Set(tableros.map((t) => t.codigo));
  const preset = (() => {
    const stored = store.preset;
    if (!Object.keys(stored).length) return presetDefault;
    return Object.fromEntries(
      Object.entries(stored).map(([rol, cod]) => [rol, validCodes.has(cod) ? cod : (presetDefault[rol] ?? '')])
    );
  })();
  const setPreset = (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => setStore({ preset: typeof v === 'function' ? v(preset) : v });

  const frenteBoardDefault = tableros.find((t) => t.codigo === preset.frente);
  const cajaBoardDefault = tableros.find((t) => t.codigo === preset.caja);
  const cantoFrentes = store.cantoFrentes || (frenteBoardDefault?.espesor_mm === 18
    ? getCantoMatch(cantos, '22x1')
    : frenteBoardDefault?.espesor_mm === 15 ? getCantoMatch(cantos, '19x0,45') : '');
  const cantoCaja = store.cantoCaja || (cajaBoardDefault?.espesor_mm === 18
    ? getCantoMatch(cantos, '22x1')
    : cajaBoardDefault?.espesor_mm === 15 ? getCantoMatch(cantos, '19x0,45') : '');
  const setCantoFrentes = (v: string) => setStore({ cantoFrentes: v });
  const setCantoCaja = (v: string) => setStore({ cantoCaja: v });

  function aplicarPerfil(id: string) {
    setPerfilId(id);
    const p = perfiles.find((x) => x.id === id);
    if (p) setStore({ preset: { ...p.valores } });
  }

  // const recargoId = store.recargoId;
  // const setRecargoId = (v: string) => setStore({ recargoId: v });
  const conHerrajes = store.conHerrajes;
  const setConHerrajes = (v: boolean) => setStore({ conHerrajes: v });
  
  const herrajesExcl = store.herrajesExcl;
  
  const moneda = store.moneda;
  const setMoneda = (v: 'COP' | 'USD') => setStore({ moneda: v });
  
  const trm = store.trm ?? trmDefault;
  const setTrm = (v: number) => setStore({ trm: v });
  
  const npuertas = store.npuertas;
  const setNpuertas = (v: string) => setStore({ npuertas: v });
  
  const ncajones = store.ncajones;
  const setNcajones = (v: string) => setStore({ ncajones: v });
  
  const nentrepanos = store.nentrepanos;
  const setNentrepanos = (v: string) => setStore({ nentrepanos: v });

  const zocalo = store.zocalo ?? '';
  const setZocalo = (v: string) => setStore({ zocalo: v });
  
  const nbarras = store.nbarras;
  const setNbarras = (v: string) => setStore({ nbarras: v });
  
  const dbTipo = store.dbTipo;
  const setDbTipo = (v: string) => setStore({ dbTipo: v });

  const pcfdConfig = store.pcfdConfig ?? '';
  const setPcfdConfig = (v: string) => setStore({ pcfdConfig: v });

  const rielCodigo = store.rielCodigo ?? 'RIELTANDEM';
  const setRielCodigo = (v: string) => setStore({ rielCodigo: v });
  
  const modoFrentes = store.modoFrentes;
  const setModoFrentes = (v: 'normal' | 'sin_frentes' | 'solo_frentes') => setStore({ modoFrentes: v });
  const sistemaFrente = store.sistemaFrente;
  const setSistemaFrente = (v: SistemaFrente) => setStore({ sistemaFrente: v });
  const removible = store.removible;
  const setRemovible = (v: boolean) => setStore({ removible: v });

  const result = store.result;

  const tableroLabel = (t: Tablero) => `${t.codigo} · ${[t.proveedor, t.sustrato, t.espesor_mm && t.espesor_mm + 'mm', t.color_nombre].filter(Boolean).join(' ')}`;

  const sortedTableros = useMemo(() => [...tableros].sort((a, b) => a.codigo.localeCompare(b.codigo)), [tableros]);
  const tipoOptions = useMemo(() => tipos.map((t) => ({ value: t.id, label: `${t.pref} — ${t.nombre_es ?? ''}` })), [tipos]);
  const tableroOptions = useMemo(() => sortedTableros.map((t) => ({ value: t.codigo, label: tableroLabel(t) })), [sortedTableros]);

  if (!isMounted) return null;

  const roles = rolesByTipo[tipoId] ?? ['caja', 'frente', 'fondo'];
  const tipoPref = tipos.find((t) => t.id === tipoId)?.pref ?? '';
  const esDB = tipoPref.startsWith('DB');
  const esPCFD = tipoPref === 'PCFD';
  const usaRiel = esDB || esPCFD;
  // Un DB sin herrajes no lleva el costo real de riel/barras en el precio
  // (herrajesPlantilla queda vacío cuando conHerrajes=false), así que se
  // fuerza al elegir el tipo, no en un efecto (evita un hook nuevo después
  // del `if (!isMounted) return null` de arriba).
  function handleTipoChange(v: string) {
    setTipoId(v);
    // El simulador hereda la configuración del módulo anterior a propósito
    // (ver arquitectura_frontend.md §3), pero un override numérico de un tipo
    // distinto (ej. n_cajones=3 de un DB-1S) no debe sobrevivir a un cambio de
    // Tipo — terminaba cobrando herraje de cajón en un módulo sin gavetas.
    setNpuertas('');
    setNcajones('');
    setNentrepanos('');
    setZocalo('');
    setNbarras('');
    setDbTipo('');
    setRielCodigo('RIELTANDEM');
    setPcfdConfig('');
    if ((tipos.find((t) => t.id === v)?.pref ?? '') === 'W') setProf(convertir(12, 'in', unidad));
    if ((tipos.find((t) => t.id === v)?.pref ?? '').startsWith('DB')) setConHerrajes(true);
  }
  function aplicarDbTipo(k: string) {
    setDbTipo(k);
    setConHerrajes(true);
    const t = DB_TIPOLOGIAS.find((x) => x.key === k);
    if (t) { setNcajones(String(t.nc)); setNbarras(String(t.nb)); }
  }
  function aplicarPcfdConfig(k: string) {
    setPcfdConfig(k);
    const config = PCFD_CONFIGURACIONES.find((x) => x.key === k);
    if (!config) return;
    setNcajones(String(config.nc));
    setNentrepanos(String(config.ne));
    setZocalo(String(config.zocalo));
  }
  const herrajesTipo = herrajesByTipo[tipoId] ?? [];
  const toggleHerraje = (rol: string) => setStore({ herrajesExcl: herrajesExcl.includes(rol) ? herrajesExcl.filter((x) => x !== rol) : [...herrajesExcl, rol] });

  function changeUnidad(nu: 'in' | 'cm' | 'mm') {
    if (nu === unidad) return;
    setLargo((v) => convertir(v, unidad, nu));
    setAlto((v) => convertir(v, unidad, nu));
    setProf((v) => convertir(v, unidad, nu));
    setUnidad(nu);
  }

  const activeValues = (): SimuladorModuloValues => getModuloValues({
    ...store,
    tipoId,
    perfilId,
    preset,
    cantoFrentes,
    cantoCaja,
  });

  const modulePatch = (values: SimuladorModuloValues) => ({ ...values });

  function inputFromModule(modulo: SimuladorModulo): CotizarInput {
    const overrides: Record<string, number> = {};
    if (modulo.npuertas !== '') overrides.n_puertas = Number(modulo.npuertas);
    if (modulo.ncajones !== '') overrides.n_cajones = Number(modulo.ncajones);
    if (modulo.nentrepanos !== '') overrides.n_entrepanos = Number(modulo.nentrepanos);
    if (modulo.zocalo !== '') overrides.zocalo = Number(modulo.zocalo);
    if (modulo.nbarras !== '') overrides.n_barras = Number(modulo.nbarras);
    const pref = tipos.find((tipo) => tipo.id === modulo.tipoId)?.pref ?? '';
    if (pref.startsWith('DB') && modulo.dbTipo) overrides.n_cajones_pequenos = DB_TIPOLOGIAS.find((x) => x.key === modulo.dbTipo)?.npeq ?? 0;
    // Variantes transversales: viajan como override numérico 0/1 para que las
    // fórmulas de pieza y las reglas puedan reaccionar (ver migración 0028).
    overrides.gola = modulo.sistemaFrente === 'gola' ? 1 : 0;
    if (permiteRemovible(pref)) overrides.removible = modulo.removible ? 1 : 0;
    return {
      tipoId: modulo.tipoId,
      largo: modulo.largo,
      alto: modulo.alto,
      prof: modulo.prof,
      unidad,
      preset: modulo.preset,
      // Un DB sin herrajes no lleva el costo real de riel/barras en el precio.
      conHerrajes: pref.startsWith('DB') ? true : modulo.conHerrajes,
      trm,
      modoFrentes: modulo.modoFrentes,
      overrides: Object.keys(overrides).length ? overrides : undefined,
      herrajesExcluidos: modulo.conHerrajes && modulo.herrajesExcl.length ? modulo.herrajesExcl : undefined,
      cantoFrentes: modulo.cantoFrentes || undefined,
      cantoCaja: modulo.cantoCaja || undefined,
      rielCodigo: (pref.startsWith('DB') || pref === 'PCFD') && modulo.rielCodigo ? modulo.rielCodigo : undefined,
    };
  }

  async function validateAndCommit(
    nextModules: SimuladorModulo[],
    extra: Partial<ReturnType<typeof useSimuladorStore.getState>> = {},
  ) {
    setLoading(true);
    setError(null);
    const res = await cotizarGrupoAction(nextModules.map(inputFromModule));
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setStore({ ...extra, modulos: nextModules, result: res.result });
    return true;
  }

  function currentCandidate() {
    const id = store.editingId ?? globalThis.crypto.randomUUID();
    const current = moduloFromValues(activeValues(), id);
    const nextModules = store.editingId
      ? store.modulos.map((modulo) => modulo.id === id ? current : modulo)
      : [...store.modulos, current];
    return { id, current, nextModules };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (store.modulos.length === 0) {
      // Modo individual: cotizar únicamente el módulo actual sin agregarlo a una lista de combinación
      setLoading(true);
      setError(null);
      const singleInput = inputFromModule(moduloFromValues(activeValues(), 'single'));
      const res = await cotizarGrupoAction([singleInput]);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStore({ result: res.result });
      return;
    }

    const { id, nextModules } = currentCandidate();
    await validateAndCommit(nextModules, {
      editingId: id,
      pendingDraft: store.pendingDraft ?? activeValues(),
    });
  }

  async function onAddModule() {
    if (store.modulos.length === 0) {
      // Iniciar modo combinado: el módulo actual pasa a ser Módulo 1 y preparamos Módulo 2
      const mod1Id = globalThis.crypto.randomUUID();
      const mod1 = moduloFromValues(activeValues(), mod1Id);
      const mod2Draft = getModuloValues(mod1);

      setLoading(true);
      setError(null);
      const res = await cotizarGrupoAction([inputFromModule(mod1)]);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setStore({
        ...modulePatch(mod2Draft),
        modulos: [mod1],
        editingId: null,
        pendingDraft: null,
        result: res.result,
      });
      return;
    }

    const { current, nextModules } = currentCandidate();
    const nextDraft = getModuloValues(current);
    await validateAndCommit(nextModules, {
      ...modulePatch(nextDraft),
      editingId: null,
      pendingDraft: null,
    });
  }

  async function onClearCombined() {
    setLoading(true);
    setError(null);
    const singleInput = inputFromModule(moduloFromValues(activeValues(), 'single'));
    const res = await cotizarGrupoAction([singleInput]);
    setLoading(false);
    setStore({
      modulos: [],
      editingId: null,
      pendingDraft: null,
      result: res.ok ? res.result : null,
    });
    if (!res.ok) {
      setError(res.error);
    }
  }

  function onEditModule(modulo: SimuladorModulo) {
    if (store.editingId && store.editingId !== modulo.id) return;
    setStore({
      ...modulePatch(getModuloValues(modulo)),
      editingId: modulo.id,
      pendingDraft: store.editingId ? store.pendingDraft : activeValues(),
    });
  }

  function onCancelEdit() {
    const restore = store.pendingDraft ?? activeValues();
    setStore({ ...modulePatch(restore), editingId: null, pendingDraft: null });
  }

  async function onDeleteModule(id: string) {
    const nextModules = store.modulos.filter((modulo) => modulo.id !== id);
    const deletingActive = store.editingId === id;
    const restore = deletingActive ? (store.pendingDraft ?? activeValues()) : null;

    // Si queda 1 o 0 módulos, revertir automáticamente al modo individual
    if (nextModules.length <= 1) {
      const remaining = nextModules[0];
      const draft = remaining ? getModuloValues(remaining) : (restore ?? activeValues());

      setLoading(true);
      setError(null);
      const singleInput = inputFromModule(moduloFromValues(draft, 'single'));
      const res = await cotizarGrupoAction([singleInput]);
      setLoading(false);

      setStore({
        ...modulePatch(draft),
        modulos: [],
        editingId: null,
        pendingDraft: null,
        result: res.ok ? res.result : null,
      });
      if (!res.ok) setError(res.error);
      return;
    }

    await validateAndCommit(nextModules, deletingActive ? {
      ...modulePatch(restore!),
      editingId: null,
      pendingDraft: null,
    } : {});
  }

  async function reorderModules(nextModules: SimuladorModulo[]) {
    if (nextModules.every((modulo, index) => modulo.id === store.modulos[index]?.id)) return;
    await validateAndCommit(nextModules);
  }

  function moveModule(id: string, delta: number) {
    const from = store.modulos.findIndex((modulo) => modulo.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= store.modulos.length) return;
    const next = [...store.modulos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void reorderModules(next);
  }

  function dropModule(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }
    const next = [...store.modulos];
    const from = next.findIndex((modulo) => modulo.id === draggedId);
    const to = next.findIndex((modulo) => modulo.id === targetId);
    if (from >= 0 && to >= 0) {
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      void reorderModules(next);
    }
    setDraggedId(null);
  }

  // El Simulador no tiene sistema de medida de proyecto como las cotizaciones:
  // el código sigue la unidad con la que se está simulando.
  const sistemaCodigo: SistemaMedida = unidad === 'in' ? 'imperial' : 'metrico';

  const codigoDeValores = (valores: Pick<SimuladorModuloValues, 'tipoId' | 'largo' | 'alto' | 'sistemaFrente' | 'dbTipo' | 'ncajones'>) => {
    const pref = tipos.find((item) => item.id === valores.tipoId)?.pref ?? '';
    if (!pref) return '';
    return codigoComercial({
      pref,
      largo: valores.largo,
      alto: valores.alto,
      unidad,
      sistema: sistemaCodigo,
      sistemaFrente: valores.sistemaFrente,
      dbTipo: pref.startsWith('DB') ? valores.dbTipo : null,
      pcfdCajones: pref === 'PCFD' ? Number(valores.ncajones) : null,
    });
  };

  const moduleTitle = (modulo: SimuladorModulo) => codigoDeValores(modulo) || 'M';

  const codigoResultado = store.modulos.length > 0
    ? codigoGrupo(store.modulos.map(codigoDeValores).filter(Boolean))
    : codigoDeValores({ tipoId, largo, alto, sistemaFrente, dbTipo, ncajones });

  const editingPosition = store.editingId
    ? store.modulos.findIndex((modulo) => modulo.id === store.editingId) + 1
    : 0;

  return (
    <div className="space-y-4">
      {store.modulos.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4" aria-label="Módulos del mueble combinado">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">Mueble combinado</h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  {store.modulos.length} módulo{store.modulos.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Orden físico de izquierda a derecha</p>
            </div>
            <button
              type="button"
              onClick={() => void onClearCombined()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 hover:border-red-300 transition disabled:opacity-50"
              title="Eliminar la combinación y volver a simular un módulo individual"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Eliminar combinación
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {store.modulos.map((modulo, index) => {
              const isEditing = store.editingId === modulo.id;
              return (
                <article
                  key={modulo.id}
                  draggable={!loading && !store.editingId}
                  onDragStart={() => setDraggedId(modulo.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => dropModule(modulo.id)}
                  className={`min-w-52 rounded-xl border p-3 transition ${isEditing ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-slate-50'} ${draggedId === modulo.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Módulo {index + 1}</div>
                      <div className="font-semibold text-slate-900">{moduleTitle(modulo)}</div>
                      <div className="text-xs text-slate-500">{modulo.largo} × {modulo.alto} × {modulo.prof} {unidad}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={loading || (!!store.editingId && !isEditing)}
                        onClick={() => onEditModule(modulo)}
                        className="rounded-md p-1 text-slate-500 hover:bg-white hover:text-blue-700 disabled:opacity-30"
                        title={`Editar módulo ${index + 1}`}
                        aria-label={`Editar módulo ${index + 1}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 7.125L16.862 4.487M18 14.25V19.5A1.5 1.5 0 0116.5 21h-12A1.5 1.5 0 013 19.5v-12A1.5 1.5 0 014.5 6H9.75" /></svg>
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => void onDeleteModule(modulo.id)}
                        className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600 disabled:opacity-30"
                        title={`Eliminar módulo ${index + 1}`}
                        aria-label={`Eliminar módulo ${index + 1}`}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7h12m-10 0l.7 12.1A2 2 0 0010.7 21h2.6a2 2 0 002-1.9L16 7m-6 0V4.5A1.5 1.5 0 0111.5 3h1A1.5 1.5 0 0114 4.5V7" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="cursor-grab text-xs text-slate-400" title="Arrastra para reordenar">⠿ Arrastrar</span>
                    <div className="flex gap-1">
                      <button type="button" disabled={loading || index === 0 || !!store.editingId} onClick={() => moveModule(modulo.id, -1)} className="rounded border border-slate-200 px-1.5 text-xs text-slate-500 disabled:opacity-30" aria-label="Mover a la izquierda">←</button>
                      <button type="button" disabled={loading || index === store.modulos.length - 1 || !!store.editingId} onClick={() => moveModule(modulo.id, 1)} className="rounded border border-slate-200 px-1.5 text-xs text-slate-500 disabled:opacity-30" aria-label="Mover a la derecha">→</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* ---- Formulario ---- */}
      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 h-fit">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">
            {editingPosition > 0
              ? `Editar módulo ${editingPosition}`
              : store.modulos.length > 0
              ? `Configurar módulo ${store.modulos.length + 1}`
              : 'Configurar módulo'}
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <UndoRedoButtons compact />
            <GuideButton steps={GUIA_SIMULADOR} label="Guía" />
            <TooltipToggle />
          </div>
        </div>

        <div data-tour="tipo">
          <Field label="Tipo de mueble">
            <Combobox value={tipoId} options={tipoOptions} onChange={handleTipoChange} placeholder="Buscar tipo…" />
          </Field>
        </div>

        <div data-tour="dims" className="grid grid-cols-4 gap-2 items-end">
          <Field label="Largo"><input type="number" step="any" value={largo} onChange={(e) => setLargo(+e.target.value)} className="inp" /></Field>
          <Field label="Alto"><input type="number" step="any" value={alto} onChange={(e) => setAlto(+e.target.value)} className="inp" /></Field>
          <Field label="Prof"><input type="number" step="any" value={prof} onChange={(e) => setProf(+e.target.value)} className="inp" /></Field>
          <Field label="Unidad">
            <select value={unidad} disabled={store.modulos.length > 0} onChange={(e) => changeUnidad(e.target.value as 'in' | 'cm' | 'mm')} className="inp disabled:bg-slate-100" title={store.modulos.length > 0 ? 'La unidad se hereda del primer módulo' : undefined}>
              <option value="in">in</option><option value="cm">cm</option><option value="mm">mm</option>
            </select>
          </Field>
        </div>

        <div data-tour="tableros" className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase">Tableros</p>
          {perfiles.length > 0 && (
            <Field label="Perfil de material">
              <Combobox value={perfilId} options={perfiles.map((p) => ({ value: p.id, label: p.nombre }))} onChange={aplicarPerfil} placeholder="Elegir perfil…" />
            </Field>
          )}
          {(() => {
            const rendered: React.ReactNode[] = [];
            let cajaRendered = false;
            for (const rol of roles) {
              if (rol === 'caja' || rol === 'refuerzo') {
                if (cajaRendered) continue;
                cajaRendered = true;
                rendered.push(
                  <Field key="caja-refuerzo" label="caja / refuerzos">
                    <Combobox value={preset.caja ?? ''} options={tableroOptions}
                      onChange={(v) => {
                        setPreset((p) => ({ ...p, caja: v, refuerzo: v }));
                        const b = tableros.find((t) => t.codigo === v);
                        if (b?.espesor_mm === 18) setCantoCaja(getCantoMatch(cantos, '22x1'));
                        else if (b?.espesor_mm === 15) setCantoCaja(getCantoMatch(cantos, '19x0,45'));
                      }}
                      placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
                  </Field>
                );
              } else {
                rendered.push(
                  <Field key={rol} label={ROL_LABEL[rol] ?? rol}>
                    <Combobox value={preset[rol] ?? ''} options={tableroOptions}
                      onChange={(v) => {
                        setPreset((p) => ({ ...p, [rol]: v }));
                        if (rol === 'frente') {
                          const b = tableros.find((t) => t.codigo === v);
                          if (b?.espesor_mm === 18) setCantoFrentes(getCantoMatch(cantos, '22x1'));
                          else if (b?.espesor_mm === 15) setCantoFrentes(getCantoMatch(cantos, '19x0,45'));
                        }
                      }}
                      placeholder="Buscar tablero…" allowEmpty emptyLabel="— seleccionar —" />
                  </Field>
                );
              }
            }
            return rendered;
          })()}
        </div>

        <div data-tour="opciones" className="grid grid-cols-2 gap-2 items-end">
          <Field label="Nº puertas (override)"><input type="number" placeholder="auto" value={npuertas} onChange={(e) => setNpuertas(e.target.value)} className="inp" /></Field>
          <Field label="Nº cajones (override)"><input type="number" min={0} step={1} placeholder="auto" value={ncajones} onChange={(e) => { setNcajones(e.target.value); if (esPCFD) setPcfdConfig(''); }} className="inp" /></Field>
          <Field label="Nº entrepaños (override)"><input type="number" min={0} step={1} placeholder="auto" value={nentrepanos} onChange={(e) => { setNentrepanos(e.target.value); if (esPCFD) setPcfdConfig(''); }} className="inp" /></Field>
          {esPCFD && (
            <Field label="Configuración PCFD">
              <select value={pcfdConfig} onChange={(e) => aplicarPcfdConfig(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {PCFD_CONFIGURACIONES.map((config) => <option key={config.key} value={config.key}>{config.key} · {config.desc}</option>)}
              </select>
            </Field>
          )}
          {esPCFD && <Field label="Zócalo TK (in)"><input type="number" min={0} step="any" placeholder="auto" value={zocalo} onChange={(e) => { setZocalo(e.target.value); setPcfdConfig(''); }} className="inp" /></Field>}
          {esDB && (
            <Field label="Tipología DB">
              <select value={dbTipo} onChange={(e) => aplicarDbTipo(e.target.value)} className="inp">
                <option value="">— manual —</option>
                {DB_TIPOLOGIAS.map((t) => <option key={t.key} value={t.key} title={t.desc}>{t.key} · {t.desc}</option>)}
              </select>
            </Field>
          )}
          {esDB && <Field label="Nº barras (pares)"><input type="number" placeholder="0" value={nbarras} onChange={(e) => setNbarras(e.target.value)} className="inp" /></Field>}
          {usaRiel && (
            <Field label="Tipo de riel">
              <select value={rielCodigo} onChange={(e) => setRielCodigo(e.target.value)} className="inp">
                {DB_RIELES.map((r) => (
                  <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Frentes">
            <select value={modoFrentes} onChange={(e) => setModoFrentes(e.target.value as 'normal' | 'sin_frentes' | 'solo_frentes')} className="inp">
              <option value="normal">Completo</option><option value="sin_frentes">Sin frentes (open)</option><option value="solo_frentes">Solo kit de frentes</option>
            </select>
          </Field>
          <Field label="Sistema de frente">
            <select value={sistemaFrente} onChange={(e) => setSistemaFrente(e.target.value as SistemaFrente)} className="inp">
              {SISTEMAS_FRENTE.map((s) => <option key={s.key} value={s.key} title={s.desc}>{s.label}</option>)}
            </select>
          </Field>
          {permiteRemovible(tipoPref) && (
            <Field label="Removible">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={removible} onChange={(e) => setRemovible(e.target.checked)} />
                <span>Panel removible</span>
              </label>
            </Field>
          )}
          <Field label="TRM"><input type="number" step="any" value={trm} onChange={(e) => setTrm(+e.target.value)} className="inp" /></Field>
          <Field label="Canto frentes">
            <select value={cantoFrentes} onChange={(e) => setCantoFrentes(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Canto caja">
            <select value={cantoCaja} onChange={(e) => setCantoCaja(e.target.value)} className="inp">
              <option value="">Por defecto</option>
              {cantos.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={esDB ? true : conHerrajes}
            disabled={esDB}
            onChange={(e) => setConHerrajes(e.target.checked)}
            title={esDB ? 'Los muebles DB siempre incluyen herrajes: sin esto, el riel y las barras no entrarían en el precio.' : undefined}
          /> Incluir herrajes
          {esDB && <span className="text-xs text-slate-400 ml-1">(obligatorio en DB: riel y barras)</span>}
        </label>
        {(esDB || conHerrajes) && herrajesTipo.length > 0 && (
          <div className="rounded-lg border border-slate-200 p-2.5">
            <p className="text-[11px] font-medium text-slate-500 uppercase mb-1.5">Herrajes incluidos (destilda para excluir)</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {herrajesTipo.map((h) => (
                <label key={h.rol} className="flex items-center gap-1.5 text-sm text-slate-700 capitalize">
                  <input type="checkbox" checked={!herrajesExcl.includes(h.rol)} onChange={() => toggleHerraje(h.rol)} />
                  {h.rol}{h.codigo ? <span className="text-slate-400 normal-case">· {h.codigo}</span> : null}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700" role="alert" aria-live="polite">{error}</p>}
        <div className="grid gap-2">
          <button data-tour="calcular" disabled={loading || !!error} className="w-full rounded-lg bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {loading
              ? 'Calculando…'
              : store.editingId
              ? 'Guardar y recalcular'
              : store.modulos.length > 0
              ? `Guardar módulo ${store.modulos.length + 1} y recalcular`
              : 'Calcular precio'}
          </button>
          <button type="button" onClick={() => void onAddModule()} disabled={loading || !!error} className="w-full rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {store.modulos.length === 0 ? '+ Agregar módulo (Combinar)' : '+ Agregar otro módulo'}
          </button>
          {store.editingId && (
            <button type="button" onClick={onCancelEdit} disabled={loading} className="w-full py-1 text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50">
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {/* ---- Resultado ---- */}
      <div data-tour="resultado" className="space-y-4">
        {!result && <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">Ingresa los datos y calcula para ver el precio y el desglose.</div>}
        {result && <ResultadoView result={result} codigo={codigoResultado} moneda={moneda} setMoneda={setMoneda} />}
      </div>

      <style>{`.inp{width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.4rem .6rem;font-size:.875rem}.inp:focus{outline:2px solid #94a3b8;outline-offset:0}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <Campo label={label} info={TIPS_COTIZADOR[label]}>{children}</Campo>;
}

function ResultadoView({ result, codigo, moneda, setMoneda }:
  { result: CotizarGrupoResult; codigo: string; moneda: 'COP' | 'USD'; setMoneda: (m: 'COP' | 'USD') => void }) {
  const precioSin = result.precioCop;
  const precioHerr = result.precioHerrajesCop;
  const precioCon = result.precioConHerrajesCop;
  const precioPrincipal = precioCon;
  const money = (cop: number) => (moneda === 'COP' ? fmtCOP(cop) : fmtUSD(cop / result.trm));
  // El despiece se calcula en pulgadas (el catálogo es imperial), pero producción
  // trabaja en milímetros: el toggle solo cambia la presentación, no el cálculo.
  const [unidadPiezas, setUnidadPiezas] = useState<'in' | 'mm'>('in');
  const tienePuertas = Number(result.vars?.n_puertas ?? 0) > 0;
  // Producción compra tablero por m² y canto por metro lineal: el consumo se muestra
  // en esas unidades y ya con la merma, así que cantidad x precio = costo.
  const superficie = (m2: number) => m2.toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const longitud = (m: number) => m.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Un resultado calculado antes de que el motor expusiera `m2`/`metros`/`desperdicio`
  // puede seguir vivo en el store persistido. Se deriva de la medida neta en vez de
  // romper el render.
  const desperdicio = result.desperdicio ?? 0;
  const m2De = (m: { m2?: number; cm2: number }) => m.m2 ?? (m.cm2 * (1 + desperdicio)) / 10000;
  const metrosDe = (c: { metros?: number; longCm: number }) => c.metros ?? c.longCm / 100;
  const dim = (valorIn: number) => (unidadPiezas === 'in'
    ? valorIn.toLocaleString('es-CO', { maximumFractionDigits: 3 })
    : (valorIn * 25.4).toLocaleString('es-CO', { maximumFractionDigits: 1 }));
  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">Precio estimado</h2>
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            {(['USD', 'COP'] as const).map((m) => (
              <button key={m} onClick={() => setMoneda(m)} className={`px-3 py-1 ${moneda === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>{m}</button>
            ))}
          </div>
        </div>
        <div className="text-4xl font-bold text-slate-900">{money(precioPrincipal)}</div>
        {codigo && (
          <div className="mt-2">
            <span className="inline-block rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 font-mono text-sm font-semibold tracking-wide text-slate-700" title="Código comercial del módulo">
              {codigo}
            </span>
          </div>
        )}
        <p className="text-sm text-slate-500 mt-1">
          {result.modulos > 1 ? `Conjunto de ${result.modulos} módulos` : 'Módulo individual'} · Margen mueble {(result.margen * 100).toFixed(0)}% · Margen herraje {(result.margenHerraje * 100).toFixed(0)}% · TRM {result.trm.toLocaleString('es-CO')}
          {moneda === 'COP' ? '' : ` · ${fmtCOP(precioPrincipal)}`}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
          <Stat label="Precio sin herrajes" value={money(precioSin)} />
          <Stat label="Precio herrajes" value={money(precioHerr)} />
          <Stat label="Total configurado" value={money(precioCon)} highlight />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
          <Stat label="Costo sin herrajes" value={money(result.costoSinHerrajes)} />
          <Stat label="Costo herrajes" value={money(result.costoHerrajes)} />
          <Stat label="Costo total" value={money(result.costoConHerrajes)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card title="Desglose de costo">
          <Row k="Tablero (madera)" v={money(result.costoMadera)} />
          <Row k="Canto" v={money(result.costoCanto)} />
          <Row k="Consumibles" v={money(result.costoConsumibles)} />
          {result.costoHerrajes > 0 && <Row k="Herrajes" v={money(result.costoHerrajes)} />}
        </Card>
        <Card title={result.modulos > 1 ? 'Resumen físico del conjunto' : 'Resumen físico del mueble'}>
          <Row k="Módulos" v={String(result.modulos)} />
          <Row k="Largo exterior" v={`${result.largoTotalIn.toLocaleString('es-CO')} in`} />
          <Row k="Laterales / divisiones" v={String(result.laterales)} />
          <Row k="Uniones" v={String(result.uniones)} />
          <Row k="Piezas continuas" v={result.piezasContinuas.length ? result.piezasContinuas.join(', ') : '—'} />
        </Card>
      </div>

      <Card title="Materiales">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th className="py-1">Material</th><th>Detalle</th><th className="text-right">Cantidad</th><th className="text-right">Costo</th></tr></thead>
          <tbody>
            {result.maderaPorRol.map((m, i) => (
              <tr key={`m${i}`} className="border-t border-slate-100">
                <td className="py-1">Tablero · <span className="capitalize">{m.rol}</span></td>
                <td className="text-slate-500">{m.codigo}</td>
                <td className="text-right" title={`${superficie(m.cm2 / 10000)} m² de piezas + ${(desperdicio * 100).toFixed(0)}% de desperdicio`}>
                  {superficie(m2De(m))} m²
                </td>
                <td className="text-right font-medium">{money(m.costo)}</td>
              </tr>
            ))}
            {result.cantoPorCalibre.map((c, i) => (
              <tr key={`c${i}`} className="border-t border-slate-100">
                <td className="py-1">Canto</td>
                <td className="text-slate-500">calibre {c.calibre}</td>
                <td className="text-right" title="Incluye 5 cm de desperdicio por arista">
                  {longitud(metrosDe(c))} m
                </td>
                <td className="text-right font-medium">{money(c.costo)}</td>
              </tr>
            ))}
            {Object.entries(result.consumibles).filter(([, v]) => v > 0).map(([k, v]) => (
              <tr key={`x${k}`} className="border-t border-slate-100">
                <td className="py-1 capitalize">{k}</td><td className="text-slate-500">consumible</td>
                <td className="text-right">—</td><td className="text-right font-medium">{money(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <MuebleVisualizer scene={result.visualizacion} />

      <Card
        title="Piezas (despiece)"
        action={(
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            {([['in', 'Pulgadas'], ['mm', 'Milímetros']] as const).map(([u, etiqueta]) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnidadPiezas(u)}
                aria-pressed={unidadPiezas === u}
                title={`Mostrar el despiece en ${etiqueta.toLowerCase()}`}
                className={`px-3 py-1 ${unidadPiezas === u ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
              >
                {u === 'in' ? 'in' : 'mm'}
              </button>
            ))}
          </div>
        )}
      >
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400"><th className="py-1">Pieza</th><th>Rol</th><th className="text-right">Cant</th><th className="text-right">Largo {unidadPiezas === 'in' ? '″' : 'mm'}</th><th className="text-right">Ancho {unidadPiezas === 'in' ? '″' : 'mm'}</th><th className="text-right">m²</th></tr></thead>
          <tbody>
            {/* Piezas con cantidad 0 no se producen (ej. "frente" uniforme queda en 0 cuando
                la tipología DB es mixta y usa frente_gaveta_pequena/grande en su lugar). */}
            {result.piezas.filter((p) => p.cant > 0).map((p, i) => {
              const { largoIn, anchoIn } = orientarPieza(p);
              return (
              <tr key={i} className="border-t border-slate-100">
                <td className="py-1">{nombrePieza(p.pieza, tienePuertas)}</td><td className="text-slate-500">{p.rol}</td>
                <td className="text-right">{p.cant}</td><td className="text-right">{dim(largoIn)}</td>
                <td className="text-right">{dim(anchoIn)}</td><td className="text-right">{(p.areaCm2 / 10000).toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
              </tr>
              );
            })}
            <tr className="border-t-2 border-slate-300 font-semibold text-slate-900">
              <td className="py-1">TOTAL</td><td></td>
              <td className="text-right">{result.piezas.filter((p) => p.cant > 0).reduce((sum, p) => sum + p.cant, 0)}</td>
              <td></td><td></td>
              <td className="text-right">{(result.piezas.filter((p) => p.cant > 0).reduce((sum, p) => sum + p.areaCm2, 0) / 10000).toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {result.herrajes.length > 0 && (
        <Card title="Herrajes">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400"><th className="py-1">Herraje</th><th>Código</th><th className="text-right">Cant</th><th className="text-right">Unit</th><th className="text-right">Costo</th></tr></thead>
            <tbody>
              {result.herrajes.map((h, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1 capitalize">{h.rol}</td><td className="text-slate-500">{h.codigo}</td>
                  <td className="text-right">{h.cant}</td><td className="text-right">{money(h.precio)}</td>
                  <td className="text-right font-medium">{money(h.costo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="font-medium text-slate-900">{title}</h3>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className="text-slate-900 font-medium">{v}</span></div>;
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`text-xs ${highlight ? 'text-slate-300' : 'text-slate-500'}`}>{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
