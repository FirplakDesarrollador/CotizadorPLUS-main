import type { SistemaFrente } from '@/lib/muebles';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CotizarGrupoResult } from '@/lib/group-result';

export type SimuladorModuloValues = {
  tipoId: string;
  largo: string;
  alto: string;
  prof: string;
  perfilId: string;
  preset: Record<string, string>;
  cantoFrentes: string;
  cantoCaja: string;
  conHerrajes: boolean;
  herrajesExcl: string[];
  npuertas: string;
  ncajones: string;
  nentrepanos: string;
  zocalo: string;
  puertaSup: string;
  nbarras: string;
  dbTipo: string;
  pcfdConfig: string;
  rielCodigo: string;
  modoFrentes: 'normal' | 'sin_frentes' | 'solo_frentes';
  // Variantes transversales (ver src/lib/muebles.ts).
  sistemaFrente: SistemaFrente;
  removible: boolean;
  door: string;
  doorHand: 'L' | 'R';
  hornoLargo: string;
  hornoAlto: string;
  mo: string;
  hood: string;
  free: string;
};

export type SimuladorValues = SimuladorModuloValues & {
  unidad: 'in' | 'cm' | 'mm';
  moneda: 'COP' | 'USD';
  trm: number | null;
};

export type SimuladorModulo = SimuladorModuloValues & { id: string };

type SimuladorSnapshot = SimuladorValues & {
  modulos: SimuladorModulo[];
  editingId: string | null;
  pendingDraft: SimuladorModuloValues | null;
};

type SimuladorHistoryEntry = SimuladorSnapshot & { result: CotizarGrupoResult | null };

interface SimuladorState extends SimuladorSnapshot {
  result: CotizarGrupoResult | null;
  past: SimuladorHistoryEntry[];
  future: SimuladorHistoryEntry[];

  setSimuladorState: (state: Partial<SimuladorSnapshot & { result: CotizarGrupoResult | null }>) => void;
  resetSimuladorState: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const initialModuloValues: SimuladorModuloValues = {
  tipoId: '',
  largo: '33',
  alto: '30',
  prof: '24',
  perfilId: '',
  preset: {},
  cantoFrentes: '',
  cantoCaja: '',
  conHerrajes: true,
  herrajesExcl: [],
  npuertas: '',
  ncajones: '',
  nentrepanos: '',
  zocalo: '',
  puertaSup: '',
  nbarras: '',
  dbTipo: '',
  pcfdConfig: '',
  rielCodigo: 'RIELTANDEM',
  modoFrentes: 'normal',
  sistemaFrente: 'manija',
  removible: false,
  door: '',
  doorHand: 'R',
  hornoLargo: '',
  hornoAlto: '',
  mo: '',
  hood: '',
  free: '',
};

const initialStateValues: SimuladorSnapshot = {
  ...initialModuloValues,
  unidad: 'in',
  moneda: 'USD',
  trm: null,
  modulos: [],
  editingId: null,
  pendingDraft: null,
};

export const moduloFromValues = (values: Partial<SimuladorModuloValues>, id: string): SimuladorModulo => ({
  id,
  ...getModuloValues(values),
});

const medidaGuardada = (value: unknown): string =>
  typeof value === 'string' || typeof value === 'number' ? String(value) : '';

export const getModuloValues = (state: Partial<SimuladorModuloValues>): SimuladorModuloValues => ({
  tipoId: state.tipoId ?? '',
  largo: medidaGuardada(state.largo),
  alto: medidaGuardada(state.alto),
  prof: medidaGuardada(state.prof),
  perfilId: state.perfilId ?? '',
  preset: { ...state.preset },
  cantoFrentes: state.cantoFrentes ?? '',
  cantoCaja: state.cantoCaja ?? '',
  conHerrajes: state.conHerrajes ?? true,
  herrajesExcl: Array.isArray(state.herrajesExcl) ? [...state.herrajesExcl] : [],
  npuertas: medidaGuardada(state.npuertas),
  ncajones: medidaGuardada(state.ncajones),
  nentrepanos: medidaGuardada(state.nentrepanos),
  zocalo: medidaGuardada(state.zocalo),
  puertaSup: medidaGuardada(state.puertaSup),
  nbarras: medidaGuardada(state.nbarras),
  dbTipo: state.dbTipo ?? '',
  pcfdConfig: state.pcfdConfig ?? '',
  rielCodigo: state.rielCodigo ?? initialModuloValues.rielCodigo,
  modoFrentes: state.modoFrentes ?? 'normal',
  sistemaFrente: state.sistemaFrente ?? 'manija',
  removible: state.removible ?? false,
  door: medidaGuardada(state.door),
  doorHand: state.doorHand ?? 'R',
  hornoLargo: medidaGuardada(state.hornoLargo),
  hornoAlto: medidaGuardada(state.hornoAlto),
  mo: medidaGuardada(state.mo),
  hood: medidaGuardada(state.hood),
  free: medidaGuardada(state.free),
});

const getSnapshot = (state: SimuladorState): SimuladorSnapshot => ({
  ...getModuloValues(state),
  unidad: state.unidad,
  moneda: state.moneda,
  trm: state.trm,
  modulos: state.modulos.map((modulo) => moduloFromValues(modulo, modulo.id)),
  editingId: state.editingId,
  pendingDraft: state.pendingDraft ? getModuloValues(state.pendingDraft) : null,
});

const getHistoryEntry = (state: SimuladorState): SimuladorHistoryEntry => ({
  ...getSnapshot(state),
  result: state.result,
});

export const useSimuladorStore = create<SimuladorState>()(
  persist(
    (set, get) => ({
      ...initialStateValues,
      result: null,
      past: [],
      future: [],

      setSimuladorState: (newState) =>
        set((state) => {
          const current = getSnapshot(state);
          const durableKeys = (Object.keys(newState) as (keyof SimuladorSnapshot)[])
            .filter((key) => key !== ('result' as keyof SimuladorSnapshot));
          const hasChange = durableKeys.some(
            (key) => JSON.stringify(newState[key]) !== JSON.stringify(current[key]),
          );
          if (!hasChange) return { ...state, ...newState };
          return {
            ...state,
            ...newState,
            past: [...state.past, getHistoryEntry(state)].slice(-50),
            future: [],
          };
        }),

      resetSimuladorState: () =>
        set((state) => ({
          ...state,
          ...initialStateValues,
          result: null,
          past: [...state.past, getHistoryEntry(state)].slice(-50),
          future: [],
        })),

      undo: () => {
        const state = get();
        if (state.past.length === 0) return false;
        const previous = state.past[state.past.length - 1];
        set({
          ...state,
          ...previous,
          past: state.past.slice(0, -1),
          future: [getHistoryEntry(state), ...state.future].slice(0, 50),
        });
        return true;
      },

      redo: () => {
        const state = get();
        if (state.future.length === 0) return false;
        const next = state.future[0];
        set({
          ...state,
          ...next,
          past: [...state.past, getHistoryEntry(state)].slice(-50),
          future: state.future.slice(1),
        });
        return true;
      },

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,
    }),
    {
      name: 'simulador-storage',
      // v3: el Breakdown ganó `m2`, `metros` y `desperdicio`. Un `result` guardado con
      // la forma anterior no los trae, así que `migrate` lo descarta (pone `result: null`)
      // y el Simulador pide recalcular en vez de renderizar campos ausentes.
      version: 9,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<SimuladorState>;
        return {
          ...initialStateValues,
          ...state,
          ...getModuloValues(state),
          modulos: (state.modulos ?? []).map((modulo) => moduloFromValues(modulo, modulo.id)),
          editingId: null,
          pendingDraft: null,
          result: null,
          past: [],
          future: [],
        } as SimuladorState;
      },
      // También normaliza snapshots parciales de la versión actual y Fast Refresh.
      merge: (persistedState, currentState) => {
        const state = (persistedState ?? {}) as Partial<SimuladorState>;
        return {
          ...currentState,
          ...state,
          ...getModuloValues({ ...currentState, ...state }),
          modulos: (state.modulos ?? currentState.modulos).map((modulo) => moduloFromValues(modulo, modulo.id)),
          pendingDraft: state.pendingDraft ? getModuloValues(state.pendingDraft) : null,
          past: [], future: [],
        };
      },
      partialize: (state) => {
        const { past, future, ...persistedState } = state;
        void past;
        void future;
        return persistedState;
      },
    },
  ),
);
