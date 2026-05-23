import { DifficultyStyle, MAX_QUANTITY as WORD_MAX_QUANTITY } from '../../wordCompletion/constants/wordCompletion.config';
import { PairsDifficulty } from '../types/paresMission.types';

export const DIFFICULTY_STYLES: Record<PairsDifficulty, DifficultyStyle> = {
  easy: {
    label: 'FACIL',
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
    missingCount: 1,
    wordCount: 1,
  },
  medium: {
    label: 'MEDIO',
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
    missingCount: 3,
    wordCount: 1,
  },
  hard: {
    label: 'DIFICIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
    missingCount: 5,
    wordCount: 2,
  },
};

export const GRID_SIZE: Record<PairsDifficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 4,
};

export const BOARD_CELLS_BY_DIFFICULTY: Record<PairsDifficulty, number> = {
  easy: 4,
  medium: 9,
  hard: 16,
};

export const PAIRS_BY_DIFFICULTY: Record<PairsDifficulty, number> = {
  easy: 2,
  medium: 4,
  hard: 8,
};

export const FIXED_CENTER_INDEX_BY_DIFFICULTY: Partial<Record<PairsDifficulty, number>> = {
  medium: 4,
};

export const MAX_BOARD_MISSES: Record<PairsDifficulty, number> = {
  easy: 3,
  medium: 6,
  hard: 12,
};

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = WORD_MAX_QUANTITY;
export const DEFAULT_CONFIG = { difficulty: 'easy' as PairsDifficulty, quantity: 3 };
