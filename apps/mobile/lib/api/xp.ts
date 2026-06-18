import { supabase, isSupabaseConfigured } from '../supabase';
import { asNumber, firstRow } from './result';

export type XpStats = { totalXp: number; hintCredits: number };

export async function fetchXpStats(): Promise<XpStats> {
  if (!isSupabaseConfigured) return { totalXp: 0, hintCredits: 3 };
  const { data } = await supabase.rpc('get_user_xp_stats');
  const row = firstRow<{ total_xp: number; hint_credits: number }>(data);
  return { totalXp: row?.total_xp ?? 0, hintCredits: row?.hint_credits ?? 3 };
}

/** Deducts 1 hint credit + 10 XP server-side. Returns remaining credits. */
export async function deductHint(): Promise<number> {
  if (!isSupabaseConfigured) return 3;
  const { data, error } = await supabase.rpc('use_hint');
  if (error) return 0;
  return asNumber(data, 0);
}

/** Award session XP. Call after completePracticeSession. */
export async function awardSessionXp(sessionId: string): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await supabase.rpc('award_session_xp', { p_session_id: sessionId });
  if (error) return 0;
  return asNumber(data, 0);
}
