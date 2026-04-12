// src/features/profile/hooks/useProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../shared/db/supabaseClient';
import { useAuth } from '../../auth/store/authStore';
import { Profile } from '../types/profile.types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProfile(): UseProfileReturn {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProfile(data as Profile);
    }
    setLoading(false);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}