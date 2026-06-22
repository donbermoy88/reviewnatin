import { useEffect } from 'react';
import { identifyPostHog, resetPostHog } from '../../lib/analytics/posthog';
import { resolveBetaCohort } from '../../lib/beta-cohort';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';

/** Sync Supabase user + beta cohort into PostHog person properties. */
export function PostHogIdentity() {
  const { user } = useAuth();
  const { isPremium } = useEntitlements();

  useEffect(() => {
    if (!user?.id) {
      resetPostHog();
      return;
    }

    const cohort = resolveBetaCohort(user.id, isPremium());
    identifyPostHog(user.id, {
      email: user.email ?? undefined,
      cohort,
      auth_provider: (user.app_metadata?.provider as string | undefined) ?? 'email',
    });
  }, [user?.id, user?.email, user?.app_metadata?.provider, isPremium]);

  return null;
}
