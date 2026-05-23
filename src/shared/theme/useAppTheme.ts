// src/shared/theme/useAppTheme.ts
import { Colors } from './colors';
import { ThemeMode, useThemeStore } from './theme.store';

type ColorKeys = Exclude<keyof typeof Colors, 'missionColors'>;

export type AppThemeColors = Record<ColorKeys, string> & {
  missionColors: Record<string, string>;
};

const darkColors: AppThemeColors = {
  ...Colors,
  missionColors: {
    ...Colors.missionColors,
  },
};

const lightColors: AppThemeColors = {
  ...Colors,

  // ── Fondos ──────────────────────────────────────────────
  bg: '#F7F8FA',
  bgCard: '#FFFFFF',
  bgCardActive: '#EEF6FB',
  bgElevated: '#F1F5F9',

  // ── Azules principales ──────────────────────────────────
  primary: Colors.primary,
  primaryLight: '#005F91',
  primaryPale: '#E8F4FB',
  primaryDeep: Colors.primaryDeep,

  // ── Acentos y resaltes ──────────────────────────────────
  accent: Colors.primary,
  accentGlow: 'rgba(0, 119, 182, 0.12)',
  accentLight: '#0077B6',

  // ── Semánticos ──────────────────────────────────────────
  success: Colors.success,
  successDim: 'rgba(52, 211, 153, 0.12)',
  warning: Colors.warning,
  warningDim: 'rgba(251, 191, 36, 0.14)',
  danger: Colors.danger,
  dangerDim: 'rgba(232, 85, 85, 0.12)',
  purple: '#8B5CF6',
  purpleDim: 'rgba(139, 92, 246, 0.12)',

  // ── Texto ───────────────────────────────────────────────
  text: '#12161F',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textAccent: '#0077B6',

  // ── Bordes ──────────────────────────────────────────────
  border: '#DDE3EA',
  borderFocus: Colors.primary,
  borderMuted: '#E8EDF3',

  // ── Misiones ────────────────────────────────────────────
  missionColors: {
    ...Colors.missionColors,
  },

  // ── Utilidad ────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  cream: '#12161F',
};

export function useAppTheme() {
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const colors = themeMode === 'dark' ? darkColors : lightColors;

  return {
    colors,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: themeMode === 'dark',
    isLight: themeMode === 'light',
    statusBarStyle:
      themeMode === 'dark'
        ? ('light-content' as const)
        : ('dark-content' as const),
  };
}

export type { ThemeMode };