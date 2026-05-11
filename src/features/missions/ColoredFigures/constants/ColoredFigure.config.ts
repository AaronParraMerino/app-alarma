import {
  ColoredFigureChallenge,
  ColoredFiguresConfig,
  Difficulty,
  FigureType,
} from '../types/ColoredFigures.types';

export interface DifficultyStyle {
  label: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
}

export const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
  easy: {
    label: 'FÁCIL',
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
    label: 'DIFÍCIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
  },
};

const FIGURES_EASY:   FigureType[] = ['circle', 'square'];
const FIGURES_MEDIUM: FigureType[] = ['circle', 'square', 'triangle', 'rectangle'];
const FIGURES_HARD:   FigureType[] = ['circle', 'square', 'triangle', 'rectangle', 'diamond'];

// ✅ Exportado para que la pantalla de config pueda mostrarlo
export const COLORS_BY_DIFFICULTY: Record<
  Difficulty,
  Array<Omit<ColoredFigureChallenge, 'figure'>>
> = {
  easy: [
    { hex: '#FF0000', colorName: 'rojo',     colorDisplayName: 'Rojo'     },
    { hex: '#FFFF00', colorName: 'amarillo', colorDisplayName: 'Amarillo' },
    { hex: '#0000FF', colorName: 'azul',     colorDisplayName: 'Azul'     },
  ],
  medium: [
    { hex: '#8B00FF', colorName: 'violeta',    colorDisplayName: 'Violeta'    },
    { hex: '#FF8000', colorName: 'anaranjado', colorDisplayName: 'Anaranjado' },
    { hex: '#00AA00', colorName: 'verde',      colorDisplayName: 'Verde'      },
  ],
  hard: [
    { hex: '#111111', colorName: 'negro',   colorDisplayName: 'Negro'   },
    { hex: '#EFEFEF', colorName: 'blanco',  colorDisplayName: 'Blanco'  },
    { hex: '#00BFFF', colorName: 'celeste', colorDisplayName: 'Celeste' },
    { hex: '#808080', colorName: 'plomo',   colorDisplayName: 'Plomo'   },
    { hex: '#8B4513', colorName: 'cafe',    colorDisplayName: 'Café'    },
    { hex: '#FF69B4', colorName: 'rosado',  colorDisplayName: 'Rosado'  },
  ],
};

const FIGURES_BY_DIFFICULTY: Record<Difficulty, FigureType[]> = {
  easy:   FIGURES_EASY,
  medium: FIGURES_MEDIUM,
  hard:   FIGURES_HARD,
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateColoredFigureChallenge(
  difficulty: Difficulty,
  lastHex: string = ''
): ColoredFigureChallenge {
  const colors  = COLORS_BY_DIFFICULTY[difficulty];
  const figures = FIGURES_BY_DIFFICULTY[difficulty];

  let color = randomItem(colors);
  let attempts = 0;
  while (color.hex === lastHex && colors.length > 1 && attempts < 10) {
    color = randomItem(colors);
    attempts++;
  }

  return { ...color, figure: randomItem(figures) };
}

export function generateColoredFigureChallenges(
  difficulty: Difficulty,
  count: number = 1
): ColoredFigureChallenge[] {
  const result: ColoredFigureChallenge[] = [];
  let lastHex = '';
  for (let i = 0; i < count; i++) {
    const challenge = generateColoredFigureChallenge(difficulty, lastHex);
    result.push(challenge);
    lastHex = challenge.hex;
  }
  return result;
}

export const PREVIEW_BY_DIFFICULTY: Record<Difficulty, ColoredFigureChallenge> = {
  easy:   { hex: '#FF0000', colorName: 'rojo',    colorDisplayName: 'Rojo',    figure: 'circle'   },
  medium: { hex: '#8B00FF', colorName: 'violeta', colorDisplayName: 'Violeta', figure: 'triangle' },
  hard:   { hex: '#808080', colorName: 'plomo',   colorDisplayName: 'Plomo',   figure: 'diamond'  },
};

function normalizeText(value: string): string {
  return value.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function isCorrectAnswer(
  challenge: ColoredFigureChallenge,
  userInput: string
): boolean {
  return normalizeText(userInput) === normalizeText(challenge.colorName);
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9;

export const DEFAULT_CONFIG: ColoredFiguresConfig = {
  difficulty: 'easy',
  quantity: 3,
};