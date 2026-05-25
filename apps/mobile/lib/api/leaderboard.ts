import { supabase, isSupabaseConfigured } from '../supabase';

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  xp: number;
  rank: number;
  isCurrentUser: boolean;
};

export type LeaderboardPeriod = 'week' | 'all';

export async function fetchLeaderboard(
  examSlug: string,
  limit = 50,
  period: LeaderboardPeriod = 'week'
): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_exam_slug: examSlug,
    p_limit: limit,
    p_period: period,
  });

  if (error) throw error;

  return ((data ?? []) as {
    user_id: string;
    display_name: string;
    xp: number;
    rank: number;
    is_current_user: boolean;
  }[]).map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    xp: row.xp,
    rank: Number(row.rank),
    isCurrentUser: row.is_current_user,
  }));
}
