// src/shared/i18n/language.store.ts
import { create } from 'zustand';

export type AppLanguage = 'es' | 'en';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'es',

  setLanguage: (language) => {
    set({
      language,
    });
  },
}));