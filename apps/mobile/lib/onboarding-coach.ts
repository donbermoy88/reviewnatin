import AsyncStorage from '@react-native-async-storage/async-storage';

const COACH_KEY = 'reviewnatin:onboarding_coach_seen';

export async function shouldShowDashboardCoach(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(COACH_KEY);
    return v !== '1';
  } catch {
    return false;
  }
}

export async function markDashboardCoachSeen(): Promise<void> {
  await AsyncStorage.setItem(COACH_KEY, '1');
}
