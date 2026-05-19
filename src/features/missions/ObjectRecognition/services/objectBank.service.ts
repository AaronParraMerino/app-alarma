import db from '../../../../shared/db/localDB';
import { OBJECT_BANK_SEED } from '../constants/objectBank';
import {
  RecognizableObject,
  RecognizableObjectCategory,
} from '../types/objectRecognition.types';

const OBJECT_BANK_SEED_KEY = 'object_recognition_bank_seed_v1';

type ObjectBankRow = {
  id: string;
  name: string;
  label: string;
  category: RecognizableObjectCategory;
  enabled: number;
};

function mapRowToObject(row: ObjectBankRow): RecognizableObject {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    category: row.category,
    enabled: Number(row.enabled) === 1,
  };
}

export class ObjectBankService {
  static seedIfNeeded(): void {
    if (this.isSeeded()) {
      return;
    }

    for (const object of OBJECT_BANK_SEED) {
      db.runSync(
        `
        INSERT OR REPLACE INTO object_recognition_objects (
          id, name, label, category, enabled, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          object.id,
          object.name,
          object.label,
          object.category,
          object.enabled === false ? 0 : 1,
          Date.now(),
        ],
      );
    }

    this.markAsSeeded();
  }

  static getAll(): RecognizableObject[] {
    const rows = db.getAllSync<ObjectBankRow>(
      `
      SELECT id, name, label, category, enabled
      FROM object_recognition_objects
      ORDER BY category ASC, label ASC
      `,
    );

    return rows.map(mapRowToObject);
  }

  static getEnabled(): RecognizableObject[] {
    const rows = db.getAllSync<ObjectBankRow>(
      `
      SELECT id, name, label, category, enabled
      FROM object_recognition_objects
      WHERE enabled = 1
      ORDER BY category ASC, label ASC
      `,
    );

    return rows.map(mapRowToObject);
  }

  static getById(id: string): RecognizableObject | null {
    const row = db.getFirstSync<ObjectBankRow>(
      `
      SELECT id, name, label, category, enabled
      FROM object_recognition_objects
      WHERE id = ?
      `,
      [id],
    );

    return row ? mapRowToObject(row) : null;
  }

  private static isSeeded(): boolean {
    const row = db.getFirstSync<{ value: string }>(
      `
      SELECT value
      FROM app_metadata
      WHERE key = ?
      `,
      [OBJECT_BANK_SEED_KEY],
    );

    return row?.value === 'true';
  }

  private static markAsSeeded(): void {
    db.runSync(
      `
      INSERT OR REPLACE INTO app_metadata (key, value)
      VALUES (?, ?)
      `,
      [OBJECT_BANK_SEED_KEY, 'true'],
    );
  }
}
