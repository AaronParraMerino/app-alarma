import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState, AuthContextType, User } from '../types/auth.types';
import { authService } from '../services/authService';
import { initDB } from '../../../shared/db/localDB';
import { startSyncListener, stopSyncListener, syncAlarms } from '../../../shared/services/storage/sync.service';
import { supabase } from '../../../shared/db/supabaseClient';
import { googleAuthService } from '../services/googleAuthService';

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
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, isAuthenticated: true, isGuest: false, user: action.payload, error: null };
    case 'LOGIN_GUEST':
      return { ...state, isLoading: false, isAuthenticated: false, isGuest: true, user: null, error: null };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_READY':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper para mapear usuario de Supabase a User
function mapSupabaseUser(u: any, fallbackEmail?: string): User {
  return {
    id: u.id,
    email: u.email ?? fallbackEmail ?? '',
    username: u.user_metadata?.username
      ?? u.user_metadata?.full_name
      ?? u.user_metadata?.name
      ?? u.email?.split('@')[0]
      ?? '',
    createdAt: u.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Verificar sesión activa al arrancar ────────────────────────────────────
  useEffect(() => {
    initDB();
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        if (session.user.id) {
          syncAlarms(session.user.id);
          startSyncListener(session.user.id);
        }
      } else {
        dispatch({ type: 'SET_READY' });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const user = mapSupabaseUser(session.user);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        if (session.user.id) {
          syncAlarms(session.user.id);
          startSyncListener(session.user.id);
        }
      }

      if (event === 'SIGNED_OUT') {
        stopSyncListener();
        dispatch({ type: 'LOGOUT' });
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
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      if (user?.id) {
        await syncAlarms(user.id);
        startSyncListener(user.id);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message ?? 'Error al iniciar sesión' });
    }
  };

  const register = async (email: string, password: string, username: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const user = await authService.register(email, password, username);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      if (user?.id) {
        await syncAlarms(user.id);
        startSyncListener(user.id);
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message ?? 'Error al registrarse' });
    }
  };

  const loginWithGoogle = async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      // Lanzar el navegador sin await para no bloquear
      googleAuthService.signInWithGoogle().catch((error) => {
        console.log('[Google] error en background:', error);
      });

      // Volver a estado listo inmediatamente
      // El onAuthStateChange maneja el LOGIN_SUCCESS cuando vuelva
      dispatch({ type: 'SET_READY' });

    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message ?? 'Error con Google' });
    }
  };

  const logout = async () => {
    stopSyncListener();
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const exitGuest = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const loginAsGuest = () => {
    dispatch({ type: 'LOGIN_GUEST' });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, loginAsGuest, loginWithGoogle, logout, exitGuest, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}