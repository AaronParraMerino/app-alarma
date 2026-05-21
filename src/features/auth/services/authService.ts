// src/features/auth/services/authService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../shared/db/supabaseClient';
import { User } from '../types/auth.types';

let passwordRecoveryMode = false;

const GUEST_MODE_KEY = '@neuro_wake/guest_mode';

const mapSupabaseUser = (u: any): User => ({
  id: u.id,
  email: u.email ?? '',
  username: u.user_metadata?.username ?? u.email?.split('@')[0] ?? 'Usuario',
  createdAt: u.created_at,
});

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '');
}

function isInvalidRefreshTokenError(error: unknown): boolean {
  return getAuthErrorMessage(error).toLowerCase().includes('invalid refresh token');
}

async function signOutSafely(options?: { scope?: 'global' | 'local' | 'others' }): Promise<void> {
  try {
    await supabase.auth.signOut(options);
  } catch (error) {
    if (!isInvalidRefreshTokenError(error)) {
      throw error;
    }
  }
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    passwordRecoveryMode = false;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo iniciar sesión');

    // Si inicia sesión real, ya no debe quedar como invitado
    await AsyncStorage.removeItem(GUEST_MODE_KEY);

    return mapSupabaseUser(data.user);
  },

  async register(email: string, password: string, username: string): Promise<User> {
    passwordRecoveryMode = false;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username } },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario');

    // Si se registra, ya no debe quedar como invitado
    await AsyncStorage.removeItem(GUEST_MODE_KEY);

    const u = data.user;

    return {
      id: u.id,
      email: u.email ?? '',
      username,
      createdAt: u.created_at,
    };
  },

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.log('[Auth] Error obteniendo sesión:', error.message);
      return null;
    }

    if (!session?.user) return null;

    return mapSupabaseUser(session.user);
  },

  async enterAsGuest(): Promise<void> {
    passwordRecoveryMode = false;
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
  },

  async isGuestSessionSaved(): Promise<boolean> {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value === 'true';
  },

  async clearGuestSession(): Promise<void> {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  },

  async logout(): Promise<void> {
    passwordRecoveryMode = false;

    await signOutSafely();
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  },

  async sendPasswordRecoveryCode(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

    if (error) throw new Error(error.message);
  },

  async verifyPasswordRecoveryCode(email: string, code: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();

    const cleanCode = code.replace(/\D/g, '');

    if (!cleanCode) {
      throw new Error('Ingresa el código de recuperación.');
    }

    passwordRecoveryMode = true;

    const { error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'recovery',
    });

    if (error) {
      passwordRecoveryMode = false;
      throw new Error('El código no es válido o ya expiró. Solicita uno nuevo.');
    }
  },

  async updateRecoveredPassword(newPassword: string): Promise<void> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      passwordRecoveryMode = false;
      throw new Error('La sesión de recuperación expiró. Solicita un nuevo código.');
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    passwordRecoveryMode = false;

    await signOutSafely();
  },

  async cancelPasswordRecovery(): Promise<void> {
    passwordRecoveryMode = false;
    await signOutSafely();
  },

  clearPasswordRecoveryMode(): void {
    passwordRecoveryMode = false;
  },

  isPasswordRecoveryMode(): boolean {
    return passwordRecoveryMode;
  },
};
