export type MovementDifficulty = 'easy' | 'medium' | 'hard';

export type MovementType =
  | 'shake'
  | 'walk'
  | 'rotate'
  | 'tilt';

export interface MovementStep {
  id: string;
  type: MovementType;
  label: string;
  instruction: string;
  detail: string;
  icon: string;
  durationSeconds: number;
  threshold: number;
  requiredRatio: number;
  completed: boolean;
}

export interface MovementMissionConfig {
  difficulty: MovementDifficulty;
  steps: MovementStep[];
  totalDurationSeconds: number;
  requiresContinuity: boolean;
  requiresOrder: boolean;
}

export interface MovementMissionUserConfig {
  difficulty: MovementDifficulty;
  quantity: number;
}

export interface MovementMissionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  durationMs: number;
}

export interface SensorCapabilities {
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  hasPedometer: boolean;
}
