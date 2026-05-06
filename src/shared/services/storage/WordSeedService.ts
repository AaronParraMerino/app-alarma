import db from '../../db/localDB';
import { WORD_COMPLETION_WORDS_SEED } from '../../db/seeds/wordCompletionWordsSeed';

const WORD_COMPLETION_SEED_KEY = 'word_completion_words_seed_v1';

export class WordSeedService {
  static seedIfNeeded(): void {
    const alreadySeeded = this.isSeeded();

    if (alreadySeeded) {
      return;
    }

    this.insertWords();
    this.markAsSeeded();
  }

  private static isSeeded(): boolean {
    const row = db.getFirstSync<{ value: string }>(
      `
      SELECT value
      FROM app_metadata
      WHERE key = ?
      `,
      [WORD_COMPLETION_SEED_KEY]
    );

    return row?.value === 'true';
  }

  private static insertWords(): void {
    for (const item of WORD_COMPLETION_WORDS_SEED) {
      db.runSync(
        `
        INSERT OR IGNORE INTO word_completion_words (word, difficulty)
        VALUES (?, ?)
        `,
        [item.word.toUpperCase(), item.difficulty]
      );
    }
  }

  private static markAsSeeded(): void {
    db.runSync(
      `
      INSERT OR REPLACE INTO app_metadata (key, value)
      VALUES (?, ?)
      `,
      [WORD_COMPLETION_SEED_KEY, 'true']
    );
  }
}