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
