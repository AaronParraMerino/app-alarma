// src/features/auth/store/authStore.tsx
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState, AuthContextType, User } from '../types/auth.types';
import { authService } from '../services/authService';
import { initDB } from '../../../shared/db/localDB';
import {
  startSyncListener,
  stopSyncListener,
  syncAlarms,
} from '../../../shared/services/storage/sync.service';
import {
  clearSupabaseSessionStorage,
  supabase,
} from '../../../shared/db/supabaseClient';
import { googleAuthService } from '../services/googleAuthService';
import { syncPreferencesFromCloud } from '../../../shared/services/preferences/preferencesSync.service';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: true,
  error: null,
};

type AuthAction =
  | { type: 'SET_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_GUEST' }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_READY' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        isGuest: false,
        user: action.payload,
        error: null,
      };

    case 'LOGIN_GUEST':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        isGuest: true,
        user: null,
        error: null,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SET_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SET_READY':
      return {
        ...state,
        isLoading: false,
      };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(u: any, fallbackEmail?: string): User {
  return {
    id: u.id,
    email: u.email ?? fallbackEmail ?? '',
    username:
      u.user_metadata?.username ??
      u.user_metadata?.full_name ??
      u.user_metadata?.name ??
      u.email?.split('@')[0] ??
      '',
    createdAt: u.created_at,
  };
}

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? '');
}

function isInvalidRefreshTokenError(error: unknown): boolean {
  return getAuthErrorMessage(error).toLowerCase().includes('invalid refresh token');
}

function clearSupabaseAuthStorage(): void {
  clearSupabaseSessionStorage();
}

async function clearInvalidLocalSession(): Promise<void> {
  clearSupabaseAuthStorage();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    initDB();

    let mounted = true;

    const loadInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          if (!isInvalidRefreshTokenError(error)) {
            console.log('[Auth] Sesion local invalida, se limpia:', error.message);
          }

          await clearInvalidLocalSession();

          if (await authService.isGuestSessionSaved()) {
            dispatch({
              type: 'LOGIN_GUEST',
            });
          } else {
            dispatch({ type: 'SET_READY' });
          }

          return;
        }

        /**
         * IMPORTANTE:
         * Si estamos en recuperación de contraseña, Supabase crea una sesión temporal.
         * No queremos mandar al usuario a Main todavía.
         */
        if (authService.isPasswordRecoveryMode()) {
          console.log('[Auth] Modo recuperación activo, no se restaura sesión inicial');
          dispatch({ type: 'SET_READY' });
          return;
        }

        if (session?.user) {
          const user = mapSupabaseUser(session.user);

          await authService.clearGuestSession();

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: user,
          });

          if (session.user.id) {
            void syncPreferencesFromCloud(session.user.id);
            void syncAlarms(session.user.id);
            startSyncListener(session.user.id);
          }

          return;
        }

        /**
         * Si no hay sesión real de Supabase,
         * revisamos si antes entró como invitado.
         */
        if (await authService.isGuestSessionSaved()) {
          console.log('[Auth] Restaurando sesión de invitado');

          dispatch({
            type: 'LOGIN_GUEST',
          });

          return;
        }

        dispatch({ type: 'SET_READY' });
      } catch (error: any) {
        if (isInvalidRefreshTokenError(error)) {
          await clearInvalidLocalSession();
          console.log('[Auth] Sesion local expirada, se limpio el token guardado.');
        } else {
          console.log('[Auth] Error cargando sesión inicial:', getAuthErrorMessage(error));
        }
        dispatch({ type: 'SET_READY' });
      }
    };

    void loadInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('[Auth] Evento:', event);

      /**
       * IMPORTANTE:
       * Cuando verificas el código de recuperación con verifyOtp,
       * Supabase puede disparar SIGNED_IN porque crea una sesión temporal.
       * Aquí evitamos que entre a Main.
       */
      if (authService.isPasswordRecoveryMode()) {
        console.log('[Auth] Sesión temporal de recuperación, no entrar a Main');

        if (event === 'SIGNED_OUT') {
          authService.clearPasswordRecoveryMode();
          stopSyncListener();

          if (await authService.isGuestSessionSaved()) {
            dispatch({ type: 'LOGIN_GUEST' });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'SET_READY' });
        }

        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const user = mapSupabaseUser(session.user);

        await authService.clearGuestSession();

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: user,
        });

        if (session.user.id) {
          void syncPreferencesFromCloud(session.user.id);
          void syncAlarms(session.user.id);
          startSyncListener(session.user.id);
        }
      }

      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] PASSWORD_RECOVERY detectado');
        dispatch({ type: 'SET_READY' });
      }

      if (event === 'SIGNED_OUT') {
        stopSyncListener();

        if (await authService.isGuestSessionSaved()) {
          dispatch({ type: 'LOGIN_GUEST' });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING' });

    try {
      const user = await authService.login(email, password);

      await authService.clearGuestSession();

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: user,
      });

      if (user?.id) {
        void syncPreferencesFromCloud(user.id);
        await syncAlarms(user.id);
        startSyncListener(user.id);
      }
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message ?? 'Error al iniciar sesión',
      });
    }
  };

  const register = async (email: string, password: string, username: string) => {
    dispatch({ type: 'SET_LOADING' });

    try {
      const user = await authService.register(email, password, username);

      await authService.clearGuestSession();

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: user,
      });

      if (user?.id) {
        void syncPreferencesFromCloud(user.id);
        await syncAlarms(user.id);
        startSyncListener(user.id);
      }
    } catch (error: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.message ?? 'Error al registrarse',
      });
    }
  };

  const loginWithGoogle = async () => {
    dispatch({ type: 'SET_LOADING' });

    try {
      if (authService.isPasswordRecoveryMode()) {
        await authService.cancelPasswordRecovery();
      } else {
        authService.clearPasswordRecoveryMode();
      }

      await authService.clearGuestSession();

      await googleAuthService.signInWithGoogle();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const user = mapSupabaseUser(session.user);

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: user,
        });

        if (session.user.id) {
          void syncPreferencesFromCloud(session.user.id);
          await syncAlarms(session.user.id);
          startSyncListener(session.user.id);
        }

        return;
      }

      dispatch({ type: 'SET_READY' });
    } catch (error: any) {
      console.log('[Google] error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error.message ?? 'Error con Google',
      });
    }
  };

  const logout = async () => {
    stopSyncListener();
    await authService.clearGuestSession();

    await authService.logout();

    dispatch({ type: 'LOGOUT' });
  };

  const exitGuest = async () => {
    await authService.clearGuestSession();
    dispatch({ type: 'LOGOUT' });
  };

  const loginAsGuest = async () => {
    stopSyncListener();
    await authService.enterAsGuest();

    dispatch({ type: 'LOGIN_GUEST' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        loginAsGuest,
        loginWithGoogle,
        logout,
        exitGuest,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
