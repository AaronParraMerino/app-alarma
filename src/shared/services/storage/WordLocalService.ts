import db from '../../db/localDB';

export class WordLocalService {

  static getRandom(difficulty: string, limit: number): string[] {
    const rows = db.getAllSync<{ word: string }>(
      `SELECT word FROM word_completion_words
       WHERE difficulty = ?
       ORDER BY RANDOM()
       LIMIT ?`,
      [difficulty, limit]
    );

    return rows.map(r => r.word.toUpperCase());
  }

  static clear() {
    db.execSync(`DELETE FROM word_completion_words`);
  }

  static bulkInsert(words: { word: string; difficulty?: string }[]) {
    for (const w of words) {
      db.runSync(
        `INSERT INTO word_completion_words (word, difficulty)
         VALUES (?, ?)`,
        [w.word, w.difficulty ?? null]
      );
    }
  }
}