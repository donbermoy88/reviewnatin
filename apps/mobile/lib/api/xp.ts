import { supabase, isSupabaseConfigured } from '../supabase';

export type XpStats = { totalXp: number; hintCredits: number };

export async function fetchXpStats(): Promise<XpStats> {
  if (!isSupabaseConfigured) return { totalXp: 0, hintCredits: 3 };
  const { data } = await supabase.rpc('get_user_xp_stats');
  const row = (data as { total_xp: number; hint_credits: number }[] | null)?.[0];
  return { totalXp: row?.total_xp ?? 0, hintCredits: row?.hint_credits ?? 3 };
}

/** Deducts 1 hint credit + 10 XP server-side. Returns remaining credits. */
export async function useHint(): Promise<number> {
  if (!isSupabaseConfigured) return 3;
  const { data, error } = await supabase.rpc('use_hint');
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}

/** Award session XP. Call after completePracticeSession. */
export async function awardSessionXp(sessionId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.rpc('award_session_xp', { p_session_id: sessionId });
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}
