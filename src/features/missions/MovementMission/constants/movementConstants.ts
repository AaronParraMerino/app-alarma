import { MovementStep, MovementType } from '../types/movement.types';

export const MOVEMENT_THRESHOLDS = {
  shake: 15,       // m/s² sudden spike
  walk: 8,         // m/s² repetitive steps
  rotate: 1.5,     // rad/s on Z axis
  tilt_left: 1.2,
  tilt_right: 1.2,
  tilt_up: 1.2,
  tilt_down: 1.2,
} as const;

export const ALL_MOVEMENT_STEPS: Record<MovementType, Omit<MovementStep, 'id' | 'completed'>> = {
  shake: {
    type: 'shake',
    label: 'Agita el teléfono',
    icon: '📳',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.shake,
  },
  walk: {
    type: 'walk',
    label: 'Camina unos pasos',
    icon: '🚶',
    durationSeconds: 10,
    threshold: MOVEMENT_THRESHOLDS.walk,
  },
  rotate: {
    type: 'rotate',
    label: 'Gira el teléfono',
    icon: '🔄',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.rotate,
  },
  tilt_left: {
    type: 'tilt_left',
    label: 'Inclina a la izquierda',
    icon: '◀️',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.tilt_left,
  },
  tilt_right: {
    type: 'tilt_right',
    label: 'Inclina a la derecha',
    icon: '▶️',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.tilt_right,
  },
  tilt_up: {
    type: 'tilt_up',
    label: 'Inclina hacia arriba',
    icon: '🔼',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.tilt_up,
  },
  tilt_down: {
    type: 'tilt_down',
    label: 'Inclina hacia abajo',
    icon: '🔽',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.tilt_down,
  },
};

// Easy: simple single movements, short
export const EASY_STEP_POOL: MovementType[] = ['shake', 'rotate', 'tilt_left', 'tilt_right'];

// Medium: continuous or multi-step
export const MEDIUM_STEP_POOL: MovementType[] = ['walk', 'shake', 'rotate', 'tilt_up', 'tilt_down'];

// Hard: all types including sequences
export const HARD_STEP_POOL: MovementType[] = [
  'walk', 'shake', 'rotate', 'tilt_left', 'tilt_right', 'tilt_up', 'tilt_down',
];

export const DIFFICULTY_LABELS = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
} as const;

export const DIFFICULTY_COLORS = {
  easy: '#4ADE80',
  medium: '#FBBF24',
  hard: '#F87171',
} as const;

export const DIFFICULTY_DURATIONS = {
  easy: { min: 10, max: 30 },
  medium: { min: 60, max: 120 },
  hard: { min: 120, max: 300 },
} as const;

// Steps per quantity level per difficulty
export const STEPS_PER_QUANTITY: Record<string, number> = {
  easy: 1,   // quantity = number of repetitions of the single step
  medium: 2, // quantity = number of step sequences
  hard: 3,   // quantity = number of steps in the sequence
};