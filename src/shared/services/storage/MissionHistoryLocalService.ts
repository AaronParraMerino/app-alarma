import db from '../../db/localDB';

export type MissionType =
  | 'word_completion'
  | 'movement'
  | 'math_exercises'
  | 'colored_figures'
  | 'memory_pairs'
  | 'color_find'
  | 'trivia'
  | 'object_recognition';

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

  static getPendingByUserAndType(
    userId: string,
    missionType?: MissionType,
  ): MissionHistoryRow[] {
    if (missionType) {
      return db.getAllSync<MissionHistoryRow>(
        `
        SELECT *
        FROM missions_history
        WHERE user_id = ?
          AND mission_type = ?
          AND synced = 0
        ORDER BY created_at DESC
        `,
        [
          userId,
          missionType,
        ],
      );
    }

    return db.getAllSync<MissionHistoryRow>(
      `
      SELECT *
      FROM missions_history
      WHERE user_id = ?
        AND synced = 0
      ORDER BY created_at DESC
      `,
      [userId],
    );
  }

  static getByUserAndType(
    userId: string,
    missionType?: MissionType,
  ): MissionHistoryRow[] {
    if (missionType) {
      return db.getAllSync<MissionHistoryRow>(
        `
        SELECT *
        FROM missions_history
        WHERE user_id = ?
          AND mission_type = ?
        ORDER BY created_at DESC
        `,
        [
          userId,
          missionType,
        ],
      );
    }

    return db.getAllSync<MissionHistoryRow>(
      `
      SELECT *
      FROM missions_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [userId],
    );
  }

  static countByUser(userId: string): number {
    const row = db.getFirstSync<{ total: number }>(
      `
      SELECT COUNT(*) AS total
      FROM missions_history
      WHERE user_id = ?
      `,
      [userId],
    );

    return Number(row?.total ?? 0);
  }

  static upsertSynced(record: {
    sync_id?: string | null;
    user_id: string;
    mission_type: string;
    difficulty?: string | null;
    content?: unknown;
    correct_answer?: string | null;
    user_answer?: string | null;
    success: boolean;
    error_count?: number | null;
    duration_seconds?: number | null;
    created_at?: string | number | null;
  }): void {
    const syncId = record.sync_id;

    if (!syncId) {
      return;
    }

    const createdAt =
      typeof record.created_at === 'number'
        ? record.created_at
        : record.created_at
          ? Math.floor(new Date(record.created_at).getTime() / 1000)
          : Math.floor(Date.now() / 1000);

    db.runSync(
      `
      INSERT OR REPLACE INTO missions_history (
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
        created_at,
        synced
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `,
      [
        syncId,
        record.user_id,
        record.mission_type,
        record.difficulty ?? null,
        JSON.stringify(record.content ?? {}),
        record.correct_answer ?? '',
        record.user_answer ?? '',
        record.success ? 1 : 0,
        record.error_count ?? 0,
        record.duration_seconds ?? null,
        createdAt,
      ],
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
