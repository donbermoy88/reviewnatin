import { supabase, isSupabaseConfigured } from '../supabase';

export type DailyStudyPoint = {
  date: string;
  dayLabel: string;
  questions: number;
  sessions: number;
};

function lastNDays(n: number): { date: string; dayLabel: string }[] {
  const result: { date: string; dayLabel: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    result.push({
      date: d.toISOString().slice(0, 10),
      dayLabel: d.toLocaleDateString(undefined, { weekday: 'narrow' }),
    });
  }

  return result;
}

export async function fetchDailyStudyTrend(
  userId: string,
  examSlug: string,
  days = 7
): Promise<DailyStudyPoint[]> {
  const empty = lastNDays(days).map(({ date, dayLabel }) => ({
    date,
    dayLabel,
    questions: 0,
    sessions: 0,
  }));

  if (!isSupabaseConfigured || !userId) return empty;

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('quiz_sessions')
    .select('item_count, completed_at, exam_types!inner(slug)')
    .eq('user_id', userId)
    .eq('exam_types.slug', examSlug)
    .not('completed_at', 'is', null)
    .gte('completed_at', start.toISOString());

  if (error) throw error;

  const buckets = new Map<string, { questions: number; sessions: number }>();
  for (const row of data ?? []) {
    if (!row.completed_at) continue;
    const key = row.completed_at.slice(0, 10);
    const bucket = buckets.get(key) ?? { questions: 0, sessions: 0 };
    bucket.questions += row.item_count ?? 0;
    bucket.sessions += 1;
    buckets.set(key, bucket);
  }

  return lastNDays(days).map(({ date, dayLabel }) => ({
    date,
    dayLabel,
    questions: buckets.get(date)?.questions ?? 0,
    sessions: buckets.get(date)?.sessions ?? 0,
  }));
}
