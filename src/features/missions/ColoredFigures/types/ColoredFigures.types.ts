export type Difficulty = 'easy' | 'medium' | 'hard';

export type FigureType = 'circle' | 'square' | 'triangle' | 'rectangle' | 'diamond';

export interface ColoredFigureChallenge {
  hex: string;
  colorName: string;
  colorDisplayName: string;
  figure: FigureType;
}

export interface ColoredFiguresChallengeState {
  userInput: string;
  hasError: boolean;
  isCompleted: boolean;
}

export interface ColoredFiguresConfig {
  difficulty: Difficulty;
  quantity: number;
}