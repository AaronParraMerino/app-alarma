import db from '../../../../shared/db/localDB';
import {
  TriviaCategory,
  TriviaQuestion,
} from '../types/trivia.types';

type TriviaQuestionRow = {
  id: string;
  category: TriviaCategory;
  prompt_es: string;
  prompt_en: string;
  options_es: string;
  options_en: string;
  correct_option_indexes: string;
  accepted_answers_es: string;
  accepted_answers_en: string;
};

function parseArray<T>(
  value: string,
): T[] {
  try {
    return JSON.parse(value) as T[];
  } catch {
    return [];
  }
}

function mapRowToQuestion(
  row: TriviaQuestionRow,
): TriviaQuestion {
  return {
    id: row.id,
    category: row.category,
    promptEs: row.prompt_es,
    promptEn: row.prompt_en,
    optionsEs: parseArray<string>(row.options_es),
    optionsEn: parseArray<string>(row.options_en),
    correctOptionIndexes: parseArray<number>(
      row.correct_option_indexes,
    ),
    acceptedAnswersEs: parseArray<string>(
      row.accepted_answers_es,
    ),
    acceptedAnswersEn: parseArray<string>(
      row.accepted_answers_en,
    ),
  };
}

export class TriviaQuestionService {
  static getAll(): TriviaQuestion[] {
    const rows = db.getAllSync<TriviaQuestionRow>(
      `
      SELECT id, category, prompt_es, prompt_en, options_es, options_en,
        correct_option_indexes, accepted_answers_es, accepted_answers_en
      FROM trivia_custom_questions
      ORDER BY created_at DESC
      `,
    );

    return rows.map(mapRowToQuestion);
  }

  static create(
    question: Omit<TriviaQuestion, 'id'>,
  ): TriviaQuestion {
    const createdQuestion: TriviaQuestion = {
      ...question,
      id: `custom-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    };

    db.runSync(
      `
      INSERT INTO trivia_custom_questions (
        id, category, prompt_es, prompt_en, options_es, options_en,
        correct_option_indexes, accepted_answers_es, accepted_answers_en,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        createdQuestion.id,
        createdQuestion.category,
        createdQuestion.promptEs,
        createdQuestion.promptEn,
        JSON.stringify(
          createdQuestion.optionsEs,
        ),
        JSON.stringify(
          createdQuestion.optionsEn,
        ),
        JSON.stringify(
          createdQuestion.correctOptionIndexes,
        ),
        JSON.stringify(
          createdQuestion.acceptedAnswersEs,
        ),
        JSON.stringify(
          createdQuestion.acceptedAnswersEn,
        ),
        Date.now(),
      ],
    );

    return createdQuestion;
  }
}
