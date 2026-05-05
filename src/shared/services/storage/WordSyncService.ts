import { supabase } from '../../db/supabaseClient';
import { WordLocalService } from './WordLocalService';

export class WordSyncService {

  static async sync() {
    try {
      const { data, error } = await supabase
        .from('word_completion_words')
        .select('*');

      if (error) {
        console.warn('Error syncing words:', error.message);
        return;
      }

      if (!data || data.length === 0) return;

      // reemplazo total
      WordLocalService.clear();

      WordLocalService.bulkInsert(
        data.map((w: any) => ({
          word: w.word,
          difficulty: w.difficulty
        }))
      );

      console.log('Words synced:', data.length);

    } catch (e) {
      console.warn('Sync exception:', e);
    }
  }
}