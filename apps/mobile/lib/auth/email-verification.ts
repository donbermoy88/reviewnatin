import type { User } from '@supabase/supabase-js';

/** OAuth providers confirm email via the identity provider. */
export function isEmailVerified(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.email_confirmed_at) return true;
  const provider = user.app_metadata?.provider as string | undefined;
  if (provider && provider !== 'email') return true;
  const providers = user.app_metadata?.providers as string[] | undefined;
  if (providers?.some((p) => p !== 'email')) return true;
  return false;
}
