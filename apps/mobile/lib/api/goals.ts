import { supabase, isSupabaseConfigured } from '../supabase';
import { getOnboarding, type OnboardingData } from '../onboarding-store';
import { mergeOnboardingWithRemote, type ActiveGoalRow } from './goals-merge';

export type { ActiveGoalRow } from './goals-merge';
export { mergeOnboardingWithRemote } from './goals-merge';

export type SyncGoalResult = { ok: true } | { ok: false; message: string };

export async function syncExamGoal(userId: string, onboarding: OnboardingData): Promise<void> {
  if (!isSupabaseConfigured || !onboarding.examSlug) {
    throw new Error('Supabase is not configured or no exam selected.');
  }

  if (onboarding.examSlug === 'let-secondary' && !onboarding.majorSlug) {
    throw new Error('Please select a major field for LET Secondary before syncing.');
  }

  const { data: exam, error: examErr } = await supabase
    .from('exam_types')
    .select('id')
    .eq('slug', onboarding.examSlug)
    .single();

  if (examErr || !exam) {
    throw new Error(examErr?.message ?? 'Hindi mahanap ang exam sa database.');
  }

  const { error: deactivateErr } = await supabase
    .from('user_exam_goals')
    .update({ is_active: false })
    .eq('user_id', userId);

  if (deactivateErr) throw new Error(deactivateErr.message);

  const { error } = await supabase.from('user_exam_goals').insert({
    user_id: userId,
    exam_type_id: exam.id,
    target_exam_date: onboarding.targetDate,
    daily_minutes: onboarding.dailyMinutes,
    current_level: onboarding.level,
    major_slug: onboarding.majorSlug ?? null,
    onboarding_completed_at: new Date().toISOString(),
    is_active: true,
  });

  if (error) throw new Error(error.message);
}

export async function syncExamGoalSafe(
  userId: string,
  onboarding: OnboardingData
): Promise<SyncGoalResult> {
  try {
    await syncExamGoal(userId, onboarding);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hindi ma-sync ang goal mo sa cloud.';
    return { ok: false, message };
  }
}

export async function fetchActiveGoal(userId: string): Promise<ActiveGoalRow | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('user_exam_goals')
    .select(
      `target_exam_date, daily_minutes, current_level, major_slug,
       exam_types ( slug, name )`
    )
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data as ActiveGoalRow | null;
}

const _goalCache = new Map<string, { data: OnboardingData | null; ts: number }>();
const GOAL_CACHE_TTL = 5 * 60 * 1000;

/** Prefer remote Supabase goal when signed in; fall back to local SecureStore */
export async function resolveOnboardingGoal(userId?: string): Promise<OnboardingData | null> {
  const local = await getOnboarding();
  if (!userId) return local;

  const hit = _goalCache.get(userId);
  if (hit && Date.now() - hit.ts < GOAL_CACHE_TTL) return hit.data;

  try {
    const remote = await fetchActiveGoal(userId);
    const merged = mergeOnboardingWithRemote(local, remote);
    _goalCache.set(userId, { data: merged, ts: Date.now() });
    return merged;
  } catch {
    return local;
  }
}

export function invalidateGoalCache(userId: string) {
  _goalCache.delete(userId);
}
