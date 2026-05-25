import { resolveOnboardingGoal } from './api/goals';
import { hasCompletedDiagnostic } from './api/diagnostic';
import { getOnboarding, saveOnboarding } from './onboarding-store';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';

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

/** After onboarding finish — diagnostic for signed-in users who haven't taken it */
export async function getPostOnboardingHref(userId?: string): Promise<string> {
  if (!userId) return '/(tabs)';

  try {
    const goal = await resolveOnboardingGoal(userId);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    const done = await hasCompletedDiagnostic(slug);
    if (!done) return '/diagnostic/intro';
  } catch {
    /* fall through to dashboard */
  }

  return '/(tabs)';
}
