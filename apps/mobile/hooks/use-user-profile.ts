import { useCallback, useEffect, useState } from 'react';
import { fallbackDisplayName, fetchUserProfile } from '../lib/api/profile';
import { useAuth } from '../providers/auth-provider';

export function useUserProfile(guestLabel = 'Guest') {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!user);

  const refresh = useCallback(async () => {
    if (!user) {
      setDisplayName(null);
      setAvatarUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await fetchUserProfile(user.id);
      const resolved =
        profile.displayName?.trim() || fallbackDisplayName(user, guestLabel);
      setDisplayName(resolved);
      setAvatarUrl(profile.avatarUrl);
    } catch {
      setDisplayName(fallbackDisplayName(user, guestLabel));
      setAvatarUrl(null);
    } finally {
      setLoading(false);
    }
  }, [user, guestLabel]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const resolved = user
    ? (displayName ?? fallbackDisplayName(user, guestLabel))
    : guestLabel;

  return {
    displayName: resolved,
    avatarUrl,
    initials: resolved.slice(0, 2).toUpperCase(),
    loading,
    refresh,
  };
}
