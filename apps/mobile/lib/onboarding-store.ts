import * as SecureStore from 'expo-secure-store';

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
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

export async function saveOnboarding(data: OnboardingData): Promise<void> {
  await SecureStore.setItemAsync(KEY, JSON.stringify(data));
}

export async function clearOnboarding(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY);
}
