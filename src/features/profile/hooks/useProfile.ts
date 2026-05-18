// src/features/profile/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/db/supabaseClient';
import { useAuth } from '../../auth/store/authStore';
import { Profile } from '../types/profile.types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  totalMissionsResolved: number;
  refetch: () => void;
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

    try {
      const [profileResult, missionsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),

        supabase
          .from('missions_history')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      if (profileResult.error) {
        console.log(
          '[Profile] Error cargando perfil:',
          profileResult.error.message
        );

        setError('Toca este mensaje para intentar cargar tus datos otra vez.');
      } else {
        setProfile(profileResult.data as Profile);
      }

      if (missionsResult.error) {
        console.log(
          '[Profile] Error contando misiones:',
          missionsResult.error.message
        );

        setTotalMissionsResolved(0);
      } else {
        setTotalMissionsResolved(missionsResult.count ?? 0);
      }
    } catch (profileError) {
      console.log('[Profile] Error inesperado cargando perfil:', profileError);
      setError('Toca este mensaje para intentar cargar tus datos otra vez.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

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