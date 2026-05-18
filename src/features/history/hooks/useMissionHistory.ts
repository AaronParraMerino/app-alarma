import { useEffect, useCallback } from 'react';
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

  // Carga inicial
  useEffect(() => {
    if (userId) fetchHistory(userId);
    return () => reset();
  }, [userId]);

  // Re-fetch cuando cambia el filtro
  useEffect(() => {
    if (userId) fetchHistory(userId);
  }, [filtroActivo]);

  const handleSetFiltro = useCallback((filtro: FilterOption) => {
    setFiltro(filtro);
  }, []);

  const refetch = useCallback(() => {
    if (userId) fetchHistory(userId);
  }, [userId]);

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