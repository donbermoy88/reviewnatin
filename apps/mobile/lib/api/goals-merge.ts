import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import type { OnboardingData } from '../onboarding-store';

export type ActiveGoalRow = {
  target_exam_date: string;
  daily_minutes: number;
  current_level: string;
  major_slug: string | null;
  exam_types: { slug: string; name: string } | null;
};

export function mergeOnboardingWithRemote(
  local: OnboardingData | null,
  remote: ActiveGoalRow | null
): OnboardingData | null {
  if (!local && !remote) return null;

  const examType = remote?.exam_types;
  const today = new Date().toISOString().slice(0, 10);

  if (!remote) return local;

  return {
    examSlug: examType?.slug ?? local?.examSlug ?? DEFAULT_EXAM_SLUG,
    targetDate: remote.target_exam_date ?? local?.targetDate ?? today,
    dailyMinutes: remote.daily_minutes ?? local?.dailyMinutes ?? 30,
    level: (remote.current_level as OnboardingData['level']) ?? local?.level ?? 'beginner',
    majorSlug: remote.major_slug ?? local?.majorSlug,
    completed: local?.completed ?? true,
  };
}

export function requiresLetSecondaryMajor(onboarding: Pick<OnboardingData, 'examSlug' | 'majorSlug'>): boolean {
  return onboarding.examSlug === 'let-secondary' && !onboarding.majorSlug;
}
