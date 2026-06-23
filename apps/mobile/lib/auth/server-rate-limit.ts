import { hashEmail } from './email-hash';
import { isSupabaseConfigured, supabase } from '../supabase';

const LOGIN_RATE_LIMIT_MESSAGE =
  'Masyadong maraming login attempt. Subukan ulit pagkalipas ng 15 minuto.';

/** Server-side login throttle (best-effort; non-blocking when RPC unavailable). */
export async function assertLoginRateLimitAllowed(email: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc('check_client_login_rate_limit', {
      p_email_hash: hashEmail(email),
    });
    if (error) return null;
    if (data === false) return LOGIN_RATE_LIMIT_MESSAGE;
    return null;
  } catch {
    return null;
  }
}
