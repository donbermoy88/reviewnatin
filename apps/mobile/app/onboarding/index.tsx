import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
  { id: '15' as const, label: 'Casual', sub: '5 mins / day', q: '5 questions', icon: 'leaf-outline' as const, minutes: 15 },
  { id: '30' as const, label: 'Regular', sub: '10 mins / day', q: '15 questions', icon: 'checkmark-circle-outline' as const, minutes: 30 },
  { id: '45' as const, label: 'Serious', sub: '20 mins / day', q: '30 questions', icon: 'flame-outline' as const, minutes: 45 },
  { id: '60' as const, label: 'Intense', sub: '40 mins / day', q: '60 questions', icon: 'rocket-outline' as const, minutes: 60 },
];

const LEVEL_ICONS: Record<string, ComponentProps<typeof Ionicons>['name']> = {
  beginner: 'trail-sign-outline',
  average: 'library-outline',
  advanced: 'ribbon-outline',
};

const WELCOME_POINTS = ['Diagnostic', 'PasaPath', 'Mistake Bank'];

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
  const { colors, spacing } = theme;
  const styles = useMemo(() => createOnboardingStyles(theme), [theme]);
  const entrance = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    entrance.setValue(0);
    Animated.spring(entrance, {
      toValue: 1,
      friction: 9,
      tension: 55,
      useNativeDriver: true,
    }).start();
  }, [entrance, step]);

  const entranceStyle = useMemo(
    () => ({
      opacity: entrance,
      transform: [
        {
          translateY: entrance.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0],
          }),
        },
      ],
    }),
    [entrance]
  );

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
        setStepError('Pumili ng major field para sa LET Secondary.');
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
          <Text style={styles.welcomeTag}>Mag-review tayo. Pasa tayo.</Text>
        </LinearGradient>

        <Animated.View style={[styles.welcomeBody, entranceStyle, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Text style={styles.welcomeTitle}>
            Board exam review na malinaw, araw-araw, at exam-ready.
          </Text>
          <Text style={styles.welcomeSub}>
            Civil Service, LET, PNLE, and more. Piliin ang exam mo, tapusin ang daily path, at i-review ang mali.
          </Text>
          <View style={styles.welcomeChips}>
            {WELCOME_POINTS.map((point) => (
              <View key={point} style={styles.welcomeChip}>
                <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                <Text style={styles.welcomeChipText}>{point}</Text>
              </View>
            ))}
          </View>
          <PrimaryButton
            label="Simulan ang review"
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
          <Animated.View style={[styles.readyBody, entranceStyle]}>
            <View style={styles.readyHero}>
              <View style={styles.readyMarkWrap}>
                <LogoMark size={88} />
              </View>
              <Pill color={colors.accentDark} bg={colors.accentLight}>
                PASAPATH READY
              </Pill>
              <Text style={styles.readyTitle}>Handa ka na para sa PasaPath</Text>
              <Text style={styles.readySub}>
                Your daily study path starts now — weak topics, mistake review, and new lessons every day.
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
          </Animated.View>
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
        <Animated.View style={[styles.pagePad, entranceStyle]}>
          <OnboardingHeader step={step} total={5} onBack={() => setStep(step - 1)} />
          {step === 1 && (
            <>
              <Text style={styles.pageTitle}>
                {isSwitchMode ? 'Switch exam track' : 'Anong exam ang nire-review mo?'}
              </Text>
              <Text style={styles.pageSub}>
                {isSwitchMode
                  ? 'Choose your new exam — we\'ll sync your goal and PasaPath.'
                  : 'Pumili muna — pwede mong baguhin mamaya.'}
              </Text>
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.pageTitle}>Itakda ang daily goal mo</Text>
              <Text style={styles.pageSub}>{'Even a little each day adds up. Let\'s build that streak!'}</Text>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.pageTitle}>I-save ang progress mo</Text>
              <Text style={styles.pageSub}>I-sync ang quiz scores, Mistake Bank, at PasaPath sa cloud.</Text>
            </>
          )}
        </Animated.View>
      </View>

      <ScreenScroll contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <Animated.View style={[styles.pagePad, entranceStyle]}>
          {step === 1 && (
            <View style={styles.list}>
                {exams.map((ex) => {
                  const on = examSlug === ex.slug;
                  return (
                    <Pressable
                      key={ex.slug}
                      style={({ pressed }) => [styles.examCard, pressed && styles.cardPressed, on && styles.examCardOn]}
                      accessibilityRole="radio"
                      accessibilityLabel={`${ex.name}. ${ex.sub}`}
                      accessibilityState={{ selected: on }}
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
                        {ex.users && ex.users !== 'New' ? (
                          <View style={styles.examUsersRow}>
                            <View style={styles.examDot} />
                            <Text style={styles.examUsers}>{ex.users} reviewers</Text>
                          </View>
                        ) : null}
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
                          style={({ pressed }) => [styles.examCard, pressed && styles.cardPressed, on && styles.examCardOn]}
                          accessibilityRole="radio"
                          accessibilityLabel={`Major field ${major.name}`}
                          accessibilityState={{ selected: on }}
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
              <Text style={styles.fieldLabel}>Ano ang level mo ngayon?</Text>
              <View style={styles.list}>
                {ONBOARDING_LEVELS.map((lv) => {
                  const on = level === lv.id;
                  return (
                      <Pressable
                      key={lv.id}
                      style={({ pressed }) => [styles.goalCard, pressed && styles.cardPressed, on && styles.goalCardOn]}
                      accessibilityRole="radio"
                      accessibilityLabel={`${lv.label}. ${lv.sub}`}
                      accessibilityState={{ selected: on }}
                      onPress={() => setLevel(lv.id)}
                    >
                      <View style={[styles.goalIcon, on && styles.goalIconOn]}>
                        <Ionicons name={LEVEL_ICONS[lv.id] ?? 'school-outline'} size={22} color={on ? '#fff' : colors.primary} />
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
                      style={({ pressed }) => [styles.goalCard, pressed && styles.cardPressed, on && styles.goalCardOn]}
                      accessibilityRole="radio"
                      accessibilityLabel={`${g.label}. ${g.sub}. ${g.q}`}
                      accessibilityState={{ selected: on }}
                      onPress={() => setGoalId(g.id)}
                    >
                      <View style={[styles.goalIcon, on && styles.goalIconOn]}>
                        <Ionicons name={g.icon} size={22} color={on ? '#fff' : colors.primary} />
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
                  style={({ pressed }) => [
                    styles.reminderToggle,
                    pressed && styles.cardPressed,
                    reminderOn && styles.reminderToggleOn,
                  ]}
                  accessibilityRole="switch"
                  accessibilityLabel="Daily reminder"
                  accessibilityState={{ checked: reminderOn }}
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
                <Text style={styles.infoText}>Naka-sync ang progress sa account mo — ligtas kahit magpalit ka ng phone.</Text>
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
                    label="Next →"
                    icon="arrow-forward"
                    iconPosition="right"
                    onPress={() => setStep(4)}
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
                  <PrimaryButton label="Skip muna (guest)" variant="outline" onPress={() => setStep(4)} style={{ marginTop: spacing.sm }} />
                </>
              )}
            </>
          )}
        </Animated.View>
      </ScreenScroll>

      {step >= 1 && step < 3 && (
        <LinearGradient
          colors={[colors.footerFade, colors.background]}
          style={[styles.stickyFooterFade, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.stickyFooterInner}>
            <PrimaryButton
              label={step === 2 ? (isSwitchMode ? 'I-save ang bagong track →' : "I'm committed →") : 'Continue →'}
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
    letterSpacing: 0,
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
  welcomeChips: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  welcomeChip: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primaryDark,
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
    letterSpacing: 0,
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
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
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
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalIconOn: { backgroundColor: 'rgba(255,255,255,0.18)' },
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
    letterSpacing: 0,
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
    letterSpacing: 0,
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
