import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { fetchBookmarkedQuestionIds, toggleBookmark } from '../../lib/api/bookmarks';
import { fetchMistakeQuestionIds, recordQuizOutcome } from '../../lib/api/mistakes';
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
  const { examSlug, topicSlug, mode, mockExamId, durationSeconds, previewLimit, pasapathTaskId, barkadaChallengeId, questionLimit } = useLocalSearchParams<{
    examSlug?: string;
    topicSlug?: string;
    mode?: string;
    mockExamId?: string;
    durationSeconds?: string;
    previewLimit?: string;
    pasapathTaskId?: string;
    barkadaChallengeId?: string;
    questionLimit?: string;
  }>();
  const slug = examSlug ?? DEFAULT_EXAM_SLUG;
  const isMock = mode === 'mock';
  const isMistakeReview = mode === 'mistake_review';
  const isDiagnostic = mode === 'diagnostic';
  const isTimed = mode === 'timed';
  const isWeakArea = mode === 'weak_area';
  const isBarkada = mode === 'barkada';
  const isBoard = mode === 'board';
  const isOffline = mode === 'offline';
  const isStrictExam = isMock || isBoard;
  const barkadaLimit = Math.max(Number(questionLimit) || 10, 5);
  const timedDuration = Number(durationSeconds) || 600;
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const { prefs } = usePreferences();
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  const [paywallReason, setPaywallReason] = useState<'daily' | 'board'>('daily');
  const [softTimerWarn, setSoftTimerWarn] = useState(false);
  const [sectionBreak, setSectionBreak] = useState<string | null>(null);
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
            if (mock) {
              setMockTitle(mock.title);
              setTimeLeft(mock.durationSeconds);
            }
            setQuestions(randomizeQuestionSet(qs.questions));
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
          setQuestions(randomizeQuestionSet(result.questions.slice(0, BOARD_ITEM_COUNT)));
          setTimeLeft(BOARD_DURATION_SECONDS);
        } else if (isMistakeReview) {
          const ids = await fetchMistakeQuestionIds(slug, 12);
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
            Alert.alert('No offline pack', 'Download the offline pack in Settings first.');
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
        if (!isMock && !isBoard && !isDiagnostic && !isWeakArea && !isBarkada && (await hasOfflinePack(slug))) {
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
  }, [slug, topicSlug, isMock, isBoard, isOffline, isMistakeReview, isDiagnostic, isTimed, isWeakArea, isBarkada, barkadaLimit, mockExamId, previewLimit, user, isPremium, router]);

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

  const pickChoice = useCallback(
    (choiceId: string) => {
      if (!current || revealed) return;
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelected(choiceId);
    },
    [current, revealed]
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

    const elapsedQ = Math.round((Date.now() - questionStarted.current) / 1000);
    const finalAnswers = finalizeAnswers(answers, current, selected, revealed || isStrictExam, elapsedQ, revealResult);
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
        mode: isDiagnostic ? 'diagnostic' : isMock ? 'mock' : isBoard ? 'board' : isTimed ? 'timed' : isWeakArea ? 'weak_area' : isBarkada ? 'barkada' : offlineMode ? 'offline' : 'practice',
        diagnosticReadiness: diagnosticReadiness != null ? String(diagnosticReadiness) : '',
        pasapathTaskId: pasapathTaskId ?? '',
        barkadaChallengeId: barkadaChallengeId ?? '',
      },
    });
  }, [answers, current, selected, revealed, revealResult, questions.length, user, slug, isMock, isBoard, isMistakeReview, isDiagnostic, isTimed, isWeakArea, isBarkada, mockExamId, pasapathTaskId, barkadaChallengeId, offlineMode, router]);

  useEffect(() => {
    if ((isStrictExam || isTimed) && timeLeft === 0 && questions.length > 0) {
      finishQuiz();
    }
  }, [isStrictExam, isTimed, timeLeft, questions.length, finishQuiz]);

  const subjectName = (q: Question | undefined) => q?.topic?.subject?.name ?? '';

  const goNext = async () => {
    if (isStrictExam && !revealed && selected && current) {
      await checkAnswer();
    }

    if (index < questions.length - 1) {
      const nextIndex = index + 1;
      const nextSubject = subjectName(questions[nextIndex]);
      const currentSubject = subjectName(current);
      if (isStrictExam && nextSubject && currentSubject && nextSubject !== currentSubject) {
        setSectionBreak(nextSubject);
        return;
      }
      setIndex(nextIndex);
      setSelected(null);
      setRevealed(false);
      setRevealResult(null);
      setEliminatedChoiceId(null);
      questionStarted.current = Date.now();
      return;
    }

    await finishQuiz();
  };

  const continueAfterSectionBreak = () => {
    setSectionBreak(null);
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
    setRevealResult(null);
    setEliminatedChoiceId(null);
    questionStarted.current = Date.now();
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
          title={paywallReason === 'board' ? 'Board Exam Mode' : 'Daily limit reached'}
          description={
            paywallReason === 'board'
              ? 'Simulate real exam pressure with ReviewNatin Plus — strict timer, no hints, no going back.'
              : `You've used ${FREE_DAILY_QUESTIONS}/${FREE_DAILY_QUESTIONS} free questions today. Unlock unlimited practice.`
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
          title="No questions yet"
          description="We're still adding questions for this topic. Try another topic or check back soon — new content drops regularly."
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

  if (sectionBreak) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top, paddingHorizontal: spacing.lg }]}>
        <Ionicons name="layers-outline" size={40} color={colors.primary} />
        <Text style={[styles.mockBannerText, { fontSize: 22, marginTop: spacing.md, textAlign: 'center' }]}>
          Next section
        </Text>
        <Text style={{ fontFamily: theme.fonts.bodyMedium, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
          {sectionBreak}
        </Text>
        <Text style={{ fontFamily: theme.fonts.bodyMedium, color: colors.textLight, marginTop: spacing.md, textAlign: 'center', lineHeight: 20 }}>
          Take a breath. Board exam mode — no going back to previous sections.
        </Text>
        <PrimaryButton label="Continue section →" size="lg" onPress={continueAfterSectionBreak} style={{ marginTop: spacing.xl, alignSelf: 'stretch' }} />
      </View>
    );
  }

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
                    'Leave diagnostic?',
                    'You can continue with the baseline later from Home. This attempt will not be saved.',
                    [
                      { text: 'Keep going', style: 'cancel' },
                      {
                        text: 'Leave',
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
                    'Leave quiz?',
                    'Your progress in this session will not be saved.',
                    [
                      { text: 'Keep going', style: 'cancel' },
                      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
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
            <View style={styles.closeBtn}>
              <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
            </View>
          )}
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
              Timed practice · {Math.round(timedDuration / 60)} min · Auto-submit when time runs out
            </Text>
          </View>
        ) : null}

        {isWeakArea ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>Quick 10 · Questions from your weakest topics</Text>
          </View>
        ) : null}

        {isBoard ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>
              Board Exam Mode · {questions.length} items · {Math.round(BOARD_DURATION_SECONDS / 60)} min · No hints · No going back
            </Text>
          </View>
        ) : null}

        {isMock ? (
          <View style={styles.mockBanner}>
            <Text style={styles.mockBannerText}>{mockTitle} · Mock exam · Strict timer · No going back</Text>
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
                The correct answer is highlighted in green above.
              </Text>
            ) : null}
          </View>
        ) : null}

        {revealed && explanation ? (
          <View style={styles.explanation}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationTitle}>Explanation</Text>
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
                Hint used — one wrong answer removed
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
                Use hint <Text style={styles.hintXp}>(–10 XP)</Text>
              </Text>
              <Pill
                color={hintCredits > 0 ? colors.accentDark : colors.textMuted}
                bg={colors.surface}
              >
                {`${hintCredits} LEFT`}
              </Pill>
            </Pressable>
          )
        ) : null}
        {revealed && !isStrictExam ? (
          <PrimaryButton
            label={
              index < questions.length - 1
                ? 'Next question →'
                : isDiagnostic
                  ? 'View baseline result →'
                  : 'View results →'
            }
            size="lg"
            onPress={goNext}
          />
        ) : isStrictExam || revealed ? (
          <PrimaryButton
            label={
              index < questions.length - 1
                ? 'Next question →'
                : isBoard
                  ? 'Submit board exam'
                  : 'Submit mock exam'
            }
            size="lg"
            disabled={!selected || checking}
            onPress={goNext}
          />
        ) : (
          <PrimaryButton
            label={checking ? 'Checking…' : 'Check answer'}
            size="lg"
            disabled={!selected || checking}
            onPress={checkAnswer}
          />
        )}
      </View>
    </View>
  );
}
