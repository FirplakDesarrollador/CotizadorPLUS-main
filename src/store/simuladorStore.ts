import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CotizarResult } from '@/lib/cotizar';

interface SimuladorState {
  tipoId: string;
  unidad: 'in' | 'cm' | 'mm';
  largo: number;
  alto: number;
  prof: number;
  perfilId: string;
  preset: Record<string, string>;
  // recargoId: string;
  conHerrajes: boolean;
  herrajesExcl: string[];
  moneda: 'COP' | 'USD';
  trm: number | null;
  npuertas: string;
  ncajones: string;
  nentrepanos: string;
  nbarras: string;
  dbTipo: string;
  modoFrentes: 'normal' | 'sin_frentes' | 'solo_frentes';
  result: CotizarResult | null;
  
  setSimuladorState: (state: Partial<SimuladorState>) => void;
  resetSimuladorState: () => void;
}

const initialState = {
  tipoId: '',
  unidad: 'in' as const,
  largo: 33,
  alto: 30,
  prof: 24,
  perfilId: '',
  preset: {},
  // recargoId: '',
  conHerrajes: true,
  herrajesExcl: [],
  moneda: 'USD' as const,
  trm: null,
  npuertas: '',
  ncajones: '',
  nentrepanos: '',
  nbarras: '',
  dbTipo: '',
  modoFrentes: 'normal' as const,
  result: null,
};

export const useSimuladorStore = create<SimuladorState>()(
  persist(
    (set) => ({
      ...initialState,
      setSimuladorState: (newState) => set((state) => ({ ...state, ...newState })),
      resetSimuladorState: () => set(initialState),
    }),
    {
      name: 'simulador-storage',
    }
  )
);
