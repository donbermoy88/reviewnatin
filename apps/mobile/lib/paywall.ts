import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MockExam } from './api/mock-exams';

export const FREE_DAILY_QUESTIONS = 20;
export const FREE_MISTAKE_DAYS = 7;
export const FREE_MOCK_PREVIEW_ITEMS = 10;

const MINI_MOCK_WEEK_KEY = 'reviewnatin:mini-mock-week';

function currentIsoWeek(): string {
  const d = new Date();
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${week}`;
}

export type MockAccess = 'full' | 'preview' | 'weekly_limit' | 'premium_required';

export function isMiniMock(mock: MockExam): boolean {
  return mock.title.toLowerCase().includes('mini');
}

export function isFullMock(mock: MockExam): boolean {
  return mock.itemCount > FREE_MOCK_PREVIEW_ITEMS && !isMiniMock(mock);
}

export async function hasUsedMiniMockThisWeek(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(MINI_MOCK_WEEK_KEY);
  return stored === currentIsoWeek();
}

export async function recordMiniMockUsed(): Promise<void> {
  await AsyncStorage.setItem(MINI_MOCK_WEEK_KEY, currentIsoWeek());
}

export function getMockAccess(mock: MockExam, isPremium: boolean): MockAccess {
  if (isPremium) return 'full';
  if (isMiniMock(mock)) return 'weekly_limit';
  if (isFullMock(mock)) return 'preview';
  return 'full';
}

export function canStartPractice(
  questionsAnsweredToday: number,
  isPremium: boolean,
  batchSize = 12
): { allowed: boolean; remaining: number; message?: string } {
  if (isPremium) {
    return { allowed: true, remaining: Infinity };
  }

  const remaining = Math.max(0, FREE_DAILY_QUESTIONS - questionsAnsweredToday);
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      message: `You've used ${FREE_DAILY_QUESTIONS}/${FREE_DAILY_QUESTIONS} free questions today. Unlock unlimited practice.`,
    };
  }

  if (batchSize > remaining) {
    return {
      allowed: true,
      remaining,
      message: `Free tier: ${remaining} question${remaining === 1 ? '' : 's'} left today.`,
    };
  }

  return { allowed: true, remaining };
}
