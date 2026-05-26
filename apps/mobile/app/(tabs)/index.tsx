import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { GoalRing } from '../../components/goal-ring';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessBreakdownSheet } from '../../components/readiness-breakdown-sheet';
import { SparkleStar } from '../../components/sparkle-star';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createDashboardStyles } from '../../lib/themed-styles';
import { fetchExamBySlug, fetchSubjectAreas } from '../../lib/api/catalog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchTodayPasaPath, type PasaPathPlan, type PasaPathTask } from '../../lib/api/pasapath';
import { fetchLatestReadiness, type ReadinessSnapshot } from '../../lib/api/readiness';
import { hasCompletedDiagnostic } from '../../lib/api/diagnostic';
import { fetchPracticeStats } from '../../lib/api/stats';
import { fetchGuestPracticeStats } from '../../lib/guest-quiz-history';
import { ExamCountdownCard } from '../../components/exam-countdown-card';
import { ContentGateBanner } from '../../components/content-gate-banner';
import { AdBanner } from '../../components/ad-banner';
import { fetchContentGateStatus, type ContentGateStatus } from '../../lib/content-gate';
import { fetchAppAnnouncements, type AppAnnouncement } from '../../lib/api/announcements';
import { fetchExamSchedules } from '../../lib/api/exam-calendar';
import { formatExamCountdown } from '../../lib/exam-countdown';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import {
  canStartPractice,
  getMockAccess,
  hasUsedMiniMockThisWeek,
  isMiniMock,
  recordMiniMockUsed,
} from '../../lib/paywall';
import { scheduleDailyReminder, scheduleExamReminders } from '../../lib/notifications';
import { fetchDueFlashcardCount } from '../../lib/api/flashcards';
import { fetchTopicAnalytics, type TopicAnalyticsRow } from '../../lib/api/analytics';
import { fetchMockExams } from '../../lib/api/mock-exams';
import { DEFAULT_EXAM_SLUG, EXAM_TYPES } from '@reviewnatin/shared';
import type { OnboardingData } from '../../lib/onboarding-store';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { useUserProfile } from '../../hooks/use-user-profile';

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Magandang umaga,';
  if (h < 18) return 'Magandang hapon,';
  return 'Magandang gabi,';
}

function examAbbr(slug: string): string {
  if (slug.includes('let')) return 'LET';
  if (slug.includes('cse')) return 'CSC';
  if (slug.includes('pnle')) return 'NLE';
  return 'RN';
}

function dailyQuestionTarget(dailyMinutes: number): number {
  const map: Record<number, number> = { 15: 5, 30: 15, 45: 30, 60: 60 };
  return map[dailyMinutes] ?? 15;
}

function filterVisiblePasapathTasks(tasks: PasaPathTask[]): PasaPathTask[] {
  return tasks.filter((task) => {
    if (task.type === 'mistakes' && task.question_count === 0 && !task.completed) return false;
    return true;
  });
}

function primaryPasapathTask(tasks: PasaPathTask[]): PasaPathTask | null {
  return filterVisiblePasapathTasks(tasks).find((task) => !task.completed) ?? null;
}

function taskIcon(task: PasaPathTask, completed: boolean): keyof typeof Ionicons.glyphMap {
  if (completed) return 'checkmark-circle';
  if (task.type === 'practice' || task.type === 'mock') return 'flash-outline';
  if (task.type === 'mistakes') return 'alert-circle-outline';
  return 'layers-outline';
}

function pickWeakTopic(subjects: { weakTopics: TopicAnalyticsRow[] }[]): TopicAnalyticsRow | null {
  for (const subject of subjects) {
    if (subject.weakTopics.length > 0) return subject.weakTopics[0];
  }
  return null;
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing } = theme;
  const styles = useMemo(() => createDashboardStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium } = useEntitlements();
  const { displayName } = useUserProfile('Reviewer');
  const { prefs, setNotificationsEnabled } = usePreferences();
  const [goal, setGoal] = useState<OnboardingData | null>(null);
  const [examName, setExamName] = useState('');
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessSnapshot | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [stats, setStats] = useState({
    questionsToday: 0,
    questionsTarget: 15,
    streakDays: 0,
    totalAnswered: 0,
    accuracyPercent: null as number | null,
    sessionCount: 0,
  });
  const [pasapath, setPasapath] = useState<PasaPathPlan | null>(null);
  const [contentGate, setContentGate] = useState<ContentGateStatus | null>(null);
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);
  const [weakTopic, setWeakTopic] = useState<TopicAnalyticsRow | null>(null);
  const [readinessSheetOpen, setReadinessSheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [updatesSheetOpen, setUpdatesSheetOpen] = useState(false);

  const load = useCallback(async () => {
    const merged = await resolveOnboardingGoal(user?.id);
    setGoal(merged);
    const slug = merged?.examSlug ?? DEFAULT_EXAM_SLUG;
    const target = dailyQuestionTarget(merged?.dailyMinutes ?? 30);

    if (user) {
      try {
        const [practiceStats, gate] = await Promise.all([
          fetchPracticeStats(user.id, target),
          fetchContentGateStatus(slug),
        ]);
        setStats(practiceStats);
        setContentGate(gate);
        setPasapath(await fetchTodayPasaPath(slug));
        setReadiness(await fetchLatestReadiness(slug));
        try {
          const analytics = await fetchTopicAnalytics(slug);
          setWeakTopic(pickWeakTopic(analytics.subjects));
        } catch {
          setWeakTopic(null);
        }
        if (gate?.meetsMinimum && !(await hasCompletedDiagnostic(slug))) {
          router.replace('/diagnostic/intro');
          return;
        }
      } catch {
        setStats((s) => ({ ...s, questionsTarget: target }));
      }
    } else {
      setPasapath(null);
      setReadiness(null);
      setWeakTopic(null);
      try {
        setStats(await fetchGuestPracticeStats(target));
      } catch {
        setStats((s) => ({ ...s, questionsTarget: target }));
      }
    }

    const exam = await fetchExamBySlug(slug);
    if (exam) {
      setExamName(exam.name);
      setExamTypeId(exam.id);
      const areas = await fetchSubjectAreas(exam.id);
      setSubjects(areas.slice(0, 3));
    } else {
      const found = EXAM_TYPES.find((e) => e.slug === slug);
      if (found) setExamName(found.name);
    }

    if (!user) setContentGate(await fetchContentGateStatus(slug));
    setAnnouncements(await fetchAppAnnouncements(slug, 3).catch(() => []));
  }, [user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const examSlug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;

  // Notification scheduling in a separate effect so pref changes don't re-trigger the full dashboard load
  useEffect(() => {
    if (!user || !prefs.notificationsEnabled) return;
    void fetchDueFlashcardCount(examSlug)
      .then((dueFlashcards) =>
        scheduleDailyReminder(prefs.reminderHour, prefs.reminderMinute, {
          streakDays: stats.streakDays,
          dueFlashcards,
        })
      )
      .catch(() => {});
  }, [prefs.notificationsEnabled, prefs.reminderHour, prefs.reminderMinute, user, examSlug, stats.streakDays]);

  useEffect(() => {
    if (!user || !prefs.examRemindersEnabled) return;
    void fetchExamSchedules(examSlug)
      .then((schedules) => scheduleExamReminders(schedules))
      .catch(() => {});
  }, [prefs.examRemindersEnabled, user, examSlug]);

  const premium = isPremium(examTypeId);
  const readinessScore = readiness?.score ?? pasapath?.readiness_hint ?? null;
  const questionsTarget = stats.questionsTarget;
  const questionsDone = stats.questionsToday;
  const dailyGoalPct = questionsTarget > 0 ? Math.min(100, Math.round((questionsDone / questionsTarget) * 100)) : 0;
  const hasActivity = stats.sessionCount > 0;
  const visiblePasapathTasks = pasapath ? filterVisiblePasapathTasks(pasapath.tasks) : [];
  const nextTask = pasapath ? primaryPasapathTask(pasapath.tasks) : null;
  const pasapathComplete =
    visiblePasapathTasks.length > 0 && visiblePasapathTasks.every((task) => task.completed);
  const showAccuracy = stats.totalAnswered >= 20 && stats.accuracyPercent != null;
  const examCountdown = goal?.targetDate ? formatExamCountdown(goal.targetDate) : null;
  const firstName = displayName.split(/\s+/)[0] ?? displayName;
  const streakLabel = stats.streakDays > 0 ? 'araw na streak' : 'simulan ngayon';

  const ensurePracticeAllowed = () => {
    if (!user) return true;
    const gate = canStartPractice(stats.questionsToday, premium);
    if (!gate.allowed) {
      router.push('/subscribe');
      return false;
    }
    return true;
  };

  const startPractice = async (pasapathTaskId?: string) => {
    if (!ensurePracticeAllowed()) return;
    router.push({
      pathname: '/practice/quiz',
      params: {
        examSlug,
        ...(pasapathTaskId ? { pasapathTaskId } : {}),
      },
    });
  };

  const startWeakAreaPractice = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!ensurePracticeAllowed()) return;
    router.push({ pathname: '/practice/quiz', params: { examSlug, mode: 'weak_area' } });
  };

  const launchMock = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    try {
      const mocks = await fetchMockExams(examSlug);
      const mock = mocks.find((m) => isMiniMock(m)) ?? mocks[0];
      if (!mock) {
        router.push('/(tabs)/study');
        return;
      }
      const access = getMockAccess(mock, premium);
      if (access === 'weekly_limit') {
        const used = await hasUsedMiniMockThisWeek();
        if (used) {
          router.push('/subscribe');
          return;
        }
        await recordMiniMockUsed();
      }
      if (access === 'preview') {
        router.push({
          pathname: '/practice/quiz',
          params: {
            examSlug,
            mode: 'mock',
            mockExamId: mock.id,
            durationSeconds: String(Math.min(mock.durationSeconds, 900)),
          },
        });
        return;
      }
      router.push({
        pathname: '/practice/quiz',
        params: {
          examSlug,
          mode: 'mock',
          mockExamId: mock.id,
          durationSeconds: String(mock.durationSeconds),
        },
      });
    } catch {
      router.push('/(tabs)/study');
    }
  };

  const runPasapathTask = (task: PasaPathTask) => {
    if (task.completed) return;
    if (task.type === 'practice' || task.type === 'mock') {
      void startPractice(task.id);
      return;
    }
    if (task.type === 'mistakes') {
      router.push('/mistakes');
      return;
    }
    if (task.type === 'flashcards') {
      router.push({
        pathname: '/flashcards',
        params: {
          examSlug,
          limit: String(task.question_count || 5),
          pasapathTaskId: task.id,
        },
      });
    }
  };

  const primaryCtaLabel = (task: PasaPathTask): string => {
    if (task.type === 'mistakes') return 'Buksan ang Mistake Bank';
    if (task.type === 'flashcards') return 'Simulan ang flashcards';
    if (task.type === 'mock') return 'Simulan ang mock exam';
    return 'Simulan ang practice quiz';
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={tabScrollPadding(insets)} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[...gradients.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.sparkleTop}>
            <SparkleStar size={14} opacity={0.6} />
          </View>
          <View style={styles.sparkleMid}>
            <SparkleStar size={10} opacity={0.35} />
          </View>

          <View style={styles.heroTop}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.xs }}>
              <Text style={styles.heroGreet}>{timeGreeting()}</Text>
              <Text style={styles.heroName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                Kumusta, {firstName}! 👋
              </Text>
            </View>
            <Pressable
              style={styles.bellBtn}
              onPress={() => setNotificationSheetOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Daily reminders"
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statPill}>
              <View style={styles.statIconWrap}>
                <Ionicons name="flame" size={20} color={colors.flame} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={styles.statVal}>{stats.streakDays}</Text>
                <Text style={styles.statLbl} numberOfLines={2}>
                  {streakLabel}
                </Text>
              </View>
            </View>
            <View style={styles.statPill}>
              <View style={styles.statIconWrap}>
                <Ionicons name="checkmark-done" size={20} color={colors.accent} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={styles.statVal}>{questionsDone}</Text>
                <Text style={styles.statLbl} numberOfLines={2}>
                  tanong ngayon
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.statPillReadiness}
              onPress={() => readinessScore != null && setReadinessSheetOpen(true)}
              disabled={readinessScore == null}
              accessibilityRole="button"
              accessibilityLabel={
                readinessScore != null ? `${readinessScore} percent handa na. Tap para sa breakdown.` : 'Walang readiness score pa'
              }
            >
              {readinessScore != null ? (
                <GoalRing
                  percent={readinessScore}
                  size={42}
                  strokeWidth={4}
                  trackColor="rgba(255,255,255,0.2)"
                  fillColor={colors.accent}
                  labelColor="#fff"
                />
              ) : (
                <View style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[styles.statVal, { fontSize: 15 }]}>—</Text>
                </View>
              )}
              <Text style={styles.statLblCenter}>handa na</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.sectionPad}>
          {user && pasapath ? (
            <View style={styles.pasapathCard}>
              <View style={styles.pasapathHead}>
                <Text style={styles.pasapathLbl}>Today&apos;s PasaPath</Text>
                <Pressable
                  onPress={() => router.push('/pasapath/week')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Tingnan ang PasaPath week"
                >
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primary }}>Week →</Text>
                </Pressable>
              </View>
              <Text style={styles.pasapathMeta}>
                {pasapath.days_until_exam} days left · {pasapath.daily_minutes} min planned
                {examCountdown ? ` · ${examCountdown.targetLabel}` : ''}
              </Text>

              {weakTopic ? (
                <Pressable style={styles.weakChip} onPress={startWeakAreaPractice}>
                  <Ionicons name="trending-down" size={14} color={colors.error} />
                  <Text style={styles.weakChipText}>Balikan: {weakTopic.topicName}</Text>
                </Pressable>
              ) : null}

              {nextTask && !pasapathComplete ? (
                <Pressable
                  style={styles.primaryCta}
                  onPress={() => runPasapathTask(nextTask)}
                  accessibilityRole="button"
                  accessibilityLabel={primaryCtaLabel(nextTask)}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                  <Text style={styles.primaryCtaText}>
                    {nextTask.title} · {nextTask.minutes} min
                  </Text>
                </Pressable>
              ) : pasapathComplete ? (
                <View style={[styles.primaryCta, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.primaryCtaText}>Tapos na ang PasaPath mo for today! 🎉</Text>
                </View>
              ) : null}

              {visiblePasapathTasks.map((task) => (
                <Pressable
                  key={task.id}
                  style={[styles.pasapathTask, task.completed && { opacity: 0.55 }]}
                  onPress={() => runPasapathTask(task)}
                  disabled={task.completed}
                >
                  <Ionicons
                    name={taskIcon(task, task.completed)}
                    size={18}
                    color={task.completed ? colors.success : colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pasapathTaskTitle}>{task.title}</Text>
                    <Text style={styles.pasapathTaskSub}>
                      {task.completed
                        ? 'Done for today ✓'
                        : task.type === 'mistakes' && task.question_count === 0
                          ? 'Mag-quiz muna para may mistakes'
                          : `${task.minutes} min · ${task.question_count} items`}
                    </Text>
                  </View>
                  {!task.completed && task.id !== nextTask?.id ? (
                    <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : user ? (
            <View style={[styles.pasapathCard, { marginBottom: spacing.md }]}>
              <Text style={styles.pasapathLbl}>Today&apos;s PasaPath</Text>
              <Text style={[styles.pasapathMeta, { marginBottom: spacing.md }]}>
                Simulan ang unang quiz para ma-generate ang daily plan mo.
              </Text>
              <PrimaryButton label="Simulan ang practice" onPress={() => void startPractice()} />
            </View>
          ) : null}

          <LinearGradient colors={[...gradients.gold]} style={styles.goalCard}>
            <GoalRing percent={dailyGoalPct} />
            <View style={{ flex: 1 }}>
              <Text style={styles.goalLbl}>Today&apos;s goal</Text>
              <Text style={styles.goalTitle}>
                {questionsDone} / {questionsTarget} questions
              </Text>
              <Text style={styles.goalHint}>
                {questionsDone >= questionsTarget
                  ? 'Goal done for today! 🎉'
                  : user
                    ? `${questionsTarget - questionsDone} to go — kaya pa! 💪`
                    : 'Mag-login para i-track ang daily goal mo.'}
              </Text>
              {showAccuracy ? (
                <Text style={[styles.goalHint, { marginTop: 6 }]}>
                  Overall accuracy: {stats.accuracyPercent}% ({stats.totalAnswered} answered)
                </Text>
              ) : null}
            </View>
          </LinearGradient>

          {examCountdown ? (
            <ExamCountdownCard
              theme={theme}
              countdown={examCountdown}
              examName={examName || 'Your exam'}
              onPress={() => router.push('/exam-calendar')}
            />
          ) : null}

          <Pressable style={styles.continueCard} onPress={() => void startPractice()}>
            <View style={styles.continueRow}>
              <View style={styles.continueIcon}>
                <Text style={styles.continueAbbr}>{examAbbr(examSlug)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.continueLbl}>
                  {hasActivity ? 'Continue reviewing' : 'Simulan ang review'}
                </Text>
                <Text style={styles.continueTitle}>{examName || 'Your exam'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.continueMeta}>
              {hasActivity
                ? `${stats.sessionCount} quiz${stats.sessionCount === 1 ? '' : 'zes'} completed`
                : 'Start your first quiz — walang fake progress dito.'}
            </Text>
          </Pressable>

          <View style={styles.quickActions}>
            {[
              { label: 'Practice', icon: 'flash-outline' as const, onPress: () => void startPractice() },
              { label: 'Mock', icon: 'document-text-outline' as const, onPress: () => void launchMock() },
              { label: 'Mistakes', icon: 'alert-circle-outline' as const, onPress: () => router.push('/mistakes') },
              {
                label: 'Flashcards',
                icon: 'layers-outline' as const,
                onPress: () => router.push({ pathname: '/flashcards', params: { examSlug } }),
              },
            ].map((action) => (
              <Pressable key={action.label} style={styles.quickAction} onPress={action.onPress}>
                <Ionicons name={action.icon} size={20} color={colors.primary} />
                <Text style={styles.quickActionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          {subjects.length > 0 ? (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Quick practice</Text>
              </View>
              {subjects.map((subject, index) => (
                <Pressable
                  key={subject.id}
                  style={styles.quickRow}
                  onPress={() =>
                    router.push({
                      pathname: '/study/[subjectSlug]',
                      params: { subjectSlug: subject.slug, examSlug },
                    })
                  }
                >
                  <View style={[styles.quickIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={{ fontSize: 20 }}>{['📚', '🎓', '🔬'][index % 3]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickName}>{subject.name}</Text>
                    <Text style={styles.quickMeta}>Tap to browse topics</Text>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="play" size={14} color="#fff" />
                  </View>
                </Pressable>
              ))}
            </>
          ) : null}

          <View style={styles.lowerSection}>
            {!user ? (
              <Pressable style={styles.guestBanner} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.guestBannerTitle}>Mag-login para ma-save ang progress</Text>
                <Text style={styles.guestBannerSub}>
                  PasaPath, streak, Mistake Bank, at readiness — naka-sync kapag may account ka.
                </Text>
              </Pressable>
            ) : null}

            {contentGate && !contentGate.meetsMinimum ? (
              <ContentGateBanner theme={theme} status={contentGate} compact />
            ) : null}

            {!premium ? <AdBanner onPress={() => router.push('/subscribe')} /> : null}

            {announcements.length > 0 ? (
              <Pressable
                style={styles.updatesChip}
                onPress={() => setUpdatesSheetOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={`${announcements.length} updates`}
              >
                <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
                <Text style={styles.updatesChipText} numberOfLines={1}>
                  {announcements.length} update{announcements.length === 1 ? '' : 's'} · {announcements[0].title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <ReadinessBreakdownSheet
        visible={readinessSheetOpen}
        onClose={() => setReadinessSheetOpen(false)}
        readiness={readiness}
      />

      <AppSheet
        visible={notificationSheetOpen}
        title="Daily reminders"
        subtitle={
          prefs.notificationsEnabled
            ? 'Naka-on ang reminders. I-manage ang schedule sa Settings.'
            : 'Gusto mo bang i-on ang araw-araw na study reminders?'
        }
        onClose={() => setNotificationSheetOpen(false)}
        actions={
          prefs.notificationsEnabled
            ? [
                {
                  label: 'Pumunta sa Settings',
                  onPress: () => {
                    setNotificationSheetOpen(false);
                    router.push('/(tabs)/settings');
                  },
                },
                { label: 'OK', onPress: () => setNotificationSheetOpen(false), variant: 'outline' },
              ]
            : [
                {
                  label: 'I-on ang reminders',
                  onPress: () => {
                    setNotificationsEnabled(true);
                    setNotificationSheetOpen(false);
                  },
                },
                {
                  label: 'Pumunta sa Settings',
                  onPress: () => {
                    setNotificationSheetOpen(false);
                    router.push('/(tabs)/settings');
                  },
                  variant: 'outline',
                },
                { label: 'Hindi muna', onPress: () => setNotificationSheetOpen(false), variant: 'ghost' },
              ]
        }
      />

      <AppSheet
        visible={updatesSheetOpen}
        title="Updates"
        subtitle="Balita at tips mula sa ReviewNatin team"
        onClose={() => setUpdatesSheetOpen(false)}
        actions={[{ label: 'OK', onPress: () => setUpdatesSheetOpen(false), variant: 'outline' }]}
      >
        {announcements.map((announcement) => (
          <View key={announcement.id} style={{ marginBottom: spacing.md }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>{announcement.title}</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 }}>
              {announcement.body}
            </Text>
          </View>
        ))}
      </AppSheet>
    </View>
  );
}
