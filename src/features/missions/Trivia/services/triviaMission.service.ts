import {
  TRIVIA_CATEGORIES,
  TRIVIA_POINTS,
  getTriviaQuestions,
} from '../constants/trivia.config';
import {
  TriviaCategory,
  TriviaDifficulty,
  TriviaQuestion,
} from '../types/trivia.types';

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function reorderOptions(
  options: string[],
  order: number[],
): string[] {
  return order
    .map((index) => options[index])
    .filter((option): option is string => typeof option === 'string');
}

function shuffleQuestionOptions(
  question: TriviaQuestion,
): TriviaQuestion {
  const optionCount = Math.max(
    question.optionsEs.length,
    question.optionsEn.length,
  );

  if (optionCount <= 1) {
    return question;
  }

  const order = shuffle(
    Array.from({ length: optionCount }, (_, index) => index),
  );
  const nextCorrectIndexes = question.correctOptionIndexes
    .map((originalIndex) => order.indexOf(originalIndex))
    .filter((index) => index >= 0);

  return {
    ...question,
    optionsEs: reorderOptions(question.optionsEs, order),
    optionsEn: reorderOptions(question.optionsEn, order),
    correctOptionIndexes: nextCorrectIndexes,
  };
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(
  source: string,
  target: string,
): number {
  const rows = source.length + 1;
  const columns = target.length + 1;
  const matrix = Array.from(
    { length: rows },
    () => Array(columns).fill(0),
  );

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost =
        source[row - 1] === target[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      );
    }
  }

  return matrix[source.length][target.length];
}

export function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function buildQuestionDeck(
  questions: TriviaQuestion[],
): TriviaQuestion[] {
  return shuffle(questions).map(shuffleQuestionOptions);
}

export function getPossibleTriviaQuestions(
  categoryIds: TriviaCategory[],
  difficulty: TriviaDifficulty,
): TriviaQuestion[] {
  const questions = getTriviaQuestions(categoryIds);

  return difficulty === 'easy'
    ? questions.filter(
        (question) => question.correctOptionIndexes.length === 1,
      )
    : questions;
}

export function getTriviaCategoryLabel(
  categoryId: TriviaCategory,
  isSpanish: boolean,
): string {
  const category = TRIVIA_CATEGORIES.find(
    (item) => item.id === categoryId,
  );

  return isSpanish
    ? category?.labelEs ?? categoryId
    : category?.labelEn ?? categoryId;
}

export function getTriviaFeedbackText(
  earnedPoints: number,
  difficulty: TriviaDifficulty,
  isSpanish: boolean,
): string {
  if (earnedPoints === 0) {
    return isSpanish ? 'Respuesta incorrecta' : 'Incorrect answer';
  }

  if (earnedPoints >= TRIVIA_POINTS[difficulty]) {
    return isSpanish ? 'Respuesta correcta' : 'Correct answer';
  }

  return isSpanish
    ? 'Respuesta parcialmente correcta'
    : 'Partially correct answer';
}

export function scoreWrittenAnswer(
  answer: string,
  acceptedAnswers: string[],
  points: number,
): number {
  const normalizedAnswer = normalizeText(answer);

  if (!normalizedAnswer) {
    return 0;
  }

  const similarity = Math.max(
    ...acceptedAnswers.map((accepted) => {
      const normalizedAccepted = normalizeText(accepted);
      const maxLength = Math.max(
        normalizedAnswer.length,
        normalizedAccepted.length,
      );

      if (maxLength === 0) {
        return 1;
      }

      return (
        1 -
        levenshtein(normalizedAnswer, normalizedAccepted) / maxLength
      );
    }),
  );

  if (similarity === 1) {
    return points;
  }

  if (similarity < 0.5) {
    return 0;
  }

  return Math.min(points - 0.5, roundHalf(points * similarity));
}

export function scoreEasyAnswer(
  selectedIndexes: number[],
  question: TriviaQuestion,
): number {
  return selectedIndexes[0] === question.correctOptionIndexes[0]
    ? TRIVIA_POINTS.easy
    : 0;
}

export function scoreMediumAnswer(
  selectedIndexes: number[],
  question: TriviaQuestion,
  optionCount: number,
): number {
  const correctIndexes = question.correctOptionIndexes;
  const incorrectOptionCount = Math.max(
    1,
    optionCount - correctIndexes.length,
  );
  const selectedCorrect = selectedIndexes.filter((index) =>
    correctIndexes.includes(index),
  ).length;
  const selectedIncorrect = selectedIndexes.length - selectedCorrect;
  const ratio = Math.max(
    0,
    selectedCorrect / correctIndexes.length -
      selectedIncorrect / incorrectOptionCount,
  );

  return TRIVIA_POINTS.medium * ratio;
}

export function shuffleSingleQuestionOptions(
  question: TriviaQuestion,
): TriviaQuestion {
  return shuffleQuestionOptions(question);
}
