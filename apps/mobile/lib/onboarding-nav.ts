import { resolveOnboardingGoal } from './api/goals';
import { getOnboarding, saveOnboarding } from './onboarding-store';

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

/** After onboarding finish, land in the main app. Diagnostic remains optional. */
export async function getPostOnboardingHref(userId?: string): Promise<string> {
  void userId;
  return '/(tabs)';
}
