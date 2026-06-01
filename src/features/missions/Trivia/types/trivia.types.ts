export type TriviaDifficulty = 'easy' | 'medium' | 'hard';

export type TriviaCategory =
  | 'history'
  | 'music'
  | 'math'
  | 'science'
  | 'geography'
  | 'custom';

export interface TriviaConfig {
  difficulty: TriviaDifficulty;
  categoryIds: TriviaCategory[];
  targetScore: number;
}

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  promptEs: string;
  promptEn: string;
  optionsEs: string[];
  optionsEn: string[];
  correctOptionIndexes: number[];
  acceptedAnswersEs: string[];
  acceptedAnswersEn: string[];
}
