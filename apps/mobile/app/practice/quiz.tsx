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
import { ErrorBoundary } from '../../components/error-boundary';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { QuestionImage } from '../../components/question-image';
import { ReportContentButton } from '../../components/report-content-button';
import { QuestionNavigator } from '../../components/question-navigator';
import { RichText } from '../../components/rich-text';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createQuizStyles } from '../../lib/themed-styles';
import { checkQuestionAnswer, fetchQuestionHint, type AnswerCheckResult } from '../../lib/api/catalog';
import { checkOfflineAnswer } from '../../lib/offline/pack';
import { recordQuizOutcome } from '../../lib/api/mistakes';
import { toggleBookmark } from '../../lib/api/bookmarks';
import { deductHint } from '../../lib/api/xp';
import { FREE_DAILY_QUESTIONS } from '../../lib/paywall';
import { dismissDiagnosticPrompt } from '../../lib/diagnostic-prompt';
import { BOARD_DURATION_SECONDS, LETTERS } from '../../lib/quiz/constants';
import { deriveQuizMode, type QuizModeParams } from '../../lib/quiz/mode';
import { useQuizQuestions } from '../../lib/quiz/use-quiz-questions';
import { useExamAutosave } from '../../lib/quiz/use-exam-autosave';
import { useQuizTimer } from '../../lib/quiz/use-quiz-timer';
import { useQuizSubmission } from '../../lib/quiz/use-quiz-submission';
import type { QuizAnswerRecord } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { trackEvent } from '../../lib/analytics/events';

function PracticeQuizScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createQuizStyles(theme), [theme]);
  const params = useLocalSearchParams<QuizModeParams>();
  const { topicSlug, mockExamId, durationSeconds, pasapathTaskId, barkadaChallengeId, focusQuestionId } = params;
  const modeFlags = deriveQuizMode(params);
  const { slug, isMock, isBookmarkReview, isDiagnostic, isTimed, isWeakArea, isBarkada, isBoard, isStrictExam, isMistakeReview, timedDuration } = modeFlags;

  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const { prefs } = usePreferences();

  const quiz = useQuizQuestions(modeFlags, { topicSlug, mockExamId, durationSeconds, focusQuestionId }, user, isPremium, router);
  const {
    loading,
    questions,
    paywallBlocked,
    paywallReason,
    offlineMode,
    bookmarkedIds,
    setBookmarkedIds,
    hintCredits,
    setHintCredits,
    mockTitle,
    mockPreviewActive,
    resumed,
    answersByIndex,
    setAnswersByIndex,
    flaggedIndices,
    setFlaggedIndices,
    index,
    setIndex,
    selected,
    setSelected,
    timeLeft,
    setTimeLeft,
  } = quiz;

  const [revealed, setRevealed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [revealResult, setRevealResult] = useState<AnswerCheckResult | null>(null);
  const [lang, setLang] = useState<'en' | 'fil'>(prefs.explanationLocale ?? 'en');
  const [answers, setAnswers] = useState<QuizAnswerRecord[]>([]);
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const startedTracked = useRef(false);

  useEffect(() => {
    setLang(prefs.explanationLocale ?? 'en');
  }, [prefs.explanationLocale]);

  useEffect(() => {
    if (loading || questions.length === 0 || startedTracked.current) return;
    startedTracked.current = true;
    if (isMock || isBoard) {
      trackEvent('mock_exam_started', {
        examSlug: slug,
        itemCount: questions.length,
        mockExamId: mockExamId ?? null,
        preview: mockPreviewActive,
      });
    } else if (!isDiagnostic) {
      trackEvent('practice_started', {
        examSlug: slug,
        itemCount: questions.length,
        mode: isTimed ? 'timed' : isMistakeReview ? 'mistake_review' : isWeakArea ? 'weak_area' : offlineMode ? 'offline' : 'practice',
      });
    }
  }, [loading, questions.length, isMock, isBoard, isDiagnostic, isTimed, isMistakeReview, isWeakArea, slug, mockExamId, mockPreviewActive, offlineMode]);

  // Hint system: eliminates one wrong answer per question.
  // hintCredits is fetched from DB; hintUsedOnQuestion tracks which questions got a hint.
  // eliminatedChoiceId is which wrong choice was dimmed on the current question.
  const [hintUsedOnQuestion, setHintUsedOnQuestion] = useState<Set<string>>(new Set());
  const [eliminatedChoiceId, setEliminatedChoiceId] = useState<string | null>(null);

  const { startedAt, elapsed, softTimerWarn } = useQuizTimer(modeFlags, setTimeLeft);
  const questionStarted = useRef(Date.now());

  useExamAutosave({
    resumeKey: modeFlags.resumeKey,
    questions,
    answersByIndex,
    flaggedIndices,
    index,
    timeLeft,
    loading,
  });

  const current = questions[index];
  const answeredIndices = useMemo(
    () => new Set(Object.keys(answersByIndex).map(Number)),
    [answersByIndex]
  );
  const answeredCount = answeredIndices.size;

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
    [current, revealed, isStrictExam, index, setSelected, setAnswersByIndex]
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
  }, [index, setFlaggedIndices]);

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
    [questions.length, answersByIndex, setIndex, setSelected, questionStarted]
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
  }, [current, revealed, user, selected, hintUsedOnQuestion, hintCredits, setHintCredits]);

  const checkAnswer = useCallback(async () => {
    if (!current || !selected || revealed || checking) return;
    if (!user && !offlineMode) {
      const continuePreview =
        index < questions.length - 1
          ? () => {
              setIndex(index + 1);
              setSelected(null);
              setRevealed(false);
              setRevealResult(null);
              setEliminatedChoiceId(null);
              questionStarted.current = Date.now();
            }
          : () => router.replace('/(tabs)/study');
      Alert.alert(
        'Log in to check answers',
        'Create a free account to see explanations, save progress, and build your Mistake Bank. You can still preview the next question.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: index < questions.length - 1 ? 'Next preview' : 'Back to Review', onPress: continuePreview },
          { text: 'Log in', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }
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
  }, [current, selected, revealed, checking, isStrictExam, user, router, offlineMode, index, questions.length, setIndex, setSelected, questionStarted]);

  const finishQuiz = useQuizSubmission({
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
  });

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

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((index + 1) / questions.length) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressCounter}>
                {index + 1}
                <Text style={styles.progressCounterMute}>/{questions.length}</Text>
              </Text>
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
            <Text style={styles.mockBannerText}>
              {mockTitle} · {mockPreviewActive ? `${questions.length}-item preview` : 'Mock exam'} · Strict timer · I-tap ang ▦ para mag-navigate
            </Text>
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
                key={`${c.id}-${i}`}
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

export default function PracticeQuizScreen() {
  return (
    <ErrorBoundary>
      <PracticeQuizScreenContent />
    </ErrorBoundary>
  );
}
