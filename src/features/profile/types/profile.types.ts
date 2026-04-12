// src/features/profile/types/profile.types.ts

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  total_alarms_completed: number;
  total_missions_completed: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}