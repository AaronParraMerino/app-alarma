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
    { baseColor: '#33B98F', oddColor: '#4ECC9F' },
    { baseColor: '#4B8FE8', oddColor: '#66A4F0' },
    { baseColor: '#D96D8D', oddColor: '#E8849D' },
    { baseColor: '#F05F57', oddColor: '#F6766D' },
    { baseColor: '#20A6C7', oddColor: '#37B8D5' },
    { baseColor: '#7B61D8', oddColor: '#8D75E2' },
    { baseColor: '#D18435', oddColor: '#DC994C' },
    { baseColor: '#77B255', oddColor: '#8AC367' },
    { baseColor: '#E35BA8', oddColor: '#EA73B7' },
    { baseColor: '#5A9BE7', oddColor: '#73ADEC' },
    { baseColor: '#26B36A', oddColor: '#3DC47C' },
    { baseColor: '#B85FD6', oddColor: '#C475DE' },
  ],
  medium: [
    { baseColor: '#D9A441', oddColor: '#E2B65A' },
    { baseColor: '#6BA6C9', oddColor: '#7CB4D2' },
    { baseColor: '#A67BD8', oddColor: '#B38BE0' },
    { baseColor: '#D66B72', oddColor: '#DD7B81' },
    { baseColor: '#45A887', oddColor: '#55B393' },
    { baseColor: '#C88F3A', oddColor: '#D19C4C' },
    { baseColor: '#4F90D0', oddColor: '#609CD8' },
    { baseColor: '#B768B8', oddColor: '#C176C1' },
    { baseColor: '#8AAE44', oddColor: '#96B854' },
    { baseColor: '#CE6D43', oddColor: '#D77C54' },
    { baseColor: '#58A0A7', oddColor: '#66ABB1' },
    { baseColor: '#9A79C9', oddColor: '#A586D1' },
    { baseColor: '#D05B99', oddColor: '#D96CA5' },
    { baseColor: '#6A9CDE', oddColor: '#78A7E4' },
  ],
  hard: [
    { baseColor: '#C95F79', oddColor: '#D06A82' },
    { baseColor: '#56A98E', oddColor: '#60B196' },
    { baseColor: '#7D8DD5', oddColor: '#8897DC' },
    { baseColor: '#C27A3F', oddColor: '#C9844A' },
    { baseColor: '#6FA5BF', oddColor: '#79ADC6' },
    { baseColor: '#A66FC2', oddColor: '#AE79C9' },
    { baseColor: '#D07068', oddColor: '#D77A72' },
    { baseColor: '#7DAF62', oddColor: '#86B86C' },
    { baseColor: '#C65E9D', oddColor: '#CC68A5' },
    { baseColor: '#668BCB', oddColor: '#7094D1' },
    { baseColor: '#45A276', oddColor: '#4FAB80' },
    { baseColor: '#B66C6C', oddColor: '#BD7575' },
    { baseColor: '#8D83C8', oddColor: '#968CCE' },
    { baseColor: '#B29A45', oddColor: '#BBA250' },
    { baseColor: '#5CA8A1', oddColor: '#66B0A9' },
    { baseColor: '#B55D82', oddColor: '#BC668A' },
  ],
};

export const EXAMPLE_PREVIEWS: Record<Difficulty, ColorFindChallenge> = {
  easy: buildChallenge('easy', 1, COLOR_PAIRS.easy[0]),
  medium: buildChallenge('medium', 4, COLOR_PAIRS.medium[0]),
  hard: buildChallenge('hard', 10, COLOR_PAIRS.hard[0]),
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
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
): ColorFindChallenge {
  const gridSize = DIFFICULTY_STYLES[difficulty].gridSize;
  const totalTiles = gridSize * gridSize;
  const pair = randomItem(COLOR_PAIRS[difficulty]);
  let oddIndex = Math.floor(Math.random() * totalTiles);
  let attempts = 0;

  while (oddIndex === lastOddIndex && totalTiles > 1 && attempts < 10) {
    oddIndex = Math.floor(Math.random() * totalTiles);
    attempts++;
  }

  return buildChallenge(difficulty, oddIndex, pair);
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9;

export const DEFAULT_CONFIG: ColorFindConfig = {
  difficulty: 'easy',
  quantity: 3,
};
