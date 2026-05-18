import { WordLocalService } from '../../../../shared/services/storage/WordLocalService';
import {
  Difficulty,
  WordChallenge,
} from '../types/wordCompletion.types';

export interface DifficultyStyle {
  label: string;
  accentColor: string;
  bgColor: string;
  textColor: string;
  missingCount: number;
  wordCount: number;
}

const DIFFICULTY_STYLES: Record<Difficulty, DifficultyStyle> = {
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

export class WordCompletionService {
  static getDifficultyStyle(difficulty: Difficulty): DifficultyStyle {
    return DIFFICULTY_STYLES[difficulty];
  }

  static generateChallenges(difficulty: Difficulty): WordChallenge[] {
    const { missingCount, wordCount } = this.getDifficultyStyle(difficulty);

    const words = WordLocalService.getRandom(difficulty, wordCount);

    return words.map(word => ({
      word,
      missingIndexes: this.randomMissingIndexes(word.length, missingCount),
    }));
  }

  static getExpectedAnswer(challenge?: WordChallenge): string {
    if (!challenge) return '';

    return challenge.missingIndexes
      .map(index => challenge.word[index])
      .join('')
      .toUpperCase();
  }

  static normalizeAnswer(value: string): string {
    return value.toUpperCase().trim();
  }

  static validateAnswer(
    challenge: WordChallenge | undefined,
    userInput: string
  ): boolean {
    if (!challenge) return false;

    const expectedAnswer = this.getExpectedAnswer(challenge);
    const normalizedInput = this.normalizeAnswer(userInput);

    return normalizedInput === expectedAnswer;
  }

  private static randomMissingIndexes(
    wordLength: number,
    count: number
  ): number[] {
    const pool = Array.from({ length: wordLength }, (_, i) => i);
    const result: number[] = [];

    while (result.length < Math.min(count, wordLength)) {
      const i = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(i, 1)[0]);
    }

    return result.sort((a, b) => a - b);
  }
}