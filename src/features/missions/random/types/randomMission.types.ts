export type RandomMissionDifficulty = 'easy' | 'medium' | 'hard';

export interface RandomMissionConfig {
  difficulty: RandomMissionDifficulty;
  quantity: number;
  missionCount: number;
}
