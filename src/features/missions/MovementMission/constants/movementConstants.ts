import { MovementDifficulty, MovementStep, MovementType } from '../types/movement.types';

export const MOVEMENT_THRESHOLDS: Record<MovementType, number> = {
  shake: 15,
  walk: 6,
  rotate: 1.5,
  tilt: 0.45,
};

export const ALL_MOVEMENT_STEPS: Record<
  MovementType,
  Omit<MovementStep, 'id' | 'completed'>
> = {
  shake: {
    type: 'shake',
    label: 'Agita el telefono',
    instruction: 'Agita el telefono con movimientos cortos y firmes.',
    detail: 'Mantiene el telefono en la mano y agitalo hasta llenar el progreso.',
    icon: 'SHAKE',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.shake,
    requiredRatio: 0.25,
  },
  walk: {
    type: 'walk',
    label: 'Camina unos pasos',
    instruction: 'Camina con el telefono en la mano.',
    detail: 'Da al menos 6 pasos reales. Estar quieto no llena el progreso.',
    icon: 'WALK',
    durationSeconds: 8,
    threshold: MOVEMENT_THRESHOLDS.walk,
    requiredRatio: 1,
  },
  rotate: {
    type: 'rotate',
    label: 'Gira el telefono',
    instruction: 'Gira el telefono sobre su eje.',
    detail: 'Haz un giro claro de muneca, sin sacudirlo.',
    icon: 'SPIN',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.rotate,
    requiredRatio: 0.3,
  },
  tilt: {
    type: 'tilt',
    label: 'Inclina el telefono',
    instruction: 'Inclina el telefono en cualquier direccion.',
    detail: 'Empieza estable, inclinalo claramente y manten esa posicion.',
    icon: 'TILT',
    durationSeconds: 3,
    threshold: MOVEMENT_THRESHOLDS.tilt,
    requiredRatio: 0.5,
  },
};

export const EASY_STEP_POOL: MovementType[] = ['shake', 'rotate', 'tilt'];
export const MEDIUM_STEP_POOL: MovementType[] = ['shake', 'rotate', 'tilt'];
export const HARD_STEP_POOL: MovementType[] = MEDIUM_STEP_POOL;

export const DIFFICULTY_LABELS: Record<MovementDifficulty, string> = {
  easy: 'Facil',
  medium: 'Medio',
  hard: 'Dificil',
};

export const DIFFICULTY_COLORS: Record<MovementDifficulty, string> = {
  easy: '#4ADE80',
  medium: '#FBBF24',
  hard: '#F87171',
};

export const DIFFICULTY_STYLES = {
  easy: {
    label: 'FACIL',
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
  },
  medium: {
    label: 'MEDIO',
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
  },
  hard: {
    label: 'DIFICIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
  },
} as const;

export const MOVEMENT_EXAMPLES: Record<MovementDifficulty, MovementType[]> = {
  easy: ['shake', 'rotate', 'tilt'],
  medium: ['walk', 'shake', 'rotate'],
  hard: ['walk', 'shake', 'walk'],
};

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 5;
