import { GEOGRAPHY_QUESTIONS } from '../banks/geography.questions';
import { HISTORY_QUESTIONS } from '../banks/history.questions';
import { MATH_QUESTIONS } from '../banks/math.questions';
import { MUSIC_QUESTIONS } from '../banks/music.questions';
import { SCIENCE_QUESTIONS } from '../banks/science.questions';
import { TriviaQuestionService } from '../services/triviaQuestion.service';
import {
  TriviaCategory,
  TriviaConfig,
  TriviaDifficulty,
  TriviaQuestion,
} from '../types/trivia.types';

export const TRIVIA_TARGET_SCORE = 20;

export const TRIVIA_POINTS: Record<TriviaDifficulty, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
};

export const TRIVIA_DIFFICULTY_STYLES: Record<
  TriviaDifficulty,
  {
    accentColor: string;
    bgColor: string;
    textColor: string;
  }
> = {
  easy: {
    accentColor: '#4ADE80',
    bgColor: '#1A3D2B',
    textColor: '#052010',
  },
  medium: {
    accentColor: '#FBBF24',
    bgColor: '#3D2E0A',
    textColor: '#1A0E00',
  },
  hard: {
    accentColor: '#F87171',
    bgColor: '#3D1010',
    textColor: '#1A0000',
  },
};

export const DEFAULT_TRIVIA_CONFIG: TriviaConfig = {
  difficulty: 'easy',
  categoryIds: ['history', 'music', 'math'],
  targetScore: TRIVIA_TARGET_SCORE,
  timeLimits: {
    easy: 45,
    medium: 60,
    hard: 90,
  },
};

export const TRIVIA_CATEGORIES: Array<{
  id: TriviaCategory;
  labelEs: string;
  labelEn: string;
  icon:
    | 'time-outline'
    | 'musical-notes-outline'
    | 'calculator-outline'
    | 'flask-outline'
    | 'earth-outline'
    | 'create-outline';
}> = [
  {
    id: 'history',
    labelEs: 'Historia',
    labelEn: 'History',
    icon: 'time-outline',
  },
  {
    id: 'music',
    labelEs: 'Música',
    labelEn: 'Music',
    icon: 'musical-notes-outline',
  },
  {
    id: 'math',
    labelEs: 'Matemática',
    labelEn: 'Math',
    icon: 'calculator-outline',
  },
  {
    id: 'science',
    labelEs: 'Ciencia',
    labelEn: 'Science',
    icon: 'flask-outline',
  },
  {
    id: 'geography',
    labelEs: 'Geografía',
    labelEn: 'Geography',
    icon: 'earth-outline',
  },
  {
    id: 'custom',
    labelEs: 'Personalizada',
    labelEn: 'Custom',
    icon: 'create-outline',
  },
];

export const BUILT_IN_TRIVIA_QUESTION_BANK: TriviaQuestion[] = [
  ...HISTORY_QUESTIONS,
  ...MUSIC_QUESTIONS,
  ...MATH_QUESTIONS,
  ...SCIENCE_QUESTIONS,
  ...GEOGRAPHY_QUESTIONS,
];

export function getTriviaQuestions(
  categories: TriviaCategory[],
): TriviaQuestion[] {
  const activeCategories =
    categories.length > 0
      ? categories
      : DEFAULT_TRIVIA_CONFIG.categoryIds;

  const questionBank = [
    ...BUILT_IN_TRIVIA_QUESTION_BANK,
    ...TriviaQuestionService.getAll(),
  ];

  return questionBank.filter((question) =>
    activeCategories.includes(question.category),
  );
}
