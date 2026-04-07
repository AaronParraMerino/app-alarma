import { supabase } from '../../../shared/db/supabaseClient';
import { User } from '../types/auth.types';

export const authService = {

  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const u = data.user;
    return {
      id: u.id,
      email: u.email ?? '',
      username: u.user_metadata?.username ?? email.split('@')[0],
      createdAt: u.created_at,
    };
  },

  async register(email: string, password: string, username: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear el usuario');

    const u = data.user;
    return {
      id: u.id,
      email: u.email ?? '',
      username,
      createdAt: u.created_at,
    };
  },

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  },
};