import { isSupabaseConfigured, supabase } from '../supabase';
import { isDisposableEmail } from './disposable-email';

/** Client-side list first, then server blocklist when available. */
export async function isEmailBlockedForSignup(email: string): Promise<boolean> {
  if (isDisposableEmail(email)) return true;
  if (!isSupabaseConfigured) return false;

  try {
    const { data, error } = await supabase.rpc('is_email_domain_blocked', {
      p_email: email.trim().toLowerCase(),
    });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
