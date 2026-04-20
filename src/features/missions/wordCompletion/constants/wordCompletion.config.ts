import { Difficulty, WordChallenge } from '../types/wordCompletion.types';

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
    label: 'FÁCIL',
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
    label: 'DIFÍCIL',
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
    missingCount: 5,
    wordCount: 2,
  },
};

/**
 * Ejemplos estáticos usados para preview o testing del UI
 */
export const EXAMPLE_PREVIEWS: Record<Difficulty, WordChallenge[]> = {
  easy: [
    { word: 'CASA', missingIndexes: [1] },
  ],
  medium: [
    { word: 'MURCIÉLAGO', missingIndexes: [2, 5, 8] },
  ],
  hard: [
    { word: 'BACKNON', missingIndexes: [1, 4, 6] },
    { word: 'ROTOR',   missingIndexes: [2, 4] },
  ],
};

const WORD_BANK: Record<Difficulty, string[]> = {
  easy: [
    'CASA', 'MESA', 'GATO', 'PATO', 'LUNA', 'ROSA', 'AGUA',
    'BOCA', 'ROPA', 'DEDO', 'PELO', 'MANO', 'NUBE', 'TREN', 'PISO',
  ],
  medium: [
    'MURCIÉLAGO', 'MARIPOSA', 'TELESCOPIO', 'BIBLIOTECA',
    'DINOSAURIO', 'HIPOPÓTAMO', 'LABORATORIO', 'PERIÓDICO',
    'CHOCOLATINA', 'ELECTRÓNICO', 'METEOROLOGÍA', 'ARQUITECTURA',
  ],
  hard: [
    'MURCIÉLAGO', 'HIPOPÓTAMO', 'XILÓFONO', 'ESTERNÓN',
    'CRIPTOGRAFÍA', 'FONOLOGÍA', 'QUIRÚRGICO', 'MICROSCOPIO',
    'NEUROLOGÍA', 'FOTOSÍNTESIS', 'TERMODINÁMICA', 'GEOQUÍMICA',
  ],
};

/**
 * Genera indices aleatorios de letras que serán ocultadas en el desafío, asegurando que no se repitan y 
 * que estén dentro del rango de la longitud de la palabra
 */
function randomMissingIndexes(wordLength: number, count: number): number[] {
  const pool = Array.from({ length: wordLength }, (_, i) => i);
  const result: number[] = [];
  while (result.length < Math.min(count, wordLength)) {
    const i = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(i, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

/**
 * Genera una lista de desafíos según dificultad
 * Selecciona palabras aleatorias del WORD_BANK
 * Aplica ocultamiento de letras según configuracion
 */
export function generateChallenges(difficulty: Difficulty): WordChallenge[] {
  const { missingCount, wordCount } = DIFFICULTY_STYLES[difficulty];
  const pool = [...WORD_BANK[difficulty]];
  const result: WordChallenge[] = [];
  for (let i = 0; i < wordCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const word = pool.splice(idx, 1)[0];
    result.push({ word, missingIndexes: randomMissingIndexes(word.length, missingCount) });
  }
  return result;
}

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 9;
export const DEFAULT_CONFIG = { difficulty: 'easy' as Difficulty, quantity: 3 };
