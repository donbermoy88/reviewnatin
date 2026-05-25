import type { User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../supabase';

export type UserProfile = {
  displayName: string | null;
  email: string | null;
};

export function fallbackDisplayName(user: User | null | undefined, guestLabel = 'Guest'): string {
  if (!user) return guestLabel;
  const meta = user.user_metadata?.display_name ?? user.user_metadata?.full_name;
  if (typeof meta === 'string' && meta.trim()) return meta.trim();
  return user.email?.split('@')[0] ?? 'Reviewer';
}

export async function fetchUserProfile(userId: string): Promise<UserProfile> {
  if (!isSupabaseConfigured) {
    return { displayName: null, email: null };
  }

  const { data, error } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return { displayName: data.display_name, email: data.email };
}

export async function updateUserDisplayName(
  displayName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: 'Hindi pa naka-connect ang Supabase.' };
  }

  const { data: authData, error: authError } = await supabase.auth.updateUser({
    data: { display_name: displayName, full_name: displayName },
  });

  if (authError) {
    return { ok: false, error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { ok: false, error: 'Hindi ma-update ang profile. Subukan ulit.' };
  }

  const { error: profileError } = await supabase
    .from('users')
    .update({ display_name: displayName })
    .eq('id', userId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  return { ok: true };
}
