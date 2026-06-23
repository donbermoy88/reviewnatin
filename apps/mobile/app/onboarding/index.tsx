import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, ZoomIn, FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/card';
import { GoalRing } from '../../components/goal-ring';
import { FeatureRow } from '../../components/feature-row';
import { SparkleStar } from '../../components/sparkle-star';
import { LogoMark } from '../../components/logo-mark';
import { OnboardingHeader } from '../../components/onboarding-header';
import { OnboardingStepHero } from '../../components/onboarding-step-hero';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { ScreenScroll } from '../../components/screen-scroll';
import { SegmentedControl } from '../../components/ui';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { trackEvent } from '../../lib/analytics/events';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { DISCLAIMERS, DEFAULT_EXAM_SLUG, EXAM_CATALOG, LET_SECONDARY_MAJORS, ONBOARDING_LEVELS } from '@reviewnatin/shared';
import { syncExamGoalSafe } from '../../lib/api/goals';
import { fetchExamSchedules } from '../../lib/api/exam-calendar';
import { fetchExamCatalog } from '../../lib/api/exam-catalog';
import { saveOnboarding, saveOnboardingDraft, hasOnboardingDraft, getOnboarding } from '../../lib/onboarding-store';
import { getPostOnboardingHref } from '../../lib/onboarding-nav';
import { markOnboardingActivationPending } from '../../lib/onboarding-activation';
import { previewReadinessPercent } from '../../lib/onboarding-first-practice';
import { useAuth } from '../../providers/auth-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { useOnboardingGate } from '../../providers/onboarding-gate';

const GOALS = [
  { id: '15' as const, label: 'Casual', sub: '5 mins / day', q: '5 questions', emoji: '🌱', minutes: 15 },
  { id: '30' as const, label: 'Regular', sub: '10 mins / day', q: '15 questions', emoji: '⚡', minutes: 30 },
  { id: '45' as const, label: 'Serious', sub: '20 mins / day', q: '30 questions', emoji: '🔥', minutes: 45 },
  { id: '60' as const, label: 'Intense', sub: '40 mins / day', q: '60 questions', emoji: '🚀', minutes: 60 },
];

const READY_ITEMS = [
  {
    icon: 'school-outline' as const,
    label: 'Handa na ang practice quiz',
    sub: 'Base sa level na pinili mo',
  },
  {
    icon: 'calendar-outline' as const,
    label: 'Naka-schedule na ang daily tasks',
    sub: 'Base sa target exam date mo',
  },
  {
    icon: 'bookmark-outline' as const,
    label: 'Active na ang Mistake Bank',
    sub: 'Awtomatikong tina-track ang mga maling sagot',
  },
];

const ONBOARDING_TOTAL = 6;

const WELCOME_EXAM_CHIPS = [
  { abbr: 'CSE', bg: '#E8F0FF', color: '#0B5FFF' },
  { abbr: 'LET', bg: '#F1E8FA', color: '#7B2CBF' },
  { abbr: 'PNLE', bg: '#E8FAF0', color: '#059669' },
];

const ACCOUNT_BENEFITS = [
  {
    icon: 'cloud-upload-outline' as const,
    title: 'Cloud sync',
    description: 'Quiz scores, streaks, at goals — naka-save sa account mo.',
  },
  {
    icon: 'bookmark-outline' as const,
    title: 'Mistake Bank',
    description: 'I-review ang mga maling sagot anytime, kahit saang device.',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Switch devices freely',
    description: 'Magpalit ng phone — ligtas ang progress mo, walang mawawala.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { step: stepParam, switch: switchParam } = useLocalSearchParams<{ step?: string; switch?: string }>();
  const isSwitchMode = switchParam === '1';
  const { user } = useAuth();
  const { setNotificationsEnabled } = usePreferences();
  const { refresh: refreshOnboarding } = useOnboardingGate();
  const [step, setStep] = useState(0);
  const [exams, setExams] = useState(EXAM_CATALOG);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [majorSlug, setMajorSlug] = useState<string | undefined>();
  const [goalId, setGoalId] = useState<'15' | '30' | '45' | '60'>('30');
  const [level, setLevel] = useState<'beginner' | 'average' | 'advanced'>('beginner');
  const [stepError, setStepError] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState(new Date('2026-08-01'));
  // True until the user explicitly picks a date or a saved draft/goal is restored —
  // while true, the placeholder above gets replaced with the real next exam date
  // for the selected exam (see the fetchExamSchedules effect below), so it matches
  // the Exam Calendar screen instead of drifting from it.
  const targetDateAuto = useRef(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createOnboardingStyles(theme), [theme]);
  const { height: windowHeight } = useWindowDimensions();
  const compactWelcome = windowHeight < 760;

  useEffect(() => {
    fetchExamCatalog().then((rows) => {
      if (rows.length) {
        setExams(rows);
        setExamSlug((current) => (rows.some((row) => row.slug === current) ? current : rows[0].slug));
      }
    });
  }, []);

  useEffect(() => {
    if (stepParam !== '5') return;
    getOnboarding().then((data) => {
      if (!hasOnboardingDraft(data)) {
        setStep(1);
        return;
      }
      setExamSlug(data!.examSlug);
      setMajorSlug(data!.majorSlug);
      setTargetDate(new Date(data!.targetDate));
      targetDateAuto.current = false;
      const matchedGoal = GOALS.find((g) => g.minutes === data!.dailyMinutes);
      if (matchedGoal) setGoalId(matchedGoal.id);
      setLevel(data!.level);
      setStep(5);
    });
  }, [stepParam]);

  useEffect(() => {
    if (!isSwitchMode) return;
    getOnboarding().then((data) => {
      if (data) {
        setExamSlug(data.examSlug);
        setMajorSlug(data.majorSlug);
        setTargetDate(new Date(data.targetDate));
        targetDateAuto.current = false;
        const matchedGoal = GOALS.find((g) => g.minutes === data.dailyMinutes);
        if (matchedGoal) setGoalId(matchedGoal.id);
        setLevel(data.level);
      }
      setStep(1);
    });
  }, [isSwitchMode]);

  // Suggest the real next exam date for the selected exam (same source as the
  // Exam Calendar screen) instead of leaving the hardcoded placeholder above —
  // but only while the user hasn't picked a date and no saved draft/goal applies.
  useEffect(() => {
    if (!targetDateAuto.current) return;
    fetchExamSchedules(examSlug)
      .then((events) => {
        if (!targetDateAuto.current) return;
        const next = events.find((e) => e.eventType === 'examination' && e.daysUntil >= 0) ?? events[0];
        if (next) setTargetDate(new Date(next.eventDate + 'T12:00:00'));
      })
      .catch(() => {});
  }, [examSlug]);

  // Android hardware back: step backwards through onboarding instead of
  // exiting the app. At step 0 (intro) we let the default fire so back leaves
  // the app as expected. No-op on iOS (BackHandler only emits on Android).
  useEffect(() => {
    const onHardwareBack = () => {
      if (step > 0) {
        setStep((current) => Math.max(0, current - 1));
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [step]);

  const dailyMinutes = GOALS.find((g) => g.id === goalId)?.minutes ?? 30;
  const dateStr = targetDate.toISOString().slice(0, 10);
  const civilServiceExams = useMemo(() => exams.filter((ex) => ex.category === 'Civil Service'), [exams]);
  const prcExams = useMemo(() => exams.filter((ex) => ex.category === 'PRC'), [exams]);
  const selectedLevel = ONBOARDING_LEVELS.find((lv) => lv.id === level);
  const selectedExam = exams.find((ex) => ex.slug === examSlug);
  const selectedGoal = GOALS.find((g) => g.id === goalId);
  const daysUntilExam = Math.max(
    0,
    Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const advanceStep = async () => {
    setStepError(null);

    if (step === 1) {
      if (examSlug === 'let-secondary' && !majorSlug) {
        setStepError('Pumili ng major field para sa LET Secondary.');
        return;
      }
      await saveOnboardingDraft({
        examSlug,
        majorSlug: examSlug === 'let-secondary' ? majorSlug : undefined,
      });
    } else if (step === 2) {
      await saveOnboardingDraft({ level });
    } else if (step === 3) {
      await saveOnboardingDraft({
        examSlug,
        targetDate: dateStr,
        dailyMinutes,
        level,
        majorSlug: examSlug === 'let-secondary' ? majorSlug : undefined,
      });
      if (isSwitchMode && user) {
        await finish();
        return;
      }
    }
    setStep(step + 1);
  };

  const finish = async (options?: { startPractice?: boolean }) => {
    const data = {
      examSlug,
      targetDate: dateStr,
      dailyMinutes,
      level,
      majorSlug: examSlug === 'let-secondary' ? majorSlug : undefined,
      completed: true as const,
    };
    await saveOnboarding(data);
    if (user) {
      const result = await syncExamGoalSafe(user.id, data);
      if (!result.ok) {
        const syncError = toUserFacingError(result.message, 'load');
        Alert.alert('Hindi na-sync ang goal', syncError);
      }
      try {
        await setNotificationsEnabled(reminderOn);
      } catch {
        /* local prefs still saved via onboarding draft */
      }
    }
    await refreshOnboarding();
    trackEvent('onboarding_completed', {
      examSlug,
      level,
      dailyMinutes,
      majorSlug: majorSlug ?? null,
      isGuest: !user,
      startPractice: Boolean(options?.startPractice),
    });
    await markOnboardingActivationPending();
    const href = await getPostOnboardingHref(user?.id, { startPractice: options?.startPractice });
    router.replace(href as '/(tabs)');
  };

  const renderExamCard = (opts: {
    key: string;
    abbr: string;
    abbrBg: string;
    abbrColor: string;
    name: string;
    tag?: string;
    sub?: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      key={opts.key}
      style={({ pressed }) => [styles.examCard, opts.selected && styles.examCardOn, pressed && { opacity: 0.85 }]}
      android_ripple={{ color: colors.primaryMuted, borderless: false }}
      onPress={opts.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${opts.name} exam${opts.selected ? ', selected' : ''}`}
      accessibilityState={{ selected: opts.selected }}
    >
      <View style={[styles.examIcon, { backgroundColor: opts.abbrBg }]}>
        <Text style={[styles.examAbbr, { color: opts.abbrColor }]}>{opts.abbr}</Text>
      </View>
      <View style={styles.examText}>
        <View style={styles.examTitleRow}>
          <Text style={styles.examName}>{opts.name}</Text>
          {opts.tag ? (
            <Pill
              color={opts.tag === 'New' ? colors.accentDark : colors.primary}
              bg={opts.tag === 'New' ? colors.accentLight : colors.primaryMuted}
            >
              {opts.tag.toUpperCase()}
            </Pill>
          ) : null}
        </View>
        {opts.sub ? <Text style={styles.examSub}>{opts.sub}</Text> : null}
      </View>
      <View style={[styles.radio, opts.selected && styles.radioOn]}>
        {opts.selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
    </Pressable>
  );

  if (step === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={[
            styles.welcomeBlob,
            compactWelcome && styles.welcomeBlobCompact,
            { paddingTop: insets.top + (compactWelcome ? spacing.md : spacing.xl) },
          ]}
        >
          <View style={styles.welcomeGlow} />
          <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.sparkleWelcomeTop}>
            <SparkleStar size={20} opacity={0.8} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(450).duration(500)} style={styles.sparkleWelcomeMid}>
            <SparkleStar size={14} opacity={0.5} />
          </Animated.View>
          <Animated.View
            entering={ZoomIn.delay(120).springify().damping(12)}
            style={[styles.markWrap, compactWelcome && styles.markWrapCompact]}
          >
            <LogoMark size={compactWelcome ? 92 : 108} />
          </Animated.View>
          <View style={styles.welcomeIllustrationRow}>
            {WELCOME_EXAM_CHIPS.map((chip, index) => (
              <Animated.View
                key={chip.abbr}
                entering={FadeInDown.delay(200 + index * 90).springify().damping(14)}
                style={[styles.welcomeChip, { backgroundColor: chip.bg }]}
              >
                <Text style={[styles.welcomeChipText, { color: chip.color }]}>{chip.abbr}</Text>
              </Animated.View>
            ))}
          </View>
          <Animated.Text entering={FadeInUp.delay(280).springify().damping(16)} style={styles.welcomeBrand}>
            Review<Text style={{ color: colors.accent }}>Natin</Text>
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(360).springify().damping(16)} style={styles.welcomeTag}>
            Mag-review tayo. Pasa tayo.
          </Animated.Text>
        </LinearGradient>

        <Animated.View
          entering={FadeInUp.delay(440).springify().damping(16)}
          style={[styles.welcomeBody, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <Text style={styles.welcomeTitle}>
            Handa ka na bang pumasa sa{'\n'}CSE, LET, o PNLE?
          </Text>
          <Text style={styles.welcomeSub}>
            Your study buddy for every Filipino board exam — one app, one streak, one goal.
          </Text>
          <PrimaryButton
            label="Get started — it's free"
            size="lg"
            onPress={() => setStep(1)}
            style={{ marginTop: spacing.lg }}
          />
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginBold}>Log in</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  if (step === 5) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.25, y: 1 }}
          style={[styles.readyGradient, { paddingTop: insets.top + spacing.sm }]}
        >
          <View style={styles.readyGlow} />
          <View style={styles.pagePad}>
            <OnboardingHeader step={step} total={ONBOARDING_TOTAL} onBack={() => setStep(4)} variant="dark" />
          </View>
        </LinearGradient>

        <ScreenScroll contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <View style={styles.readyBody}>
            <View style={styles.readyHero}>
              <View style={styles.readyMarkWrap}>
                <LogoMark size={88} />
              </View>
              <Pill color={colors.accentDark} bg={colors.accentLight}>
                PASAPATH READY
              </Pill>
              <Text style={styles.readyTitle}>
                Handa ka na bang pumasa sa{'\n'}
                {selectedExam?.name ?? 'exam mo'}?
              </Text>
              <Text style={styles.readySub}>
                Your daily study path starts now — weak topics, mistake review, and new lessons every day.
              </Text>
            </View>

            <Card variant="elevated" padding={spacing.md} style={styles.dashboardPreview}>
              <Text style={styles.dashboardPreviewLbl}>Dashboard preview</Text>
              <View style={styles.dashboardPreviewRow}>
                <GoalRing
                  percent={previewReadinessPercent(level)}
                  size={72}
                  strokeWidth={8}
                  trackColor={colors.primaryMuted}
                  fillColor={colors.primary}
                />
                <View style={styles.dashboardPreviewCopy}>
                  <Text style={styles.dashboardPreviewExam} numberOfLines={2}>
                    {selectedExam?.name ?? examSlug}
                  </Text>
                  <Text style={styles.dashboardPreviewMeta}>
                    {selectedLevel?.emoji} {selectedLevel?.label} · {selectedGoal?.sub ?? `${dailyMinutes} min/day`}
                  </Text>
                  <Text style={styles.dashboardPreviewMeta}>
                    Exam in {daysUntilExam} days · {dateStr}
                  </Text>
                </View>
              </View>
              <View style={styles.dashboardPreviewPills}>
                <View style={styles.dashboardPreviewPill}>
                  <Ionicons name="flash-outline" size={14} color={colors.primary} />
                  <Text style={styles.dashboardPreviewPillText}>Daily PasaPath</Text>
                </View>
                <View style={styles.dashboardPreviewPill}>
                  <Ionicons name="bookmark-outline" size={14} color={colors.primary} />
                  <Text style={styles.dashboardPreviewPillText}>Mistake Bank</Text>
                </View>
              </View>
            </Card>

            <Card variant="elevated" padding={spacing.md} style={styles.readyCard}>
              {READY_ITEMS.map((item, index) => (
                <View
                  key={item.label}
                  style={[styles.readyItem, index < READY_ITEMS.length - 1 && styles.readyItemBorder]}
                >
                  <View style={styles.readyIconWrap}>
                    <Ionicons name={item.icon} size={20} color={colors.success} />
                  </View>
                  <View style={styles.readyItemText}>
                    <Text style={styles.readyItemLabel}>{item.label}</Text>
                    <Text style={styles.readyItemSub}>{item.sub}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                </View>
              ))}
            </Card>

            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.accentDark} />
              <Text style={styles.disclaimer}>{DISCLAIMERS.short}</Text>
            </View>
          </View>
        </ScreenScroll>

        <LinearGradient
          colors={[colors.footerFade, colors.background]}
          style={[styles.stickyFooterFade, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.stickyFooterInner}>
            <PrimaryButton
              label={isSwitchMode ? 'Save new track' : 'Pumunta sa Dashboard'}
              size="lg"
              icon="arrow-forward"
              onPress={() => void finish()}
            />
            {!isSwitchMode ? (
              <PrimaryButton
                label="Simulan ang unang practice"
                variant="outline"
                icon="play-outline"
                iconPosition="left"
                onPress={() => void finish({ startPractice: true })}
                style={{ marginTop: spacing.sm }}
                accessibilityLabel="Start first practice quiz based on your level"
              />
            ) : null}
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.stepHeader, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.pagePad}>
          <OnboardingHeader step={step} total={ONBOARDING_TOTAL} onBack={() => setStep(step - 1)} />
          {step === 1 && (
            <>
              <Text style={styles.pageTitle}>
                {isSwitchMode ? 'Switch exam track' : 'Anong exam ang nire-review mo?'}
              </Text>
              <Text style={styles.pageSub}>
                {selectedExam && !isSwitchMode
                  ? `Handa ka na bang pumasa sa ${selectedExam.name}?`
                  : isSwitchMode
                    ? 'Choose your new exam — we\'ll sync your goal and PasaPath.'
                    : 'Pumili muna — pwede mong baguhin mamaya.'}
              </Text>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.pageTitle}>Ano ang level mo ngayon?</Text>
              <Text style={styles.pageSub}>
                We&apos;ll tune quiz difficulty and PasaPath pacing to match your starting point.
              </Text>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.pageTitle}>Itakda ang daily goal mo</Text>
              <Text style={styles.pageSub}>{'Even a little each day adds up. Let\'s build that streak!'}</Text>
            </>
          )}
          {step === 4 && (
            <>
              <Text style={styles.pageTitle}>I-save ang progress mo</Text>
              <Text style={styles.pageSub}>I-sync ang quiz scores, Mistake Bank, at PasaPath sa cloud.</Text>
            </>
          )}
        </View>
      </View>

      <ScreenScroll contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.pagePad}>
          {step >= 1 && step <= 4 ? <OnboardingStepHero step={step as 1 | 2 | 3 | 4} /> : null}
          {step === 1 && (
            <View style={styles.list}>
              <Text style={styles.fieldLabel}>Civil Service Exams</Text>
              <View style={styles.list}>
                {civilServiceExams.map((ex) =>
                  renderExamCard({
                    key: ex.slug,
                    abbr: ex.abbr,
                    abbrBg: ex.bg,
                    abbrColor: ex.color,
                    name: ex.name,
                    tag: ex.tag,
                    sub: ex.sub,
                    selected: examSlug === ex.slug,
                    onPress: () => {
                      setExamSlug(ex.slug);
                      setMajorSlug(undefined);
                    },
                  }),
                )}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>PRC Licensure Exams</Text>
              <View style={styles.list}>
                {prcExams.map((ex) =>
                  renderExamCard({
                    key: ex.slug,
                    abbr: ex.abbr,
                    abbrBg: ex.bg,
                    abbrColor: ex.color,
                    name: ex.name,
                    tag: ex.tag,
                    sub: ex.sub,
                    selected: examSlug === ex.slug,
                    onPress: () => {
                      setExamSlug(ex.slug);
                      if (ex.slug !== 'let-secondary') setMajorSlug(undefined);
                    },
                  }),
                )}
              </View>

              {examSlug === 'let-secondary' ? (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Major field</Text>
                  <View style={styles.list}>
                    {LET_SECONDARY_MAJORS.map((major) =>
                      renderExamCard({
                        key: major.slug,
                        abbr: 'M',
                        abbrBg: '#F1E8FA',
                        abbrColor: '#7B2CBF',
                        name: major.name,
                        selected: majorSlug === major.slug,
                        onPress: () => setMajorSlug(major.slug),
                      }),
                    )}
                  </View>
                </>
              ) : null}
              {stepError && step === 1 ? <Text style={styles.stepError}>{stepError}</Text> : null}
            </View>
          )}

          {step === 2 && (
            <>
              <SegmentedControl
                options={ONBOARDING_LEVELS.map((lv) => ({ value: lv.id, label: lv.label }))}
                value={level}
                onChange={setLevel}
                accessibilityLabel="Choose your current level"
              />
              {selectedLevel ? (
                <Card variant="default" style={{ marginTop: spacing.md }}>
                  <View style={styles.proficiencyCard}>
                    <Text style={styles.proficiencyEmoji}>{selectedLevel.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.proficiencyTitle}>{selectedLevel.label}</Text>
                      <Text style={styles.proficiencySub}>{selectedLevel.sub}</Text>
                    </View>
                  </View>
                </Card>
              ) : null}
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.fieldLabel}>Daily study goal</Text>
              <View style={styles.goalGrid}>
                {GOALS.map((g) => {
                  const on = goalId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      style={({ pressed }) => [styles.goalTile, on && styles.goalTileOn, pressed && { opacity: 0.85 }]}
                      android_ripple={{ color: colors.primaryMuted, borderless: false }}
                      onPress={() => setGoalId(g.id)}
                    >
                      <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                      <Text style={[styles.goalTileLabel, on && styles.goalLabelOn]}>{g.label}</Text>
                      <Text style={[styles.goalTileSub, on && styles.goalSubOn]}>
                        {g.sub} · {g.q}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.reminderCard}>
                <View style={styles.reminderIcon}>
                  <Ionicons name="notifications-outline" size={20} color={colors.accentDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderTitle}>Daily reminder</Text>
                  <Text style={styles.reminderSub}>
                    {reminderOn ? 'Every day at 7:00 PM' : 'Off by default — turn on if helpful'}
                  </Text>
                </View>
                <Pressable
                  style={[styles.reminderToggle, reminderOn && styles.reminderToggleOn]}
                  onPress={() => setReminderOn((v) => !v)}
                >
                  <View style={[styles.reminderKnob, reminderOn && styles.reminderKnobOn]} />
                </Pressable>
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Target exam date</Text>
              <PrimaryButton
                label={dateStr}
                variant="outline"
                icon="calendar-outline"
                iconPosition="left"
                onPress={() => setShowDatePicker(true)}
              />
              {showDatePicker && (
                <DateTimePicker
                  value={targetDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) {
                      targetDateAuto.current = false;
                      setTargetDate(date);
                    }
                  }}
                />
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Card variant="default" style={{ marginTop: spacing.sm }}>
                {ACCOUNT_BENEFITS.map((item, index) => (
                  <FeatureRow
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                    isLast={index === ACCOUNT_BENEFITS.length - 1}
                  />
                ))}
              </Card>
              {user ? (
                <>
                  <View style={[styles.signedInCard, { marginTop: spacing.lg }]}>
                    <View style={styles.signedInIcon}>
                      <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.signedInTitle}>Naka-sign in ka na</Text>
                      <Text style={styles.signedInEmail}>{user.email}</Text>
                    </View>
                  </View>
                  <PrimaryButton
                    label="Next →"
                    icon="arrow-forward"
                    iconPosition="right"
                    onPress={() => setStep(5)}
                    style={{ marginTop: spacing.md }}
                  />
                </>
              ) : (
                <>
                  <PrimaryButton
                    label="Mag-sign up / Mag-log in"
                    icon="log-in-outline"
                    iconPosition="left"
                    onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: 'onboarding' } })}
                    style={{ marginTop: spacing.lg }}
                  />
                  <PrimaryButton label="Skip muna (guest)" variant="outline" onPress={() => setStep(5)} style={{ marginTop: spacing.sm }} />
                </>
              )}
            </>
          )}
        </View>
      </ScreenScroll>

      {step >= 1 && step < 4 && (
        <LinearGradient
          colors={[colors.footerFade, colors.background]}
          style={[styles.stickyFooterFade, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.stickyFooterInner}>
            <PrimaryButton
              label={
                step === 3
                  ? isSwitchMode
                    ? 'I-save ang bagong track →'
                    : "I'm committed →"
                  : 'Continue →'
              }
              size="lg"
              onPress={advanceStep}
            />
          </View>
        </LinearGradient>
      )}
    </View>
  );
}

function createOnboardingStyles(theme: AppTheme) {
  const { colors, fonts, radii, shadows, spacing, type } = theme;
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  welcomeBlob: {
    height: 430,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    alignItems: 'center',
    overflow: 'hidden',
  },
  welcomeBlobCompact: {
    height: 360,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
  },
  welcomeGlow: {
    position: 'absolute',
    top: -60,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sparkleWelcomeTop: { position: 'absolute', top: 60, right: 40, zIndex: 2 },
  sparkleWelcomeMid: { position: 'absolute', top: 130, left: 50, zIndex: 2 },
  markWrap: { marginTop: spacing.md, ...shadows.soft },
  markWrapCompact: { marginTop: spacing.xs },
  welcomeIllustrationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  welcomeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    ...shadows.soft,
  },
  welcomeChipText: {
    fontFamily: type.label.fontFamily,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  welcomeBrand: {
    fontFamily: type.brand.fontFamily,
    fontSize: 32,
    color: '#fff',
    marginTop: spacing.md,
    letterSpacing: -0.5,
  },
  welcomeTag: {
    fontFamily: type.bodyMedium.fontFamily,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  welcomeBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    justifyContent: 'flex-start',
  },
  welcomeTitle: {
    ...type.headline,
    fontSize: 26,
    textAlign: 'center',
    lineHeight: 30,
  },
  welcomeSub: {
    ...type.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  loginLink: { marginTop: spacing.md, alignItems: 'center', padding: spacing.sm },
  loginText: { ...type.subtitle, color: colors.textMuted },
  loginBold: { color: colors.primary, fontFamily: type.label.fontFamily },
  stepHeader: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pagePad: { paddingHorizontal: spacing.lg },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.65,
    color: colors.text,
  },
  pageSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  list: { gap: spacing.sm },
  examCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  examCardOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted, ...shadows.soft },
  examIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examAbbr: { fontFamily: type.label.fontFamily, fontSize: 15 },
  examText: { flex: 1 },
  examTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  examName: { ...type.label, fontSize: 15 },
  examSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 3 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  levelHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  proficiencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  proficiencyEmoji: { fontSize: 28 },
  proficiencyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
  },
  proficiencySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  dashboardPreview: {
    marginBottom: spacing.md,
  },
  dashboardPreviewLbl: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  dashboardPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dashboardPreviewCopy: { flex: 1, gap: 4 },
  dashboardPreviewExam: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.text,
    lineHeight: 21,
  },
  dashboardPreviewMeta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  dashboardPreviewPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  dashboardPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  dashboardPreviewPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primary,
  },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  goalTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: 4,
  },
  goalTileOn: { backgroundColor: colors.primary, ...shadows.button },
  goalTileLabel: { ...type.label, fontSize: 14, marginTop: 4 },
  goalLabelOn: { color: '#fff' },
  goalTileSub: { ...type.caption, color: colors.textMuted, textTransform: 'none', letterSpacing: 0, fontSize: 11 },
  goalSubOn: { color: 'rgba(255,255,255,0.75)' },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.textMuted, marginBottom: spacing.sm },
  stepError: { ...type.body, color: colors.error, marginTop: spacing.sm, fontSize: 14 },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
  reminderSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  reminderToggle: {
    width: 44,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  reminderToggleOn: { backgroundColor: colors.primary },
  reminderKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  reminderKnobOn: { alignSelf: 'flex-end' },
  signedInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successBg,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  signedInIcon: { width: 40, alignItems: 'center' },
  signedInTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
  signedInEmail: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  readyGradient: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: spacing.xl,
    overflow: 'hidden',
  },
  readyGlow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  readyBody: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg,
  },
  readyHero: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  readyMarkWrap: {
    ...shadows.soft,
    marginBottom: spacing.xs,
  },
  readyTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.84,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  readySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  readyCard: {
    marginBottom: spacing.md,
  },
  readyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  readyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyItemText: { flex: 1 },
  readyItemLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.text,
  },
  readyItemSub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.warnBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warnBorder,
    alignItems: 'flex-start',
  },
  disclaimer: {
    fontFamily: fonts.bodyMedium,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.disclaimerText,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  stickyFooterFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.xl,
  },
  stickyFooterInner: {
    paddingHorizontal: spacing.lg,
  },
  });
}
