import { supabase } from '../../db/supabaseClient';
import { Profile } from '../../../features/profile/types/profile.types';

export type ProfileUpdateInput = {
  userId: string;
  username: string;
  bio: string | null;
};

export async function updateProfile({
  userId,
  username,
  bio,
}: ProfileUpdateInput): Promise<Profile> {
  const cleanUsername = username.trim();
  const cleanBio = bio?.trim() || null;

  if (!cleanUsername) {
    throw new Error('El nombre no puede estar vacio.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      username: cleanUsername,
      bio: cleanBio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      username: cleanUsername,
    },
  });

  if (metadataError) {
    console.log('[Profile] No se pudo actualizar metadata:', metadataError.message);
  }

  return data as Profile;
}

export async function deleteCurrentAccountData(userId: string): Promise<void> {
  const tables = ['missions_history', 'alarms', 'profiles'] as const;

  for (const table of tables) {
    const column = table === 'profiles' ? 'id' : 'user_id';
    const { error } = await supabase.from(table).delete().eq(column, userId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
