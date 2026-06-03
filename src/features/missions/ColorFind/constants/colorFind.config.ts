import { ColorFindChallenge, ColorFindConfig, Difficulty } from '../types/colorFind.types';

export interface DifficultyStyle {
  label: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  gridSize: number;
}

export const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
  easy: {
    label: 'FACIL',
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
    gridSize: 2,
  },
  medium: {
    label: 'MEDIO',
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
    gridSize: 3,
  },
  hard: {
    label: 'DIFICIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
    gridSize: 4,
  },
};

type ColorPair = {
  baseColor: string;
  oddColor: string;
};

const COLOR_PAIRS: Record<Difficulty, ColorPair[]> = {
  easy: [
    { baseColor: '#E53935', oddColor: '#F25C54' },
    { baseColor: '#1E88E5', oddColor: '#4BA3F2' },
    { baseColor: '#43A047', oddColor: '#66BB6A' },
    { baseColor: '#FDD835', oddColor: '#FFE766' },
    { baseColor: '#8E24AA', oddColor: '#AB47BC' },
    { baseColor: '#00ACC1', oddColor: '#26C6DA' },
    { baseColor: '#FB8C00', oddColor: '#FFA726' },
    { baseColor: '#D81B60', oddColor: '#EC407A' },
    { baseColor: '#7CB342', oddColor: '#9CCC65' },
    { baseColor: '#3949AB', oddColor: '#5C6BC0' },
    { baseColor: '#6D4C41', oddColor: '#8D6E63' },
    { baseColor: '#546E7A', oddColor: '#78909C' },
    { baseColor: '#00897B', oddColor: '#26A69A' },
    { baseColor: '#C0CA33', oddColor: '#D4E157' },
    { baseColor: '#5E35B1', oddColor: '#7E57C2' },
    { baseColor: '#F4511E', oddColor: '#FF7043' },
    { baseColor: '#C21807', oddColor: '#E5391F' },
    { baseColor: '#0288D1', oddColor: '#29B6F6' },
    { baseColor: '#2E7D32', oddColor: '#81C784' },
    { baseColor: '#FFB300', oddColor: '#FFD54F' },
    { baseColor: '#6A1B9A', oddColor: '#BA68C8' },
    { baseColor: '#006064', oddColor: '#4DD0E1' },
    { baseColor: '#E65100', oddColor: '#FFB74D' },
    { baseColor: '#880E4F', oddColor: '#F06292' },
    { baseColor: '#33691E', oddColor: '#AED581' },
    { baseColor: '#1A237E', oddColor: '#7986CB' },
  ],
  medium: [
    { baseColor: '#D32F2F', oddColor: '#DE4444' },
    { baseColor: '#1976D2', oddColor: '#2D86DA' },
    { baseColor: '#388E3C', oddColor: '#4B9C4F' },
    { baseColor: '#FBC02D', oddColor: '#FFD047' },
    { baseColor: '#7B1FA2', oddColor: '#8B35AD' },
    { baseColor: '#0097A7', oddColor: '#14A9B8' },
    { baseColor: '#F57C00', oddColor: '#FA8D1C' },
    { baseColor: '#C2185B', oddColor: '#CF2D6A' },
    { baseColor: '#689F38', oddColor: '#79AD4A' },
    { baseColor: '#303F9F', oddColor: '#4553AB' },
    { baseColor: '#5D4037', oddColor: '#6F5046' },
    { baseColor: '#455A64', oddColor: '#586A73' },
    { baseColor: '#00796B', oddColor: '#14897C' },
    { baseColor: '#AFB42B', oddColor: '#BDC139' },
    { baseColor: '#512DA8', oddColor: '#6441B5' },
    { baseColor: '#E64A19', oddColor: '#EE5E31' },
    { baseColor: '#B71C1C', oddColor: '#C93434' },
    { baseColor: '#0D47A1', oddColor: '#1B5EBA' },
    { baseColor: '#1B5E20', oddColor: '#2E7332' },
    { baseColor: '#FF8F00', oddColor: '#FFA722' },
    { baseColor: '#4A148C', oddColor: '#5D259A' },
    { baseColor: '#004D40', oddColor: '#0B6154' },
    { baseColor: '#BF360C', oddColor: '#D34B21' },
    { baseColor: '#880E4F', oddColor: '#9C245F' },
    { baseColor: '#827717', oddColor: '#948A25' },
    { baseColor: '#263238', oddColor: '#37474F' },
  ],
  hard: [
    { baseColor: '#C62828', oddColor: '#CF3535' },
    { baseColor: '#1565C0', oddColor: '#2372C9' },
    { baseColor: '#2E7D32', oddColor: '#3B893F' },
    { baseColor: '#F9A825', oddColor: '#FBB638' },
    { baseColor: '#6A1B9A', oddColor: '#7629A4' },
    { baseColor: '#00838F', oddColor: '#0E909C' },
    { baseColor: '#EF6C00', oddColor: '#F47A12' },
    { baseColor: '#AD1457', oddColor: '#B82363' },
    { baseColor: '#558B2F', oddColor: '#62973C' },
    { baseColor: '#283593', oddColor: '#35429D' },
    { baseColor: '#4E342E', oddColor: '#5A4039' },
    { baseColor: '#37474F', oddColor: '#44545C' },
    { baseColor: '#00695C', oddColor: '#0D7668' },
    { baseColor: '#9E9D24', oddColor: '#AAA82F' },
    { baseColor: '#4527A0', oddColor: '#5234AA' },
    { baseColor: '#D84315', oddColor: '#E14F23' },
    { baseColor: '#A52714', oddColor: '#AD301D' },
    { baseColor: '#0D47A1', oddColor: '#164FA8' },
    { baseColor: '#1B5E20', oddColor: '#246727' },
    { baseColor: '#FF8F00', oddColor: '#F99A12' },
    { baseColor: '#4A148C', oddColor: '#532093' },
    { baseColor: '#004D40', oddColor: '#07574A' },
    { baseColor: '#BF360C', oddColor: '#C64015' },
    { baseColor: '#880E4F', oddColor: '#921858' },
    { baseColor: '#827717', oddColor: '#8B811F' },
    { baseColor: '#263238', oddColor: '#2F3B41' },
  ],
};

export const EXAMPLE_PREVIEWS: Record<Difficulty, ColorFindChallenge> = {
  easy: buildChallenge('easy', 1, COLOR_PAIRS.easy[0]),
  medium: buildChallenge('medium', 4, COLOR_PAIRS.medium[0]),
  hard: buildChallenge('hard', 10, COLOR_PAIRS.hard[0]),
};

const pairQueues: Record<Difficulty, ColorPair[]> = {
  easy: [],
  medium: [],
  hard: [],
};

const oddIndexQueues: Record<Difficulty, number[]> = {
  easy: [],
  medium: [],
  hard: [],
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }

  return result;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function getColorProfile(hex: string): { hue: number; saturation: number; lightness: number } {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * ((blue - red) / delta + 2);
    } else {
      hue = 60 * ((red - green) / delta + 4);
    }
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation,
    lightness,
  };
}

function areColorFamiliesSimilar(color: string, otherColor: string): boolean {
  if (!otherColor) {
    return false;
  }

  const current = getColorProfile(color);
  const previous = getColorProfile(otherColor);
  const hueDistance = Math.abs(current.hue - previous.hue);
  const shortestHueDistance = Math.min(hueDistance, 360 - hueDistance);
  const saturationDistance = Math.abs(current.saturation - previous.saturation);
  const lightnessDistance = Math.abs(current.lightness - previous.lightness);

  return shortestHueDistance < 55 && saturationDistance < 0.26 && lightnessDistance < 0.24;
}

function getNextColorPair(difficulty: Difficulty, lastBaseColor = ''): ColorPair {
  if (pairQueues[difficulty].length === 0) {
    pairQueues[difficulty] = shuffle(COLOR_PAIRS[difficulty]);
  }

  if (
    pairQueues[difficulty].length > 1 &&
    areColorFamiliesSimilar(pairQueues[difficulty][0].baseColor, lastBaseColor)
  ) {
    const swapIndex = pairQueues[difficulty].findIndex(
      pair => !areColorFamiliesSimilar(pair.baseColor, lastBaseColor),
    );

    if (swapIndex > 0) {
      const nextPair = pairQueues[difficulty][0];
      pairQueues[difficulty][0] = pairQueues[difficulty][swapIndex];
      pairQueues[difficulty][swapIndex] = nextPair;
    }
  }

  return pairQueues[difficulty].shift() ?? COLOR_PAIRS[difficulty][0];
}

function getNextOddIndex(
  difficulty: Difficulty,
  totalTiles: number,
  lastOddIndex: number,
): number {
  if (oddIndexQueues[difficulty].length === 0) {
    oddIndexQueues[difficulty] = shuffle(
      Array.from({ length: totalTiles }, (_, index) => index),
    );
  }

  if (
    oddIndexQueues[difficulty].length > 1 &&
    oddIndexQueues[difficulty][0] === lastOddIndex
  ) {
    const swapIndex = oddIndexQueues[difficulty].findIndex(
      index => index !== lastOddIndex,
    );

    if (swapIndex > 0) {
      const nextIndex = oddIndexQueues[difficulty][0];
      oddIndexQueues[difficulty][0] = oddIndexQueues[difficulty][swapIndex];
      oddIndexQueues[difficulty][swapIndex] = nextIndex;
    }
  }

  return oddIndexQueues[difficulty].shift() ?? Math.floor(Math.random() * totalTiles);
}

function buildChallenge(
  difficulty: Difficulty,
  oddIndex: number,
  pair: ColorPair,
): ColorFindChallenge {
  const gridSize = DIFFICULTY_STYLES[difficulty].gridSize;
  const totalTiles = gridSize * gridSize;
  const normalizedOddIndex = Math.max(0, Math.min(totalTiles - 1, oddIndex));

  return {
    baseColor: pair.baseColor,
    oddColor: pair.oddColor,
    oddIndex: normalizedOddIndex,
    gridSize,
    tiles: Array.from({ length: totalTiles }, (_, index) => ({
      id: `${difficulty}-${index}`,
      color: index === normalizedOddIndex ? pair.oddColor : pair.baseColor,
      isOdd: index === normalizedOddIndex,
    })),
  };
}

export function generateColorFindChallenge(
  difficulty: Difficulty,
  lastOddIndex = -1,
  lastBaseColor = '',
): ColorFindChallenge {
  const gridSize = DIFFICULTY_STYLES[difficulty].gridSize;
  const totalTiles = gridSize * gridSize;
  const pair = getNextColorPair(difficulty, lastBaseColor);
  const oddIndex = getNextOddIndex(difficulty, totalTiles, lastOddIndex);

  return buildChallenge(difficulty, oddIndex, pair);
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 20;

export const DEFAULT_CONFIG: ColorFindConfig = {
  difficulty: 'easy',
  quantity: 5,
};
