import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/card';
import { SparkleStar } from '../../components/sparkle-star';
import { LogoMark } from '../../components/logo-mark';
import { OnboardingHeader } from '../../components/onboarding-header';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { ScreenScroll } from '../../components/screen-scroll';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { DISCLAIMERS, DEFAULT_EXAM_SLUG, EXAM_CATALOG, LET_SECONDARY_MAJORS, ONBOARDING_LEVELS } from '@reviewnatin/shared';
import { syncExamGoalSafe } from '../../lib/api/goals';
import { fetchExamCatalog } from '../../lib/api/exam-catalog';
import { saveOnboarding, saveOnboardingDraft, hasOnboardingDraft, getOnboarding } from '../../lib/onboarding-store';
import { getPostOnboardingHref } from '../../lib/onboarding-nav';
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
    label: 'Practice quiz ready',
    sub: 'Based on your self-assessed level',
  },
  {
    icon: 'calendar-outline' as const,
    label: 'Daily tasks scheduled',
    sub: 'Based on your target exam date',
  },
  {
    icon: 'bookmark-outline' as const,
    label: 'Mistake Bank active',
    sub: 'Auto-tracks all wrong answers',
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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderOn, setReminderOn] = useState(true);
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createOnboardingStyles(theme), [theme]);

  useEffect(() => {
    fetchExamCatalog().then((rows) => {
      if (rows.length) {
        setExams(rows);
        setExamSlug((current) => (rows.some((row) => row.slug === current) ? current : rows[0].slug));
      }
    });
  }, []);

  useEffect(() => {
    if (stepParam !== '4') return;
    getOnboarding().then((data) => {
      if (!hasOnboardingDraft(data)) {
        setStep(1);
        return;
      }
      setExamSlug(data!.examSlug);
      setMajorSlug(data!.majorSlug);
      setTargetDate(new Date(data!.targetDate));
      const matchedGoal = GOALS.find((g) => g.minutes === data!.dailyMinutes);
      if (matchedGoal) setGoalId(matchedGoal.id);
      setLevel(data!.level);
      setStep(4);
    });
  }, [stepParam]);

  useEffect(() => {
    if (!isSwitchMode) return;
    getOnboarding().then((data) => {
      if (data) {
        setExamSlug(data.examSlug);
        setMajorSlug(data.majorSlug);
        setTargetDate(new Date(data.targetDate));
        const matchedGoal = GOALS.find((g) => g.minutes === data.dailyMinutes);
        if (matchedGoal) setGoalId(matchedGoal.id);
        setLevel(data.level);
      }
      setStep(1);
    });
  }, [isSwitchMode]);

  const dailyMinutes = GOALS.find((g) => g.id === goalId)?.minutes ?? 30;
  const dateStr = targetDate.toISOString().slice(0, 10);

  const advanceStep = async () => {
    setStepError(null);

    if (step === 1) {
      if (examSlug === 'let-secondary' && !majorSlug) {
        setStepError('Please choose a major field for LET Secondary.');
        return;
      }
      await saveOnboardingDraft({
        examSlug,
        majorSlug: examSlug === 'let-secondary' ? majorSlug : undefined,
      });
    } else if (step === 2) {
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

  const finish = async () => {
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
        Alert.alert('Goal sync failed', result.message);
      }
      try {
        await setNotificationsEnabled(reminderOn);
      } catch {
        /* local prefs still saved via onboarding draft */
      }
    }
    await refreshOnboarding();
    router.replace((await getPostOnboardingHref(user?.id)) as '/(tabs)');
  };

  if (step === 0) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={[styles.welcomeBlob, { paddingTop: insets.top + 40 }]}
        >
          <View style={styles.welcomeGlow} />
          <View style={styles.sparkleWelcomeTop}>
            <SparkleStar size={20} opacity={0.8} />
          </View>
          <View style={styles.sparkleWelcomeMid}>
            <SparkleStar size={14} opacity={0.5} />
          </View>
          <View style={styles.markWrap}>
            <LogoMark size={120} />
          </View>
          <Text style={styles.welcomeBrand}>
            Review<Text style={{ color: colors.accent }}>Natin</Text>
          </Text>
          <Text style={styles.welcomeTag}>Review together. Pass together.</Text>
        </LinearGradient>

        <View style={[styles.welcomeBody, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.welcomeTitle}>
            Study buddy mo para sa{'\n'}bawat Filipino exam.
          </Text>
          <Text style={styles.welcomeSub}>
            CSE Full, CSE Sub, PNLE, LET Elementary & Secondary — one app, one streak, one goal.
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
        </View>
      </View>
    );
  }

  if (step === 4) {
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
            <OnboardingHeader step={step} total={5} onBack={() => setStep(3)} variant="dark" />
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
              <Text style={styles.readyTitle}>Handa ka na sa PasaPath</Text>
              <Text style={styles.readySub}>
                Magsisimula ang araw-araw mong study path — weak topics, mistake review, at bagong lessons.
              </Text>
            </View>

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
              label={isSwitchMode ? 'Save new track' : 'Go to Dashboard'}
              size="lg"
              icon="arrow-forward"
              onPress={finish}
            />
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.stepHeader, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.pagePad}>
          <OnboardingHeader step={step} total={5} onBack={() => setStep(step - 1)} />
          {step === 1 && (
            <>
              <Text style={styles.pageTitle}>
                {isSwitchMode ? 'Switch exam track' : 'Which exam are you reviewing for?'}
              </Text>
              <Text style={styles.pageSub}>
                {isSwitchMode
                  ? 'Choose your new exam — we\'ll sync your goal and PasaPath.'
                  : 'Pick one for now — you can change it later.'}
              </Text>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.pageTitle}>Set your daily goal</Text>
              <Text style={styles.pageSub}>Even a little each day adds up. Let's build that streak!</Text>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.pageTitle}>Save your progress</Text>
              <Text style={styles.pageSub}>Sync quiz scores, mistake bank, and PasaPath to the cloud.</Text>
            </>
          )}
        </View>
      </View>

      <ScreenScroll contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.pagePad}>
          {step === 1 && (
            <View style={styles.list}>
                {exams.map((ex) => {
                  const on = examSlug === ex.slug;
                  return (
                    <Pressable
                      key={ex.slug}
                      style={[styles.examCard, on && styles.examCardOn]}
                      onPress={() => {
                        setExamSlug(ex.slug);
                        if (ex.slug !== 'let-secondary') setMajorSlug(undefined);
                      }}
                    >
                      <View style={[styles.examIcon, { backgroundColor: ex.bg }]}>
                        <Text style={[styles.examAbbr, { color: ex.color }]}>{ex.abbr}</Text>
                      </View>
                      <View style={styles.examText}>
                        <View style={styles.examTitleRow}>
                          <Text style={styles.examName}>{ex.name}</Text>
                          {ex.tag ? (
                            <Pill
                              color={ex.tag === 'New' ? colors.accentDark : colors.primary}
                              bg={ex.tag === 'New' ? colors.accentLight : colors.primaryMuted}
                            >
                              {ex.tag.toUpperCase()}
                            </Pill>
                          ) : null}
                        </View>
                        <Text style={styles.examSub}>{ex.sub}</Text>
                        <View style={styles.examUsersRow}>
                          <View style={styles.examDot} />
                          <Text style={styles.examUsers}>{ex.users} reviewers</Text>
                        </View>
                      </View>
                      <View style={[styles.radio, on && styles.radioOn]}>
                        {on ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              {examSlug === 'let-secondary' ? (
                <>
                  <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Major field</Text>
                  <View style={styles.list}>
                    {LET_SECONDARY_MAJORS.map((major) => {
                      const on = majorSlug === major.slug;
                      return (
                        <Pressable
                          key={major.slug}
                          style={[styles.examCard, on && styles.examCardOn]}
                          onPress={() => setMajorSlug(major.slug)}
                        >
                          <View style={[styles.examIcon, { backgroundColor: '#F1E8FA' }]}>
                            <Text style={[styles.examAbbr, { color: '#7B2CBF' }]}>M</Text>
                          </View>
                          <View style={styles.examText}>
                            <Text style={styles.examName}>{major.name}</Text>
                          </View>
                          <View style={[styles.radio, on && styles.radioOn]}>
                            {on ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}
              {stepError && step === 1 ? <Text style={styles.stepError}>{stepError}</Text> : null}
            </View>
          )}

          {step === 2 && (
            <>
              <Text style={styles.fieldLabel}>Anong level ka ngayon?</Text>
              <View style={styles.list}>
                {ONBOARDING_LEVELS.map((lv) => {
                  const on = level === lv.id;
                  return (
                    <Pressable
                      key={lv.id}
                      style={[styles.goalCard, on && styles.goalCardOn]}
                      onPress={() => setLevel(lv.id)}
                    >
                      <View style={[styles.goalEmoji, on && styles.goalEmojiOn]}>
                        <Text style={{ fontSize: 24 }}>{lv.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.goalLabel, on && styles.goalLabelOn]}>{lv.label}</Text>
                        <Text style={[styles.goalSub, on && styles.goalSubOn]}>{lv.sub}</Text>
                      </View>
                      <View style={[styles.radioSm, on && styles.radioSmOn]}>
                        {on ? <Ionicons name="checkmark" size={12} color={colors.primary} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Daily study goal</Text>
              <View style={styles.list}>
                {GOALS.map((g) => {
                  const on = goalId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      style={[styles.goalCard, on && styles.goalCardOn]}
                      onPress={() => setGoalId(g.id)}
                    >
                      <View style={[styles.goalEmoji, on && styles.goalEmojiOn]}>
                        <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.goalLabel, on && styles.goalLabelOn]}>{g.label}</Text>
                        <Text style={[styles.goalSub, on && styles.goalSubOn]}>
                          {g.sub} · {g.q}
                        </Text>
                      </View>
                      <View style={[styles.radioSm, on && styles.radioSmOn]}>
                        {on ? <Ionicons name="checkmark" size={12} color={colors.primary} /> : null}
                      </View>
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
                  <Text style={styles.reminderSub}>Every day at 7:00 PM</Text>
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
                    if (date) setTargetDate(date);
                  }}
                />
              )}
            </>
          )}

          {step === 3 && (
            <>
              <View style={[styles.infoCard, { marginTop: spacing.sm }]}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                <Text style={styles.infoText}>Safe kahit magpalit ng phone — email sign-up lang.</Text>
              </View>
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
                    label="Susunod →"
                    icon="arrow-forward"
                    iconPosition="right"
                    onPress={() => setStep(4)}
                    style={{ marginTop: spacing.md }}
                  />
                </>
              ) : (
                <>
                  <PrimaryButton
                    label="Sign up / Log in"
                    icon="log-in-outline"
                    iconPosition="left"
                    onPress={() => router.push({ pathname: '/(auth)/login', params: { returnTo: 'onboarding' } })}
                    style={{ marginTop: spacing.lg }}
                  />
                  <PrimaryButton label="Skip for now (guest)" variant="outline" onPress={() => setStep(4)} style={{ marginTop: spacing.sm }} />
                </>
              )}
            </>
          )}
        </View>
      </ScreenScroll>

      {step >= 1 && step < 3 && (
        <LinearGradient
          colors={[colors.footerFade, colors.background]}
          style={[styles.stickyFooterFade, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.stickyFooterInner}>
            <PrimaryButton
              label={step === 2 ? (isSwitchMode ? 'Save new track →' : "I'm committed →") : 'Continue →'}
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
    height: 480,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    alignItems: 'center',
    overflow: 'hidden',
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
  markWrap: { marginTop: 40, ...shadows.soft },
  welcomeBrand: {
    fontFamily: type.brand.fontFamily,
    fontSize: 34,
    color: '#fff',
    marginTop: spacing.lg,
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
    paddingTop: spacing.lg,
    justifyContent: 'flex-end',
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
  examCardOn: { borderColor: colors.primary, ...shadows.soft },
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
  examUsersRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  examDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.success },
  examUsers: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.textLight },
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
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  goalCardOn: { backgroundColor: colors.primary, ...shadows.button },
  goalEmoji: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalEmojiOn: { backgroundColor: 'rgba(255,255,255,0.18)' },
  goalLabel: { ...type.label, fontSize: 16 },
  goalLabelOn: { color: '#fff' },
  goalSub: { ...type.caption, color: colors.textMuted, marginTop: 2, textTransform: 'none', letterSpacing: 0 },
  goalSubOn: { color: 'rgba(255,255,255,0.75)' },
  radioSm: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSmOn: { backgroundColor: '#fff', borderColor: '#fff' },
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  infoText: { fontFamily: fonts.body, flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
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
