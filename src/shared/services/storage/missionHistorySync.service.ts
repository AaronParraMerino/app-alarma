import { supabase } from '../../db/supabaseClient';
import {
  MissionHistoryLocalService,
  MissionHistoryRow,
} from './MissionHistoryLocalService';

export async function syncMissionHistory(userId: string): Promise<void> {
  const pendingRows = MissionHistoryLocalService.getPendingByUser(userId);

  if (pendingRows.length === 0) {
    return;
  }

  const payload = pendingRows.map(toSupabasePayload);

  const { error } = await supabase
    .from('missions_history')
    .upsert(payload, {
      onConflict: 'sync_id',
    });

  if (error) {
    console.error('Error sincronizando historial de misiones:', error);
    return;
  }

  MissionHistoryLocalService.markAsSynced(
    pendingRows.map(row => row.sync_id)
  );
}

function toSupabasePayload(row: MissionHistoryRow) {
  return {
    sync_id: row.sync_id,
    user_id: row.user_id,
    mission_type: row.mission_type,
    difficulty: row.difficulty,

    content: JSON.parse(row.content),
    correct_answer: row.correct_answer,
    user_answer: row.user_answer,

    success: Boolean(row.success),
    error_count: row.error_count,
    duration_seconds: row.duration_seconds,

    created_at: new Date(row.created_at * 1000).toISOString(),
  };
}