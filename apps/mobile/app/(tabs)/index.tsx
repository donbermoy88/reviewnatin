import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { GoalRing } from '../../components/goal-ring';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessBreakdownSheet } from '../../components/readiness-breakdown-sheet';
import { SparkleStar } from '../../components/sparkle-star';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createDashboardStyles } from '../../lib/themed-styles';
import { fetchExamBySlug, fetchSubjectAreas } from '../../lib/api/catalog';
import { fetchTopicQuestionCounts, fetchTopicsBySubjectSlug, type TopicRow } from '../../lib/api/topics';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchTodayPasaPath, type PasaPathPlan, type PasaPathTask } from '../../lib/api/pasapath';
import { fetchLatestReadiness, type ReadinessSnapshot } from '../../lib/api/readiness';
import { fetchStreakStatus } from '../../lib/api/streak';
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
  isMiniMock,
  isMiniMockAvailable,
} from '../../lib/paywall';
import { scheduleDailyReminder, scheduleExamReminders } from '../../lib/notifications';
import { fetchDueFlashcardCount } from '../../lib/api/flashcards';
import { fetchTopicAnalytics, type TopicAnalyticsRow } from '../../lib/api/analytics';
import { fetchMockExams } from '../../lib/api/mock-exams';
import { DEFAULT_EXAM_SLUG, EXAM_TYPES } from '@reviewnatin/shared';
import type { OnboardingData } from '../../lib/onboarding-store';
import type { SubjectArea } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { useUserProfile } from '../../hooks/use-user-profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakMilestoneModal, isStreakMilestone } from '../../components/streak-milestone-modal';
import { isDiagnosticPromptDismissed } from '../../lib/diagnostic-prompt';

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Magandang umaga,';
  if (h < 18) return 'Magandang hapon,';
  return 'Magandang gabi,';
}

function examAbbr(slug: string): string {
  if (slug.includes('let')) return 'LET';
  if (slug.includes('cse')) return 'CSE';
  if (slug.includes('pnle')) return 'PNLE';
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

function subjectIcon(index: number): keyof typeof Ionicons.glyphMap {
  const icons: (keyof typeof Ionicons.glyphMap)[] = ['book-outline', 'school-outline', 'analytics-outline'];
  return icons[index % icons.length];
}

type HomeSubjectCard = SubjectArea & {
  topics: TopicRow[];
  readyTopicCount: number;
  questionCount: number | null;
  countsKnown: boolean;
};

function subjectCardMeta(subject: HomeSubjectCard): string {
  const topicCount = subject.topics.length;
  if (topicCount === 0) return 'Topics coming soon';
  if (!subject.countsKnown) return `${topicCount} topic${topicCount === 1 ? '' : 's'} · open list`;
  if (subject.questionCount === 0) return `${topicCount} topic${topicCount === 1 ? '' : 's'} · questions coming soon`;
  return `${subject.readyTopicCount}/${topicCount} topics ready · ${subject.questionCount} question${subject.questionCount === 1 ? '' : 's'}`;
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
  const [subjects, setSubjects] = useState<HomeSubjectCard[]>([]);
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
  const [streakFreezes, setStreakFreezes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readinessSheetOpen, setReadinessSheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [updatesSheetOpen, setUpdatesSheetOpen] = useState(false);
  const [milestoneVisible, setMilestoneVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const merged = await resolveOnboardingGoal(user?.id);
      setGoal(merged);
      const slug = merged?.examSlug ?? DEFAULT_EXAM_SLUG;
      const target = dailyQuestionTarget(merged?.dailyMinutes ?? 30);

      if (user) {
        try {
          // These dashboard sections are independent — fetch them concurrently
          // instead of in a waterfall. Non-critical fetches fall back to a safe
          // value so one slow/failed call doesn't blank the rest of the screen.
          const [practiceStats, gate, todayPasa, latestReadiness, weakest, streak, diagnosticDone] =
            await Promise.all([
              fetchPracticeStats(user.id, target).then(async (s) => {
                // Show streak milestone modal if a milestone was just reached
                if (isStreakMilestone(s.streakDays)) {
                  const key = `milestone_shown_${user.id}_${s.streakDays}`;
                  const shown = await AsyncStorage.getItem(key).catch(() => null);
                  if (!shown) {
                    await AsyncStorage.setItem(key, '1').catch(() => {});
                    setMilestoneVisible(true);
                  }
                }
                return s;
              }),
              fetchContentGateStatus(slug).catch(() => null),
              fetchTodayPasaPath(slug).catch(() => null),
              fetchLatestReadiness(slug).catch(() => null),
              fetchTopicAnalytics(slug)
                .then((a) => pickWeakTopic(a.subjects))
                .catch(() => null),
              fetchStreakStatus(user.id).catch(() => null),
              // Treat a lookup failure as "done" so we never force the diagnostic
              // redirect on a transient error.
              hasCompletedDiagnostic(slug).catch(() => true),
            ]);
          setStats(practiceStats);
          setContentGate(gate);
          setPasapath(todayPasa);
          setReadiness(latestReadiness);
          setWeakTopic(weakest);
          setStreakFreezes(streak?.streakFreezes ?? 0);
          if (gate?.meetsMinimum && !diagnosticDone) {
            const dismissed = await isDiagnosticPromptDismissed(user.id, slug).catch(() => false);
            if (!dismissed) {
              router.replace('/diagnostic/intro');
              return;
            }
          }
        } catch {
          setStats((s) => ({ ...s, questionsTarget: target }));
        }
      } else {
        setPasapath(null);
        setReadiness(null);
        setWeakTopic(null);
        setStreakFreezes(0);
        try {
          setStats(await fetchGuestPracticeStats(target));
        } catch {
          setStats((s) => ({ ...s, questionsTarget: target }));
        }
      }

      const exam = await fetchExamBySlug(slug).catch(() => null);
      if (exam) {
        setExamName(exam.name);
        setExamTypeId(exam.id);
        const areas = await fetchSubjectAreas(exam.id).catch(() => []);
        const previewSubjects = areas.slice(0, 3);
        const subjectCards = await Promise.all(
          previewSubjects.map(async (subject) => {
            const [topicRows, topicCounts] = await Promise.all([
              fetchTopicsBySubjectSlug(slug, subject.slug).catch(() => []),
              fetchTopicQuestionCounts(slug, subject.slug).catch(() => new Map<string, number>()),
            ]);
            const countsKnown = topicRows.length > 0 && topicRows.every((topic) => topicCounts.has(topic.slug));
            const readyTopicCount = countsKnown
              ? topicRows.filter((topic) => (topicCounts.get(topic.slug) ?? 0) > 0).length
              : topicRows.length;
            const questionCount = countsKnown
              ? topicRows.reduce((sum, topic) => sum + (topicCounts.get(topic.slug) ?? 0), 0)
              : null;
            return {
              ...subject,
              topics: topicRows,
              readyTopicCount,
              questionCount,
              countsKnown,
            };
          })
        );
        setSubjects(subjectCards);
      } else {
        const found = EXAM_TYPES.find((e) => e.slug === slug);
        if (found) setExamName(found.name);
      }

      if (!user) {
        setContentGate(await fetchContentGateStatus(slug).catch(() => null));
      }
      setAnnouncements(await fetchAppAnnouncements(slug, 3).catch(() => []));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, router]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
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
  const streakLabel = stats.streakDays > 0 ? 'day streak' : 'simulan na';
  const remainingQuestions = Math.max(questionsTarget - questionsDone, 0);

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
      if (access === 'weekly_limit' && !(await isMiniMockAvailable(examSlug))) {
        router.push('/subscribe');
        return;
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
    if (task.type === 'mistakes') return 'Open Mistake Bank';
    if (task.type === 'flashcards') return 'Start flashcards';
    if (task.type === 'mock') return 'Start mock exam';
    return 'Start practice quiz';
  };

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={tabScrollPadding(insets)}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
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
            <View style={styles.heroCopy}>
              <Text style={styles.heroGreet}>{timeGreeting()}</Text>
              <Text style={styles.heroName} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                {firstName}
              </Text>
              <Text style={styles.heroTrack} numberOfLines={1}>
                {examName || 'Review track'} · {premium ? 'Plus' : 'Free'}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.bellBtn, pressed && styles.pressedSoft]}
              onPress={() => setNotificationSheetOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Daily reminders"
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.heroFocusCard}>
            <View style={styles.heroFocusTop}>
              <Text style={styles.heroFocusLabel}>{"Today's focus"}</Text>
              <Text style={styles.heroFocusValue}>{dailyGoalPct}%</Text>
            </View>
            <View style={styles.heroProgressTrack}>
              <View style={[styles.heroProgressFill, { width: `${dailyGoalPct}%` }]} />
            </View>
            <Text style={styles.heroFocusText}>
              {remainingQuestions === 0
                ? 'Daily target complete. Use Mock or Mistakes next.'
                : `${remainingQuestions} questions left for today's target.`}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Pressable
              style={({ pressed }) => [styles.statPill, pressed && styles.pressedSoft]}
              onPress={() => user && router.push('/streak-freeze')}
              disabled={!user}
              accessibilityRole="button"
              accessibilityLabel={
                user
                  ? `${stats.streakDays}-day streak. ${streakFreezes} freeze${streakFreezes === 1 ? '' : 's'}. Tap to manage.`
                  : `${stats.streakDays}-day streak`
              }
            >
              <View style={styles.statIconWrap}>
                <Ionicons name="flame" size={20} color={colors.flame} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={styles.statVal}>{stats.streakDays}</Text>
                {user && streakFreezes > 0 ? (
                  <View style={styles.statFreezeRow}>
                    <Text style={styles.statLbl} numberOfLines={1}>
                      {streakLabel}
                    </Text>
                    <Ionicons name="snow" size={11} color={colors.accent} />
                    <Text style={[styles.statLbl, { color: colors.accent }]}>{streakFreezes}</Text>
                  </View>
                ) : (
                  <Text style={styles.statLbl} numberOfLines={2}>
                    {streakLabel}
                  </Text>
                )}
              </View>
            </Pressable>
            <View style={styles.statPill}>
              <View style={styles.statIconWrap}>
                <Ionicons name="checkmark-done" size={20} color={colors.accent} />
              </View>
              <View style={styles.statTextWrap}>
                <Text style={styles.statVal}>{questionsDone}</Text>
                <Text style={styles.statLbl} numberOfLines={2}>
                  questions today
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.statPillReadiness, pressed && styles.pressedSoft]}
              onPress={() => readinessScore != null && setReadinessSheetOpen(true)}
              disabled={readinessScore == null}
              accessibilityRole="button"
              accessibilityLabel={
                readinessScore != null ? `${readinessScore}% ready. Tap for breakdown.` : 'No readiness score yet'
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
                <View style={styles.statEmptyRing}>
                  <Text style={[styles.statVal, { fontSize: 15 }]}>—</Text>
                </View>
              )}
              <Text style={styles.statLblCenter}>ready</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.sectionPad}>
          {user && pasapath ? (
            <View style={styles.pasapathCard}>
              <View style={styles.pasapathHead}>
                <Text style={styles.pasapathLbl}>{"Today's PasaPath"}</Text>
                <Pressable
                  onPress={() => router.push('/pasapath/week')}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="View PasaPath week"
                >
                  <View style={styles.weekLink}>
                    <Text style={styles.weekLinkText}>Week</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </View>
                </Pressable>
              </View>
              <Text style={styles.pasapathMeta}>
                {pasapath.days_until_exam} days left · {pasapath.daily_minutes} min planned
                {examCountdown ? ` · ${examCountdown.targetLabel}` : ''}
              </Text>

              {weakTopic ? (
                <Pressable style={styles.weakChip} onPress={startWeakAreaPractice}>
                  <Ionicons name="trending-down" size={14} color={colors.error} />
                  <Text style={styles.weakChipText}>Weak area: {weakTopic.topicName}</Text>
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
                  <Text style={styles.primaryCtaText} numberOfLines={1}>
                    {nextTask.title} · {nextTask.minutes} min
                  </Text>
                </Pressable>
              ) : pasapathComplete ? (
                <View style={[styles.primaryCta, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.primaryCtaText}>PasaPath complete for today</Text>
                </View>
              ) : null}

              {visiblePasapathTasks.filter((task) => task.id !== nextTask?.id || task.completed).map((task) => (
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
                  <View style={styles.pasapathTaskCopy}>
                    <Text style={styles.pasapathTaskTitle}>{task.title}</Text>
                    <Text style={styles.pasapathTaskSub}>
                      {task.completed
                        ? 'Done for today'
                        : task.type === 'mistakes' && task.question_count === 0
                          ? 'Take a quiz first to build mistakes'
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
              <Text style={styles.pasapathLbl}>{"Today's PasaPath"}</Text>
              <Text style={[styles.pasapathMeta, { marginBottom: spacing.md }]}>
                Tapusin ang unang quiz para mabuo ang daily study plan mo.
              </Text>
              <PrimaryButton label="Magsimulang mag-practice" onPress={() => void startPractice()} />
            </View>
          ) : null}

          <LinearGradient colors={[...gradients.gold]} style={styles.goalCard}>
            <GoalRing percent={dailyGoalPct} />
            <View style={{ flex: 1 }}>
              <Text style={styles.goalLbl}>Goal ngayong araw</Text>
              <Text style={styles.goalTitle}>
                {questionsDone} / {questionsTarget} questions
              </Text>
              <Text style={styles.goalHint}>
                {questionsDone >= questionsTarget
                  ? 'Tapos na ang goal mo ngayon.'
                  : user
                    ? `${remainingQuestions} na lang para matapos ang target.`
                    : `${remainingQuestions} na lang para matapos ang target.`}
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

          <Pressable
            style={styles.continueCard}
            onPress={() => void startPractice()}
            accessibilityRole="button"
            accessibilityLabel={`${hasActivity ? 'Continue review' : 'Start review'} for ${examName || 'your exam'}`}
            accessibilityHint="Starts a practice quiz"
          >
            <View style={styles.continueRow}>
              <View style={styles.continueIcon}>
                <Text style={styles.continueAbbr}>{examAbbr(examSlug)}</Text>
              </View>
              <View style={styles.continueCopy}>
                <Text style={styles.continueLbl}>
                  {hasActivity ? 'Ituloy ang review' : 'Simulan ang review'}
                </Text>
                <Text style={styles.continueTitle}>{examName || 'Your exam'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.continueMeta}>
              {hasActivity
                ? `${stats.sessionCount} quiz${stats.sessionCount === 1 ? '' : 'zes'} completed`
                : 'Simulan ang unang quiz mo.'}
            </Text>
          </Pressable>

          <View style={styles.quickActions}>
            {[
              {
                label: 'Practice',
                sub: '12-item set',
                icon: 'flash-outline' as const,
                onPress: () => void startPractice(),
              },
              {
                label: 'Mock',
                sub: 'Timed exam',
                icon: 'document-text-outline' as const,
                onPress: () => void launchMock(),
              },
              {
                label: 'Mistakes',
                sub: 'Review misses',
                icon: 'alert-circle-outline' as const,
                onPress: () => router.push('/mistakes'),
              },
              {
                label: 'Flashcards',
                sub: 'Due cards',
                icon: 'layers-outline' as const,
                onPress: () => router.push({ pathname: '/flashcards', params: { examSlug } }),
              },
            ].map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.quickAction, pressed && styles.cardPressed]}
                onPress={action.onPress}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name={action.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.quickActionCopy}>
                  <Text style={styles.quickActionText}>{action.label}</Text>
                  <Text style={styles.quickActionSub}>{action.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {subjects.length > 0 ? (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Mabilis na practice</Text>
              </View>
              {subjects.map((subject, index) => (
                <Pressable
                  key={subject.id}
                  style={({ pressed }) => [styles.quickRow, pressed && styles.cardPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${subject.name} topics. ${subjectCardMeta(subject)}`}
                  onPress={() =>
                    router.push({
                      pathname: '/study/[subjectSlug]',
                      params: { subjectSlug: subject.slug, examSlug, subjectName: subject.name },
                    })
                  }
                >
                  <View style={[styles.quickIcon, { backgroundColor: colors.primaryMuted }]}>
                    <Ionicons name={subjectIcon(index)} size={21} color={colors.primary} />
                  </View>
                  <View style={styles.quickCopy}>
                    <Text style={styles.quickName}>{subject.name}</Text>
                    <Text style={styles.quickMeta}>{subjectCardMeta(subject)}</Text>
                    {subject.topics.length > 0 ? (
                      <View style={styles.quickTopics}>
                        {subject.topics.slice(0, 3).map((topic) => (
                          <View key={topic.id} style={styles.quickTopicChip}>
                            <Text style={styles.quickTopicText} numberOfLines={1}>
                              {topic.name}
                            </Text>
                          </View>
                        ))}
                        {subject.topics.length > 3 ? (
                          <Text style={styles.quickTopicMore}>+{subject.topics.length - 3} more</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.quickTopicAction}>
                    <Text style={styles.quickTopicActionCount}>{subject.readyTopicCount || subject.topics.length}</Text>
                    <Text style={styles.quickTopicActionLabel}>topics</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
            </>
          ) : null}

          <View style={styles.lowerSection}>
            {!user ? (
              <Pressable
                style={styles.guestBanner}
                onPress={() => router.push('/(auth)/login')}
                accessibilityRole="button"
                accessibilityLabel="Log in to save progress"
              >
                <Text style={styles.guestBannerTitle}>Mag-log in para ma-save ang progress mo</Text>
                <Text style={styles.guestBannerSub}>
                  PasaPath, streak, Mistake Bank, at readiness — naka-sync lahat kapag may account ka.
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
            ? 'Reminders are on. Manage the schedule in Settings.'
            : 'Want to turn on daily study reminders?'
        }
        onClose={() => setNotificationSheetOpen(false)}
        actions={
          prefs.notificationsEnabled
            ? [
                {
                  label: 'Go to Settings',
                  onPress: () => {
                    setNotificationSheetOpen(false);
                    router.push('/settings');
                  },
                },
                { label: 'OK', onPress: () => setNotificationSheetOpen(false), variant: 'outline' },
              ]
            : [
                {
                  label: 'Enable reminders',
                  onPress: () => {
                    setNotificationsEnabled(true);
                    setNotificationSheetOpen(false);
                  },
                },
                {
                  label: 'Go to Settings',
                  onPress: () => {
                    setNotificationSheetOpen(false);
                    router.push('/settings');
                  },
                  variant: 'outline',
                },
                { label: 'Not now', onPress: () => setNotificationSheetOpen(false), variant: 'ghost' },
              ]
        }
      />

      <AppSheet
        visible={updatesSheetOpen}
        title="Updates"
        subtitle="News and tips from the ReviewNatin team"
        onClose={() => setUpdatesSheetOpen(false)}
        actions={[{ label: 'OK', onPress: () => setUpdatesSheetOpen(false), variant: 'outline' }]}
      >
        {announcements.map((announcement) => (
          <View key={announcement.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, flex: 1 }}>
                {announcement.title}
              </Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textLight }}>
                {new Date(announcement.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 }}>
              {announcement.body}
            </Text>
          </View>
        ))}
      </AppSheet>

      <StreakMilestoneModal
        visible={milestoneVisible}
        streakDays={stats.streakDays}
        onClose={() => setMilestoneVisible(false)}
      />
    </View>
  );
}
