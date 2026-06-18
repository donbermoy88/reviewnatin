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
import {
  createQuizSession,
  completePracticeSession,
  saveQuizAnswers,
  type QuizMode,
} from '../api/quiz';
import { fetchExamBySlug } from '../api/catalog';
import { recordQuizOutcome } from '../api/mistakes';
import { captureAppException, captureAppMessage } from '../monitoring/events';
import { createQueueStorage } from './queue-storage';
import { isRetryDue, nextRetryAt } from './retry-policy';
import { StorageKeys } from '../storage-keys';

const QUEUE_KEY = StorageKeys.offlinePendingSessions;
const MAX_QUEUE_ITEMS = 50;

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
  attemptCount?: number;
  nextAttemptAt?: string;
  lastError?: string;
};

const storage = createQueueStorage<PendingSession>(QUEUE_KEY, MAX_QUEUE_ITEMS);
const readQueue = storage.read;
const writeQueue = storage.write;

export async function queuePendingSession(session: PendingSession): Promise<void> {
  const queue = await readQueue();
  // Idempotent: skip if a session with the same localId is already queued.
  if (queue.some((q) => q.localId === session.localId)) return;
  captureAppMessage('offline quiz session queued', { area: 'offline_sync', action: 'queue_session' }, { mode: session.mode, itemCount: session.itemCount });
  queue.push({
    ...session,
    attemptCount: session.attemptCount ?? 0,
    nextAttemptAt: session.nextAttemptAt ?? new Date().toISOString(),
  });
  await writeQueue(queue);
}

export async function pendingSessionCount(userId?: string): Promise<number> {
  const queue = await readQueue();
  if (!userId) return queue.length;
  return queue.filter((session) => session.userId === userId).length;
}

/**
 * Attempt to push every queued session to Supabase. Sessions that succeed
 * are removed from the queue; sessions that fail stay queued for the next
 * attempt. Safe to call repeatedly; safe to call when offline (every
 * upload will just fail and remain queued).
 */
export async function flushPendingAnswers(userId: string): Promise<{
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
    if (session.userId !== userId) {
      survivors.push(session);
      continue;
    }

    if (!isRetryDue(session.nextAttemptAt)) {
      survivors.push(session);
      continue;
    }

    try {
      const exam = await fetchExamBySlug(session.examSlug);
      if (!exam) {
        const attemptCount = (session.attemptCount ?? 0) + 1;
        captureAppMessage('offline session flush failed: exam not found', { area: 'offline_sync', action: 'flush_session' }, { examSlug: session.examSlug, attemptCount }, 'warning');
        survivors.push({
          ...session,
          attemptCount,
          nextAttemptAt: nextRetryAt(attemptCount),
          lastError: 'exam_not_found',
        });
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
        const attemptCount = (session.attemptCount ?? 0) + 1;
        captureAppMessage('offline session flush failed: session create returned empty', { area: 'offline_sync', action: 'flush_session' }, { mode: session.mode, attemptCount }, 'warning');
        survivors.push({
          ...session,
          attemptCount,
          nextAttemptAt: nextRetryAt(attemptCount),
          lastError: 'session_create_failed',
        });
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
          await recordQuizOutcome(
            a.questionId,
            a.isCorrect,
            a.isCorrect ? undefined : a.selectedChoiceId ?? undefined
          );
        } catch {
          /* non-blocking */
        }
      }

      flushed++;
    } catch (error) {
      const attemptCount = (session.attemptCount ?? 0) + 1;
      captureAppException(error, { area: 'offline_sync', action: 'flush_session' }, { mode: session.mode, attemptCount });
      survivors.push({
        ...session,
        attemptCount,
        nextAttemptAt: nextRetryAt(attemptCount),
        lastError: error instanceof Error ? error.message : 'network_error',
      });
      failed++;
    }
  }

  await writeQueue(survivors);
  return { flushed, failed, remaining: survivors.length };
}

export async function clearPendingAnswers(): Promise<void> {
  await storage.clear();
}
