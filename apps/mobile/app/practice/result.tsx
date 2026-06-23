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
import { PREMIUM_LOCK_CTA } from '../../lib/subscription/paywall-copy';
import { recomputeReadiness } from '../../lib/api/readiness';
import { fetchUsageLimits } from '../../lib/api/iap';
import { canUseTts, speakText, stopSpeaking } from '../../lib/tts/speak';
import { AdBanner } from '../../components/ad-banner';
import { AdInterstitialModal } from '../../components/ad-interstitial-modal';
import { tryShowSessionInterstitial } from '../../lib/ads/interstitial';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { useUserProfile } from '../../hooks/use-user-profile';
import { GUEST_PROGRESS_NUDGE } from '../../lib/product-copy';

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
  const { prefs } = usePreferences();
  const { displayName } = useUserProfile('Guest');
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
  const { score, total, correct, duration, sessionId, mode, diagnosticReadiness, pasapathTaskId, examSlug: paramExamSlug, barkadaChallengeId, flaggedQuestionIds } = useLocalSearchParams<{
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
    flaggedQuestionIds?: string;
  }>();
  const flaggedIds = useMemo(
    () => new Set((flaggedQuestionIds ?? '').split(',').filter(Boolean)),
    [flaggedQuestionIds]
  );
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'flagged'>('all');

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

  // Per-subject score breakdown (most useful on multi-subject mock/board exams).
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { correct: number; total: number; slug: string | null }>();
    for (const item of review) {
      const name = item.subjectName ?? 'Other';
      const entry = map.get(name) ?? { correct: 0, total: 0, slug: item.subjectSlug ?? null };
      entry.total += 1;
      if (item.isCorrect) entry.correct += 1;
      if (!entry.slug && item.subjectSlug) entry.slug = item.subjectSlug;
      map.set(name, entry);
    }
    return Array.from(map.entries()).map(([name, v]) => ({
      name,
      slug: v.slug,
      correct: v.correct,
      total: v.total,
      pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }));
  }, [review]);

  // Weakest practiceable subject (lowest %, must have a slug to route, not 100%).
  const weakestSubject = useMemo(() => {
    const candidates = subjectBreakdown.filter((s) => s.slug && s.pct < 100);
    if (!candidates.length) return null;
    return candidates.reduce((min, s) => (s.pct < min.pct ? s : min));
  }, [subjectBreakdown]);

  // Review list, filterable by All / Incorrect / Flagged. Question numbers stay
  // tied to session order regardless of the active filter.
  const filteredReview = useMemo(() => {
    return review
      .map((item, idx) => ({ item, number: idx + 1 }))
      .filter(({ item }) =>
        reviewFilter === 'incorrect'
          ? item.isCorrect === false
          : reviewFilter === 'flagged'
            ? flaggedIds.has(item.questionId)
            : true
      );
  }, [review, reviewFilter, flaggedIds]);

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
          Alert.alert('Abot na ang daily limit', 'Free tier: 5 AI explanations kada araw.', [
            { text: 'Not now', style: 'cancel' },
            { text: PREMIUM_LOCK_CTA, onPress: () => router.push('/subscribe') },
          ]);
        } else {
          Alert.alert('Hindi available', 'Pakisubukan ulit mamaya.');
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
                : mode === 'bookmark_review'
                  ? 'Bookmarks review'
                  : 'Practice quiz';

  const toggleSpeak = async (questionId: string, text: string, locale: 'en' | 'fil' = 'en') => {
    if (speakingId === questionId) {
      await stopSpeaking();
      setSpeakingId(null);
      return;
    }
    if (speakingId) {
      await stopSpeaking();
    }
    setSpeakingId(questionId);
    try {
      const started = await speakText(text, locale, {
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
      if (!started) setSpeakingId(null);
    } catch {
      setSpeakingId(null);
    }
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
              ? 'Tapos na ang diagnostic!'
              : mode === 'mock'
                ? 'Tapos na ang mock exam!'
                : mode === 'board'
                  ? 'Tapos na ang board exam!'
                  : mode === 'timed'
                    ? 'Tapos na ang timed practice!'
                    : mode === 'weak_area'
                      ? 'Tapos na ang Quick 10!'
                      : mode === 'barkada'
                        ? 'Tapos na ang Barkada challenge!'
                        : mode === 'bookmark_review'
                          ? 'Tapos na ang Bookmarks review!'
                          : 'Tapos na ang quiz!'}
          </Text>
          <Text style={styles.heroTitle}>
            {mode === 'diagnostic'
              ? `Baseline readiness: ${diagnosticReadiness ?? scoreNum}%`
              : mode === 'mock' || mode === 'board'
                ? scoreNum >= MOCK_PASS_THRESHOLD
                  ? `${mode === 'board' ? 'Board exam' : 'Mock'} PASS — ${scoreNum}% 🎉`
                  : `Score: ${scoreNum}% — target ay ${MOCK_PASS_THRESHOLD}%+`
                : scoreNum >= 70
                  ? `Galing, ${displayName}! 🎉`
                  : 'Kaya mo pa! 💪'}
          </Text>
          <ScoreRing percent={scoreNum} correct={correctNum} total={totalNum} />
        </LinearGradient>

        <View style={styles.statsRow}>
          {[
            { v: `${correctNum}/${totalNum}`, l: 'Tama', c: colors.primary },
            { v: formatDuration(duration ?? '0'), l: 'Oras', c: colors.accentDark },
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

        {subjectBreakdown.length >= 2 ? (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewTitle}>Score kada subject</Text>
            <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
              {subjectBreakdown.map((s) => {
                const barColor = s.pct >= 75 ? colors.success : s.pct >= 50 ? colors.flame : colors.error;
                return (
                  <View key={s.name}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.text, flex: 1 }} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: barColor }}>
                        {s.correct}/{s.total} · {s.pct}%
                      </Text>
                    </View>
                    <View style={{ height: 6, borderRadius: 999, backgroundColor: colors.border, overflow: 'hidden' }}>
                      <View style={{ width: `${s.pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 999 }} />
                    </View>
                  </View>
                );
              })}
            </View>
            {weakestSubject ? (
              <PrimaryButton
                label={`I-practice ang pinakamahina: ${weakestSubject.name} →`}
                variant="outline"
                size="lg"
                style={{ marginTop: spacing.md }}
                onPress={() =>
                  router.push({
                    pathname: '/study/[subjectSlug]',
                    params: { subjectSlug: weakestSubject.slug!, examSlug, subjectName: weakestSubject.name },
                  })
                }
              />
            ) : null}
          </View>
        ) : null}

        {sessionId ? (
          <View style={styles.reviewBox}>
            <Text style={styles.reviewTitle}>I-review ang mga sagot</Text>
            {!reviewLoading && review.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm, flexWrap: 'wrap' }}>
                {([
                  { id: 'all' as const, label: `Lahat (${review.length})` },
                  { id: 'incorrect' as const, label: `Mali (${wrongCount})` },
                  ...(flaggedIds.size > 0
                    ? [{ id: 'flagged' as const, label: `Flagged (${flaggedIds.size})` }]
                    : []),
                ]).map((chip) => {
                  const active = reviewFilter === chip.id;
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => setReviewFilter(chip.id)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: 6,
                        borderRadius: radii.full,
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: active ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: active ? '#fff' : colors.textMuted }}>
                        {chip.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
            {reviewLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : review.length === 0 ? (
              <Text style={styles.reviewEmpty}>Walang naka-save na sagot para sa session na ito.</Text>
            ) : filteredReview.length === 0 ? (
              <Text style={styles.reviewEmpty}>
                {reviewFilter === 'incorrect' ? 'Walang maling sagot — galing!' : 'Walang naka-flag na tanong.'}
              </Text>
            ) : (
              filteredReview.map(({ item, number: idx }) => {
                // Respect the user's explanation-language preference (matches
                // the quiz screen); fall back to whichever translation exists.
                const explanation =
                  aiExtras[item.questionId] ??
                  (prefs.explanationLocale === 'fil'
                    ? item.explanationFil ?? item.explanationEn
                    : item.explanationEn ?? item.explanationFil);
                const explanationLocale =
                  prefs.explanationLocale === 'fil' && explanation === item.explanationFil ? 'fil' : 'en';
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
                        Q{idx}. {item.stem}
                      </Text>
                      {flaggedIds.has(item.questionId) ? (
                        <Ionicons name="flag" size={14} color={colors.accentDark} style={{ marginLeft: 4 }} />
                      ) : null}
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
                                onPress={() => void toggleSpeak(item.questionId, explanation, explanationLocale)}
                              >
                                <Ionicons
                                  name={speakingId === item.questionId ? 'stop-circle-outline' : 'volume-high-outline'}
                                  size={16}
                                  color={colors.primary}
                                />
                                <Text style={[styles.reportBtnText, { color: colors.primary }]}>
                                  {speakingId === item.questionId ? 'Itigil · TTS' : 'Pakinggan · TTS'}
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
                                ? 'Ginagawa…'
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
                          onReported={() => setReportFeedback('Salamat! Ire-review namin ang isyung ito.')}
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
          {!user ? (
            <View
              style={{
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                marginBottom: spacing.md,
                gap: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.primaryMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>
                    {GUEST_PROGRESS_NUDGE.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyMedium,
                      fontSize: 13,
                      color: colors.textMuted,
                      lineHeight: 18,
                      marginTop: 3,
                    }}
                  >
                    {GUEST_PROGRESS_NUDGE.subtitle}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => router.push('/(auth)/signup')}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: radii.md,
                    backgroundColor: colors.primary,
                    paddingVertical: spacing.sm,
                    alignItems: 'center',
                    opacity: pressed ? 0.9 : 1,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={GUEST_PROGRESS_NUDGE.ctaSignup}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' }}>
                    {GUEST_PROGRESS_NUDGE.ctaSignup}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.replace('/(tabs)')}
                  style={({ pressed }) => ({
                    flex: 1,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: spacing.sm,
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1,
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={GUEST_PROGRESS_NUDGE.ctaContinue}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted }}>
                    {GUEST_PROGRESS_NUDGE.ctaContinue}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <PrimaryButton
            label={sharing ? 'Hinahanda…' : 'I-share ang score'}
            variant="outline"
            icon="share-outline"
            size="lg"
            onPress={shareScore}
            style={{ marginBottom: spacing.sm }}
          />
          {wrongCount > 0 && user ? (
            <PrimaryButton
              label="I-review ang mga mali"
              size="lg"
              onPress={() => router.push('/mistakes')}
              style={{ marginBottom: spacing.sm }}
            />
          ) : null}
          <PrimaryButton
            label={mode === 'mock' || mode === 'diagnostic' || mode === 'board' ? 'Tapos' : 'Balik sa Home'}
            variant={wrongCount > 0 && user ? 'outline' : undefined}
            size="lg"
            onPress={() => router.replace('/(tabs)')}
          />
          {mode === 'diagnostic' ? (
            <PrimaryButton
              label="Tingnan ang PasaPath mo →"
              variant="outline"
              size="lg"
              onPress={() => router.replace('/pasapath/week')}
              style={{ marginTop: spacing.sm }}
            />
          ) : (
            <PrimaryButton
              label={mode === 'mock' || mode === 'board' ? 'Bagong mock →' : mode === 'weak_area' ? 'Isa pang Quick 10 →' : 'Susunod na quiz →'}
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
