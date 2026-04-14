import { Difficulty, WordChallenge } from '../types/wordCompletion.types';

export const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; color: string; bgColor: string; borderColor: string; textColor: string; missingCount: number; wordCount: number }
> = {
  easy: {
    label: 'FÁCIL',
    color: '#4ADE80',
    bgColor: '#1A3D2B',
    borderColor: '#4ADE80',
    textColor: '#052010',
    missingCount: 1,
    wordCount: 1,
  },
  medium: {
    label: 'MEDIO',
    color: '#FBBF24',
    bgColor: '#3D2E0A',
    borderColor: '#FBBF24',
    textColor: '#1A0E00',
    missingCount: 3,
    wordCount: 1,
  },
  hard: {
    label: 'DIFÍCIL',
    color: '#F87171',
    bgColor: '#3D1010',
    borderColor: '#F87171',
    textColor: '#1A0000',
    missingCount: 5,
    wordCount: 2,
  },
};

const WORD_BANK: Record<Difficulty, string[]> = {
  easy: [
    'CASA', 'MESA', 'GATO', 'PATO', 'LUNA', 'ROSA', 'AGUA', 'PISO',
    'BOCA', 'ROPA', 'DEDO', 'PELO', 'MANO', 'NUBE', 'TREN',
  ],
  medium: [
    'MURCIELAGO', 'MARIPOSA', 'TELESCOPIO', 'BIBLIOTECA',
    'DINOSAURIO', 'HIPOPOTAMO', 'LABORATORIO', 'PERIODICO',
    'CHOCOLATINA', 'ELECTRONICO',
  ],
  hard: [
    'MURCIÉLAGO', 'HIPOPÓTAMO', 'XILÓFONO', 'ESTERNÓN',
    'BACKNON', 'ROTOR', 'CRIPTOGRAFÍA', 'FONOLOGÍA',
    'QUIRÚRGICO', 'MICROSCOPIO', 'NEUROLOGÍA', 'FOTOSÍNTESIS',
  ],
};

function getRandomMissingIndexes(wordLength: number, count: number): number[] {
  const indexes: number[] = [];
  while (indexes.length < Math.min(count, wordLength)) {
    const idx = Math.floor(Math.random() * wordLength);
    if (!indexes.includes(idx)) indexes.push(idx);
  }
  return indexes.sort((a, b) => a - b);
}

export function generateMission(difficulty: Difficulty): WordChallenge[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const pool = [...WORD_BANK[difficulty]];
  const challenges: WordChallenge[] = [];

  for (let i = 0; i < config.wordCount; i++) {
    const randIdx = Math.floor(Math.random() * pool.length);
    const word = pool.splice(randIdx, 1)[0];
    const missingIndexes = getRandomMissingIndexes(word.length, config.missingCount);
    challenges.push({ word, missingIndexes });
  }
  return challenges;
}
