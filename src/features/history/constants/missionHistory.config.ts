// src/features/history/constants/missionHistory.config.ts
import {
  MissionType,
  Difficulty,
  FilterOption,
} from '../types/missionHistory.types';

export type HistoryLanguage = 'es' | 'en';

export interface MissionVisualConfig {
  label: string;
  labelEn: string;
  sublabel: string;
  sublabelEn: string;
  iconName: string;
  iconColor: string;
  bgColor: string;
  failedBg: string;
}

export interface DifficultyVisualConfig {
  label: string;
  labelEn: string;
  color: string;
  bg: string;
  barColor: string;
}

export interface FilterVisualConfig {
  key: FilterOption;
  label: string;
  labelEn: string;
}

export const MISSION_CONFIG: Record<
  MissionType,
  MissionVisualConfig
> = {
  word_completion: {
    label: 'Palabras',
    labelEn: 'Words',
    sublabel: 'Completar letras faltantes',
    sublabelEn: 'Complete missing letters',
    iconName: 'pencil-outline',
    iconColor: '#facc15',
    bgColor: '#1a1a0d',
    failedBg: '#2e2200',
  },

  math_exercises: {
    label: 'Matemáticas',
    labelEn: 'Math',
    sublabel: 'Operaciones aritméticas',
    sublabelEn: 'Arithmetic operations',
    iconName: 'calculator-outline',
    iconColor: '#4ade80',
    bgColor: '#1a2e0d',
    failedBg: '#0d2e1e',
  },

  movement: {
    label: 'Movimientos',
    labelEn: 'Movements',
    sublabel: 'Agitar o mover el teléfono',
    sublabelEn: 'Shake or move the phone',
    iconName: 'run-fast',
    iconColor: '#60a5fa',
    bgColor: '#0d1e2e',
    failedBg: '#0d1a2e',
  },

  colored_figures: {
    label: 'Colores',
    labelEn: 'Colors',
    sublabel: 'Identificar colores y figuras',
    sublabelEn: 'Identify colors and shapes',
    iconName: 'palette-outline',
    iconColor: '#c084fc',
    bgColor: '#1e0d2e',
    failedBg: '#2e0d2e',
  },

  color_find: {
    label: 'Color diferente',
    labelEn: 'Different color',
    sublabel: 'Encontrar el cuadro distinto',
    sublabelEn: 'Find the different square',
    iconName: 'grid-outline',
    iconColor: '#22d3ee',
    bgColor: '#0d2630',
    failedBg: '#10222c',
  },

  memory_pairs: {
    label: 'Pares',
    labelEn: 'Pairs',
    sublabel: 'Encontrar parejas de memoria',
    sublabelEn: 'Find matching pairs',
    iconName: 'albums-outline',
    iconColor: '#fb923c',
    bgColor: '#2e160d',
    failedBg: '#2e100d',
  },

  trivia: {
    label: 'Cultura general',
    labelEn: 'Trivia',
    sublabel: 'Responder preguntas por puntos',
    sublabelEn: 'Answer questions for points',
    iconName: 'help-circle-outline',
    iconColor: '#38bdf8',
    bgColor: '#0d2430',
    failedBg: '#0d1b2e',
  },

  object_recognition: {
    label: 'Objetos',
    labelEn: 'Objects',
    sublabel: 'Reconocer objetos con la camara',
    sublabelEn: 'Recognize objects with the camera',
    iconName: 'scan-outline',
    iconColor: '#a3e635',
    bgColor: '#1b2e0d',
    failedBg: '#24300d',
  },
};

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  DifficultyVisualConfig
> = {
  easy: {
    label: 'Fácil',
    labelEn: 'Easy',
    color: '#4ade80',
    bg: '#0d2e1e',
    barColor: '#16a34a',
  },

  medium: {
    label: 'Medio',
    labelEn: 'Medium',
    color: '#facc15',
    bg: '#2e2200',
    barColor: '#ca8a04',
  },

  hard: {
    label: 'Difícil',
    labelEn: 'Hard',
    color: '#f87171',
    bg: '#2e0d0d',
    barColor: '#dc2626',
  },
};

export const FILTER_OPTIONS: FilterVisualConfig[] = [
  {
    key: 'todas',
    label: 'Todas',
    labelEn: 'All',
  },

  {
    key: 'math_exercises',
    label: 'Matemáticas',
    labelEn: 'Math',
  },

  {
    key: 'word_completion',
    label: 'Palabras',
    labelEn: 'Words',
  },

  {
    key: 'movement',
    label: 'Movimientos',
    labelEn: 'Movements',
  },

  {
    key: 'colored_figures',
    label: 'Colores',
    labelEn: 'Colors',
  },

  {
    key: 'color_find',
    label: 'Color diferente',
    labelEn: 'Different color',
  },

  {
    key: 'memory_pairs',
    label: 'Pares',
    labelEn: 'Pairs',
  },

  {
    key: 'trivia',
    label: 'Cultura general',
    labelEn: 'Trivia',
  },

  {
    key: 'object_recognition',
    label: 'Objetos',
    labelEn: 'Objects',
  },
];

export const MISSION_TYPES_ORDER: MissionType[] = [
  'math_exercises',
  'word_completion',
  'movement',
  'colored_figures',
  'color_find',
  'memory_pairs',
  'trivia',
  'object_recognition',
];

export function getMissionLabel(
  missionType: MissionType,
  language: HistoryLanguage,
): string {
  const config = MISSION_CONFIG[missionType];

  if (!config) {
    return language === 'es' ? 'Misión' : 'Mission';
  }

  return language === 'es'
    ? config.label
    : config.labelEn;
}

export function getMissionSublabel(
  missionType: MissionType,
  language: HistoryLanguage,
): string {
  const config = MISSION_CONFIG[missionType];

  if (!config) {
    return language === 'es'
      ? 'Sin descripción'
      : 'No description';
  }

  return language === 'es'
    ? config.sublabel
    : config.sublabelEn;
}

export function getDifficultyLabel(
  difficulty: Difficulty | null | undefined,
  language: HistoryLanguage,
): string {
  if (!difficulty) {
    return language === 'es'
      ? 'Sin nivel'
      : 'No level';
  }

  const config = DIFFICULTY_CONFIG[difficulty];

  if (!config) {
    return language === 'es'
      ? 'Sin nivel'
      : 'No level';
  }

  return language === 'es'
    ? config.label
    : config.labelEn;
}

export function getFilterLabel(
  filter: FilterVisualConfig,
  language: HistoryLanguage,
): string {
  return language === 'es'
    ? filter.label
    : filter.labelEn;
}

export function formatFecha(
  isoString: string,
  language: HistoryLanguage = 'es',
): string {
  const fecha = new Date(isoString);

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  const hoy = new Date();

  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);

  const locale = language === 'es'
    ? 'es'
    : 'en-US';

  const hora = fecha.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (fecha.toDateString() === hoy.toDateString()) {
    return language === 'es'
      ? `Hoy ${hora}`
      : `Today ${hora}`;
  }

  if (fecha.toDateString() === ayer.toDateString()) {
    return language === 'es'
      ? `Ayer ${hora}`
      : `Yesterday ${hora}`;
  }

  return fecha.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatContenido(
  missionType: MissionType,
  content: Record<string, unknown> | null,
  language: HistoryLanguage = 'es',
): string {
  if (!content) {
    return '';
  }

  if (missionType === 'word_completion') {
    const word = getStringValue(content, [
      'word',
      'palabra',
      'correctWord',
    ]);

    if (!word) {
      return '';
    }

    return language === 'es'
      ? `Palabra: ${word}`
      : `Word: ${word}`;
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

    if (figure && color) {
      return `${figure} - ${color}`;
    }

    if (figure) {
      return language === 'es'
        ? `Figura: ${figure}`
        : `Shape: ${figure}`;
    }

    if (color) {
      return `Color: ${color}`;
    }

    return '';
  }

  if (missionType === 'color_find') {
    const gridSize = getStringValue(content, [
      'gridSize',
    ]);

    const oddColor = getStringValue(content, [
      'oddColor',
    ]);

    if (gridSize && oddColor) {
      return `${gridSize}x${gridSize} - ${oddColor}`;
    }

    if (gridSize) {
      return `${gridSize}x${gridSize}`;
    }

    if (oddColor) {
      return language === 'es'
        ? `Color diferente: ${oddColor}`
        : `Different color: ${oddColor}`;
    }

    return '';
  }

  if (missionType === 'movement') {
    const movement = getStringValue(content, [
      'movement',
      'action',
      'instruction',
      'label',
      'movementType',
    ]);

    return movement;
  }

  if (missionType === 'memory_pairs') {
    const board = getStringValue(content, [
      'board',
    ]);

    const matchedPairs = getStringValue(content, [
      'matchedPairs',
    ]);

    if (board && matchedPairs) {
      return language === 'es'
        ? `Tablero ${board} - ${matchedPairs} pares`
        : `Board ${board} - ${matchedPairs} pairs`;
    }

    return board;
  }

  if (missionType === 'trivia') {
    const prompt = getStringValue(content, [
      'prompt',
      'question',
    ]);

    const earnedPoints = getStringValue(content, [
      'earnedPoints',
    ]);

    if (prompt && earnedPoints) {
      return language === 'es'
        ? `${prompt} (+${earnedPoints})`
        : `${prompt} (+${earnedPoints})`;
    }

    return prompt;
  }

  if (missionType === 'object_recognition') {
    const targetName = getStringValue(content, [
      'targetName',
      'targetLabel',
    ]);

    const detectedLabel = getStringValue(content, [
      'detectedLabel',
    ]);

    if (targetName && detectedLabel) {
      return language === 'es'
        ? `Objeto: ${targetName} - Detectado: ${detectedLabel}`
        : `Object: ${targetName} - Detected: ${detectedLabel}`;
    }

    if (targetName) {
      return language === 'es'
        ? `Objeto: ${targetName}`
        : `Object: ${targetName}`;
    }

    return '';
  }

  return '';
}

function getStringValue(
  content: Record<string, unknown>,
  keys: string[],
): string {
  for (const key of keys) {
    const value = content[key];

    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return '';
}
