// src/shared/i18n/useTranslation.ts
import { translations } from './translations';
import {
  AppLanguage,
  useLanguageStore,
} from './language.store';

function getNestedValue(
  object: unknown,
  path: string,
): string | undefined {
  const value = path
    .split('.')
    .reduce<unknown>((current, key) => {
      if (
        current &&
        typeof current === 'object' &&
        key in current
      ) {
        return (current as Record<string, unknown>)[key];
      }

      return undefined;
    }, object);

  return typeof value === 'string' ? value : undefined;
}

export function useTranslation() {
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);

  const t = (key: string): string => {
    const translatedValue = getNestedValue(
      translations[language],
      key,
    );

    if (translatedValue) {
      return translatedValue;
    }

    const fallbackValue = getNestedValue(
      translations.es,
      key,
    );

    return fallbackValue ?? key;
  };

  return {
    t,
    language,
    setLanguage,
  };
}

export type { AppLanguage };