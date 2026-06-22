import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import type { ImperativeRouter } from 'expo-router';
import { fetchExamBySlug, type AnswerCheckResult } from '../api/catalog';
import { clearExamSnapshot } from '../exam-resume';
import { saveGuestQuizSession } from '../guest-quiz-history';
import { queuePendingSession } from '../offline/answer-queue';
import { awardUserBadges } from '../api/achievements';
import { recordSessionOutcomes } from '../api/mistakes';
import { completeDiagnostic } from '../api/diagnostic';
import { completePracticeSession, createQuizSession, saveQuizAnswers } from '../api/quiz';
import { awardSessionXp } from '../api/xp';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../monitoring/events';
import { trackEvent } from '../analytics/events';
import type { Question, QuizAnswerRecord } from '../types';
import type { QuizMode } from './mode';

function finalizeAnswers(
  prev: QuizAnswerRecord[],
  current: Question | undefined,
  selected: string | null,
  revealed: boolean,
  timeSpentSeconds: number,
  revealResult: AnswerCheckResult | null
): QuizAnswerRecord[] {
  if (!current || !selected || !revealed || !revealResult) return prev;
  if (prev.some((a) => a.questionId === current.id)) return prev;
  return [
    ...prev,
    {
      questionId: current.id,
      selectedChoiceId: selected,
      isCorrect: revealResult.isCorrect,
      timeSpentSeconds,
    },
  ];
}

export type UseQuizSubmissionParams = {
  modeFlags: QuizMode;
  questions: Question[];
  answersByIndex: Record<number, string>;
  flaggedIndices: Set<number>;
  answers: QuizAnswerRecord[];
  current: Question | undefined;
  selected: string | null;
  revealed: boolean;
  revealResult: AnswerCheckResult | null;
  user: { id: string } | null;
  offlineMode: boolean;
  mockExamId?: string;
  pasapathTaskId?: string;
  barkadaChallengeId?: string;
  router: ImperativeRouter;
  startedAt: { current: number };
  questionStarted: { current: number };
};

/** Builds the final answer set, saves the session (server/offline-queue/guest), and navigates to the result screen. */
export function useQuizSubmission({
  modeFlags,
  questions,
  answersByIndex,
  flaggedIndices,
  answers,
  current,
  selected,
  revealed,
  revealResult,
  user,
  offlineMode,
  mockExamId,
  pasapathTaskId,
  barkadaChallengeId,
  router,
  startedAt,
  questionStarted,
}: UseQuizSubmissionParams) {
  const finishing = useRef(false);
  const { slug, isMock, isBoard, isStrictExam, isMistakeReview, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, resumeKey } = modeFlags;

  const finishQuiz = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;

    // The attempt is being submitted — discard any resume snapshot.
    if (resumeKey) void clearExamSnapshot(resumeKey);

    const elapsedQ = Math.round((Date.now() - questionStarted.current) / 1000);
    // Strict exams build the answer set from the answer-sheet (any-order, deferred
    // grading — server computes correctness). Other modes use the live record.
    const finalAnswers: QuizAnswerRecord[] = isStrictExam
      ? questions.flatMap((q, i) =>
          answersByIndex[i]
            ? [{ questionId: q.id, selectedChoiceId: answersByIndex[i], isCorrect: false, timeSpentSeconds: 0 }]
            : []
        )
      : finalizeAnswers(answers, current, selected, revealed, elapsedQ, revealResult);

    // Strict exams (mock/board) defer grading to the server. Guest strict exams
    // are blocked before loading because grading and saved results require auth.
    const totalCorrect = finalAnswers.filter((a) => a.isCorrect).length;
    const score = questions.length ? Math.round((totalCorrect / questions.length) * 100) : 0;
    const duration = Math.round((Date.now() - startedAt.current) / 1000);

    let sessionId: string | null = null;
    let serverScore = score;
    let diagnosticReadiness: number | null = null;

    // OFFLINE QUEUE — if user is signed in but quiz ran offline, persist
    // the session locally so we can sync it the next time we're online.
    // This guarantees offline practice never loses progress, XP, or
    // mistake-bank entries.
    if (user && offlineMode) {
      try {
        const localId = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        await queuePendingSession({
          localId,
          userId: user.id,
          examSlug: slug,
          itemCount: questions.length,
          durationSeconds: duration,
          mode: 'practice',
          answers: finalAnswers.map((a) => ({
            questionId: a.questionId,
            selectedChoiceId: a.selectedChoiceId,
            isCorrect: a.isCorrect,
            timeSpentSeconds: a.timeSpentSeconds,
          })),
          completedAt: new Date().toISOString(),
        });
      } catch (error) {
        captureAppException(error, { area: 'quiz', action: 'queue_offline_session' }, { mode: 'practice', itemCount: questions.length });
        /* queue write failed — non-fatal; the user still gets their score */
      }
    }

    if (user && !offlineMode) {
      try {
        addAppBreadcrumb('quiz', 'server quiz save started', { itemCount: questions.length });
        const exam = await fetchExamBySlug(slug);
        if (exam) {
          sessionId = await createQuizSession(
            user.id,
            exam.id,
            questions.length,
            isDiagnostic
              ? 'diagnostic'
              : isMock
                ? 'mock'
                : isBoard
                  ? 'board'
                  : isTimed
                  ? 'timed'
                  : isMistakeReview
                    ? 'mistake_review'
                    : isBarkada
                      ? 'barkada'
                      : 'practice',
            mockExamId
          );
          if (sessionId) {
            await saveQuizAnswers(sessionId, finalAnswers);
            if (isDiagnostic) {
              const diag = await completeDiagnostic(sessionId, duration);
              if (diag) {
                serverScore = Math.round(diag.score);
                diagnosticReadiness = diag.readiness;
              }
            } else {
              const graded = await completePracticeSession(sessionId, duration);
              if (graded != null) serverScore = Math.round(graded);
              // Award XP for this session (fire-and-forget, non-blocking)
              awardSessionXp(sessionId).catch(() => {});
              // Strict exams defer grading, so apply topic-mastery + mistake-bank
              // outcomes server-side once here (practice mode does this per-answer).
              if (isStrictExam) {
                recordSessionOutcomes(sessionId).catch(() => {});
              }
              if (!isDiagnostic) {
                const newBadges = await awardUserBadges();
                if (newBadges.length > 0) {
                  Alert.alert(
                    'Achievement unlocked!',
                    newBadges.map((b) => `${b.emoji} ${b.title}`).join('\n')
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        captureAppException(error, { area: 'quiz', action: 'save_server_session' }, {
          mode: isDiagnostic ? 'diagnostic' : isMock ? 'mock' : isBoard ? 'board' : isTimed ? 'timed' : 'practice',
          itemCount: questions.length,
        });
        /* session save failed */
      }
    }

    captureAppMessage('quiz submitted', { area: 'quiz', action: 'submit' }, {
      score: serverScore,
      itemCount: questions.length,
      offline: offlineMode,
      mode: isDiagnostic ? 'diagnostic' : isMock ? 'mock' : isBoard ? 'board' : isTimed ? 'timed' : 'practice',
    });

    if (isMock || isBoard) {
      trackEvent('mock_exam_completed', {
        examSlug: slug,
        score: serverScore,
        itemCount: questions.length,
        durationSeconds: duration,
        offline: offlineMode,
      });
    } else if (!isDiagnostic) {
      trackEvent('practice_completed', {
        examSlug: slug,
        score: serverScore,
        itemCount: questions.length,
        durationSeconds: duration,
        mode: isTimed ? 'timed' : isMistakeReview ? 'mistake_review' : isWeakArea ? 'weak_area' : offlineMode ? 'offline' : 'practice',
      });
    }

    const totalCorrectFinal = Math.round((serverScore / 100) * questions.length);

    if (!user && !isDiagnostic) {
      try {
        await saveGuestQuizSession({
          examSlug: slug,
          mode: isMock ? 'mock' : isBoard ? 'board' : isMistakeReview ? 'mistake_review' : isTimed ? 'timed' : isWeakArea ? 'weak_area' : isBarkada ? 'barkada' : isDiagnostic ? 'diagnostic' : offlineMode ? 'offline' : 'practice',
          itemCount: questions.length,
          scorePercent: serverScore,
          correct: totalCorrectFinal,
          durationSeconds: duration,
        });
      } catch {
        /* local save failed */
      }
    }

    router.replace({
      pathname: '/practice/result',
      params: {
        score: String(serverScore),
        total: String(questions.length),
        correct: String(totalCorrectFinal),
        duration: String(duration),
        sessionId: sessionId ?? '',
        examSlug: slug,
        mode: isDiagnostic ? 'diagnostic' : isMock ? 'mock' : isBoard ? 'board' : isTimed ? 'timed' : isWeakArea ? 'weak_area' : isBarkada ? 'barkada' : isBookmarkReview ? 'bookmark_review' : offlineMode ? 'offline' : 'practice',
        diagnosticReadiness: diagnosticReadiness != null ? String(diagnosticReadiness) : '',
        pasapathTaskId: pasapathTaskId ?? '',
        barkadaChallengeId: barkadaChallengeId ?? '',
        flaggedQuestionIds: isStrictExam
          ? [...flaggedIndices]
              .map((i) => questions[i]?.id)
              .filter(Boolean)
              .join(',')
          : '',
      },
    });
    // startedAt/questionStarted are stable ref objects passed in by the caller — their
    // `.current` is read at call time, not captured, so they don't need to be deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, answersByIndex, current, selected, revealed, revealResult, questions, flaggedIndices, user, slug, isMock, isBoard, isStrictExam, isMistakeReview, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, mockExamId, pasapathTaskId, barkadaChallengeId, offlineMode, resumeKey, router]);

  return finishQuiz;
}
