import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from '../supabase';

/** Simple deterministic hash — not cryptographic, sufficient for audit dedup. */
function hashEmail(email: string): string {
  let h = 0;
  const s = email.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `e${Math.abs(h).toString(16)}`;
}

function deviceInfo(): string {
  const model = Device.modelName ?? 'unknown';
  const os = `${Platform.OS} ${Platform.Version}`;
  return `${model} / ${os}`;
}

/** Best-effort login audit trail (no raw email stored). */
export async function logAuthLoginAttempt(
  email: string,
  success: boolean,
  userId?: string | null,
  failureReason?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.rpc('log_auth_login_attempt', {
      p_user_id: userId ?? null,
      p_email_hash: hashEmail(email),
      p_success: success,
      p_device_info: deviceInfo(),
      p_failure_reason: failureReason ?? null,
    });
  } catch {
    // Non-blocking audit logging
  }
}
