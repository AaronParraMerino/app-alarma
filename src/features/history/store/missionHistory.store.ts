import { create } from 'zustand';
import { supabase } from '../../../shared/db/supabaseClient';
import {
  MissionHistoryLocalService,
  MissionHistoryRow,
} from '../../../shared/services/storage/MissionHistoryLocalService';
import { syncMissionHistory } from '../../../shared/services/storage/missionHistorySync.service';
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

function localRowToRecord(row: MissionHistoryRow): MissionHistoryRecord {
  return {
    id: `local-${row.sync_id}`,
    sync_id: row.sync_id,
    user_id: row.user_id,
    mission_type: row.mission_type as MissionType,
    difficulty: row.difficulty as MissionHistoryRecord['difficulty'],
    content: JSON.parse(row.content),
    correct_answer: row.correct_answer,
    user_answer: row.user_answer,
    success: Boolean(row.success),
    error_count: row.error_count,
    duration_seconds: row.duration_seconds,
    created_at: new Date(row.created_at * 1000).toISOString(),
  };
}

function mergeHistoryRecords(
  cloudRecords: MissionHistoryRecord[],
  localRows: MissionHistoryRow[],
): MissionHistoryRecord[] {
  const cloudSyncIds = new Set(
    cloudRecords
      .map((record) => record.sync_id)
      .filter(Boolean),
  );

  const localRecords = localRows
    .filter((row) => !cloudSyncIds.has(row.sync_id))
    .map(localRowToRecord);

  return [
    ...cloudRecords,
    ...localRecords,
  ].sort((a, b) =>
    new Date(b.created_at).getTime() -
    new Date(a.created_at).getTime(),
  );
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

    const hadRecords = get().registros.length > 0;

    set({
      loading: !hadRecords,
      error: null,
    });

    try {
      const filtro = get().filtroActivo;
      const localRows =
        MissionHistoryLocalService.getByUserAndType(
          userId,
          filtro === 'todas'
            ? undefined
            : filtro as MissionType,
        );
      const localRecords = localRows.map(localRowToRecord);
      const localDerived = calcularDerivados(localRecords);

      set({
        registros: localRecords,
        loading: false,
        error: null,
        ...localDerived,
      });

      void syncMissionHistory(userId).catch((syncError) => {
        console.log(
          '[MissionHistory] Sync en segundo plano falló:',
          syncError,
        );
      });

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
        const pendingRows =
          MissionHistoryLocalService.getPendingByUserAndType(
            userId,
            filtro === 'todas'
              ? undefined
              : filtro as MissionType,
          );
        const registros = mergeHistoryRecords(
          localRecords,
          pendingRows,
        );
        const derivados = calcularDerivados(registros);

        set({
          registros,
          error: registros.length > 0
            ? null
            : error.message,
          loading: false,
          ...derivados,
        });
        return;
      }

      const localSyncIds = new Set(
        localRows
          .map((row) => row.sync_id)
          .filter(Boolean),
      );

      (data ?? [])
        .filter((record) => {
          const syncId = (record as MissionHistoryRecord).sync_id;

          return syncId && !localSyncIds.has(syncId);
        })
        .forEach((record) => {
        MissionHistoryLocalService.upsertSynced(
          record as MissionHistoryRecord,
        );
        });

      const pendingAfterSync =
        MissionHistoryLocalService.getPendingByUserAndType(
          userId,
          filtro === 'todas'
            ? undefined
            : filtro as MissionType,
        );
      const registros = mergeHistoryRecords(
        (data ?? []) as MissionHistoryRecord[],
        pendingAfterSync,
      );
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
