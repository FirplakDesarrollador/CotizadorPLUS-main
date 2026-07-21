import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CotizarResult } from '@/lib/cotizar';

export type SimuladorValues = {
  tipoId: string;
  unidad: 'in' | 'cm' | 'mm';
  largo: number;
  alto: number;
  prof: number;
  perfilId: string;
  preset: Record<string, string>;
  conHerrajes: boolean;
  herrajesExcl: string[];
  moneda: 'COP' | 'USD';
  trm: number | null;
  npuertas: string;
  ncajones: string;
  nentrepanos: string;
  nbarras: string;
  dbTipo: string;
  rielCodigo: string;  // código del riel para muebles DB (por defecto 'RIELTANDEM')
  modoFrentes: 'normal' | 'sin_frentes' | 'solo_frentes';
};

interface SimuladorState extends SimuladorValues {
  result: CotizarResult | null;
  past: SimuladorValues[];
  future: SimuladorValues[];
  
  setSimuladorState: (state: Partial<SimuladorValues & { result: CotizarResult | null }>) => void;
  resetSimuladorState: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const initialStateValues: SimuladorValues = {
  tipoId: '',
  unidad: 'in' as const,
  largo: 33,
  alto: 30,
  prof: 24,
  perfilId: '',
  preset: {},
  conHerrajes: true,
  herrajesExcl: [],
  moneda: 'USD' as const,
  trm: null,
  npuertas: '',
  ncajones: '',
  nentrepanos: '',
  nbarras: '',
  dbTipo: '',
  rielCodigo: 'RIELTANDEM',
  modoFrentes: 'normal' as const,
};

const getValuesFromState = (state: SimuladorState): SimuladorValues => ({
  tipoId: state.tipoId,
  unidad: state.unidad,
  largo: state.largo,
  alto: state.alto,
  prof: state.prof,
  perfilId: state.perfilId,
  preset: state.preset,
  conHerrajes: state.conHerrajes,
  herrajesExcl: state.herrajesExcl,
  moneda: state.moneda,
  trm: state.trm,
  npuertas: state.npuertas,
  ncajones: state.ncajones,
  nentrepanos: state.nentrepanos,
  nbarras: state.nbarras,
  dbTipo: state.dbTipo,
  rielCodigo: state.rielCodigo,
  modoFrentes: state.modoFrentes,
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
          const currentValues = getValuesFromState(state);
          // Verificar si hay cambios reales en las propiedades
          const keys = Object.keys(newState) as (keyof SimuladorValues)[];
          const hasChange = keys.some(
            (k) => JSON.stringify(newState[k]) !== JSON.stringify(currentValues[k])
          );
          if (!hasChange) return state;

          const newPast = [...state.past, currentValues].slice(-50); // máx 50 pasos
          return {
            ...state,
            ...newState,
            past: newPast,
            future: [], // borrar futuro tras nueva acción
          };
        }),

      resetSimuladorState: () =>
        set((state) => ({
          ...state,
          ...initialStateValues,
          result: null,
          past: [...state.past, getValuesFromState(state)].slice(-50),
          future: [],
        })),

      undo: () => {
        const state = get();
        if (state.past.length === 0) return false;

        const previousValues = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, state.past.length - 1);
        const currentValues = getValuesFromState(state);

        set({
          ...state,
          ...previousValues,
          past: newPast,
          future: [currentValues, ...state.future].slice(0, 50),
        });
        return true;
      },

      redo: () => {
        const state = get();
        if (state.future.length === 0) return false;

        const nextValues = state.future[0];
        const newFuture = state.future.slice(1);
        const currentValues = getValuesFromState(state);

        set({
          ...state,
          ...nextValues,
          past: [...state.past, currentValues].slice(-50),
          future: newFuture,
        });
        return true;
      },

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,
    }),
    {
      name: 'simulador-storage',
      partialize: (state) => {
        // Excluir past/future de la persistencia local para evitar almacenamiento redundante enorme
        const { past, future, ...persistedState } = state;
        return persistedState;
      },
    }
  )
);

