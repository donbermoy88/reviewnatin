/**
 * Resume support for strict exams (mock & board).
 *
 * A snapshot of the in-progress attempt is kept in AsyncStorage so an exam that
 * gets interrupted (app killed/backgrounded) can be resumed exactly where it was
 * left. Because questions are shuffled per attempt and the answer-sheet / flags
 * are keyed by question INDEX, the snapshot stores the question ORDER and we
 * reorder the freshly-fetched questions to match on resume — otherwise indices
 * would point at the wrong questions.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeyPrefix } from './storage-keys';

const PREFIX = StorageKeyPrefix.examResume;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // only resume within a day

export type ExamSnapshot = {
  questionOrder: string[];
  answers: Record<number, string>;
  flagged: number[];
  index: number;
  timeLeft: number;
  savedAt: number;
};

export function examResumeKey(opts: { mode: 'mock' | 'board'; mockExamId?: string; slug: string }): string {
  return opts.mode === 'mock' && opts.mockExamId
    ? `${PREFIX}mock:${opts.mockExamId}`
    : `${PREFIX}board:${opts.slug}`;
}

export async function saveExamSnapshot(key: string, snapshot: ExamSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    /* best effort */
  }
}

export async function loadExamSnapshot(key: string): Promise<ExamSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as ExamSnapshot;
    if (!snapshot?.questionOrder?.length) return null;
    if (Date.now() - (snapshot.savedAt ?? 0) > MAX_AGE_MS) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return snapshot;
  } catch {
    return null;
  }
}

export async function clearExamSnapshot(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* best effort */
  }
}

/**
 * Reorder freshly-fetched questions to match a saved attempt's order. Returns
 * null when the question sets differ (content changed since the snapshot), in
 * which case the caller should start fresh.
 */
export function reorderToSnapshot<T extends { id: string }>(questions: T[], order: string[]): T[] | null {
  if (questions.length !== order.length) return null;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered: T[] = [];
  for (const id of order) {
    const q = byId.get(id);
    if (!q) return null;
    ordered.push(q);
  }
  return ordered;
}
