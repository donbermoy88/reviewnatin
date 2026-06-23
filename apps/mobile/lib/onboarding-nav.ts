import { resolveOnboardingGoal } from './api/goals';
import { getOnboarding, saveOnboarding } from './onboarding-store';
import { firstPracticeHref } from './onboarding-first-practice';

/**
 * True when onboarding is finished — checks local storage, then Supabase goal for signed-in users.
 * Caches remote goal locally so returning users land on the dashboard after login.
 */
export async function isOnboardingComplete(userId?: string): Promise<boolean> {
  const local = await getOnboarding();
  if (local?.completed) return true;

  if (!userId) return false;

  try {
    const resolved = await resolveOnboardingGoal(userId);
    if (resolved?.completed) {
      await saveOnboarding(resolved);
      return true;
    }
  } catch {
    /* use local only */
  }

  return false;
}

/** Central entry routing — onboarding first, dashboard only after finish */
export async function getAppEntryHref(userId?: string): Promise<'/onboarding' | '/(tabs)'> {
  return (await isOnboardingComplete(userId)) ? '/(tabs)' : '/onboarding';
}

export type PostOnboardingOptions = {
  /** Deep link to first practice quiz from onboarding level + exam. */
  startPractice?: boolean;
};

/**
 * After onboarding finish — dashboard by default, or first practice quiz when requested.
 */
export async function getPostOnboardingHref(
  userId?: string,
  options?: PostOnboardingOptions
): Promise<string> {
  void userId;
  const data = await getOnboarding();
  if (options?.startPractice && data?.examSlug && data?.level) {
    return firstPracticeHref(data.examSlug, data.level);
  }
  return '/(tabs)';
}
