import { create } from 'zustand';
import { supabase } from '../../../shared/db/supabaseClient';
import {
  MissionHistoryRecord,
  HistorySummary,
  DifficultyStats,
  MissionTypeStat,
  FilterOption,
  MissionType,
} from '../types/missionHistory.types';
import { MISSION_TYPES_ORDER } from '../constants/missionHistory.config';

interface MissionHistoryState {
  registros: MissionHistoryRecord[];
  loading: boolean;
  error: string | null;
  filtroActivo: FilterOption;

  resumen: HistorySummary;
  porDificultad: DifficultyStats;
  porTipo: MissionTypeStat[];

  setFiltro: (filtro: FilterOption) => void;
  fetchHistory: (userId: string) => Promise<void>;
  reset: () => void;
}

function calcularDerivados(registros: MissionHistoryRecord[]) {
  const completadas = registros.filter((r) => r.success).length;
  const fallidas = registros.filter((r) => !r.success).length;
  const total = registros.length;
  const tasaExito = total > 0 ? Math.round((completadas / total) * 100) : 0;

  const porDificultad: DifficultyStats = {
    easy: registros.filter((r) => r.difficulty === 'easy').length,
    medium: registros.filter((r) => r.difficulty === 'medium').length,
    hard: registros.filter((r) => r.difficulty === 'hard').length,
  };

  const porTipo: MissionTypeStat[] = MISSION_TYPES_ORDER.map((tipo) => {
    const items = registros.filter((r) => r.mission_type === tipo);

    return {
      tipo,
      total: items.length,
      completadas: items.filter((r) => r.success).length,
      easy: items.filter((r) => r.difficulty === 'easy').length,
      medium: items.filter((r) => r.difficulty === 'medium').length,
      hard: items.filter((r) => r.difficulty === 'hard').length,
    };
  });

  return {
    resumen: {
      completadas,
      fallidas,
      total,
      tasaExito,
    },
    porDificultad,
    porTipo,
  };
}

const initialDerivedState = {
  resumen: {
    completadas: 0,
    fallidas: 0,
    total: 0,
    tasaExito: 0,
  },
  porDificultad: {
    easy: 0,
    medium: 0,
    hard: 0,
  },
  porTipo: [],
};

export const useMissionHistoryStore = create<MissionHistoryState>((set, get) => ({
  registros: [],
  loading: false,
  error: null,
  filtroActivo: 'todas',
  ...initialDerivedState,

  setFiltro: (filtro) => {
    set({ filtroActivo: filtro });
  },

  fetchHistory: async (userId: string) => {
    if (!userId || userId.trim().length === 0) {
      set({
        registros: [],
        loading: false,
        error: 'No se encontró el usuario para cargar el historial.',
        ...initialDerivedState,
      });
      return;
    }

    set({ loading: true, error: null });

    try {
      const filtro = get().filtroActivo;

      let query = supabase
        .from('missions_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filtro !== 'todas') {
        query = query.eq('mission_type', filtro as MissionType);
      }

      const { data, error } = await query;

      if (error) {
        set({
          error: error.message,
          loading: false,
        });
        return;
      }

      const registros = (data ?? []) as MissionHistoryRecord[];
      const derivados = calcularDerivados(registros);

      set({
        registros,
        loading: false,
        error: null,
        ...derivados,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al cargar historial de misiones.';

      set({
        loading: false,
        error: message,
      });
    }
  },

  reset: () =>
    set({
      registros: [],
      loading: false,
      error: null,
      filtroActivo: 'todas',
      ...initialDerivedState,
    }),
}));