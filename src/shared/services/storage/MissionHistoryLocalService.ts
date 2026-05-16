import db from '../../db/localDB';

export type MissionType =
  | 'word_completion'
  | 'movement'
  | 'math_exercises'
  | 'colored_figures';

export interface SaveMissionHistoryDTO {
  userId: string;
  missionType: MissionType;
  difficulty?: string | null;

  content: unknown;
  correctAnswer: string;
  userAnswer: string;

  success: boolean;
  errorCount?: number;
  durationSeconds?: number | null;
}

export interface MissionHistoryRow {
  id: number;
  sync_id: string;
  user_id: string;
  mission_type: string;
  difficulty: string | null;
  content: string;
  correct_answer: string;
  user_answer: string;
  success: number;
  error_count: number;
  duration_seconds: number | null;
  created_at: number;
  synced: number;
}

export class MissionHistoryLocalService {
  static save(dto: SaveMissionHistoryDTO): string {
    const syncId = this.generateSyncId(dto.userId);

    db.runSync(
      `
      INSERT INTO missions_history (
        sync_id,
        user_id,
        mission_type,
        difficulty,
        content,
        correct_answer,
        user_answer,
        success,
        error_count,
        duration_seconds,
        synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `,
      [
        syncId,
        dto.userId,
        dto.missionType,
        dto.difficulty ?? null,
        JSON.stringify(dto.content),
        dto.correctAnswer,
        dto.userAnswer,
        dto.success ? 1 : 0,
        dto.errorCount ?? 0,
        dto.durationSeconds ?? null,
      ],
    );

    return syncId;
  }

  static getPendingByUser(userId: string): MissionHistoryRow[] {
    return db.getAllSync<MissionHistoryRow>(
      `
      SELECT *
      FROM missions_history
      WHERE user_id = ?
        AND synced = 0
      ORDER BY created_at ASC
      `,
      [userId],
    );
  }

  static markAsSynced(syncIds: string[]): void {
    for (const syncId of syncIds) {
      db.runSync(
        `
        UPDATE missions_history
        SET synced = 1
        WHERE sync_id = ?
        `,
        [syncId],
      );
    }
  }

  private static generateSyncId(userId: string): string {
    return `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
