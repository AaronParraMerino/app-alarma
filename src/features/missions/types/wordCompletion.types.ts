export type Difficulty = 'easy' | 'medium' | 'hard';

export interface WordChallenge {
  word: string;
  missingIndexes: number[];
}

export interface WordCompletionMission {
  difficulty: Difficulty;
  challenges: WordChallenge[];
}

export interface WordCompletionState {
  currentChallengeIndex: number;
  userInput: string;
  hasError: boolean;
  completedIndexes: number[];
  isCompleted: boolean;
}
