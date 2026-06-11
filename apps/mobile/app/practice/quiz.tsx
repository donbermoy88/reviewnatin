import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoiceOption } from '../../components/choice-option';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { QuestionImage } from '../../components/question-image';
import { ReportContentButton } from '../../components/report-content-button';
import { QuestionNavigator } from '../../components/question-navigator';
import { RichText } from '../../components/rich-text';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createQuizStyles } from '../../lib/themed-styles';
import { randomizeQuestionSet } from '../../lib/question-randomization';
import {
  checkQuestionAnswer,
  fetchExamBySlug,
  fetchPracticeQuestions,
  fetchQuestionHint,
  fetchQuestionsByIds,
  type AnswerCheckResult,
} from '../../lib/api/catalog';
import {
  checkOfflineAnswer,
  pickOfflinePracticeQuestions,
  hasOfflinePack,
} from '../../lib/offline/pack';
import { queuePendingSession } from '../../lib/offline/answer-queue';
import {
  clearExamSnapshot,
  examResumeKey,
  loadExamSnapshot,
  reorderToSnapshot,
  saveExamSnapshot,
} from '../../lib/exam-resume';
import { fetchBookmarkedQuestionIds, toggleBookmark } from '../../lib/api/bookmarks';
import { fetchMistakeQuestionIds, recordQuizOutcome, recordSessionOutcomes } from '../../lib/api/mistakes';
import { fetchMockExamById, fetchMockExamQuestions } from '../../lib/api/mock-exams';
import { fetchDiagnosticQuestions, completeDiagnostic } from '../../lib/api/diagnostic';
import {
  completePracticeSession,
  createQuizSession,
  saveQuizAnswers,
} from '../../lib/api/quiz';
import { fetchUsageLimits, isMiniMockLimitError } from '../../lib/api/iap';
import { fetchWeakAreaQuestions } from '../../lib/api/analytics';
import { awardUserBadges } from '../../lib/api/achievements';
import { deductHint, awardSessionXp, fetchXpStats } from '../../lib/api/xp';
import { FREE_DAILY_QUESTIONS } from '../../lib/paywall';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { saveGuestQuizSession } from '../../lib/guest-quiz-history';
import { dismissDiagnosticPrompt } from '../../lib/diagnostic-prompt';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../../lib/monitoring/events';
import type { Question, QuizAnswerRecord } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';

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

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DIAGNOSTIC_ITEM_COUNT = 40;
const DIAGNOSTIC_SOFT_SECONDS = 30 * 60;
const BOARD_ITEM_COUNT = 30;
const BOARD_DURATION_SECONDS = 45 * 60;

export default function PracticeQuizScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createQuizStyles(theme), [theme]);
  const { examSlug, topicSlug, mode, mockExamId, durationSeconds, previewLimit, pasapathTaskId, barkadaChallengeId, questionLimit, focusQuestionId } = useLocalSearchParams<{
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
  }>();
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
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const { prefs } = usePreferences();
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'daily' | 'board'>('daily');
  const [softTimerWarn, setSoftTimerWarn] = useState(false);
  const [offlineMode, setOfflineMode] = useState(isOffline);

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [revealResult, setRevealResult] = useState<AnswerCheckResult | null>(null);
  const [lang, setLang] = useState<'en' | 'fil'>(prefs.explanationLocale ?? 'en');
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  // Strict exams (mock/board) use an answer-sheet model: selections are stored
  // per question index so the user can answer in any order, revisit, and change
  // answers via the navigator. Grading is deferred to submit.
  const [answersByIndex, setAnswersByIndex] = useState<Record<number, string>>({});
  // "Flag for review" markers — persisted with the resume snapshot below.
  const [flaggedIndices, setFlaggedIndices] = useState<Set<number>>(new Set());
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(
    isMock ? Number(durationSeconds) || 600 : isBoard ? BOARD_DURATION_SECONDS : isTimed ? timedDuration : 0
  );
  const [mockTitle, setMockTitle] = useState('Mock Exam');

  // Hint system: eliminates one wrong answer per question.
  // hintCredits is fetched from DB; hintUsedOnQuestion tracks which questions got a hint.
  // eliminatedChoiceId is which wrong choice was dimmed on the current question.
  const [hintCredits, setHintCredits] = useState(3);
  const [hintUsedOnQuestion, setHintUsedOnQuestion] = useState<Set<string>>(new Set());
  const [eliminatedChoiceId, setEliminatedChoiceId] = useState<string | null>(null);

  const startedAt = useRef(Date.now());
  const questionStarted = useRef(Date.now());
  const finishing = useRef(false);

  useEffect(() => {
    (async () => {
      // Strict exams: restore an interrupted attempt (same question order,
      // answers, flags, position, remaining time) when a valid snapshot exists;
      // otherwise shuffle fresh and save the starting order so future saves and
      // resumes stay index-aligned.
      const applyStrict = async (raw: Question[], fallbackTimeLeft: number) => {
        const snap = resumeKey ? await loadExamSnapshot(resumeKey) : null;
        const ordered = snap ? reorderToSnapshot(raw, snap.questionOrder) : null;
        if (snap && ordered) {
          setQuestions(ordered);
          setAnswersByIndex(snap.answers);
          setFlaggedIndices(new Set(snap.flagged));
          setIndex(Math.min(snap.index, ordered.length - 1));
          setSelected(snap.answers[snap.index] ?? null);
          setTimeLeft(snap.timeLeft);
          setResumed(true);
        } else {
          const shuffled = randomizeQuestionSet(raw);
          setQuestions(shuffled);
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
        }
      };

      try {
        const exam = await fetchExamBySlug(slug);

        if (isDiagnostic) {
          if (!user) {
            router.replace('/(auth)/login');
            return;
          }
          setQuestions(randomizeQuestionSet(await fetchDiagnosticQuestions(slug, DIAGNOSTIC_ITEM_COUNT)));
        } else if (isMock && mockExamId) {
          try {
            const [mock, qs] = await Promise.all([
              fetchMockExamById(mockExamId),
              fetchMockExamQuestions(mockExamId),
            ]);
            const fullDuration = mock?.durationSeconds ?? Number(durationSeconds) ?? 600;
            if (mock) {
              setMockTitle(mock.title);
              setTimeLeft(fullDuration);
            }
            await applyStrict(qs.questions, fullDuration);
          } catch (err) {
            if (isMiniMockLimitError(err as { message?: string })) {
              setPaywallBlocked(true);
              return;
            }
            throw err;
          }
        } else if (isBoard) {
          if (!user) {
            router.replace('/(auth)/login');
            return;
          }
          if (!isPremium()) {
            setPaywallReason('board');
            setPaywallBlocked(true);
            return;
          }
          const result = await fetchPracticeQuestions(slug, BOARD_ITEM_COUNT, topicSlug);
          setTimeLeft(BOARD_DURATION_SECONDS);
          await applyStrict(result.questions.slice(0, BOARD_ITEM_COUNT), BOARD_DURATION_SECONDS);
        } else if (isMistakeReview) {
          const ids = await fetchMistakeQuestionIds(slug, 12);
          setQuestions(randomizeQuestionSet(await fetchQuestionsByIds(ids)));
        } else if (isBookmarkReview) {
          if (!user) {
            router.replace('/(auth)/login');
            return;
          }
          // Focus a single bookmarked question, or drill all of them.
          const ids = focusQuestionId
            ? [focusQuestionId]
            : [...(await fetchBookmarkedQuestionIds(user.id))];
          setQuestions(randomizeQuestionSet(await fetchQuestionsByIds(ids)));
        } else if (isWeakArea) {
          if (!user) {
            router.replace('/(auth)/login');
            return;
          }
          if (user && exam) {
            const limits = await fetchUsageLimits(slug);
            if (limits && !limits.isPremium && limits.dailyQuestionsRemaining === 0) {
              setPaywallBlocked(true);
              return;
            }
          }
          const result = await fetchWeakAreaQuestions(slug, 10);
          if (result.error === 'daily_limit') {
            setPaywallBlocked(true);
            return;
          }
          setQuestions(randomizeQuestionSet(result.questions));
        } else if (isOffline) {
          const offlineQs = await pickOfflinePracticeQuestions(slug, 12, topicSlug);
          if (!offlineQs.length) {
            Alert.alert('Walang offline pack', 'I-download muna ang offline pack sa Settings.');
            router.back();
            return;
          }
          setOfflineMode(true);
          setQuestions(randomizeQuestionSet(offlineQs));
        } else if (isBarkada) {
          if (!user) {
            router.replace('/(auth)/login');
            return;
          }
          const result = await fetchPracticeQuestions(slug, barkadaLimit, topicSlug);
          if (result.error === 'daily_limit') {
            setPaywallBlocked(true);
            return;
          }
          setQuestions(randomizeQuestionSet(result.questions.slice(0, barkadaLimit)));
        } else {
          if (user && exam) {
            const limits = await fetchUsageLimits(slug);
            if (limits && !limits.isPremium && limits.dailyQuestionsRemaining === 0) {
              setPaywallBlocked(true);
              return;
            }
          }
          const result = await fetchPracticeQuestions(slug, 12, topicSlug);
          if (result.error === 'daily_limit') {
            setPaywallBlocked(true);
            return;
          }
          setQuestions(randomizeQuestionSet(result.questions));
        }
        if (user) {
          const [bookmarks, xpStats] = await Promise.all([
            fetchBookmarkedQuestionIds(user.id),
            fetchXpStats(),
          ]);
          setBookmarkedIds(bookmarks);
          setHintCredits(xpStats.hintCredits);
        }
      } catch {
        if (!isMock && !isBoard && !isDiagnostic && !isWeakArea && !isBarkada && !isBookmarkReview && (await hasOfflinePack(slug))) {
          const offlineQs = await pickOfflinePracticeQuestions(slug, 12, topicSlug);
          if (offlineQs.length) {
            setOfflineMode(true);
            setQuestions(randomizeQuestionSet(offlineQs));
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, topicSlug, isMock, isBoard, isOffline, isMistakeReview, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, barkadaLimit, mockExamId, previewLimit, focusQuestionId, user, isPremium, router]);

  useEffect(() => {
    setLang(prefs.explanationLocale ?? 'en');
  }, [prefs.explanationLocale]);

  useEffect(() => {
    const id = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(sec);
      if (isMock || isTimed || isBoard) {
        setTimeLeft((t) => Math.max(0, t - 1));
      }
      if (isDiagnostic && sec >= DIAGNOSTIC_SOFT_SECONDS) {
        setSoftTimerWarn(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isMock, isTimed, isBoard, isDiagnostic]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const current = questions[index];
  const answeredIndices = useMemo(
    () => new Set(Object.keys(answersByIndex).map(Number)),
    [answersByIndex]
  );
  const answeredCount = answeredIndices.size;

  // Latest exam state in a ref so background/unmount saves capture the current
  // values without re-subscribing every render.
  const examStateRef = useRef({ questions, answersByIndex, flaggedIndices, index, timeLeft });
  useEffect(() => {
    examStateRef.current = { questions, answersByIndex, flaggedIndices, index, timeLeft };
  });

  const saveExamProgress = useCallback(() => {
    if (!resumeKey) return;
    const s = examStateRef.current;
    if (!s.questions.length) return;
    void saveExamSnapshot(resumeKey, {
      questionOrder: s.questions.map((q) => q.id),
      answers: s.answersByIndex,
      flagged: [...s.flaggedIndices],
      index: s.index,
      timeLeft: s.timeLeft,
      savedAt: Date.now(),
    });
  }, [resumeKey]);

  // Persist progress on every answer/flag/navigation change.
  useEffect(() => {
    if (!resumeKey || loading || !questions.length) return;
    saveExamProgress();
  }, [answersByIndex, flaggedIndices, index, resumeKey, loading, questions.length, saveExamProgress]);

  // Capture the latest state (incl. remaining time) when the app is backgrounded.
  useEffect(() => {
    if (!resumeKey) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'inactive' || state === 'background') saveExamProgress();
    });
    return () => sub.remove();
  }, [resumeKey, saveExamProgress]);

  const pickChoice = useCallback(
    (choiceId: string) => {
      if (!current || revealed) return;
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelected(choiceId);
      // Answer-sheet: remember the selection for this question so it survives
      // navigating away and back (strict exams only).
      if (isStrictExam) {
        setAnswersByIndex((prev) => ({ ...prev, [index]: choiceId }));
      }
    },
    [current, revealed, isStrictExam, index]
  );

  /** Toggle the current question's "flag for review" marker (strict exams). */
  const toggleFlag = useCallback(() => {
    setFlaggedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, [index]);

  /** Jump to any question (strict-exam navigator). Restores its saved answer. */
  const jumpTo = useCallback(
    (target: number) => {
      if (target < 0 || target >= questions.length) return;
      setNavigatorOpen(false);
      setIndex(target);
      setSelected(answersByIndex[target] ?? null);
      setRevealed(false);
      setRevealResult(null);
      setEliminatedChoiceId(null);
      questionStarted.current = Date.now();
    },
    [questions.length, answersByIndex]
  );

  /**
   * Activates a hint: eliminates one genuinely incorrect choice.
   * The wrong choice is chosen server-side (get_question_hint) so the hint can
   * never remove the correct answer. Only deducts a credit (–10 XP) once a real
   * wrong choice has been eliminated.
   */
  const activateHint = useCallback(async () => {
    if (!current || revealed || !user || hintUsedOnQuestion.has(current.id) || hintCredits <= 0) return;

    let eliminatedId: string | null;
    try {
      eliminatedId = await fetchQuestionHint(current.id, selected);
    } catch {
      return;
    }
    // No eliminable wrong choice (or offline) — don't charge the user.
    if (!eliminatedId) return;

    setEliminatedChoiceId(eliminatedId);

    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setHintUsedOnQuestion((prev) => new Set([...prev, current.id]));

    // Server deduct (fire-and-forget) now that a real hint was applied.
    deductHint()
      .then((remaining) => setHintCredits(remaining))
      .catch(() => setHintCredits((c) => Math.max(c - 1, 0)));
  }, [current, revealed, user, selected, hintUsedOnQuestion, hintCredits]);

  const checkAnswer = useCallback(async () => {
    if (!current || !selected || revealed || checking) return;
    // Guest users (no auth) can still check answers — checkQuestionAnswer uses the anon Supabase key
    const effectiveOffline = offlineMode;
    setChecking(true);
    try {
      const result = effectiveOffline
        ? checkOfflineAnswer(current, selected)
        : await checkQuestionAnswer(current.id, selected);
      if (!result) return;
      const elapsedQ = Math.round((Date.now() - questionStarted.current) / 1000);
      if (!isStrictExam) {
        setRevealResult(result);
        setRevealed(true);
      }
      setAnswers((prev) => [
        ...prev,
        {
          questionId: current.id,
          selectedChoiceId: selected,
          isCorrect: result.isCorrect,
          timeSpentSeconds: elapsedQ,
        },
      ]);
      if (user && !effectiveOffline) {
        void recordQuizOutcome(
          current.id,
          result.isCorrect,
          result.isCorrect ? undefined : selected
        ).catch(() => {});
      }
    } catch {
      /* grading failed */
    } finally {
      setChecking(false);
    }
  }, [current, selected, revealed, checking, isStrictExam, user, router, offlineMode]);

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
      score,
      itemCount: questions.length,
      offline: offlineMode,
      mode: isDiagnostic ? 'diagnostic' : isMock ? 'mock' : isBoard ? 'board' : isTimed ? 'timed' : 'practice',
    });

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
  }, [answers, answersByIndex, current, selected, revealed, revealResult, questions, flaggedIndices, user, slug, isMock, isBoard, isStrictExam, isMistakeReview, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, mockExamId, pasapathTaskId, barkadaChallengeId, offlineMode, resumeKey, router]);

  useEffect(() => {
    if ((isStrictExam || isTimed) && timeLeft === 0 && questions.length > 0) {
      finishQuiz();
    }
  }, [isStrictExam, isTimed, timeLeft, questions.length, finishQuiz]);

  /**
   * Submitting a strict exam routes through here: warn when questions are still
   * unanswered or flagged for review so the answer-sheet + flag states actually
   * gate submission. (Timer expiry submits directly without this prompt.)
   */
  const confirmSubmit = useCallback(() => {
    setNavigatorOpen(false);
    const unanswered = questions.length - Object.keys(answersByIndex).length;
    const flagged = flaggedIndices.size;
    if (unanswered === 0 && flagged === 0) {
      void finishQuiz();
      return;
    }
    const parts: string[] = [];
    if (unanswered > 0) parts.push(`${unanswered} hindi pa nasasagot`);
    if (flagged > 0) parts.push(`${flagged} flagged`);
    Alert.alert(
      'I-submit ang exam?',
      `May ${parts.join(' at ')} ka pa. Balikan mo muna o i-submit na.`,
      [
        { text: 'Balikan muna', style: 'cancel' },
        { text: 'I-submit na', style: 'destructive', onPress: () => void finishQuiz() },
      ]
    );
  }, [questions.length, answersByIndex, flaggedIndices, finishQuiz]);

  const goNext = async () => {
    // Strict exams (mock/board): answer-sheet model — selection is already saved
    // by pickChoice. Advance freely (the navigator allows revisiting); submit on
    // the last item (with an unanswered/flagged confirmation).
    if (isStrictExam) {
      if (index < questions.length - 1) {
        jumpTo(index + 1);
      } else {
        confirmSubmit();
      }
      return;
    }

    if (index < questions.length - 1) {
      setIndex(index + 1);
      setSelected(null);
      setRevealed(false);
      setRevealResult(null);
      setEliminatedChoiceId(null);
      questionStarted.current = Date.now();
      return;
    }

    await finishQuiz();
  };

  const toggleBookmarkCurrent = async () => {
    if (!user || !current) return;
    const isBookmarked = bookmarkedIds.has(current.id);
    await toggleBookmark(user.id, current.id, isBookmarked);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (paywallBlocked) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="lock-closed-outline" size={32} color={colors.primary} />}
          title={paywallReason === 'board' ? 'Board Exam Mode' : 'Abot na ang daily limit'}
          description={
            paywallReason === 'board'
              ? 'Maranasan ang totoong exam pressure gamit ang ReviewNatin Plus — strict timer, walang hint.'
              : `Nagamit mo na ang ${FREE_DAILY_QUESTIONS}/${FREE_DAILY_QUESTIONS} libreng tanong ngayong araw. I-unlock ang unlimited practice.`
          }
          actionLabel="View plans"
          onAction={() => router.replace('/subscribe')}
        />
      </View>
    );
  }

  if (!questions.length || !current) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="document-text-outline" size={32} color={colors.primary} />}
          title="Wala pang tanong dito"
          description="Nagdadagdag pa kami ng tanong dito. Subukan ang ibang topic o balikan mamaya — regular ang bagong content."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const explanation = revealResult
    ? lang === 'fil' && revealResult.explanationFil
      ? revealResult.explanationFil
      : revealResult.explanationEn
    : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          {!isStrictExam ? (
            <Pressable
              style={styles.closeBtn}
              onPress={() => {
                const hasProgress = answers.length > 0 || !!selected;
                if (isDiagnostic && user) {
                  Alert.alert(
                    'Aalis sa diagnostic?',
                    'Pwede mong ituloy ang baseline mamaya sa Home. Hindi maise-save ang attempt na ito.',
                    [
                      { text: 'Ituloy', style: 'cancel' },
                      {
                        text: 'Umalis',
                        style: 'destructive',
                        onPress: () => {
                          void dismissDiagnosticPrompt(user.id, slug).catch(() => {});
                          router.replace('/(tabs)');
                        },
                      },
                    ]
                  );
                  return;
                }
                if (isTimed || isBarkada || hasProgress) {
                  Alert.alert(
                    'Aalis sa quiz?',
                    'Hindi maise-save ang progress sa session na ito.',
                    [
                      { text: 'Ituloy', style: 'cancel' },
                      { text: 'Umalis', style: 'destructive', onPress: () => router.back() },
                    ]
                  );
                  return;
                }
                router.back();
              }}
              accessibilityRole="button"
              accessibilityLabel={isDiagnostic ? 'Leave diagnostic quiz' : 'Close quiz'}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          ) : (
            <Pressable
              style={styles.closeBtn}
              onPress={() => setNavigatorOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open question navigator"
            >
              <Ionicons name="grid-outline" size={16} color={colors.primary} />
            </Pressable>
          )}
          {isStrictExam ? (
            <Pressable
              style={[styles.segments, { alignItems: 'center', justifyContent: 'center' }]}
              onPress={() => setNavigatorOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Question ${index + 1} of ${questions.length}. Open navigator.`}
            >
              <Text style={styles.metaText}>
                {index + 1} / {questions.length}
                {answeredCount > 0 ? ` · ${answeredCount} answered` : ''}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.segments}>
              {questions.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    i < index && styles.segmentDone,
                    i === index && styles.segmentActive,
                  ]}
                />
              ))}
            </View>
          )}
          <View style={[styles.timer, (isStrictExam || isTimed) && timeLeft < 60 && { backgroundColor: colors.errorBg }]}>
            <Ionicons name="time-outline" size={14} color={(isStrictExam || isTimed) && timeLeft < 60 ? colors.error : colors.accentDark} />
            <Text style={[styles.timerText, (isStrictExam || isTimed) && timeLeft < 60 && { color: colors.error }]}>
              {formatTime(isStrictExam || isTimed ? timeLeft : elapsed)}
            </Text>
          </View>
        </View>

        {isDiagnostic ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Diagnostic baseline · {questions.length} items · Soft 30-min timer
              {softTimerWarn ? ' · Consider wrapping up' : ''}
            </Text>
          </View>
        ) : null}

        {isTimed ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Timed practice · {Math.round(timedDuration / 60)} min · Auto-submit pag naubos ang oras
            </Text>
          </View>
        ) : null}

        {isWeakArea ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>Quick 10 · Mga tanong sa pinakamahina mong topic</Text>
          </View>
        ) : null}

        {isBookmarkReview ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Bookmarks review · {questions.length} naka-save na tanong
            </Text>
          </View>
        ) : null}

        {isBoard ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Board Exam Mode · {questions.length} items · {Math.round(BOARD_DURATION_SECONDS / 60)} min · Walang hint · I-tap ang ▦ para mag-navigate
            </Text>
          </View>
        ) : null}

        {isMock ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>{mockTitle} · Mock exam · Strict timer · I-tap ang ▦ para mag-navigate</Text>
          </View>
        ) : null}

        {resumed ? (
          <View style={[styles.mockBanner, { backgroundColor: colors.successBg }]}>
            <Text style={[styles.mockBannerText, { color: colors.success }]}>
              ↻ Resumed your in-progress exam — answers, flags, and timer restored.
            </Text>
          </View>
        ) : null}

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Question {index + 1} of {questions.length}
          </Text>
          {current.topic?.subject?.name ? (
            <Pill color={colors.primary}>{current.topic.subject.name.toUpperCase()}</Pill>
          ) : null}
          {user ? (
            <Pressable
              onPress={toggleBookmarkCurrent}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={bookmarkedIds.has(current.id) ? 'Remove bookmark' : 'Save bookmark'}
            >
              <Ionicons
                name={bookmarkedIds.has(current.id) ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={colors.primary}
              />
            </Pressable>
          ) : null}
          {isStrictExam ? (
            <Pressable
              onPress={toggleFlag}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={flaggedIndices.has(index) ? 'Unflag this question for review' : 'Flag this question for review'}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Ionicons
                name={flaggedIndices.has(index) ? 'flag' : 'flag-outline'}
                size={18}
                color={flaggedIndices.has(index) ? colors.accentDark : colors.textMuted}
              />
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: flaggedIndices.has(index) ? colors.accentDark : colors.textMuted }}>
                Review
              </Text>
            </Pressable>
          ) : null}
          <ReportContentButton
            contentType="question"
            contentId={current.id}
            label="Flag"
            compact
          />
        </View>

        <View style={styles.questionCard}>
          <RichText
            content={current.stem}
            fontSize={19}
            color={colors.text}
          />
        </View>

        {current.image_url ? (
          <QuestionImage uri={current.image_url} />
        ) : null}

        <View style={styles.options}>
          {current.choices.map((c, i) => {
            const isEliminated = c.id === eliminatedChoiceId;
            return (
              <ChoiceOption
                key={c.id}
                letter={LETTERS[i] ?? String(i + 1)}
                label={c.text}
                selected={selected === c.id}
                correct={revealed && c.id === revealResult?.correctChoiceId}
                wrong={revealed && selected === c.id && c.id !== revealResult?.correctChoiceId}
                disabled={revealed || isEliminated}
                eliminated={isEliminated}
                onPress={() => pickChoice(c.id)}
              />
            );
          })}
        </View>

        {revealed && !isStrictExam && !explanation ? (
          <View style={[styles.explanation, { borderColor: revealResult?.isCorrect ? colors.success : colors.error, backgroundColor: revealResult?.isCorrect ? colors.successBg : colors.errorBg }]}>
            <Text style={[styles.explanationTitle, { color: revealResult?.isCorrect ? colors.success : colors.error }]}>
              {revealResult?.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </Text>
            {!revealResult?.isCorrect && revealResult?.correctChoiceId ? (
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: colors.text, marginTop: 4 }}>
                Naka-highlight sa green sa itaas ang tamang sagot.
              </Text>
            ) : null}
          </View>
        ) : null}

        {revealed && explanation ? (
          <View style={styles.explanation}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationTitle}>Paliwanag</Text>
              <View style={styles.langToggle}>
                {(['en', 'fil'] as const).map((l) => (
                  <Pressable
                    key={l}
                    style={[styles.langBtn, lang === l && styles.langBtnActive]}
                    onPress={() => setLang(l)}
                  >
                    <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                      {l === 'en' ? 'EN' : 'TL'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <RichText
              content={explanation}
              fontSize={14}
              color={colors.text}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {!revealed && !isStrictExam && !isDiagnostic && !isTimed && user ? (
          hintUsedOnQuestion.has(current?.id ?? '') ? (
            <View style={styles.hintRow}>
              <Text style={{ fontSize: 18 }}>💡</Text>
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Nagamit ang hint — isang maling sagot ang tinanggal
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.hintRow}
              onPress={activateHint}
              disabled={hintCredits <= 0}
            >
              <Text style={{ fontSize: 18 }}>💡</Text>
              <Text style={[styles.hintText, hintCredits <= 0 && { color: colors.textMuted }]}>
                Gamitin ang hint <Text style={styles.hintXp}>(–10 XP)</Text>
              </Text>
              <Pill
                color={hintCredits > 0 ? colors.accentDark : colors.textMuted}
                bg={colors.surface}
              >
                {`${hintCredits} NATITIRA`}
              </Pill>
            </Pressable>
          )
        ) : null}
        {revealed && !isStrictExam ? (
          <PrimaryButton
            label={
              index < questions.length - 1
                ? 'Susunod na tanong →'
                : isDiagnostic
                  ? 'Tingnan ang baseline →'
                  : 'Tingnan ang resulta →'
            }
            size="lg"
            onPress={goNext}
          />
        ) : isStrictExam || revealed ? (
          <PrimaryButton
            // Free navigation: advancing/submitting never requires an answer on
            // the current question — unanswered items can be revisited via ▦.
            label={
              index < questions.length - 1
                ? 'Susunod na tanong →'
                : isBoard
                  ? 'I-submit ang board exam'
                  : 'I-submit ang mock exam'
            }
            size="lg"
            onPress={goNext}
          />
        ) : (
          <PrimaryButton
            label={checking ? 'Chini-check…' : 'I-check ang sagot'}
            size="lg"
            disabled={!selected || checking}
            onPress={checkAnswer}
          />
        )}
      </View>

      {isStrictExam ? (
        <QuestionNavigator
          visible={navigatorOpen}
          questions={questions}
          currentIndex={index}
          answeredIndices={answeredIndices}
          flaggedIndices={flaggedIndices}
          onJump={jumpTo}
          onClose={() => setNavigatorOpen(false)}
          onSubmit={confirmSubmit}
        />
      ) : null}
    </View>
  );
}
