import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { deleteSecureItem, getSecureItem, setSecureItem } from './secure-storage';

const KEY = 'reviewnatin_onboarding';

export type OnboardingData = {
  examSlug: string;
  targetDate: string;
  dailyMinutes: number;
  level: 'beginner' | 'average' | 'advanced';
  majorSlug?: string;
  completed: boolean;
};

export async function getOnboarding(): Promise<OnboardingData | null> {
  const raw = await getSecureItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

export async function saveOnboarding(data: OnboardingData): Promise<void> {
  await setSecureItem(KEY, JSON.stringify(data));
}

/** Persist in-progress choices before onboarding is marked complete */
export async function saveOnboardingDraft(
  partial: Partial<Omit<OnboardingData, 'completed'>>
): Promise<void> {
  const existing = await getOnboarding();
  await saveOnboarding({
    examSlug: partial.examSlug ?? existing?.examSlug ?? DEFAULT_EXAM_SLUG,
    targetDate: partial.targetDate ?? existing?.targetDate ?? new Date().toISOString().slice(0, 10),
    dailyMinutes: partial.dailyMinutes ?? existing?.dailyMinutes ?? 30,
    level: partial.level ?? existing?.level ?? 'beginner',
    majorSlug: partial.majorSlug ?? existing?.majorSlug,
    completed: false,
  });
}

export function hasOnboardingDraft(data: OnboardingData | null | undefined): boolean {
  if (!data?.examSlug || !data?.targetDate || !data?.dailyMinutes) return false;
  if (data.examSlug === 'let-secondary' && !data.majorSlug) return false;
  return true;
}

export async function clearOnboarding(): Promise<void> {
  await deleteSecureItem(KEY);
}
