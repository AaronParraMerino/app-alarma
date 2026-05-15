import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { supabase } from '../../../shared/db/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CALLBACK_PATH = 'auth/callback';
const GOOGLE_AUTH_TIMEOUT_MS = 90_000;

type GoogleAuthResult =
  | { type: 'success'; url: string }
  | { type: 'cancel' | 'dismiss' | 'opened' };

const getRedirectUri = (): string => {
  const configuredRedirect = process.env.EXPO_PUBLIC_GOOGLE_REDIRECT?.trim();
  if (configuredRedirect) {
    return configuredRedirect;
  }

  return makeRedirectUri({
    scheme: 'neurowake',
    path: GOOGLE_CALLBACK_PATH,
  });
};

function getParamsFromUrl(url: string): URLSearchParams {
  const fragment = url.includes('#') ? url.split('#')[1] : '';
  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';

  return new URLSearchParams(fragment || query);
}

function logAuthorizeUrl(url: string): void {
  try {
    const parsedUrl = new URL(url);
    const redirectTo = parsedUrl.searchParams.get('redirect_to');
    console.log('[Google] authorize host:', parsedUrl.host);
    console.log('[Google] Supabase redirect_to:', redirectTo);
  } catch (error) {
    console.log('[Google] No se pudo leer URL de autorizacion:', error);
  }
}

function isOAuthRedirectUrl(url: string, redirectTo: string): boolean {
  return url.startsWith(redirectTo) || url.includes(GOOGLE_CALLBACK_PATH);
}

async function openAuthSession(url: string, redirectTo: string): Promise<GoogleAuthResult> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let subscription: { remove: () => void } | undefined;

  try {
    return await Promise.race([
      WebBrowser.openAuthSessionAsync(url, redirectTo).then(result => {
        if (result.type === 'success') {
          return { type: 'success', url: result.url } as const;
        }

        return { type: result.type } as GoogleAuthResult;
      }),
      new Promise<GoogleAuthResult>((resolve) => {
        subscription = Linking.addEventListener('url', event => {
          console.log('[Google] Linking URL recibida:', event.url);

          if (!isOAuthRedirectUrl(event.url, redirectTo)) return;

          void WebBrowser.dismissBrowser();
          resolve({ type: 'success', url: event.url });
        });
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          void WebBrowser.dismissBrowser();
          reject(
            new Error(
              'Google no devolvio el control a la app. Revisa el OAuth Web Client de Google y reconstruye la app si cambiaste el scheme.',
            ),
          );
        }, GOOGLE_AUTH_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
    subscription?.remove();
  }
}

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
    if (!data.url) throw new Error('No se obtuvo URL de autenticacion');

    logAuthorizeUrl(data.url);

    const result = await openAuthSession(data.url, redirectTo);

    console.log('[Google] result type:', result.type);

    if (result.type === 'success') {
      console.log('[Google] return URL:', result.url);

      const params = getParamsFromUrl(result.url);
      const urlError = params.get('error_description') ?? params.get('error');
      if (urlError) throw new Error(urlError);

      const code = params.get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw new Error(exchangeError.message);
        return;
      }

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
        if (!session) throw new Error('No se pudo obtener la sesion');
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      console.log('[Google] Usuario cancelo');
    }
  },
};
