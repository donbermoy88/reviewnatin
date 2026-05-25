import { syncExamGoalSafe } from '../api/goals';
import { isOnboardingComplete } from '../onboarding-nav';
import { getOnboarding } from '../onboarding-store';

/** Hydrate onboarding from Supabase after login; sync local goal to cloud when complete. */
export async function syncOnboardingAfterAuth(userId: string): Promise<string | null> {
  await isOnboardingComplete(userId);

  const onboarding = await getOnboarding();
  if (!onboarding?.completed) return null;

  const result = await syncExamGoalSafe(userId, onboarding);
  return result.ok ? null : result.message;
}
