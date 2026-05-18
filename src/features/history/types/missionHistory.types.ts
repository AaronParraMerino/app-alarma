export type MissionType =
  | 'word_completion'
  | 'math_exercises'
  | 'movement'
  | 'colored_figures';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MissionHistoryRecord {
  id: string | number;
  user_id: string;
  mission_type: MissionType;
  difficulty: Difficulty | null;
  content: Record<string, unknown> | null;
  correct_answer: string | null;
  user_answer: string | null;
  success: boolean;
  error_count: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface DifficultyStats {
  easy: number;
  medium: number;
  hard: number;
}

export interface MissionTypeStat {
  tipo: MissionType;
  total: number;
  completadas: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface HistorySummary {
  completadas: number;
  fallidas: number;
  total: number;
  tasaExito: number;
}

export type FilterOption = 'todas' | MissionType;