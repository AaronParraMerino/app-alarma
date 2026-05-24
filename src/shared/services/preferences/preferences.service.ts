import { supabase } from '../../db/supabaseClient';
import { AppLanguage } from '../../i18n/language.store';
import { ThemeMode } from '../../theme/theme.store';

export type AppPreferences = {
  themeMode: ThemeMode;
  language: AppLanguage;
};

type RemotePreferences = {
  theme_mode: string | null;
  language: string | null;
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'es' || value === 'en';
}

function isMissingPreferenceColumn(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : String(error ?? '');

  return (
    message.includes('theme_mode') ||
    message.includes('language') ||
    message.includes('PGRST204') ||
    message.includes('column')
  );
}

export async function getRemotePreferences(
  userId: string,
): Promise<Partial<AppPreferences> | null> {
  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select('theme_mode, language')
    .eq('id', userId)
    .single<RemotePreferences>();

  if (error) {
    if (isMissingPreferenceColumn(error)) {
      console.log(
        '[Preferences] Las columnas de preferencias aun no existen en Supabase.',
      );
      return null;
    }

    throw new Error(error.message);
  }

  return {
    ...(isThemeMode(data?.theme_mode)
      ? {
          themeMode: data.theme_mode,
        }
      : {}),
    ...(isAppLanguage(data?.language)
      ? {
          language: data.language,
        }
      : {}),
  };
}

export async function saveRemotePreferences(
  userId: string,
  preferences: AppPreferences,
): Promise<boolean> {
  const {
    error,
  } = await supabase
    .from('profiles')
    .update({
      theme_mode: preferences.themeMode,
      language: preferences.language,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    if (isMissingPreferenceColumn(error)) {
      console.log(
        '[Preferences] No se guardaron preferencias remotas: faltan columnas en Supabase.',
      );
      return false;
    }

    throw new Error(error.message);
  }

  return true;
}
