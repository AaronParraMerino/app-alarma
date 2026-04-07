import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AuthState, AuthContextType, User } from '../types/auth.types';
import { authService } from '../services/authService';

// Estado inicial
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isGuest: false,
  isLoading: false,
  error: null,
};

// Acciones
type AuthAction =
  | { type: 'SET_LOADING' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_GUEST' }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { ...state, isLoading: false, isAuthenticated: true, isGuest: false, user: action.payload, error: null };
    case 'LOGIN_GUEST':
      return { ...state, isLoading: false, isAuthenticated: false, isGuest: true, user: null, error: null };
    case 'LOGOUT':
      return { ...initialState };
    case 'SET_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const user = await authService.login(email, password);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message ?? 'Error al iniciar sesión' });
    }
  };

  const register = async (email: string, password: string, username: string) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const user = await authService.register(email, password, username);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message ?? 'Error al registrarse' });
    }
  };

  const loginAsGuest = () => {
    dispatch({ type: 'LOGIN_GUEST' });
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginAsGuest, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}