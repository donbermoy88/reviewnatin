import { hashEmail } from './email-hash';
import { isSupabaseConfigured, supabase } from '../supabase';
import { addAppBreadcrumb } from '../monitoring/events';

const LOGIN_RATE_LIMIT_MESSAGE =
  'Masyadong maraming login attempt. Subukan ulit pagkalipas ng 15 minuto.';

const OTP_RESEND_RATE_LIMIT_MESSAGE =
  'Naabot mo na ang resend limit para ngayong araw. Subukan ulit bukas.';

/**
 * Server-side login throttle. A definitive denial (`data === false`) blocks the
 * attempt. RPC/transport errors intentionally fail OPEN (login proceeds) to
 * avoid a global auth outage if the RPC is unavailable — the client lockout in
 * `login-lockout.ts` and Supabase's IP-level limits remain as fallbacks. The
 * failure is recorded as a breadcrumb so silent degradation is observable.
 */
export async function assertLoginRateLimitAllowed(email: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc('check_client_login_rate_limit', {
      p_email_hash: hashEmail(email),
    });
    if (error) {
      addAppBreadcrumb(
        'auth',
        'Login rate-limit RPC error — failing open',
        { reason: error.message },
        'warning'
      );
      return null;
    }
    if (data === false) return LOGIN_RATE_LIMIT_MESSAGE;
    return null;
  } catch (err) {
    addAppBreadcrumb(
      'auth',
      'Login rate-limit check threw — failing open',
      { reason: err instanceof Error ? err.message : String(err) },
      'warning'
    );
    return null;
  }
}

/**
 * Server-side OTP resend throttle (5/day per hashed email). Returns a localized
 * error message when the cap is exceeded, otherwise null. Fails open on
 * RPC/transport errors so a backend issue never permanently blocks verification.
 */
export async function assertOtpResendRateLimitAllowed(email: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.rpc('check_client_otp_resend_rate_limit', {
      p_email_hash: hashEmail(email),
    });
    if (error) {
      addAppBreadcrumb(
        'auth',
        'OTP resend rate-limit RPC error — failing open',
        { reason: error.message },
        'warning'
      );
      return null;
    }
    if (data === false) return OTP_RESEND_RATE_LIMIT_MESSAGE;
    return null;
  } catch (err) {
    addAppBreadcrumb(
      'auth',
      'OTP resend rate-limit check threw — failing open',
      { reason: err instanceof Error ? err.message : String(err) },
      'warning'
    );
    return null;
  }
}
