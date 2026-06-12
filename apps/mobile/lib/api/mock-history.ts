import { supabase, isSupabaseConfigured } from '../supabase';

export type MockExamHistoryRow = {
  sessionId: string;
  mockTitle: string;
  scorePercent: number;
  itemCount: number;
  durationSeconds: number | null;
  completedAt: string;
  passed: boolean;
};

export const MOCK_PASS_THRESHOLD = 75;

export type SubjectTrendPoint = { date: string; pct: number };
export type SubjectTrend = {
  subjectName: string;
  subjectSlug: string | null;
  points: SubjectTrendPoint[];
  firstPct: number;
  latestPct: number;
  delta: number;
};

/**
 * Per-subject score across the user's recent mock/board attempts, grouped into
 * a series per subject (oldest → newest). Only subjects with 2+ attempts are
 * returned (a single data point isn't a trend); sorted weakest-current first.
 */
export async function fetchMockSubjectTrends(examSlug: string, limit = 5): Promise<SubjectTrend[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_mock_subject_trends', {
    p_exam_slug: examSlug,
    p_limit: limit,
  });
  if (error) throw error;

  const bySubject = new Map<string, { slug: string | null; points: SubjectTrendPoint[] }>();
  type TrendRow = {
    completed_at: string;
    subject_name: string;
    subject_slug: string | null;
    correct: number;
    total: number;
  };
  for (const row of (data ?? []) as TrendRow[]) {
    const entry = bySubject.get(row.subject_name) ?? { slug: row.subject_slug, points: [] };
    const pct = row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
    entry.points.push({ date: row.completed_at, pct });
    bySubject.set(row.subject_name, entry);
  }

  return Array.from(bySubject.entries())
    .filter(([, v]) => v.points.length >= 2)
    .map(([subjectName, v]) => ({
      subjectName,
      subjectSlug: v.slug,
      points: v.points,
      firstPct: v.points[0].pct,
      latestPct: v.points[v.points.length - 1].pct,
      delta: v.points[v.points.length - 1].pct - v.points[0].pct,
    }))
    .sort((a, b) => a.latestPct - b.latestPct);
}

export async function fetchMockExamHistory(
  examSlug: string,
  limit = 10
): Promise<MockExamHistoryRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase.rpc('get_mock_exam_history', {
    p_exam_slug: examSlug,
    p_limit: limit,
  });

  if (error) throw error;

  return ((data ?? []) as Array<{
    session_id: string;
    mock_title: string;
    score_percent: number;
    item_count: number;
    duration_seconds: number | null;
    completed_at: string;
    passed: boolean;
  }>).map((row) => ({
    sessionId: row.session_id,
    mockTitle: row.mock_title,
    scorePercent: Number(row.score_percent ?? 0),
    itemCount: row.item_count,
    durationSeconds: row.duration_seconds,
    completedAt: row.completed_at,
    passed: row.passed,
  }));
}
