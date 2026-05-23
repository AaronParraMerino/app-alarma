import {
  Difficulty,
  WordChallenge,
  WordLanguage,
} from '../types/wordCompletion.types';

export interface DifficultyStyle {
  label: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  missingCount: number;
  wordCount: number;
}

export const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
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

export const EXAMPLE_PREVIEWS: Record<
  WordLanguage,
  Record<Difficulty, WordChallenge[]>
> = {
  es: {
    easy: [{ word: 'CASA', missingIndexes: [1] }],
    medium: [{ word: 'MURCIELAGO', missingIndexes: [2, 5, 8] }],
    hard: [
      { word: 'CRIPTOGRAFIA', missingIndexes: [1, 4, 8, 10, 11] },
      { word: 'PROGRAMACION', missingIndexes: [2, 5, 8, 10, 11] },
    ],
  },
  en: {
    easy: [{ word: 'HOME', missingIndexes: [1] }],
    medium: [{ word: 'TELESCOPE', missingIndexes: [2, 5, 8] }],
    hard: [
      { word: 'CRYPTOGRAPHY', missingIndexes: [1, 4, 8, 10, 11] },
      { word: 'PROGRAMMING', missingIndexes: [2, 5, 8, 9, 10] },
    ],
  },
};

const WORD_BANK: Record<WordLanguage, Record<Difficulty, string[]>> = {
  es: {
    easy: [
      'CASA',
      'MESA',
      'GATO',
      'PATO',
      'LUNA',
      'ROSA',
      'AGUA',
      'BOCA',
      'ROPA',
      'DEDO',
      'PELO',
      'MANO',
      'NUBE',
      'TREN',
      'PISO',
    ],
    medium: [
      'MURCIELAGO',
      'MARIPOSA',
      'TELESCOPIO',
      'BIBLIOTECA',
      'DINOSAURIO',
      'HIPOPOTAMO',
      'LABORATORIO',
      'PERIODICO',
      'CHOCOLATINA',
      'ELECTRONICO',
      'METEOROLOGIA',
      'ARQUITECTURA',
    ],
    hard: [
      'MURCIELAGO',
      'HIPOPOTAMO',
      'XILOFONO',
      'ESTERNON',
      'CRIPTOGRAFIA',
      'FONOLOGIA',
      'QUIRURGICO',
      'MICROSCOPIO',
      'NEUROLOGIA',
      'FOTOSINTESIS',
      'TERMODINAMICA',
      'GEOQUIMICA',
    ],
  },
  en: {
    easy: [
      'HOME',
      'TABLE',
      'CAT',
      'DUCK',
      'MOON',
      'ROSE',
      'WATER',
      'MOUTH',
      'HAIR',
      'HAND',
      'CLOUD',
      'TRAIN',
      'FLOOR',
      'BOOK',
    ],
    medium: [
      'BUTTERFLY',
      'TELESCOPE',
      'LIBRARY',
      'DINOSAUR',
      'HIPPOPOTAMUS',
      'LABORATORY',
      'NEWSPAPER',
      'CHOCOLATE',
      'ELECTRONIC',
      'METEOROLOGY',
      'ARCHITECTURE',
      'COMPUTER',
    ],
    hard: [
      'CRYPTOGRAPHY',
      'PHONOLOGY',
      'SURGICAL',
      'MICROSCOPE',
      'NEUROLOGY',
      'PHOTOSYNTHESIS',
      'THERMODYNAMICS',
      'GEOCHEMISTRY',
      'ARCHAEOLOGY',
      'ANTHROPOLOGY',
      'BIOTECHNOLOGY',
      'ASTROPHYSICS',
    ],
  },
};

function randomMissingIndexes(wordLength: number, count: number): number[] {
  const pool = Array.from({ length: wordLength }, (_, i) => i);
  const result: number[] = [];
  while (result.length < Math.min(count, wordLength)) {
    const i = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(i, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

export function generateChallenges(
  difficulty: Difficulty,
  language: WordLanguage = 'es',
): WordChallenge[] {
  const { missingCount, wordCount } = DIFFICULTY_STYLES[difficulty];
  const pool = [...WORD_BANK[language][difficulty]];
  const result: WordChallenge[] = [];

  for (let i = 0; i < wordCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const word = pool.splice(idx, 1)[0];
    result.push({
      word,
      missingIndexes: randomMissingIndexes(word.length, missingCount),
    });
  }

  return result;
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9;
export const DEFAULT_CONFIG = {
  difficulty: 'easy' as Difficulty,
  quantity: 3,
};
