import { supabase, isSupabaseConfigured } from '../supabase';

export type StreakStatus = {
  streakCount: number;
  streakFreezes: number;
  totalXp: number;
};

export const STREAK_FREEZE_COST_XP = 50;
export const STREAK_FREEZE_CAP = 3;

export async function fetchStreakStatus(userId: string): Promise<StreakStatus | null> {
  if (!isSupabaseConfigured || !userId) return null;
  const { data, error } = await supabase
    .from('users')
    .select('streak_count, streak_freezes, total_xp')
    .eq('id', userId)
    .single();
  if (error) return null;
  return {
    streakCount: data.streak_count ?? 0,
    streakFreezes: data.streak_freezes ?? 0,
    totalXp: data.total_xp ?? 0,
  };
}

export type BuyFreezeResult =
  | { ok: true; streakFreezes: number; totalXp: number }
  | { ok: false; error: 'insufficient_xp' | 'cap_reached' | 'unknown' };

/** Spend XP to buy one streak freeze (server-enforced cost + cap). */
export async function buyStreakFreeze(): Promise<BuyFreezeResult> {
  if (!isSupabaseConfigured) return { ok: false, error: 'unknown' };
  const { data, error } = await supabase.rpc('buy_streak_freeze');
  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('insufficient_xp')) return { ok: false, error: 'insufficient_xp' };
    if (msg.includes('streak_freeze_cap_reached')) return { ok: false, error: 'cap_reached' };
    return { ok: false, error: 'unknown' };
  }
  const row = (data as { streak_freezes: number; total_xp: number }[] | null)?.[0];
  return { ok: true, streakFreezes: row?.streak_freezes ?? 0, totalXp: row?.total_xp ?? 0 };
}
