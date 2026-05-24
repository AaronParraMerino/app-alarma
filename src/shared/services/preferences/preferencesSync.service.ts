import { useLanguageStore } from '../../i18n/language.store';
import { useThemeStore } from '../../theme/theme.store';
import {
  getRemotePreferences,
  saveRemotePreferences,
} from './preferences.service';

export async function syncPreferencesFromCloud(
  userId: string,
): Promise<void> {
  try {
    await Promise.all([
      useThemeStore.persist.rehydrate(),
      useLanguageStore.persist.rehydrate(),
    ]);

    const localThemeMode =
      useThemeStore.getState().themeMode;
    const localLanguage =
      useLanguageStore.getState().language;

    const remotePreferences =
      await getRemotePreferences(userId);

    if (
      remotePreferences?.themeMode ||
      remotePreferences?.language
    ) {
      if (remotePreferences.themeMode) {
        useThemeStore
          .getState()
          .setThemeMode(remotePreferences.themeMode);
      }

      if (remotePreferences.language) {
        useLanguageStore
          .getState()
          .setLanguage(remotePreferences.language);
      }

      return;
    }

    await saveRemotePreferences(userId, {
      themeMode: localThemeMode,
      language: localLanguage,
    });
  } catch (error) {
    console.log(
      '[Preferences] No se pudo sincronizar preferencias:',
      error instanceof Error
        ? error.message
        : String(error),
    );
  }
}

export async function saveCurrentPreferencesToCloud(
  userId: string,
): Promise<void> {
  try {
    await saveRemotePreferences(userId, {
      themeMode: useThemeStore.getState().themeMode,
      language: useLanguageStore.getState().language,
    });
  } catch (error) {
    console.log(
      '[Preferences] No se pudo guardar preferencias:',
      error instanceof Error
        ? error.message
        : String(error),
    );
  }
}
