import { fetchBookmarkedQuestionIds } from '../api/bookmarks';
import {
  fetchExamBySlug,
  fetchPracticeQuestions,
  fetchQuestionsByIds,
} from '../api/catalog';
import { fetchDiagnosticQuestions } from '../api/diagnostic';
import { fetchWeakAreaQuestions } from '../api/analytics';
import { fetchUsageLimits, isMiniMockLimitError } from '../api/iap';
import { fetchMistakeQuestionIds } from '../api/mistakes';
import { fetchMockExamById, fetchMockExamQuestions } from '../api/mock-exams';
import { fetchXpStats } from '../api/xp';
import { hasOfflinePack, pickOfflinePracticeQuestions } from '../offline/pack';
import { loadExamSnapshot, reorderToSnapshot, saveExamSnapshot } from '../exam-resume';
import { randomizeQuestionSet } from '../question-randomization';
import type { Question } from '../types';
import { BOARD_ITEM_COUNT, BOARD_DURATION_SECONDS, DIAGNOSTIC_ITEM_COUNT } from './constants';
import type { QuizMode } from './mode';

export type LoadQuizInput = {
  modeFlags: QuizMode;
  topicSlug?: string;
  mockExamId?: string;
  durationSeconds?: string;
  focusQuestionId?: string;
  user: { id: string } | null;
  isPremium: (examTypeId?: string | null) => boolean;
};

export type StrictAttempt = {
  resumed: boolean;
  answersByIndex: Record<number, string>;
  flagged: number[];
  index: number;
  selected: string | null;
  timeLeft: number;
};

export type LoadQuizResult =
  | { kind: 'needs_login' }
  | { kind: 'paywall'; reason: 'daily' | 'board' }
  | { kind: 'mini_mock_limit' }
  | { kind: 'no_offline_pack' }
  | {
      kind: 'ready';
      questions: Question[];
      offlineMode: boolean;
      mockTitle?: string;
      mockPreviewActive: boolean;
      timeLeft?: number;
      strict?: StrictAttempt;
    };

/**
 * Strict exams (mock/board) restore an interrupted attempt (same question
 * order, answers, flags, position, remaining time) when a valid snapshot
 * exists; otherwise shuffle fresh and save the starting order so future
 * saves/resumes stay index-aligned.
 */
async function resolveStrictAttempt(
  resumeKey: string | null,
  raw: Question[],
  fallbackTimeLeft: number
): Promise<{ questions: Question[]; strict: StrictAttempt }> {
  const snap = resumeKey ? await loadExamSnapshot(resumeKey) : null;
  const ordered = snap ? reorderToSnapshot(raw, snap.questionOrder) : null;

  if (snap && ordered) {
    return {
      questions: ordered,
      strict: {
        resumed: true,
        answersByIndex: snap.answers,
        flagged: snap.flagged,
        index: Math.min(snap.index, ordered.length - 1),
        selected: snap.answers[snap.index] ?? null,
        timeLeft: snap.timeLeft,
      },
    };
  }

  const shuffled = randomizeQuestionSet(raw);
  if (resumeKey) {
    void saveExamSnapshot(resumeKey, {
      questionOrder: shuffled.map((q) => q.id),
      answers: {},
      flagged: [],
      index: 0,
      timeLeft: fallbackTimeLeft,
      savedAt: Date.now(),
    });
  }
  return {
    questions: shuffled,
    strict: { resumed: false, answersByIndex: {}, flagged: [], index: 0, selected: null, timeLeft: fallbackTimeLeft },
  };
}

/** Fetches the question set for the current mode. Throws on network/RPC failure. */
export async function loadQuizAttempt(input: LoadQuizInput): Promise<LoadQuizResult> {
  const { modeFlags, topicSlug, mockExamId, durationSeconds, focusQuestionId, user, isPremium } = input;
  const { slug, isMock, isBoard, isDiagnostic, isMistakeReview, isBookmarkReview, isWeakArea, isBarkada, isOffline, barkadaLimit, previewItemLimit, resumeKey } = modeFlags;

  const exam = await fetchExamBySlug(slug);

  if (isDiagnostic) {
    if (!user) return { kind: 'needs_login' };
    const questions = randomizeQuestionSet(await fetchDiagnosticQuestions(slug, DIAGNOSTIC_ITEM_COUNT));
    return { kind: 'ready', questions, offlineMode: false, mockPreviewActive: false };
  }

  if (isMock && mockExamId) {
    if (!user) return { kind: 'needs_login' };
    try {
      const [mock, qs] = await Promise.all([
        fetchMockExamById(mockExamId),
        fetchMockExamQuestions(mockExamId),
      ]);
      const requestedDuration = Number(durationSeconds);
      const fullDuration =
        mock?.durationSeconds ??
        (Number.isFinite(requestedDuration) && requestedDuration > 0 ? requestedDuration : 600);
      const serverPreviewLimit = qs.previewLimit ?? (qs.isPreview ? qs.questions.length : null);
      const effectivePreviewLimit =
        serverPreviewLimit && previewItemLimit
          ? Math.min(serverPreviewLimit, previewItemLimit)
          : serverPreviewLimit ?? previewItemLimit;
      const effectiveQuestions = effectivePreviewLimit
        ? qs.questions.slice(0, effectivePreviewLimit)
        : qs.questions;
      const effectiveDuration = effectivePreviewLimit
        ? Math.min(
            fullDuration,
            Number.isFinite(requestedDuration) && requestedDuration > 0 ? requestedDuration : 900
          )
        : fullDuration;
      const { questions, strict } = await resolveStrictAttempt(resumeKey, effectiveQuestions, effectiveDuration);
      // Mirrors the original: time is only set unconditionally when `mock` resolved,
      // but a resumed snapshot's saved timeLeft always wins regardless of that.
      const timeLeft = strict.resumed ? strict.timeLeft : mock ? effectiveDuration : undefined;
      return {
        kind: 'ready',
        questions,
        offlineMode: false,
        mockTitle: mock ? mock.title : undefined,
        mockPreviewActive: Boolean(effectivePreviewLimit),
        timeLeft,
        strict,
      };
    } catch (err) {
      if (isMiniMockLimitError(err as { message?: string })) {
        return { kind: 'mini_mock_limit' };
      }
      throw err;
    }
  }

  if (isBoard) {
    if (!user) return { kind: 'needs_login' };
    if (!isPremium(exam?.id ?? null)) {
      return { kind: 'paywall', reason: 'board' };
    }
    const result = await fetchPracticeQuestions(slug, BOARD_ITEM_COUNT, topicSlug);
    const { questions, strict } = await resolveStrictAttempt(
      resumeKey,
      result.questions.slice(0, BOARD_ITEM_COUNT),
      BOARD_DURATION_SECONDS
    );
    return {
      kind: 'ready',
      questions,
      offlineMode: false,
      mockPreviewActive: false,
      // Unconditional in the original (set before the resumed-snapshot override).
      timeLeft: strict.timeLeft,
      strict,
    };
  }

  if (isMistakeReview) {
    const ids = await fetchMistakeQuestionIds(slug, 12);
    const questions = randomizeQuestionSet(await fetchQuestionsByIds(ids));
    return { kind: 'ready', questions, offlineMode: false, mockPreviewActive: false };
  }

  if (isBookmarkReview) {
    if (!user) return { kind: 'needs_login' };
    // Focus a single bookmarked question, or drill all of them.
    const ids = focusQuestionId ? [focusQuestionId] : [...(await fetchBookmarkedQuestionIds(user.id))];
    const questions = randomizeQuestionSet(await fetchQuestionsByIds(ids));
    return { kind: 'ready', questions, offlineMode: false, mockPreviewActive: false };
  }

  if (isWeakArea) {
    if (!user) return { kind: 'needs_login' };
    if (user && exam) {
      const limits = await fetchUsageLimits(slug);
      if (limits && !limits.isPremium && limits.dailyQuestionsRemaining === 0) {
        return { kind: 'paywall', reason: 'daily' };
      }
    }
    const result = await fetchWeakAreaQuestions(slug, 10);
    if (result.error === 'daily_limit') return { kind: 'paywall', reason: 'daily' };
    return { kind: 'ready', questions: randomizeQuestionSet(result.questions), offlineMode: false, mockPreviewActive: false };
  }

  if (isOffline) {
    const offlineQs = await pickOfflinePracticeQuestions(slug, 12, topicSlug);
    if (!offlineQs.length) return { kind: 'no_offline_pack' };
    return { kind: 'ready', questions: randomizeQuestionSet(offlineQs), offlineMode: true, mockPreviewActive: false };
  }

  if (isBarkada) {
    if (!user) return { kind: 'needs_login' };
    const result = await fetchPracticeQuestions(slug, barkadaLimit, topicSlug);
    if (result.error === 'daily_limit') return { kind: 'paywall', reason: 'daily' };
    return {
      kind: 'ready',
      questions: randomizeQuestionSet(result.questions.slice(0, barkadaLimit)),
      offlineMode: false,
      mockPreviewActive: false,
    };
  }

  // Default: practice.
  if (user && exam) {
    const limits = await fetchUsageLimits(slug);
    if (limits && !limits.isPremium && limits.dailyQuestionsRemaining === 0) {
      return { kind: 'paywall', reason: 'daily' };
    }
  }
  const result = await fetchPracticeQuestions(slug, 12, topicSlug);
  if (result.error === 'daily_limit') return { kind: 'paywall', reason: 'daily' };
  return { kind: 'ready', questions: randomizeQuestionSet(result.questions), offlineMode: false, mockPreviewActive: false };
}

export async function loadQuizUserExtras(userId: string): Promise<{ bookmarkedIds: Set<string>; hintCredits: number }> {
  const [bookmarkedIds, xpStats] = await Promise.all([
    fetchBookmarkedQuestionIds(userId),
    fetchXpStats(),
  ]);
  return { bookmarkedIds, hintCredits: xpStats.hintCredits };
}

/** Eligible fallback for modes where a partial/offline question set is an acceptable substitute on error. */
export function isEligibleForOfflineFallback(modeFlags: QuizMode): boolean {
  return (
    !modeFlags.isMock &&
    !modeFlags.isBoard &&
    !modeFlags.isDiagnostic &&
    !modeFlags.isWeakArea &&
    !modeFlags.isBarkada &&
    !modeFlags.isBookmarkReview
  );
}

export async function loadOfflineFallback(slug: string, topicSlug?: string): Promise<Question[] | null> {
  if (!(await hasOfflinePack(slug))) return null;
  const offlineQs = await pickOfflinePracticeQuestions(slug, 12, topicSlug);
  return offlineQs.length ? randomizeQuestionSet(offlineQs) : null;
}
