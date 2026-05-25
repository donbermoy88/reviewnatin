import { supabase, isSupabaseConfigured } from '../supabase';

export type ReadinessHistoryPoint = {
  score: number;
  computedAt: string;
};

export async function fetchReadinessHistory(
  examSlug: string,
  limit = 12
): Promise<ReadinessHistoryPoint[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_readiness_history', {
    p_exam_slug: examSlug,
    p_limit: limit,
  });

  if (error) throw error;

  return ((data ?? []) as Array<{ score: number; computed_at: string }>).map((row) => ({
    score: Number(row.score ?? 0),
    computedAt: row.computed_at,
  }));
}
