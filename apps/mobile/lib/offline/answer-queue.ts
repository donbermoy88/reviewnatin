/**
 * Offline answer queue.
 *
 * When a user completes a quiz while offline (or with a flaky connection),
 * we persist the session + answers to AsyncStorage. The next time the
 * app boots online — or the next time `flushPendingAnswers` is invoked —
 * we replay the saved sessions to Supabase, then clear the queue.
 *
 * This guarantees that offline practice never silently loses progress,
 * mistake bank entries, or XP.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createQuizSession,
  completePracticeSession,
  saveQuizAnswers,
  type QuizMode,
} from '../api/quiz';
import { fetchExamBySlug } from '../api/catalog';
import { recordQuizOutcome } from '../api/mistakes';

const QUEUE_KEY = 'reviewnatin:offline:pending-sessions:v1';

export type PendingAnswer = {
  questionId: string;
  selectedChoiceId: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number;
};

export type PendingSession = {
  /** Locally generated UUID so the queue is idempotent. */
  localId: string;
  userId: string;
  examSlug: string;
  itemCount: number;
  durationSeconds: number;
  mode: QuizMode;
  answers: PendingAnswer[];
  /** ISO timestamp when the quiz was completed locally. */
  completedAt: string;
};

async function readQueue(): Promise<PendingSession[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingSession[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingSession[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function queuePendingSession(session: PendingSession): Promise<void> {
  const queue = await readQueue();
  // Idempotent: skip if a session with the same localId is already queued.
  if (queue.some((q) => q.localId === session.localId)) return;
  queue.push(session);
  await writeQueue(queue);
}

export async function pendingSessionCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * Attempt to push every queued session to Supabase. Sessions that succeed
 * are removed from the queue; sessions that fail stay queued for the next
 * attempt. Safe to call repeatedly; safe to call when offline (every
 * upload will just fail and remain queued).
 */
export async function flushPendingAnswers(): Promise<{
  flushed: number;
  failed: number;
  remaining: number;
}> {
  const queue = await readQueue();
  if (queue.length === 0) return { flushed: 0, failed: 0, remaining: 0 };

  const survivors: PendingSession[] = [];
  let flushed = 0;
  let failed = 0;

  for (const session of queue) {
    try {
      const exam = await fetchExamBySlug(session.examSlug);
      if (!exam) {
        survivors.push(session);
        failed++;
        continue;
      }
      const sessionId = await createQuizSession(
        session.userId,
        exam.id,
        session.itemCount,
        session.mode
      );
      if (!sessionId) {
        survivors.push(session);
        failed++;
        continue;
      }

      // saveQuizAnswers expects QuizAnswerRecord[] shape — the server
      // trigger grades correctness, so we don't pass isCorrect.
      await saveQuizAnswers(
        sessionId,
        session.answers.map((a) => ({
          questionId: a.questionId,
          selectedChoiceId: a.selectedChoiceId,
          isCorrect: a.isCorrect, // present for type but ignored server-side
          timeSpentSeconds: a.timeSpentSeconds,
        }))
      );
      await completePracticeSession(sessionId, session.durationSeconds);

      // Spaced repetition / mistake bank updates — best effort per answer.
      for (const a of session.answers) {
        try {
          recordQuizOutcome(a.questionId, a.isCorrect, a.isCorrect ? undefined : a.selectedChoiceId ?? undefined);
        } catch {
          /* non-blocking */
        }
      }

      flushed++;
    } catch {
      survivors.push(session);
      failed++;
    }
  }

  await writeQueue(survivors);
  return { flushed, failed, remaining: survivors.length };
}

export async function clearPendingAnswers(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
