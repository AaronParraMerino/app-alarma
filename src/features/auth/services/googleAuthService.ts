import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../../shared/db/supabaseClient';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const isExpoGo = Constants.appOwnership === 'expo';

export const googleAuthService = {
  async signInWithGoogle(): Promise<void> {

    // En Expo Go usamos el callback de Supabase directamente
    // En APK usamos el scheme propio
    const redirectTo = isExpoGo
      ? 'https://kvcsezfzbvmtmhanxupf.supabase.co/auth/v1/callback'
      : 'appalarma://auth/callback';

    console.log('[Google] isExpoGo:', isExpoGo);
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

    if (isExpoGo) {
      // En Expo Go abrimos el navegador y esperamos que el usuario
      // vuelva manualmente — la sesión la detecta onAuthStateChange
      await WebBrowser.openBrowserAsync(data.url);

      // Dar tiempo a que Supabase procese la sesión
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Google] sesión después de navegador:', !!session);
    } else {
      // En APK el scheme funciona correctamente
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'appalarma://',
      );

      console.log('[Google] result type:', result.type);

      if (result.type === 'success') {
        const fragment = result.url.split('#')[1];
        const query = result.url.split('?')[1];
        const params = new URLSearchParams(fragment ?? query ?? '');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken ?? '',
          });
        }
      }
    }
  },
};