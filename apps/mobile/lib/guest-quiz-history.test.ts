import { beforeEach, describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXAM_TYPES } from '@reviewnatin/shared';
import {
  fetchGuestPracticeStats,
  fetchGuestRecentSessions,
  saveGuestQuizSession,
} from './guest-quiz-history';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: vi.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
    },
  };
});

describe('guest quiz history', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.setSystemTime(new Date('2026-06-16T08:00:00.000Z'));
  });

  it('scopes guest practice stats by exam slug', async () => {
    await saveGuestQuizSession({
      examSlug: 'cse-professional',
      mode: 'practice',
      itemCount: 20,
      scorePercent: 80,
      correct: 16,
      durationSeconds: 600,
    });
    await saveGuestQuizSession({
      examSlug: 'pnle',
      mode: 'practice',
      itemCount: 10,
      scorePercent: 50,
      correct: 5,
      durationSeconds: 300,
    });

    const cseStats = await fetchGuestPracticeStats('cse-professional', 15);
    const pnleStats = await fetchGuestPracticeStats('pnle', 15);

    expect(cseStats.totalAnswered).toBe(20);
    expect(cseStats.accuracyPercent).toBe(80);
    expect(cseStats.sessionCount).toBe(1);

    expect(pnleStats.totalAnswered).toBe(10);
    expect(pnleStats.accuracyPercent).toBe(50);
    expect(pnleStats.sessionCount).toBe(1);
  });

  it('scopes guest recent sessions by exam slug', async () => {
    await saveGuestQuizSession({
      examSlug: 'cse-professional',
      mode: 'mock',
      itemCount: 30,
      scorePercent: 70,
      correct: 21,
      durationSeconds: 1200,
    });
    await saveGuestQuizSession({
      examSlug: 'pnle',
      mode: 'practice',
      itemCount: 15,
      scorePercent: 60,
      correct: 9,
      durationSeconds: 600,
    });

    const cseSessions = await fetchGuestRecentSessions('cse-professional');
    const pnleSessions = await fetchGuestRecentSessions('pnle');
    const letSessions = await fetchGuestRecentSessions('let-elementary');

    expect(cseSessions).toHaveLength(1);
    expect(cseSessions[0].mode).toBe('mock');
    expect(cseSessions[0].item_count).toBe(30);

    expect(pnleSessions).toHaveLength(1);
    expect(pnleSessions[0].mode).toBe('practice');
    expect(pnleSessions[0].item_count).toBe(15);

    expect(letSessions).toHaveLength(0);
  });

  it('isolates guest history for every configured exam type', async () => {
    for (const [index, exam] of EXAM_TYPES.entries()) {
      await saveGuestQuizSession({
        examSlug: exam.slug,
        mode: index % 2 === 0 ? 'practice' : 'mock',
        itemCount: 10 + index,
        scorePercent: 50 + index,
        correct: 5 + index,
        durationSeconds: 300 + index,
      });
    }

    for (const [index, exam] of EXAM_TYPES.entries()) {
      const stats = await fetchGuestPracticeStats(exam.slug, 15);
      const sessions = await fetchGuestRecentSessions(exam.slug);

      expect(stats.totalAnswered).toBe(10 + index);
      expect(stats.questionsToday).toBe(10 + index);
      expect(stats.accuracyPercent).toBe(50 + index);
      expect(stats.sessionCount).toBe(1);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].item_count).toBe(10 + index);
      expect(sessions[0].score_percent).toBe(50 + index);
    }
  });

  it.each(EXAM_TYPES.map((activeExam) => [activeExam.slug] as const))(
    'shows empty guest history for %s when only other exam types have attempts',
    async (activeSlug) => {
      for (const [index, exam] of EXAM_TYPES.filter((exam) => exam.slug !== activeSlug).entries()) {
        await saveGuestQuizSession({
          examSlug: exam.slug,
          mode: 'practice',
          itemCount: 20 + index,
          scorePercent: 60 + index,
          correct: 12 + index,
          durationSeconds: 600 + index,
        });
      }

      const stats = await fetchGuestPracticeStats(activeSlug, 15);
      const sessions = await fetchGuestRecentSessions(activeSlug);

      expect(stats.totalAnswered).toBe(0);
      expect(stats.questionsToday).toBe(0);
      expect(stats.accuracyPercent).toBeNull();
      expect(stats.sessionCount).toBe(0);
      expect(sessions).toHaveLength(0);
    }
  );
});
