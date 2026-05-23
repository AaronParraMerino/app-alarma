export type Difficulty = 'easy' | 'medium' | 'hard';
export type WordLanguage = 'es' | 'en';

export interface WordChallenge {
  word: string;
  missingIndexes: number[];
}

export interface WordCompletionConfig {
  difficulty: Difficulty;
  quantity: number;
}

export interface WordCompletionState {
  currentChallengeIndex: number;
  userInput: string;
  hasError: boolean;
  completedIndexes: number[];
  isCompleted: boolean;
}
