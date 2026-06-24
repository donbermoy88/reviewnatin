import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { ErrorBoundary } from '../../components/error-boundary';
import { GuestNextStepCard } from '../../components/guest-next-step-card';
import { FreeDailyLimitStrip } from '../../components/dashboard/free-daily-limit-strip';
import { HomeStudyInsights } from '../../components/dashboard/home-study-insights';
import { GoalRing } from '../../components/goal-ring';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessBreakdownSheet } from '../../components/readiness-breakdown-sheet';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createDashboardStyles } from '../../lib/themed-styles';
import { fetchExamBySlug, fetchSubjectAreas } from '../../lib/api/catalog';
import { fetchTopicQuestionCounts, fetchTopicsBySubjectSlug, type TopicRow } from '../../lib/api/topics';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchTodayPasaPath, type PasaPathPlan, type PasaPathTask } from '../../lib/api/pasapath';
import { fetchLatestReadiness, type ReadinessSnapshot } from '../../lib/api/readiness';
import { fetchPracticeStats } from '../../lib/api/stats';
import { fetchGuestPracticeStats } from '../../lib/guest-quiz-history';
import { ExamCountdownCard } from '../../components/exam-countdown-card';
import { ContentGateBanner } from '../../components/content-gate-banner';
import { Skeleton, SkeletonCard } from '../../components/skeleton';
import { AdBanner } from '../../components/ad-banner';
import { ScreenBackground } from '../../components/screen-background';
import { fetchContentGateStatus, type ContentGateStatus } from '../../lib/content-gate';
import { fetchAppAnnouncements, type AppAnnouncement } from '../../lib/api/announcements';
import { fetchExamSchedules } from '../../lib/api/exam-calendar';
import { formatExamCountdown } from '../../lib/exam-countdown';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { GUEST_SAVE_PROGRESS } from '../../lib/product-copy';
import { canStartPractice } from '../../lib/paywall';
import { scheduleDailyReminder, scheduleExamReminders } from '../../lib/notifications';
import { fetchDueFlashcardCount } from '../../lib/api/flashcards';
import { fetchTopicAnalytics, type SubjectAnalytics, type TopicAnalyticsRow } from '../../lib/api/analytics';
import { trackEvent } from '../../lib/analytics/events';
import { fetchDailyStudyTrend, type DailyStudyPoint } from '../../lib/api/study-trend';
import { buildAnalyticsInsights } from '../../lib/analytics/insights';
import { runAfterInteractions } from '../../lib/performance/defer-after-interaction';
import { PASAPATH_COACH_MARK_KEY, PasaPathCoachMark } from '../../components/pasapath-coach-mark';
import { consumeOnboardingActivationPending } from '../../lib/onboarding-activation';
import { DEFAULT_EXAM_SLUG, EXAM_TYPES } from '@reviewnatin/shared';
import type { OnboardingData } from '../../lib/onboarding-store';
import type { SubjectArea } from '../../lib/types';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { resolveMonthlyPlusDisplay } from '../../lib/subscription/pricing-display';
import { usePreferences } from '../../providers/preferences-provider';
import { useUserProfile } from '../../hooks/use-user-profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StreakMilestoneModal, isStreakMilestone } from '../../components/streak-milestone-modal';

const APP_ICON = require('../../assets/icon.png');

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Magandang umaga,';
  if (h < 18) return 'Magandang hapon,';
  return 'Magandang gabi,';
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

function cleanExamName(name: string): string {
  return name
    .replace(/CSE[\s\u200B-\u200D\uFEFF]*Professional/gi, 'CSE Professional')
    .replace(/\b([A-Z]{2,})([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bCse\b/g, 'CSE')
    .replace(/\bPnle\b/g, 'PNLE')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatExamDisplayName(examSlug: string, examName: string): string {
  const source = examName || examSlug;
  const canonical = source
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
  if (canonical.includes('cseprofessional')) return 'CSE Professional';
  if (canonical.includes('csesubprofessional') || canonical.includes('csesub')) return 'CSE Subprofessional';
  return cleanExamName(source || 'Your exam');
}

function pickWeakTopic(subjects: { weakTopics: TopicAnalyticsRow[] }[]): TopicAnalyticsRow | null {
  for (const subject of subjects) {
    if (subject.weakTopics.length > 0) return subject.weakTopics[0];
  }
  return null;
}

type ReadinessStage = {
  label: 'Diagnostic' | 'Mocks' | 'Coverage' | 'Mistakes';
  value: number | null;
};

function ReadinessStageProgress({
  stages,
  styles,
  colors,
}: {
  stages: ReadinessStage[];
  styles: ReturnType<typeof createDashboardStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const firstIncomplete = stages.findIndex((stage) => stage.value == null || stage.value < 70);
  const currentIndex = firstIncomplete === -1 ? stages.length - 1 : firstIncomplete;

  return (
    <View style={styles.stageWrap}>
      <View style={styles.stageTrackRow}>
        {stages.map((stage, index) => {
          const done = (stage.value ?? 0) >= 70;
          const current = index === currentIndex && !done;
          const known = stage.value != null;
          const active = done || current || known;
          const nodeColor = done ? colors.accent : active ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.28)';
          const connectorColor = index < currentIndex || done ? colors.accent : 'rgba(255,255,255,0.24)';

          return (
            <View key={stage.label} style={styles.stageTrackSegment}>
              <View style={[styles.stageNode, { backgroundColor: nodeColor }]}>
                {done ? <Ionicons name="checkmark" size={13} color={colors.primaryDark} /> : null}
              </View>
              {index < stages.length - 1 ? (
                <View style={[styles.stageConnector, { backgroundColor: connectorColor }]} />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={styles.stageLabelRow}>
        {stages.map((stage) => (
          <Text key={stage.label} style={styles.stageLabel} numberOfLines={1}>
            {stage.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

function PremiumStudyPackArt({
  styles,
  colors,
  floatAnim,
}: {
  styles: ReturnType<typeof createDashboardStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  floatAnim: Animated.Value;
}) {
  const floatStyle = {
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        }),
      },
      { rotate: '-7deg' },
    ],
  };

  return (
    <Animated.View style={[styles.plusArtScene, floatStyle]} pointerEvents="none">
      <View style={styles.plusArtGlow} />
      <View style={styles.plusArtBase}>
        <Image source={APP_ICON} style={styles.plusArtIcon} resizeMode="cover" />
      </View>
      <View style={styles.plusArtCrown}>
        <Ionicons name="sparkles" size={23} color={colors.primaryDark} />
      </View>
      <Ionicons name="star" size={10} color={colors.accent} style={styles.plusArtSparkleA} />
      <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.72)" style={styles.plusArtSparkleB} />
    </Animated.View>
  );
}

function DashboardScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing } = theme;
  const styles = useMemo(() => createDashboardStyles(theme), [theme]);
  const { user } = useAuth();
  const { isPremium, products, storePrices } = useEntitlements();
  const { displayName } = useUserProfile('Guest');
  const { prefs, setNotificationsEnabled } = usePreferences();
  const [introAnim] = useState(() => new Animated.Value(0));
  const [floatAnim] = useState(() => new Animated.Value(0));
  const [goal, setGoal] = useState<OnboardingData | null>(null);
  const [examName, setExamName] = useState('');
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessSnapshot | null>(null);
  const [subjects, setSubjects] = useState<HomeSubjectCard[]>([]);
  const [subjectCount, setSubjectCount] = useState(0);
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
  const [subjectAnalytics, setSubjectAnalytics] = useState<SubjectAnalytics[]>([]);
  const [studyTrend, setStudyTrend] = useState<DailyStudyPoint[]>([]);
  const [coachMarkVisible, setCoachMarkVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [readinessSheetOpen, setReadinessSheetOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [updatesSheetOpen, setUpdatesSheetOpen] = useState(false);
  const [milestoneVisible, setMilestoneVisible] = useState(false);

  useEffect(() => {
    Animated.timing(introAnim, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    floating.start();
    return () => floating.stop();
  }, [floatAnim, introAnim]);

  const load = useCallback(async () => {
    try {
      const merged = await resolveOnboardingGoal(user?.id);
      setGoal(merged);
      const slug = merged?.examSlug ?? DEFAULT_EXAM_SLUG;
      const target = dailyQuestionTarget(merged?.dailyMinutes ?? 30);

      if (user) {
        try {
          const [practiceStats, gate, todayPasa, latestReadiness] = await Promise.all([
            fetchPracticeStats(user.id, target, slug).then(async (s) => {
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
          ]);
          setStats(practiceStats);
          setContentGate(gate);
          setPasapath(todayPasa);
          setReadiness(latestReadiness);

          runAfterInteractions(async () => {
            const [analytics, trend] = await Promise.all([
              fetchTopicAnalytics(slug).catch(() => ({ subjects: [], allTopics: [] })),
              fetchDailyStudyTrend(user.id, slug).catch(() => []),
            ]);
            setSubjectAnalytics(analytics.subjects);
            setWeakTopic(pickWeakTopic(analytics.subjects));
            setStudyTrend(trend);
          });
        } catch {
          setStats((s) => ({ ...s, questionsTarget: target }));
        }
      } else {
        setPasapath(null);
        setReadiness(null);
        setWeakTopic(null);
        setSubjectAnalytics([]);
        setStudyTrend([]);
        try {
          setStats(await fetchGuestPracticeStats(slug, target));
        } catch {
          setStats((s) => ({ ...s, questionsTarget: target }));
        }
        setLoading(false);
        setRefreshing(false);

        runAfterInteractions(async () => {
          const exam = await fetchExamBySlug(slug).catch(() => null);
          if (exam) {
            setExamName(exam.name);
            setExamTypeId(exam.id);
            const areas = await fetchSubjectAreas(exam.id).catch(() => []);
            setSubjectCount(areas.length);
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
            setSubjectCount(0);
          }

          const [gate, appAnnouncements] = await Promise.all([
            fetchContentGateStatus(slug).catch(() => null),
            fetchAppAnnouncements(slug, 3).catch(() => []),
          ]);
          setContentGate(gate);
          setAnnouncements(appAnnouncements);
        });
        return;
      }

      const exam = await fetchExamBySlug(slug).catch(() => null);
      if (exam) {
        setExamName(exam.name);
        setExamTypeId(exam.id);
        const areas = await fetchSubjectAreas(exam.id).catch(() => []);
        setSubjectCount(areas.length);
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
        setSubjectCount(0);
      }

      if (!user) {
        setContentGate(await fetchContentGateStatus(slug).catch(() => null));
      }
      setAnnouncements(await fetchAppAnnouncements(slug, 3).catch(() => []));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

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

  const dismissCoachMark = useCallback(async () => {
    setCoachMarkVisible(false);
    await AsyncStorage.setItem(PASAPATH_COACH_MARK_KEY, 'seen').catch(() => {});
  }, []);

  const analyticsInsights = useMemo(
    () => buildAnalyticsInsights(subjectAnalytics, stats.accuracyPercent),
    [subjectAnalytics, stats.accuracyPercent]
  );

  useEffect(() => {
    if (subjectAnalytics.length === 0) return;
    trackEvent('dashboard_charts_viewed', {
      subject_count: subjectAnalytics.length,
      has_study_trend: studyTrend.length > 0,
      screen: 'home',
    });
  }, [subjectAnalytics.length, studyTrend.length]);

  const premium = isPremium(examTypeId);
  const readinessScore = readiness?.score ?? pasapath?.readiness_hint ?? null;
  const questionsTarget = stats.questionsTarget;
  const questionsDone = stats.questionsToday;
  const dailyGoalPct = questionsTarget > 0 ? Math.min(100, Math.round((questionsDone / questionsTarget) * 100)) : 0;
  const hasActivity = stats.sessionCount > 0;
  const visiblePasapathTasks = pasapath ? filterVisiblePasapathTasks(pasapath.tasks) : [];
  const nextTask = pasapath ? primaryPasapathTask(pasapath.tasks) : null;

  useEffect(() => {
    if (loading) return;
    void consumeOnboardingActivationPending().then((pending) => {
      if (!pending) return;
      if (user && pasapath && nextTask) {
        setCoachMarkVisible(true);
        return;
      }
      if (!user) {
        trackEvent('onboarding_activation_shown', { cohort: 'guest' });
      }
    });
  }, [user, loading, pasapath, nextTask]);

  useEffect(() => {
    if (!user || loading || !pasapath || !nextTask) return;
    void AsyncStorage.getItem(PASAPATH_COACH_MARK_KEY).then((seen) => {
      if (!seen) setCoachMarkVisible(true);
    });
  }, [user, loading, pasapath, nextTask]);

  const pasapathComplete =
    visiblePasapathTasks.length > 0 && visiblePasapathTasks.every((task) => task.completed);
  const completedPasapathTasks = visiblePasapathTasks.filter((task) => task.completed).length;
  const remainingPasapathTasks = Math.max(visiblePasapathTasks.length - completedPasapathTasks, 0);
  const examCountdown = goal?.targetDate ? formatExamCountdown(goal.targetDate) : null;
  const firstName = user ? displayName.split(/\s+/)[0] ?? displayName : 'Guest';
  const remainingQuestions = Math.max(questionsTarget - questionsDone, 0);
  const monthlyPlusPriceText = resolveMonthlyPlusDisplay(products, storePrices);
  const displayExamName = formatExamDisplayName(examSlug, examName);
  const dailyGoalText =
    questionsDone >= questionsTarget
      ? 'Goal complete today'
      : `${remainingQuestions} question${remainingQuestions === 1 ? '' : 's'} left`;
  const completedQuizText =
    stats.sessionCount > 0
      ? `${stats.sessionCount} quiz${stats.sessionCount === 1 ? '' : 'zes'} completed`
      : user
        ? 'Start your first quiz'
        : 'Log in to save progress';
  const planStatusText = pasapathComplete
    ? 'Plan complete. Use Mock or Mistakes for extra reps.'
    : nextTask
      ? `${nextTask.title} is the best next step.`
      : 'Start a practice set to generate a smarter plan.';
  const readinessFactors = readiness?.factors;
  const readinessStages: ReadinessStage[] = [
    { label: 'Diagnostic', value: readinessFactors?.diagnostic_score ?? (readinessScore != null ? readinessScore : null) },
    { label: 'Mocks', value: readinessFactors?.mock_score_avg ?? null },
    { label: 'Coverage', value: readinessFactors?.topic_coverage_pct ?? null },
    { label: 'Mistakes', value: readinessFactors?.mistake_mastery_pct ?? null },
  ];

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

  const quickPracticeItems = (subjectAnalytics.length > 0
    ? subjectAnalytics.slice(0, 3).map((s) => {
        const topic = s.weakTopics[0] ?? s.topics[0] ?? null;
        return {
          name: s.subjectName,
          pct: Math.round(s.averageAccuracy),
          hasData: s.topics.some((t) => t.attempts > 0),
          topicSlug: topic?.topicSlug,
          subjectSlug: subjects.find((subject) => subject.name === s.subjectName)?.slug,
        };
      })
    : subjects.slice(0, 3).map((s) => ({
        name: s.name,
        pct: 0,
        hasData: false,
        topicSlug: s.topics[0]?.slug,
        subjectSlug: s.slug,
      }))
  ).slice(0, 3);

  const openQuickPractice = (item: { topicSlug?: string; subjectSlug?: string; name: string }) => {
    if (!ensurePracticeAllowed()) return;
    if (item.topicSlug) {
      router.push({ pathname: '/practice/quiz', params: { examSlug, topicSlug: item.topicSlug } });
      return;
    }
    if (item.subjectSlug) {
      router.push({
        pathname: '/study/[subjectSlug]',
        params: { subjectSlug: item.subjectSlug, examSlug, subjectName: item.name },
      });
      return;
    }
    void startPractice();
  };
  const entranceStyle = {
    opacity: introAnim,
    transform: [
      {
        translateY: introAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <ScrollView
          contentContainerStyle={tabScrollPadding(insets)}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        >
          <LinearGradient
            colors={[...gradients.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.homeHeroCard, { marginTop: insets.top + spacing.sm }]}
          >
            <View style={styles.homeHeroHeader}>
              <Skeleton width={58} height={58} radius={29} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <View style={{ flex: 1 }}>
                <Skeleton width="46%" height={14} radius={7} style={{ backgroundColor: 'rgba(255,255,255,0.22)' }} />
                <Skeleton width="64%" height={24} radius={8} style={{ marginTop: 6, backgroundColor: 'rgba(255,255,255,0.22)' }} />
              </View>
              <Skeleton width={52} height={52} radius={16} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
            </View>
            <View style={styles.homeHeroDivider} />
            <View style={styles.homeHeroRow}>
              <Skeleton width={104} height={104} radius={52} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="70%" height={16} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.22)' }} />
                <Skeleton width="90%" height={12} radius={6} style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} />
                <Skeleton width="100%" height={20} radius={10} style={{ marginTop: spacing.sm, backgroundColor: 'rgba(255,255,255,0.18)' }} />
              </View>
            </View>
          </LinearGradient>
          <View style={styles.sectionPad}>
            <SkeletonCard lines={3} style={{ marginBottom: spacing.md }} />
            <SkeletonCard lines={2} style={{ marginBottom: spacing.md }} />
            <SkeletonCard lines={2} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
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
        <Animated.View style={entranceStyle}>
          <LinearGradient
            colors={[...gradients.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.homeHeroCard, { marginTop: insets.top + spacing.sm }]}
          >
          <View style={styles.homeHeroHeader}>
            <View style={styles.homeAvatar}>
              <Text style={styles.homeAvatarText}>{(firstName[0] ?? 'R').toUpperCase()}</Text>
            </View>
            <View style={styles.homeGreetCol}>
              <Text style={styles.homeGreetTop} numberOfLines={1}>{timeGreeting()}</Text>
              <Text style={styles.homeGreetName} numberOfLines={1}>{firstName} 👋</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.homeBell, pressed && styles.pressedSoft]}
              onPress={() => setNotificationSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={
                announcements.length > 0
                  ? `${announcements.length} update${announcements.length === 1 ? '' : 's'} and daily reminders`
                  : 'Daily reminders'
              }
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {announcements.length > 0 ? (
                <View style={styles.homeBellBadge}>
                  <Text style={styles.homeBellBadgeText}>{Math.min(announcements.length, 9)}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
          <View style={styles.homeHeroDivider} />
          <View style={styles.homeHeroRow}>
            <Pressable
              onPress={() => readinessScore != null && setReadinessSheetOpen(true)}
              disabled={readinessScore == null}
              accessibilityRole="button"
              accessibilityLabel={
                readinessScore != null ? `${readinessScore}% ready. Tap for breakdown.` : 'No readiness score yet'
              }
            >
              <View style={styles.homeReadinessBlock}>
                {readinessScore != null ? (
                  <GoalRing
                    percent={readinessScore}
                    size={84}
                    strokeWidth={9}
                    trackColor="rgba(255,255,255,0.14)"
                    fillColor={colors.accent}
                    labelColor="#fff"
                  />
                ) : (
                  <View style={[styles.heroEmptyRing, { width: 84, height: 84, borderRadius: 42, borderWidth: 9 }]}>
                    <Text style={[styles.heroEmptyRingText, { fontSize: 24 }]}>—</Text>
                  </View>
                )}
                <Text style={styles.homeReadinessLabel}>Readiness</Text>
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.homeHeroExam} numberOfLines={1}>{displayExamName}</Text>
              {examCountdown ? (
                <Text style={styles.homeHeroSub} numberOfLines={2}>
                  Exam in <Text style={styles.homeHeroSubAccent}>{examCountdown.daysLeft} days</Text>
                  {examCountdown.targetLabel ? ` · ${examCountdown.targetLabel}` : ''}
                </Text>
              ) : (
                <Text style={styles.homeHeroSub} numberOfLines={2}>{planStatusText}</Text>
              )}
              <ReadinessStageProgress stages={readinessStages} styles={styles} colors={colors} />
            </View>
          </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.sectionPad, entranceStyle]}>
          {!user ? (
            <GuestNextStepCard
              questionsToday={stats.questionsToday}
              onPractice={() => void startPractice()}
              onBrowseSubjects={() => router.push('/(tabs)/study')}
              onSignup={() => router.push('/(auth)/signup')}
            />
          ) : null}

          {user && !premium ? (
            <FreeDailyLimitStrip
              questionsToday={stats.questionsToday}
              onUpgrade={() => router.push('/subscribe')}
            />
          ) : null}

          <View style={styles.planRow}>
            <View style={styles.planGoalCard}>
              <GoalRing
                percent={dailyGoalPct}
                size={62}
                strokeWidth={7}
                trackColor={colors.primaryMuted}
                fillColor={colors.primary}
                labelColor={colors.text}
              />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.planGoalTitle}>Daily goal</Text>
                <Text style={styles.planGoalHint}>
                  {dailyGoalText}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.planContinueCard, pressed && styles.cardPressed]}
              onPress={() => void startPractice()}
              accessibilityRole="button"
              accessibilityLabel={`${hasActivity ? 'Continue review' : 'Start review'} for ${displayExamName}`}
            >
              <View>
                <Text style={styles.planContinueLbl}>Continue</Text>
                <Text style={styles.planContinueTitle} numberOfLines={2}>{displayExamName}</Text>
                <Text style={styles.planContinueMeta}>
                  {completedQuizText}
                </Text>
              </View>
              <View style={styles.planResumeBtn}>
                <Text style={styles.planResumeBtnText}>{hasActivity ? 'Resume' : 'Start'}</Text>
                <Ionicons name="play" size={13} color={colors.primary} />
              </View>
            </Pressable>
          </View>

          {examCountdown ? (
            <ExamCountdownCard
              theme={theme}
              countdown={examCountdown}
              examName={displayExamName}
              onPress={() => router.push('/exam-calendar')}
              onPlusPress={!premium ? () => router.push('/subscribe') : undefined}
            />
          ) : null}

          <View style={styles.sectionHead}>
            <View style={styles.sectionHeadCopy}>
              <Text style={styles.sectionTitle}>Quick practice</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/study')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="See all subjects"
            >
              <View style={styles.weekLink}>
                <Text style={styles.weekLinkText}>See all</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.primary} />
              </View>
            </Pressable>
          </View>
          <View style={styles.qpTrioWrap}>
            {quickPracticeItems.map((qp, i) => {
              const barColor =
                !qp.hasData ? colors.border : qp.pct >= 75 ? colors.success : qp.pct >= 50 ? colors.accentDark : colors.error;
              const textColor =
                !qp.hasData ? colors.textMuted : qp.pct >= 75 ? colors.success : qp.pct >= 50 ? colors.accentDark : colors.error;
              return (
                <Pressable
                  key={qp.name + i}
                  style={({ pressed }) => [styles.qpCard, pressed && styles.cardPressed]}
                  onPress={() => openQuickPractice(qp)}
                  accessibilityRole="button"
                  accessibilityLabel={`${qp.name}${qp.hasData ? ` ${qp.pct}% mastery` : ''}`}
                >
                  <View style={styles.qpCardIcon}>
                    <Ionicons name="flash" size={17} color={colors.primary} />
                  </View>
                  <Text style={styles.qpCardName} numberOfLines={2}>{qp.name}</Text>
                  <Text style={[styles.qpCardMeta, { color: textColor }]} numberOfLines={1}>
                    {qp.hasData ? `${qp.pct}% mastery` : 'Start quiz'}
                  </Text>
                  <View style={styles.qpCardBar}>
                    <View
                      style={[
                        styles.qpCardBarFill,
                        { width: `${qp.hasData ? qp.pct : 0}%`, backgroundColor: barColor },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>

          {user ? (
            <HomeStudyInsights
              studyTrend={studyTrend}
              subjectAnalytics={subjectAnalytics}
              insights={analyticsInsights}
              onOpenAnalytics={() => router.push('/analytics')}
            />
          ) : null}

          {!premium ? (
            <Pressable
              onPress={() => router.push('/subscribe')}
              accessibilityRole="button"
              accessibilityLabel="See ReviewNatin Plus plans"
              style={({ pressed }) => pressed && styles.cardPressed}
            >
              <LinearGradient
                colors={[...gradients.hero]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.plusUpsell}
              >
                <View style={styles.plusUpsellBadge}>
                  <Ionicons name="star" size={11} color={colors.primaryDark} />
                  <Text style={styles.plusUpsellBadgeText}>PLUS</Text>
                </View>
                <Text style={styles.plusUpsellTitle}>Full mocks & offline packs{'\n'}No ads while you study</Text>
                <Text style={styles.plusUpsellSub}>From {monthlyPlusPriceText}/mo · cancel anytime</Text>
                <PremiumStudyPackArt styles={styles} colors={colors} floatAnim={floatAnim} />
              </LinearGradient>
            </Pressable>
          ) : null}

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

              <View style={styles.planSummaryRow}>
                <View style={styles.planSummaryPill}>
                  <Text style={styles.planSummaryValue}>{completedPasapathTasks}</Text>
                  <Text style={styles.planSummaryLabel}>done</Text>
                </View>
                <View style={styles.planSummaryPill}>
                  <Text style={styles.planSummaryValue}>{remainingPasapathTasks}</Text>
                  <Text style={styles.planSummaryLabel}>left</Text>
                </View>
                <View style={styles.planSummaryPillWide}>
                  <Ionicons name="time-outline" size={15} color={colors.primary} />
                  <Text style={styles.planSummaryLabel}>{pasapath.daily_minutes} min plan</Text>
                </View>
              </View>

              {weakTopic ? (
                <Pressable style={styles.weakChip} onPress={startWeakAreaPractice}>
                  <Ionicons name="trending-down" size={14} color={colors.error} />
                  <Text style={styles.weakChipText}>Weak area: {weakTopic.topicName}</Text>
                </Pressable>
              ) : null}

              {nextTask && !pasapathComplete ? (
                <View style={styles.nextStepBlock}>
                  <Text style={styles.nextStepLabel}>Recommended next</Text>
                  <Text style={styles.nextStepTitle} numberOfLines={2}>
                    {nextTask.title}
                  </Text>
                  <Pressable
                    style={styles.primaryCta}
                    onPress={() => runPasapathTask(nextTask)}
                    accessibilityRole="button"
                    accessibilityLabel={primaryCtaLabel(nextTask)}
                  >
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={styles.primaryCtaText} numberOfLines={1}>
                      Start next step · {nextTask.minutes} min
                    </Text>
                  </Pressable>
                </View>
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
                Finish one quiz to build your daily study plan.
              </Text>
              <PrimaryButton label="Start practice" onPress={() => void startPractice()} />
            </View>
          ) : null}

          {subjects.length > 0 ? (
            <>
              <View style={styles.sectionHead}>
                <View style={styles.sectionHeadCopy}>
                  <Text style={styles.sectionTitle}>Subject shortcuts</Text>
                  <Text style={styles.sectionSub}>Jump into review areas with ready questions.</Text>
                </View>
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
                    <Text style={styles.quickTopicActionLabel}>ready</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </Pressable>
              ))}
              {subjectCount > subjects.length ? (
                <Pressable
                  style={({ pressed }) => [styles.quickAllSubjectsRow, pressed && styles.cardPressed]}
                  onPress={() => router.push('/(tabs)/study')}
                  accessibilityRole="button"
                  accessibilityLabel={`View all ${subjectCount} subjects`}
                >
                  <View style={styles.quickAllSubjectsIcon}>
                    <Ionicons name="grid-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickAllSubjectsTitle}>View all subjects</Text>
                    <Text style={styles.quickAllSubjectsMeta}>
                      {subjectCount - subjects.length} more subject{subjectCount - subjects.length === 1 ? '' : 's'} in Review
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </>
          ) : null}

          <View style={styles.lowerSection}>
            {!user || (contentGate && !contentGate.meetsMinimum) || !premium || announcements.length > 0 ? (
              <View style={styles.sectionHead}>
                <View style={styles.sectionHeadCopy}>
                  <Text style={styles.sectionTitle}>Updates</Text>
                  <Text style={styles.sectionSub}>Account, content, and subscription notices.</Text>
                </View>
              </View>
            ) : null}

            {!user ? (
              <Pressable
                style={styles.guestBanner}
                onPress={() => router.push('/(auth)/signup')}
                accessibilityRole="button"
                accessibilityLabel={GUEST_SAVE_PROGRESS.ctaSignup}
              >
                <Text style={styles.guestBannerTitle}>{GUEST_SAVE_PROGRESS.title}</Text>
                <Text style={styles.guestBannerSub}>{GUEST_SAVE_PROGRESS.subtitle}</Text>
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
                <View style={styles.updatesIcon}>
                  <Ionicons name="megaphone-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.updatesCopy}>
                  <Text style={styles.updatesChipText} numberOfLines={1}>
                    {announcements.length} update{announcements.length === 1 ? '' : 's'}
                  </Text>
                  <Text style={styles.updatesChipSub} numberOfLines={1}>
                    {announcements[0].title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
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

      <PasaPathCoachMark
        visible={coachMarkVisible && Boolean(nextTask)}
        taskTitle={nextTask?.title}
        onDismiss={() => void dismissCoachMark()}
        onStart={() => {
          void dismissCoachMark();
          if (nextTask) runPasapathTask(nextTask);
        }}
      />
    </View>
  );
}

export default function DashboardScreen() {
  return (
    <ErrorBoundary>
      <DashboardScreenContent />
    </ErrorBoundary>
  );
}
