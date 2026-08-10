import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CotizarGrupoResult } from '@/lib/group-result';

export type SimuladorModuloValues = {
  tipoId: string;
  largo: number;
  alto: number;
  prof: number;
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
  nbarras: string;
  dbTipo: string;
  pcfdConfig: string;
  rielCodigo: string;
  modoFrentes: 'normal' | 'sin_frentes' | 'solo_frentes';
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
  largo: 33,
  alto: 30,
  prof: 24,
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
  nbarras: '',
  dbTipo: '',
  pcfdConfig: '',
  rielCodigo: 'RIELTANDEM',
  modoFrentes: 'normal',
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

export const moduloFromValues = (values: SimuladorModuloValues, id: string): SimuladorModulo => ({
  id,
  ...values,
  preset: { ...values.preset },
  herrajesExcl: [...values.herrajesExcl],
});

export const getModuloValues = (state: SimuladorModuloValues): SimuladorModuloValues => ({
  tipoId: state.tipoId,
  largo: state.largo,
  alto: state.alto,
  prof: state.prof,
  perfilId: state.perfilId,
  preset: { ...state.preset },
  cantoFrentes: state.cantoFrentes,
  cantoCaja: state.cantoCaja,
  conHerrajes: state.conHerrajes,
  herrajesExcl: [...state.herrajesExcl],
  npuertas: state.npuertas,
  ncajones: state.ncajones,
  nentrepanos: state.nentrepanos,
  zocalo: state.zocalo,
  nbarras: state.nbarras,
  dbTipo: state.dbTipo,
  pcfdConfig: state.pcfdConfig,
  rielCodigo: state.rielCodigo,
  modoFrentes: state.modoFrentes,
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
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<SimuladorState>;
        return {
          ...initialStateValues,
          ...state,
          modulos: state.modulos ?? [],
          editingId: null,
          pendingDraft: null,
          result: null,
          past: [],
          future: [],
        } as SimuladorState;
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
