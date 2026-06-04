// src/features/profile/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/db/supabaseClient';
import { MissionHistoryLocalService } from '../../../shared/services/storage/MissionHistoryLocalService';
import { useAuth } from '../../auth/store/authStore';
import { Profile } from '../types/profile.types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  totalMissionsResolved: number;
  refetch: () => void;
}

function getEmailLocalPart(email?: string | null): string {
  return String(email ?? '').split('@')[0] ?? '';
}

function getBestUsername(user: {
  email?: string | null;
  username?: string | null;
}): string {
  const username = user.username?.trim();

  if (username) {
    return username;
  }

  const localPart = getEmailLocalPart(user.email);

  return localPart || 'Usuario';
}

function shouldRepairUsername(
  profileUsername: string | null | undefined,
  authUsername: string,
  email?: string | null,
): boolean {
  const current = profileUsername?.trim();
  const cleanAuthUsername = authUsername.trim();
  const emailLocalPart = getEmailLocalPart(email);

  if (!cleanAuthUsername) {
    return false;
  }

  if (!current) {
    return true;
  }

  return (
    current === emailLocalPart &&
    cleanAuthUsername !== emailLocalPart
  );
}

export function useProfile(): UseProfileReturn {
  const { user, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalMissionsResolved, setTotalMissionsResolved] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setProfile(null);
      setTotalMissionsResolved(0);
      return;
    }

    setLoading(true);
    setError(null);
    setTotalMissionsResolved(MissionHistoryLocalService.countByUser(user.id));

    try {
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileResult.error) {
        console.log(
          '[Profile] Error cargando perfil:',
          profileResult.error.message
        );

        setError('Toca este mensaje para intentar cargar tus datos otra vez.');
      } else {
        const bestUsername = getBestUsername(user);
        let nextProfile = profileResult.data as Profile | null;

        if (!nextProfile) {
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              username: bestUsername,
              updated_at: new Date().toISOString(),
            })
            .select('*')
            .single();

          if (createError) {
            console.log(
              '[Profile] Error creando perfil faltante:',
              createError.message,
            );
            setError('Toca este mensaje para intentar cargar tus datos otra vez.');
          } else {
            nextProfile = createdProfile as Profile;
          }
        } else if (
          shouldRepairUsername(
            nextProfile.username,
            bestUsername,
            user.email,
          )
        ) {
          const { data: repairedProfile, error: repairError } = await supabase
            .from('profiles')
            .update({
              username: bestUsername,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
            .select('*')
            .single();

          if (repairError) {
            console.log(
              '[Profile] Error reparando nombre de perfil:',
              repairError.message,
            );
          } else {
            nextProfile = repairedProfile as Profile;
          }
        }

        setProfile(nextProfile);
      }

      void (async () => {
        try {
          const missionsResult = await supabase
            .from('missions_history')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (missionsResult.error) {
            console.log(
              '[Profile] Error contando misiones:',
              missionsResult.error.message,
            );
            return;
          }

          setTotalMissionsResolved(missionsResult.count ?? 0);
        } catch (missionsError) {
          console.log(
            '[Profile] Error inesperado contando misiones:',
            missionsError,
          );
        }
      })();
    } catch (profileError) {
      console.log('[Profile] Error inesperado cargando perfil:', profileError);
      setError('Toca este mensaje para intentar cargar tus datos otra vez.');
    } finally {
      setLoading(false);
    }
  }, [
    isAuthenticated,
    user?.email,
    user?.id,
    user?.username,
  ]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    totalMissionsResolved,
    refetch: fetchProfile,
  };
}
