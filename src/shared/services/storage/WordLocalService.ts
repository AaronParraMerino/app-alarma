import db from '../../db/localDB';

export class WordLocalService {

  static getRandom(difficulty: string, limit: number, language = 'es'): string[] {
    const rows = db.getAllSync<{ word: string }>(
      `SELECT word FROM word_completion_words
       WHERE difficulty = ? AND language = ?
       ORDER BY RANDOM()
       LIMIT ?`,
      [difficulty, language, limit]
    );

    if (rows.length > 0) {
      return rows.map(r => r.word.toUpperCase());
    }

    const fallbackRows = db.getAllSync<{ word: string }>(
      `SELECT word FROM word_completion_words
       WHERE difficulty = ? AND language = 'es'
       ORDER BY RANDOM()
       LIMIT ?`,
      [difficulty, limit]
    );

    return fallbackRows.map(r => r.word.toUpperCase());
  }

}
