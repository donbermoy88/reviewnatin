import { supabase, isSupabaseConfigured } from '../supabase';
import { clearOnboarding } from '../onboarding-store';
import { clearGuestQuizHistory } from '../guest-quiz-history';

export type DeleteAccountResult = { ok: true } | { ok: false; error: string };

/** Permanently delete the signed-in account and all associated data (Apple App Store requirement). */
export async function deleteUserAccount(): Promise<DeleteAccountResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Not available offline. Please try again when connected.' };
  }

  const { error } = await supabase.rpc('delete_user_account');
  if (error) {
    return { ok: false, error: error.message };
  }

  await Promise.all([clearOnboarding(), clearGuestQuizHistory()]);
  await supabase.auth.signOut({ scope: 'local' });

  return { ok: true };
}
