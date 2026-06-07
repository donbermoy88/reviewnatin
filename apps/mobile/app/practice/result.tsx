import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { ShareScoreCard } from '../../components/share-score-card';
import { ShareScoreCapture } from '../../components/share-score-capture';
import { ReportContentButton } from '../../components/report-content-button';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { canUseViewShot, shareQuizScore, shareQuizScoreImage } from '../../lib/share/score-share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChoiceOption } from '../../components/choice-option';
import { PrimaryButton } from '../../components/primary-button';
import { ScoreRing } from '../../components/score-ring';
import { SparkleStar } from '../../components/sparkle-star';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createResultStyles } from '../../lib/themed-styles';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchSessionReview, type SessionReviewItem } from '../../lib/api/quiz';
import { completePasaPathTask } from '../../lib/api/pasapath';
import { submitBarkadaChallengeResult } from '../../lib/api/barkada';
import { MOCK_PASS_THRESHOLD } from '../../lib/api/mock-history';
import { fetchAiExplanation } from '../../lib/api/ai-explain';
import { recomputeReadiness } from '../../lib/api/readiness';
import { fetchUsageLimits } from '../../lib/api/iap';
import { canUseTts, speakText, stopSpeaking } from '../../lib/tts/speak';
import { AdBanner } from '../../components/ad-banner';
import { AdInterstitialModal } from '../../components/ad-interstitial-modal';
import { tryShowSessionInterstitial } from '../../lib/ads/interstitial';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { useUserProfile } from '../../hooks/use-user-profile';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

function formatDuration(sec: string): string {
  const n = Number(sec) || 0;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PracticeResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing, radii } = theme;
  const styles = useMemo(() => createResultStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const { displayName } = useUserProfile('reviewer');
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [review, setReview] = useState<SessionReviewItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [examName, setExamName] = useState('ReviewNatin');
  const [sharing, setSharing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiExtras, setAiExtras] = useState<Record<string, string>>({});
  const [aiRemaining, setAiRemaining] = useState<number | null>(null);
  const captureRef = useRef<(() => Promise<string | undefined>) | null>(null);
  const { score, total, correct, duration, sessionId, mode, diagnosticReadiness, pasapathTaskId, examSlug: paramExamSlug, barkadaChallengeId } = useLocalSearchParams<{
    score: string;
    total: string;
    correct: string;
    duration: string;
    sessionId?: string;
    mode?: string;
    diagnosticReadiness?: string;
    pasapathTaskId?: string;
    examSlug?: string;
    barkadaChallengeId?: string;
  }>();

  useEffect(() => {
    resolveOnboardingGoal(user?.id).then(async (goal) => {
      const slug = paramExamSlug ?? goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);
      const exam = await fetchExamBySlug(slug);
      if (exam) setExamName(exam.name);
      if (exam) setExamTypeId(exam.id);
    });
  }, [user?.id, paramExamSlug]);

  useEffect(() => {
    if (!mode || mode === 'mock' || mode === 'diagnostic' || mode === 'board') return;
    void (async () => {
      const premium = isPremium(examTypeId);
      const outcome = await tryShowSessionInterstitial(premium, false);
      if (outcome === 'fallback') {
        setShowInterstitial(true);
      }
    })();
  }, [mode, examTypeId, isPremium]);

  useEffect(() => {
    if (!sessionId) return;
    setReviewLoading(true);
    fetchSessionReview(sessionId)
      .then(setReview)
      .finally(() => setReviewLoading(false));
  }, [sessionId]);

  useEffect(() => {
    if (!user || !pasapathTaskId || !examSlug) return;
    void completePasaPathTask(examSlug, pasapathTaskId);
  }, [user, pasapathTaskId, examSlug]);

  useEffect(() => {
    if (!user || !examSlug) return;
    void fetchUsageLimits(examSlug).then((limits) => {
      if (limits) setAiRemaining(limits.aiExplanationsRemaining);
    });
  }, [user, examSlug]);

  useEffect(() => {
    if (!user || !examSlug) return;
    void recomputeReadiness(examSlug).catch(() => {});
  }, [user, examSlug]);

  const scoreNum = Number(score) || 0;
  const totalNum = Number(total) || 0;
  const correctNum = Number(correct) || 0;

  useEffect(() => {
    if (!user || !barkadaChallengeId || !sessionId) return;
    void submitBarkadaChallengeResult(
      barkadaChallengeId,
      sessionId,
      scoreNum,
      correctNum,
      totalNum
    );
  }, [user, barkadaChallengeId, sessionId, scoreNum, correctNum, totalNum]);

  const wrongCount = review.filter((r) => r.isCorrect === false).length;

  const requestAiExplanation = async (questionId: string) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setAiLoadingId(questionId);
    try {
      const result = await fetchAiExplanation(questionId, { examSlug });
      if (!result.ok) {
        if (result.error === 'daily_limit_reached') {
          Alert.alert('Daily limit reached', 'Free tier: 5 AI explanations per day. Upgrade for unlimited.');
        } else {
          Alert.alert('Not available', 'Please try again later.');
        }
        return;
      }
      setAiExtras((prev) => ({ ...prev, [questionId]: result.explanation }));
      if (result.remaining != null) setAiRemaining(result.remaining);
    } finally {
      setAiLoadingId(null);
    }
  };

  const modeLabel =
    mode === 'diagnostic'
      ? 'Diagnostic baseline'
      : mode === 'mock'
        ? 'Mock exam'
        : mode === 'board'
          ? 'Board exam'
          : mode === 'timed'
            ? 'Timed practice'
            : mode === 'weak_area'
              ? 'Quick 10 · weak areas'
              : mode === 'barkada'
                ? 'Barkada challenge'
                : 'Practice quiz';

  const toggleSpeak = async (questionId: string, text: string) => {
    if (speakingId === questionId) {
      await stopSpeaking();
      setSpeakingId(null);
      return;
    }
    if (speakingId) {
      await stopSpeaking();
    }
    setSpeakingId(questionId);
    const started = await speakText(text, 'en', {
      onDone: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
    if (!started) setSpeakingId(null);
  };

  const handleCaptureReady = useCallback((capture: () => Promise<string | undefined>) => {
    captureRef.current = capture;
  }, []);

  const shareScore = async () => {
    setSharing(true);
    const payload = {
      displayName,
      examName,
      modeLabel,
      score: scoreNum,
      correct: correctNum,
      total: totalNum,
    };

    try {
      if (canUseViewShot() && captureRef.current) {
        const shared = await shareQuizScoreImage(captureRef.current);
        if (shared) return;
      }
      await shareQuizScore(payload);
    } finally {
      setSharing(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
        >
          <View style={styles.sparkleA}>
            <SparkleStar size={14} />
          </View>
          <Text style={styles.heroLbl}>
            {mode === 'diagnostic'
              ? 'Diagnostic complete!'
              : mode === 'mock'
                ? 'Mock exam complete!'
                : mode === 'board'
                  ? 'Board exam complete!'
                  : mode === 'timed'
                    ? 'Timed practice complete!'
                    : mode === 'weak_area'
                      ? 'Quick 10 complete!'
                      : mode === 'barkada'
                        ? 'Barkada challenge complete!'
                        : 'Quiz complete!'}
          </Text>
          <Text style={styles.heroTitle}>
            {mode === 'diagnostic'
              ? `Baseline readiness: ${diagnosticReadiness ?? scoreNum}%`
              : mode === 'mock' || mode === 'board'
                ? scoreNum >= MOCK_PASS_THRESHOLD
                  ? `${mode === 'board' ? 'Board exam' : 'Mock'} PASS — ${scoreNum}% 🎉`
                  : `Score: ${scoreNum}% — aim for ${MOCK_PASS_THRESHOLD}%+`
                : scoreNum >= 70
                  ? `Great work, ${displayName}! 🎉`
                  : 'Keep going! 💪'}
          </Text>
          <ScoreRing percent={scoreNum} correct={correctNum} total={totalNum} />
        </LinearGradient>

        <View style={styles.statsRow}>
          {[
            { v: `${correctNum}/${totalNum}`, l: 'Correct', c: colors.primary },
            { v: formatDuration(duration ?? '0'), l: 'Time taken', c: colors.accentDark },
            { v: `${scoreNum}%`, l: 'Score', c: scoreNum >= 75 ? colors.success : scoreNum >= 50 ? colors.flame : colors.error },
          ].map((s) => (
            <View key={s.l} style={styles.statCard}>
              <Text style={styles.statLbl}>{s.l.toUpperCase()}</Text>
              <Text style={[styles.statVal, { color: s.c }]}>{s.v}</Text>
            </View>
          ))}
        </View>

        {reportFeedback ? (
          <View
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.sm,
              padding: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: colors.successBg,
              borderWidth: 1,
              borderColor: colors.success,
            }}
          >
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, lineHeight: 20 }}>
              {reportFeedback}
            </Text>
          </View>
        ) : null}

        {sessionId ? (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewTitle}>Review answers</Text>
            {reviewLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : review.length === 0 ? (
              <Text style={styles.reviewEmpty}>No saved answers for this session.</Text>
            ) : (
              review.map((item, idx) => {
                const explanation =
                  aiExtras[item.questionId] ??
                  (item.explanationFil && item.explanationEn
                    ? item.explanationEn
                    : item.explanationEn ?? item.explanationFil);
                const open = expandedId === item.questionId;
                const showAiCta = user && !explanation && item.isCorrect === false;
                return (
                  <Pressable
                    key={item.questionId}
                    style={styles.reviewItem}
                    onPress={() => setExpandedId(open ? null : item.questionId)}
                  >
                    <View style={styles.reviewHead}>
                      <Ionicons
                        name={item.isCorrect ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={item.isCorrect ? colors.success : colors.error}
                      />
                      <Text style={[styles.reviewQ, { flex: 1 }]} numberOfLines={open ? undefined : 2}>
                        Q{idx + 1}. {item.stem}
                      </Text>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.textMuted}
                        style={{ marginLeft: 4 }}
                      />
                    </View>
                    {open ? (
                      <View style={styles.reviewBody}>
                        {item.choices.map((c, i) => (
                          <ChoiceOption
                            key={c.id}
                            letter={LETTERS[i] ?? String(i + 1)}
                            label={c.text}
                            selected={item.selectedChoiceId === c.id}
                            correct={c.id === item.correctChoiceId}
                            wrong={item.selectedChoiceId === c.id && c.id !== item.correctChoiceId}
                            disabled
                            onPress={() => {}}
                          />
                        ))}
                        {explanation ? (
                          <>
                            <Text style={styles.explanation}>{explanation}</Text>
                            {canUseTts() ? (
                              <Pressable
                                style={styles.reportBtn}
                                onPress={() => void toggleSpeak(item.questionId, explanation)}
                              >
                                <Ionicons
                                  name={speakingId === item.questionId ? 'stop-circle-outline' : 'volume-high-outline'}
                                  size={16}
                                  color={colors.primary}
                                />
                                <Text style={[styles.reportBtnText, { color: colors.primary }]}>
                                  {speakingId === item.questionId ? 'Stop · TTS' : 'Listen · TTS'}
                                </Text>
                              </Pressable>
                            ) : null}
                          </>
                        ) : null}
                        {showAiCta ? (
                          <Pressable
                            style={styles.reportBtn}
                            onPress={() => void requestAiExplanation(item.questionId)}
                            disabled={aiLoadingId === item.questionId}
                          >
                            <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
                            <Text style={[styles.reportBtnText, { color: colors.primary }]}>
                              {aiLoadingId === item.questionId
                                ? 'Generating…'
                                : aiRemaining != null
                                  ? `AI explain (${aiRemaining} left today)`
                                  : 'AI explain'}
                            </Text>
                          </Pressable>
                        ) : null}
                        <ReportContentButton
                          contentType="question"
                          contentId={item.questionId}
                          label="Flag question"
                          style={{ alignSelf: 'flex-start' }}
                          onReported={() => setReportFeedback('Thank you! We will review this content issue.')}
                        />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })
            )}
          </View>
        ) : null}

        <View style={styles.actions}>
          {!isPremium(examTypeId) && mode !== 'mock' && mode !== 'diagnostic' && mode !== 'board' ? (
            <AdBanner onPress={() => router.push('/subscribe')} />
          ) : null}
          <PrimaryButton
            label={sharing ? 'Preparing…' : 'Share score'}
            variant="outline"
            icon="share-outline"
            size="lg"
            onPress={shareScore}
            style={{ marginBottom: spacing.sm }}
          />
          {wrongCount > 0 && user ? (
            <PrimaryButton
              label="Review mistakes"
              size="lg"
              onPress={() => router.push('/mistakes')}
              style={{ marginBottom: spacing.sm }}
            />
          ) : null}
          <PrimaryButton
            label={mode === 'mock' || mode === 'diagnostic' || mode === 'board' ? 'Done' : 'Back to Home'}
            variant={wrongCount > 0 && user ? 'outline' : undefined}
            size="lg"
            onPress={() => router.replace('/(tabs)')}
          />
          {mode === 'diagnostic' ? (
            <PrimaryButton
              label="View your PasaPath →"
              variant="outline"
              size="lg"
              onPress={() => router.replace('/pasapath/week')}
              style={{ marginTop: spacing.sm }}
            />
          ) : (
            <PrimaryButton
              label={mode === 'mock' || mode === 'board' ? 'New mock →' : mode === 'weak_area' ? 'Another Quick 10 →' : 'Next quiz →'}
              variant="outline"
              size="lg"
              onPress={() => {
                if (mode === 'mock' || mode === 'board') {
                  router.replace('/(tabs)/study');
                } else if (mode === 'weak_area') {
                  router.replace({ pathname: '/practice/quiz', params: { examSlug, mode: 'weak_area' } });
                } else {
                  router.replace({ pathname: '/practice/quiz', params: { examSlug } });
                }
              }}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>
      </ScrollView>

      {canUseViewShot() ? (
        <View style={{ position: 'absolute', left: -9999, top: 0 }}>
          <ShareScoreCapture onReady={handleCaptureReady}>
            <ShareScoreCard
              theme={theme}
              displayName={displayName}
              examName={examName}
              score={scoreNum}
              correct={correctNum}
              total={totalNum}
              modeLabel={modeLabel}
            />
          </ShareScoreCapture>
        </View>
      ) : null}

      <AdInterstitialModal
        visible={showInterstitial}
        onClose={() => setShowInterstitial(false)}
        onUpgrade={() => {
          setShowInterstitial(false);
          router.push('/subscribe');
        }}
      />
    </View>
  );
}
