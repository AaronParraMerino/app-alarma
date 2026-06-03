// src/shared/db/supabaseClient.ts
import 'expo-sqlite/localStorage/install';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const projectRef = (() => {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0];
  } catch {
    return null;
  }
})();

export const SUPABASE_AUTH_STORAGE_KEY =
  'neuro-wake-supabase-auth-token-v2';

const LEGACY_SUPABASE_AUTH_STORAGE_KEYS = [
  projectRef ? `sb-${projectRef}-auth-token` : null,
  'supabase.auth.token',
].filter(Boolean) as string[];

export function clearSupabaseSessionStorage(): void {
  try {
    [
      SUPABASE_AUTH_STORAGE_KEY,
      ...LEGACY_SUPABASE_AUTH_STORAGE_KEYS,
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);

      if (
        key &&
        (
          key.includes('auth-token') ||
          key.includes('supabase.auth.token')
        )
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.log('[Supabase] No se pudo limpiar storage de sesion:', error);
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
