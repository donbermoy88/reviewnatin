import { supabase, isSupabaseConfigured } from '../supabase';

export type ReadinessSnapshot = {
  score: number;
  factors: {
    source?: string;
    diagnostic_score?: number;
    mock_score_avg?: number;
    topic_coverage_pct?: number;
    mistake_mastery_pct?: number;
    diagnostic_trend?: number;
    score_by_subject?: Record<string, number>;
    practice_accuracy_14d?: number;
  };
  computedAt: string;
};

export type ReadinessBand = {
  label: string;
  copy: string;
};

export function getReadinessBand(score: number): ReadinessBand {
  if (score >= 85) {
    return { label: 'Exam-ready', copy: 'Great form — keep it up with regular mocks.' };
  }
  if (score >= 70) {
    return { label: 'Almost there', copy: 'Strong coverage — take a full mock this week.' };
  }
  if (score >= 40) {
    return { label: 'Making progress', copy: 'Good progress — keep your daily streak going.' };
  }
  return { label: 'Building foundation', copy: 'Focus on the basics — PasaPath will prioritize your weak areas.' };
}

export async function fetchLatestReadiness(examSlug: string): Promise<ReadinessSnapshot | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_latest_readiness', {
    p_exam_slug: examSlug,
  });

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    score: number;
    factors: ReadinessSnapshot['factors'];
    computed_at: string;
  };

  return {
    score: Number(row.score ?? 0),
    factors: row.factors ?? {},
    computedAt: row.computed_at,
  };
}

export async function recomputeReadiness(examSlug: string): Promise<number | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('recompute_user_readiness', {
    p_exam_slug: examSlug,
  });

  if (error) throw error;

  const row = data as { success?: boolean; score?: number } | null;
  return row?.success ? Number(row.score ?? 0) : null;
}
