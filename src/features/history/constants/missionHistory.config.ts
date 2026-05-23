import {
  MissionType,
  Difficulty,
  FilterOption,
} from '../types/missionHistory.types';

export interface MissionVisualConfig {
  label: string;
  sublabel: string;
  iconName: string;
  iconColor: string;
  bgColor: string;
  failedBg: string;
}

export interface DifficultyVisualConfig {
  label: string;
  color: string;
  bg: string;
  barColor: string;
}

export const MISSION_CONFIG: Record<MissionType, MissionVisualConfig> = {
  word_completion: {
    label: 'Palabras',
    sublabel: 'Completar letras faltantes',
    iconName: 'pencil-outline',
    iconColor: '#facc15',
    bgColor: '#1a1a0d',
    failedBg: '#2e2200',
  },

  math_exercises: {
    label: 'Matemáticas',
    sublabel: 'Operaciones aritméticas',
    iconName: 'calculator-outline',
    iconColor: '#4ade80',
    bgColor: '#1a2e0d',
    failedBg: '#0d2e1e',
  },

  movement: {
    label: 'Movimientos',
    sublabel: 'Agitar o mover el teléfono',
    iconName: 'run-fast',
    iconColor: '#60a5fa',
    bgColor: '#0d1e2e',
    failedBg: '#0d1a2e',
  },

  colored_figures: {
    label: 'Colores',
    sublabel: 'Identificar colores y figuras',
    iconName: 'palette-outline',
    iconColor: '#c084fc',
    bgColor: '#1e0d2e',
    failedBg: '#2e0d2e',
  },

  color_find: {
    label: 'Color diferente',
    sublabel: 'Encontrar el cuadro distinto',
    iconName: 'grid-outline',
    iconColor: '#22d3ee',
    bgColor: '#0d2630',
    failedBg: '#10222c',
  },
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyVisualConfig> = {
  easy: {
    label: 'Fácil',
    color: '#4ade80',
    bg: '#0d2e1e',
    barColor: '#16a34a',
  },
  medium: {
    label: 'Medio',
    color: '#facc15',
    bg: '#2e2200',
    barColor: '#ca8a04',
  },
  hard: {
    label: 'Difícil',
    color: '#f87171',
    bg: '#2e0d0d',
    barColor: '#dc2626',
  },
};

export const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'math_exercises', label: 'Matemáticas' },
  { key: 'word_completion', label: 'Palabras' },
  { key: 'movement', label: 'Movimientos' },
  { key: 'colored_figures', label: 'Colores' },
  { key: 'color_find', label: 'Color diferente' },
];

export const MISSION_TYPES_ORDER: MissionType[] = [
  'math_exercises',
  'word_completion',
  'movement',
  'colored_figures',
  'color_find',
];

export function formatFecha(isoString: string): string {
  const fecha = new Date(isoString);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  const hoy = new Date();

  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const hora = fecha.toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (fecha.toDateString() === hoy.toDateString()) {
    return `Hoy ${hora}`;
  }

  if (fecha.toDateString() === ayer.toDateString()) {
    return `Ayer ${hora}`;
  }

  return fecha.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatContenido(
  missionType: MissionType,
  content: Record<string, unknown> | null
): string {
  if (!content) return '';

  if (missionType === 'word_completion') {
    const word = getStringValue(content, [
      'word',
      'palabra',
      'correctWord',
    ]);

    return word ? `Palabra: ${word}` : '';
  }

  if (missionType === 'math_exercises') {
    const expression = getStringValue(content, [
      'expression',
      'operation',
      'question',
      'exercise',
    ]);

    return expression;
  }

  if (missionType === 'colored_figures') {
    const color = getStringValue(content, [
      'color',
      'selectedColor',
      'targetColor',
    ]);

    const figure = getStringValue(content, [
      'figure',
      'shape',
      'figura',
      'targetFigure',
    ]);

    if (figure && color) return `${figure} - ${color}`;
    if (figure) return `Figura: ${figure}`;
    if (color) return `Color: ${color}`;

    return '';
  }

  if (missionType === 'color_find') {
    const gridSize = getStringValue(content, ['gridSize']);
    const oddColor = getStringValue(content, ['oddColor']);

    if (gridSize && oddColor) return `${gridSize}x${gridSize} - ${oddColor}`;
    if (gridSize) return `${gridSize}x${gridSize}`;
    if (oddColor) return `Color diferente: ${oddColor}`;

    return '';
  }

  if (missionType === 'movement') {
    const movement = getStringValue(content, [
      'movement',
      'action',
      'instruction',
    ]);

    return movement;
  }

  return '';
}

function getStringValue(
  content: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = content[key];

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}
