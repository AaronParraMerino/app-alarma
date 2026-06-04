import { useEffect, useCallback, useRef } from 'react';
import { useMissionHistoryStore } from '../store/missionHistory.store';
import { FilterOption } from '../types/missionHistory.types';

export function useMissionHistory(userId: string) {
  const {
    registros,
    loading,
    error,
    filtroActivo,
    resumen,
    porDificultad,
    porTipo,
    setFiltro,
    fetchHistory,
    reset,
  } = useMissionHistoryStore();
  const didRunInitialFilterFetch = useRef(false);

  // Carga inicial
  useEffect(() => {
    if (userId) fetchHistory(userId);
    didRunInitialFilterFetch.current = false;
    return () => reset();
  }, [fetchHistory, reset, userId]);

  // Re-fetch cuando cambia el filtro
  useEffect(() => {
    if (!didRunInitialFilterFetch.current) {
      didRunInitialFilterFetch.current = true;
      return;
    }

    if (userId) fetchHistory(userId);
  }, [fetchHistory, filtroActivo, userId]);

  const handleSetFiltro = useCallback((filtro: FilterOption) => {
    setFiltro(filtro);
  }, [setFiltro]);

  const refetch = useCallback(() => {
    if (userId) fetchHistory(userId);
  }, [fetchHistory, userId]);

  return {
    registros,
    loading,
    error,
    filtroActivo,
    resumen,
    porDificultad,
    porTipo,
    setFiltro: handleSetFiltro,
    refetch,
  };
}
