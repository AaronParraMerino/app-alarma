// src/shared/theme/theme.store.ts
import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

type ThemeStore = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  themeMode: 'dark',

  setThemeMode: (mode) => {
    set({ themeMode: mode });
  },

  toggleTheme: () => {
    set((state) => ({
      themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
    }));
  },
}));