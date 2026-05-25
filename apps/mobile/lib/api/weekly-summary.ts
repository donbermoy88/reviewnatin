import { supabase, isSupabaseConfigured } from '../supabase';

export type WeeklySummary = {
  questionsAnswered: number;
  sessionsCompleted: number;
  accuracyPercent: number | null;
  streakDays: number;
};

export async function fetchWeeklySummary(examSlug: string): Promise<WeeklySummary | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.rpc('get_weekly_summary', {
    p_exam_slug: examSlug,
  });

  if (error) throw error;
  if (!data) return null;

  const row = data as {
    questions_answered: number;
    sessions_completed: number;
    accuracy_percent: number | null;
    streak_days: number;
  };

  return {
    questionsAnswered: Number(row.questions_answered ?? 0),
    sessionsCompleted: Number(row.sessions_completed ?? 0),
    accuracyPercent: row.accuracy_percent != null ? Number(row.accuracy_percent) : null,
    streakDays: Number(row.streak_days ?? 0),
  };
}
