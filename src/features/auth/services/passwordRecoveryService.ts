// src/features/auth/services/passwordRecoveryService.ts
import * as Linking from 'expo-linking';
import { supabase } from '../../../shared/db/supabaseClient';

const PASSWORD_RESET_PATH = 'auth/reset-password';

function getParamsFromUrl(url: string): URLSearchParams {
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';

  return new URLSearchParams(fragment || query);
}

export const passwordRecoveryService = {
  getRedirectUri(): string {
    const googleRedirect = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT?.trim();
    if (googleRedirect) {
      const base = new URL(googleRedirect);
      return `${base.protocol}//${base.host}/${PASSWORD_RESET_PATH.split('/').at(-1)}`;
    }

    return Linking.createURL(PASSWORD_RESET_PATH);
  },

  isPasswordRecoveryUrl(url: string): boolean {
    const params = getParamsFromUrl(url);

    return (
      url.includes(PASSWORD_RESET_PATH) ||
      params.get('type') === 'recovery' ||
      !!params.get('access_token') ||
      !!params.get('code')
    );
  },

  async sendResetEmail(email: string): Promise<void> {
    const redirectTo = this.getRedirectUri();

    console.log('[PasswordRecovery] redirectTo:', redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) throw new Error(error.message);
  },

  async createSessionFromRecoveryUrl(url: string): Promise<boolean> {
    const params = getParamsFromUrl(url);

    const urlError = params.get('error_description') ?? params.get('error');
    if (urlError) throw new Error(urlError);

    const code = params.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw new Error(error.message);
      return true;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) return false;

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw new Error(error.message);

    return true;
  },

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);
  },
};
