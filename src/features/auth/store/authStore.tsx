// src/features/auth/store/authStore.tsx
// CAMBIO: se añadió la acción exitGuest() para redirigir invitados al login
import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState, AuthContextType, User } from '../types/auth.types';
import { authService } from '../services/authService';
import { initDB } from '../../../shared/db/localDB';
import { startSyncListener, stopSyncListener, syncAlarms } from '../../../shared/services/storage/sync.service';
import { supabase } from '../../../shared/db/supabaseClient';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ── Verificar sesión activa al arrancar ────────────────────────────────────
  useEffect(() => {
    initDB();
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const u = session.user;
        const user: User = {
          id: u.id,
          email: u.email ?? '',
          username: u.user_metadata?.username ?? u.email?.split('@')[0] ?? '',
          createdAt: u.created_at,
        };
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        if (u.id) {
          syncAlarms(u.id);
          startSyncListener(u.id);
        }
      } else {
        dispatch({ type: 'SET_READY' });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
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

  const logout = async () => {
    stopSyncListener();
    await authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // ── Nuevo: para invitados que quieren ir al login ──────────────────────────
  // No llama a Supabase porque el invitado nunca inició sesión allí
  const exitGuest = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const loginAsGuest = () => {
    dispatch({ type: 'LOGIN_GUEST' });
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, loginAsGuest, logout, exitGuest, clearError }}
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