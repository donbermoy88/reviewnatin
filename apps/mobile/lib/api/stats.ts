import { supabase, isSupabaseConfigured } from '../supabase';

export type PracticeStats = {
  questionsToday: number;
  questionsTarget: number;
  streakDays: number;
  totalAnswered: number;
  accuracyPercent: number | null;
  sessionCount: number;
};

const EMPTY: PracticeStats = {
  questionsToday: 0,
  questionsTarget: 0,
  streakDays: 0,
  totalAnswered: 0,
  accuracyPercent: null,
  sessionCount: 0,
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function computeStreak(sessionDates: string[]): number {
  if (!sessionDates.length) return 0;

  const days = new Set(sessionDates.map((iso) => iso.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function fetchPracticeStats(
  userId: string,
  dailyTarget: number,
  examSlug?: string
): Promise<PracticeStats> {
  if (!isSupabaseConfigured || !userId) {
    return { ...EMPTY, questionsTarget: dailyTarget };
  }

  try {
    let sessionsQuery = supabase
      .from('quiz_sessions')
      .select('id, item_count, score_percent, completed_at, exam_types!inner(slug)')
      .eq('user_id', userId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(100);

    if (examSlug) {
      sessionsQuery = sessionsQuery.eq('exam_types.slug', examSlug);
    }

    const [sessionsResult, userResult] = await Promise.all([
      sessionsQuery,
      supabase
        .from('users')
        .select('streak_count')
        .eq('id', userId)
        .single(),
    ]);

    if (sessionsResult.error) throw sessionsResult.error;

    const rows = sessionsResult.data ?? [];
    const dbStreak = examSlug ? 0 : (userResult.data?.streak_count ?? 0);

    const todayStart = startOfTodayIso();
    const questionsToday = rows
      .filter((s) => s.completed_at && s.completed_at >= todayStart)
      .reduce((sum, s) => sum + (s.item_count ?? 0), 0);

    const totalAnswered = rows.reduce((sum, s) => sum + (s.item_count ?? 0), 0);
    const scored = rows.filter((s) => s.score_percent != null && (s.item_count ?? 0) > 0);
    const totalScoredItems = scored.reduce((sum, s) => sum + (s.item_count ?? 0), 0);
    const accuracyPercent =
      totalScoredItems > 0
        ? Math.round(
            scored.reduce((sum, s) => sum + (s.score_percent ?? 0) * (s.item_count ?? 0), 0) /
              totalScoredItems
          )
        : null;

    // Prefer DB streak_count (maintained by trigger); fall back to client-side
    // computation so existing history still works before the trigger fires once.
    const computedStreak = computeStreak(
      rows.map((s) => s.completed_at).filter((d): d is string => Boolean(d))
    );
    const streakDays = Math.max(dbStreak, computedStreak);

    return {
      questionsToday,
      questionsTarget: dailyTarget,
      streakDays,
      totalAnswered,
      accuracyPercent,
      sessionCount: rows.length,
    };
  } catch {
    return { ...EMPTY, questionsTarget: dailyTarget };
  }
}
