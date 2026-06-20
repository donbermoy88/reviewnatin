import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { examResumeKey } from '../exam-resume';
import { BOARD_DURATION_SECONDS } from './constants';

export type QuizModeParams = {
  examSlug?: string;
  topicSlug?: string;
  mode?: string;
  mockExamId?: string;
  durationSeconds?: string;
  previewLimit?: string;
  pasapathTaskId?: string;
  barkadaChallengeId?: string;
  questionLimit?: string;
  focusQuestionId?: string;
};

export type QuizMode = {
  slug: string;
  isMock: boolean;
  isMistakeReview: boolean;
  isBookmarkReview: boolean;
  isDiagnostic: boolean;
  isTimed: boolean;
  isWeakArea: boolean;
  isBarkada: boolean;
  isBoard: boolean;
  isOffline: boolean;
  isStrictExam: boolean;
  resumeKey: string | null;
  barkadaLimit: number;
  timedDuration: number;
  previewItemLimit: number | null;
  initialTimeLeft: number;
};

/** Pure derivation of every mode flag from the route params — no side effects. */
export function deriveQuizMode(params: QuizModeParams): QuizMode {
  const { examSlug, mode, mockExamId, durationSeconds, previewLimit, questionLimit } = params;
  const slug = examSlug ?? DEFAULT_EXAM_SLUG;
  const isMock = mode === 'mock';
  const isMistakeReview = mode === 'mistake_review';
  const isBookmarkReview = mode === 'bookmark_review';
  const isDiagnostic = mode === 'diagnostic';
  const isTimed = mode === 'timed';
  const isWeakArea = mode === 'weak_area';
  const isBarkada = mode === 'barkada';
  const isBoard = mode === 'board';
  const isOffline = mode === 'offline';
  const isStrictExam = isMock || isBoard;
  const resumeKey = isStrictExam
    ? examResumeKey({ mode: isMock ? 'mock' : 'board', mockExamId, slug })
    : null;
  const barkadaLimit = Math.max(Number(questionLimit) || 10, 5);
  const timedDuration = Number(durationSeconds) || 600;
  const requestedPreviewLimit = Number(previewLimit);
  const previewItemLimit =
    Number.isFinite(requestedPreviewLimit) && requestedPreviewLimit > 0
      ? Math.floor(requestedPreviewLimit)
      : null;
  const initialTimeLeft = isMock
    ? Number(durationSeconds) || 600
    : isBoard
      ? BOARD_DURATION_SECONDS
      : isTimed
        ? timedDuration
        : 0;

  return {
    slug,
    isMock,
    isMistakeReview,
    isBookmarkReview,
    isDiagnostic,
    isTimed,
    isWeakArea,
    isBarkada,
    isBoard,
    isOffline,
    isStrictExam,
    resumeKey,
    barkadaLimit,
    timedDuration,
    previewItemLimit,
    initialTimeLeft,
  };
}
