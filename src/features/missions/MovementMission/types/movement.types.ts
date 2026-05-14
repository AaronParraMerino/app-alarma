export type MovementDifficulty = 'easy' | 'medium' | 'hard';

export type MovementType =
  | 'shake'
  | 'walk'
  | 'rotate'
  | 'tilt_left'
  | 'tilt_right'
  | 'tilt_up'
  | 'tilt_down';

export interface MovementStep {
  id: string;
  type: MovementType;
  label: string;
  icon: string;
  durationSeconds: number; // how long this step must be sustained
  threshold: number;       // sensor threshold to consider "detected"
  completed: boolean;
}

export interface MovementMissionConfig {
  difficulty: MovementDifficulty;
  steps: MovementStep[];
  totalDurationSeconds: number;
  requiresContinuity: boolean; // medium/hard: user must not stop
  requiresOrder: boolean;      // hard: must follow the sequence
}

export interface MovementMissionUserConfig {
  difficulty: MovementDifficulty;
  quantity: number; // how many steps/repetitions (1–5)
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