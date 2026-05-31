// src/shared/i18n/translations.ts
export const translations = {
  es: {
    common: {
      cancel: 'Cancelar',
      accept: 'Aceptar',
      save: 'Guardar',
      close: 'Cerrar',
      back: 'Volver',
    },

    settings: {
      title: 'Ajustes',
      account: 'Cuenta',
      preferences: 'Preferencias',
      appearance: 'Apariencia',
      language: 'Idioma',
      dark: 'Oscuro',
      light: 'Claro',
      spanish: 'Español',
      english: 'Inglés',
      selectAppearance: 'Seleccionar apariencia',
      selectLanguage: 'Seleccionar idioma',
      profile: 'Perfil',
      missionHistory: 'Historial de misiones',
      logout: 'Cerrar sesión',
    },

    tabs: {
      alarm: 'Alarma',
      stopwatch: 'Cronómetro',
      missions: 'Misiones',
      settings: 'Ajustes',
    },

    auth: {
      login: 'Iniciar Sesión',
      register: 'Regístrate',
      email: 'Correo electrónico',
      password: 'Contraseña',
      repeatPassword: 'Repite la contraseña',
      name: 'Nombre',
      continueWithoutAccount: 'Continuar sin cuenta',
      loginWithGoogle: 'Google',
    },
  },

  en: {
    common: {
      cancel: 'Cancel',
      accept: 'Accept',
      save: 'Save',
      close: 'Close',
      back: 'Back',
    },

    settings: {
      title: 'Settings',
      account: 'Account',
      preferences: 'Preferences',
      appearance: 'Appearance',
      language: 'Language',
      dark: 'Dark',
      light: 'Light',
      spanish: 'Spanish',
      english: 'English',
      selectAppearance: 'Select appearance',
      selectLanguage: 'Select language',
      profile: 'Profile',
      missionHistory: 'Mission history',
      logout: 'Log out',
    },

    tabs: {
      alarm: 'Alarm',
      stopwatch: 'Stopwatch',
      missions: 'Missions',
      settings: 'Settings',
    },

    auth: {
      login: 'Log in',
      register: 'Sign up',
      email: 'Email',
      password: 'Password',
      repeatPassword: 'Repeat password',
      name: 'Name',
      continueWithoutAccount: 'Continue without account',
      loginWithGoogle: 'Google',
    },
  },
} as const;

export type TranslationLanguage = keyof typeof translations;
