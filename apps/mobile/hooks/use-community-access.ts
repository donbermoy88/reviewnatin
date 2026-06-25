import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/auth-provider';

export type CommunityStatus = 'active' | 'muted' | 'suspended' | 'banned';

export type CommunityAccess = {
  canPost: boolean;
  communityStatus: CommunityStatus | null;
  refresh: () => Promise<void>;
};

/** Client-side gate for UX messaging only — the real enforcement is the
 *  community_status RLS check on community_posts/community_comments INSERT. */
export function useCommunityAccess(): CommunityAccess {
  const { user } = useAuth();
  const [communityStatus, setCommunityStatus] = useState<CommunityStatus | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setCommunityStatus(null);
      return;
    }
    const { data } = await supabase.from('users').select('community_status').eq('id', user.id).maybeSingle();
    setCommunityStatus((data?.community_status as CommunityStatus) ?? 'active');
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { canPost: communityStatus !== 'muted' && communityStatus !== 'suspended' && communityStatus !== 'banned', communityStatus, refresh };
}

export function communityAccessMessage(status: CommunityStatus | null): string {
  switch (status) {
    case 'muted':
      return "Your account is muted and can't post or comment right now.";
    case 'suspended':
      return "Your account is suspended and can't post or comment right now.";
    case 'banned':
      return "Your account can't post or comment in the Community.";
    default:
      return "You can't post right now. Please try again later.";
  }
}
