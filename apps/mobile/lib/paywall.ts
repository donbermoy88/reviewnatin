import type { MockExam } from './api/mock-exams';
import { fetchUsageLimits } from './api/iap';
import { DAILY_LIMIT } from './product-copy';

export const FREE_DAILY_QUESTIONS = 20;
export const FREE_MISTAKE_DAYS = 7;
export const FREE_MOCK_PREVIEW_ITEMS = 10;

export type MockAccess = 'full' | 'preview' | 'weekly_limit' | 'premium_required';

export function isMiniMock(mock: MockExam): boolean {
  return mock.title.toLowerCase().includes('mini');
}

export function isFullMock(mock: MockExam): boolean {
  return mock.itemCount > FREE_MOCK_PREVIEW_ITEMS && !isMiniMock(mock);
}

/**
 * Whether the free-tier user may start a mini-mock this week. Authoritative
 * source is the server (`get_usage_limits.mini_mock_available`, computed from
 * completed quiz_sessions) — not a local counter that resets on reinstall.
 * When the server is unreachable we allow the attempt; `get_mock_exam_questions`
 * still enforces the limit and the quiz screen handles the rejection.
 */
export async function isMiniMockAvailable(examSlug: string): Promise<boolean> {
  const limits = await fetchUsageLimits(examSlug);
  return limits ? limits.miniMockAvailable : true;
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
      message: DAILY_LIMIT.body(questionsAnsweredToday),
    };
  }

  if (batchSize > remaining) {
    return {
      allowed: true,
      remaining,
      message: `${remaining} libreng tanong na lang ngayong araw.`,
    };
  }

  return { allowed: true, remaining };
}
