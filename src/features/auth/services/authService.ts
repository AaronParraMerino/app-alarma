import { User } from '../types/auth.types';

// Cuando tengas Supabase listo, reemplazás estas funciones
// import { supabase } from '../../../shared/db/supabaseClient';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    // TODO: reemplazar con supabase.auth.signInWithPassword
    throw new Error('Login no implementado aún');
  },

  async register(email: string, password: string, username: string): Promise<User> {
    // TODO: reemplazar con supabase.auth.signUp
    throw new Error('Register no implementado aún');
  },

  async logout(): Promise<void> {
    // TODO: reemplazar con supabase.auth.signOut
  },
};