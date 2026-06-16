import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PracticeStats } from './api/stats';

export type GuestQuizSession = {
  id: string;
  examSlug: string;
  mode: string;
  itemCount: number;
  scorePercent: number;
  correct: number;
  durationSeconds: number;
  completedAt: string;
};

const KEY = 'reviewnatin:guest-quiz-history';
const MAX_SESSIONS = 50;

function sessionsForExam(sessions: GuestQuizSession[], examSlug: string): GuestQuizSession[] {
  return sessions.filter((session) => session.examSlug === examSlug);
}

export async function loadGuestQuizHistory(): Promise<GuestQuizSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestQuizSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveGuestQuizSession(
  session: Omit<GuestQuizSession, 'id' | 'completedAt'>
): Promise<void> {
  const list = await loadGuestQuizHistory();
  const entry: GuestQuizSession = {
    ...session,
    id: `guest-${Date.now()}`,
    completedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...list].slice(0, MAX_SESSIONS)));
}

export async function clearGuestQuizHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function computeStreak(sessionDates: string[]): number {
  if (!sessionDates.length) return 0;
  const days = new Set(sessionDates.map((iso) => iso.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function fetchGuestPracticeStats(
  examSlug: string,
  dailyTarget: number
): Promise<PracticeStats> {
  const sessions = sessionsForExam(await loadGuestQuizHistory(), examSlug);
  const todayStart = startOfTodayIso();

  const questionsToday = sessions
    .filter((s) => s.completedAt >= todayStart)
    .reduce((sum, s) => sum + s.itemCount, 0);

  const totalAnswered = sessions.reduce((sum, s) => sum + s.itemCount, 0);
  const scored = sessions.filter((s) => Number.isFinite(s.scorePercent));
  const accuracyPercent =
    scored.length > 0
      ? Math.round(scored.reduce((sum, s) => sum + s.scorePercent, 0) / scored.length)
      : null;

  const streakDays = computeStreak(sessions.map((s) => s.completedAt));

  return {
    questionsToday,
    questionsTarget: dailyTarget,
    streakDays,
    totalAnswered,
    accuracyPercent,
    sessionCount: sessions.length,
  };
}

export async function fetchGuestRecentSessions(
  examSlug: string,
  limit = 5
): Promise<
  {
    id: string;
    score_percent: number | null;
    item_count: number;
    completed_at: string | null;
    mode: string;
  }[]
> {
  const sessions = sessionsForExam(await loadGuestQuizHistory(), examSlug);
  return sessions.slice(0, limit).map((s) => ({
    id: s.id,
    score_percent: s.scorePercent,
    item_count: s.itemCount,
    completed_at: s.completedAt,
    mode: s.mode,
  }));
}
