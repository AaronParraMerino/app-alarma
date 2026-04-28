import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../shared/db/supabaseClient';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Detecta el entorno automáticamente
const getRedirectUri = (): string => {
  const appOwnership = Constants.appOwnership;
  const executionEnvironment = Constants.executionEnvironment;

  console.log('[Google] appOwnership:', appOwnership);
  console.log('[Google] executionEnvironment:', executionEnvironment);

  // Expo Go
  if (appOwnership === 'expo') {
    return 'exp+appalarma://expo-development-client';
  }

  // Development Build o APK
  return 'appalarma://auth/callback';
};

export const googleAuthService = {
  async signInWithGoogle(): Promise<void> {
    const redirectTo = getRedirectUri();
    console.log('[Google] redirectTo:', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw new Error(error.message);
    if (!data.url) throw new Error('No se obtuvo URL de autenticación');

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo,
    );

    console.log('[Google] result type:', result.type);

    if (result.type === 'success') {
      console.log('[Google] return URL:', result.url);

      const fragment = result.url.split('#')[1];
      const query = result.url.split('?')[1];
      const params = new URLSearchParams(fragment ?? query ?? '');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken ?? '',
        });
        if (sessionError) throw new Error(sessionError.message);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No se pudo obtener la sesión');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('[Google] Usuario canceló');
    }
  },
};