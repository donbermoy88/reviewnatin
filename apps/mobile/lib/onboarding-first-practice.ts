import type { OnboardingLevel } from '@reviewnatin/shared';

/** Mock readiness ring on onboarding step 5 — scales with proficiency selection. */
export function previewReadinessPercent(level: OnboardingLevel): number {
  const map: Record<OnboardingLevel, number> = {
    beginner: 18,
    average: 35,
    advanced: 52,
  };
  return map[level];
}

/** Quiz mode tuned to onboarding level (beginner/average → daily warm-up; advanced → weak area). */
export function firstPracticeMode(level: OnboardingLevel): 'daily' | 'weak_area' {
  return level === 'advanced' ? 'weak_area' : 'daily';
}

export type FirstPracticeParams = {
  pathname: '/practice/quiz';
  params: {
    examSlug: string;
    mode: 'daily' | 'weak_area';
    source: 'onboarding';
  };
};

export function firstPracticeQuizParams(examSlug: string, level: OnboardingLevel): FirstPracticeParams {
  const mode = firstPracticeMode(level);
  return {
    pathname: '/practice/quiz',
    params: { examSlug, mode, source: 'onboarding' },
  };
}

/** Expo Router href string for post-onboarding deep link. */
export function firstPracticeHref(examSlug: string, level: OnboardingLevel): string {
  const mode = firstPracticeMode(level);
  const q = new URLSearchParams({ examSlug, mode, source: 'onboarding' });
  return `/practice/quiz?${q.toString()}`;
}
