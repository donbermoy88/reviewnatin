import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnalyticsInsightCards, SubjectStrengthChart } from '../../components/analytics/subject-strength-chart';
import { IconButton } from '../../components/icon-button';
import { StudyTrendChart } from '../../components/analytics/study-trend-chart';
import { EmptyState } from '../../components/empty-state';
import { ErrorState } from '../../components/error-state';
import { MasteryBar } from '../../components/mastery-bar';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessBreakdownSheet } from '../../components/readiness-breakdown-sheet';
import { ScreenBackground } from '../../components/screen-background';
import { StackShell } from '../../components/stack-shell';
import { SegmentedReadinessBar } from '../../components/segmented-readiness-bar';
import { SimpleBarChart } from '../../components/simple-bar-chart';
import { useAppTheme } from '../../hooks/use-app-theme';
import { fetchTopicAnalytics, type SubjectAnalytics } from '../../lib/api/analytics';
import { fetchDailyStudyTrend, type DailyStudyPoint } from '../../lib/api/study-trend';
import { buildAnalyticsInsights } from '../../lib/analytics/insights';
import { trackEvent } from '../../lib/analytics/events';
import { fetchPracticeStats } from '../../lib/api/stats';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import {
  fetchLatestReadiness,
  getReadinessBand,
  type ReadinessSnapshot,
} from '../../lib/api/readiness';
import { createAnalyticsStyles } from '../../lib/themed-styles';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { useAuth } from '../../providers/auth-provider';

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors } = theme;
  const styles = useMemo(() => createAnalyticsStyles(theme), [theme]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [subjects, setSubjects] = useState<SubjectAnalytics[]>([]);
  const [studyTrend, setStudyTrend] = useState<DailyStudyPoint[]>([]);
  const [accuracyPercent, setAccuracyPercent] = useState<number | null>(null);
  const [readiness, setReadiness] = useState<ReadinessSnapshot | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const goal = await resolveOnboardingGoal(user?.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      setExamSlug(slug);

      if (!user) {
        setSubjects([]);
        setStudyTrend([]);
        setAccuracyPercent(null);
        setReadiness(null);
        return;
      }

      try {
        const goalMinutes = goal?.dailyMinutes ?? 30;
        const dailyTarget = { 15: 5, 30: 15, 45: 30, 60: 60 }[goalMinutes] ?? 15;
        const [analytics, latestReadiness, trend, practiceStats] = await Promise.all([
          fetchTopicAnalytics(slug),
          fetchLatestReadiness(slug),
          fetchDailyStudyTrend(user.id, slug),
          fetchPracticeStats(user.id, dailyTarget, slug),
        ]);
        setSubjects(analytics.subjects);
        setReadiness(latestReadiness);
        setStudyTrend(trend);
        setAccuracyPercent(practiceStats.accuracyPercent);
      } catch (e) {
        setLoadError(toUserFacingError(e, 'load'));
        setSubjects([]);
        setStudyTrend([]);
        setAccuracyPercent(null);
        setReadiness(null);
      }
    } catch (e) {
      setLoadError(toUserFacingError(e, 'load'));
      setSubjects([]);
      setReadiness(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || subjects.length === 0) return;
    trackEvent('analytics_screen_opened', {
      subject_count: subjects.length,
      has_study_trend: studyTrend.length > 0,
    });
  }, [loading, subjects.length, studyTrend.length]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const startQuick10 = () => {
    router.push({
      pathname: '/practice/quiz',
      params: { examSlug, mode: 'weak_area' },
    });
  };

  const readinessScore = readiness?.score ?? null;
  const readinessBand = readinessScore != null ? getReadinessBand(readinessScore) : null;
  const weakTopics = subjects.flatMap((s) => s.weakTopics);
  const weakTopicNames = weakTopics
    .map((t) => t.topicName)
    .slice(0, 6);
  const insights = useMemo(
    () => buildAnalyticsInsights(subjects, accuracyPercent),
    [subjects, accuracyPercent]
  );
  const emptyTrend = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        date: '',
        dayLabel: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i],
        questions: 0,
        sessions: 0,
      })),
    []
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <StackShell title="Analytics" subtitle="Readiness and weak-topic tracking">
        <EmptyState
          icon={<Ionicons name="analytics-outline" size={32} color={colors.primary} />}
          title="Mag-log in muna"
          description="Kailangan ng signed-in account para sa analytics at weak-topic tracking."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  if (loadError) {
    return (
      <StackShell title="Analytics" subtitle="Readiness and weak-topic tracking">
        <ErrorState
          description={loadError}
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        />
      </StackShell>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <IconButton
            variant="plain"
            buttonSize={40}
            size={24}
            icon="chevron-back"
            color={colors.primaryDark}
            hitSlop={8}
            accessibilityLabel="Go back"
            style={styles.backBtn}
            onPress={() => router.back()}
          />
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <Pressable
              style={styles.summarySettings}
              onPress={() => setBreakdownOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="View readiness breakdown"
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
            </Pressable>

            <Text style={styles.summaryTitle}>
              {readinessScore != null ? `${Math.round(readinessScore)}% exam ready` : 'Building your baseline'}
            </Text>
            <Text style={styles.summarySub}>
              {readinessBand?.label ?? 'Complete quizzes to unlock topic mastery charts.'}
            </Text>

            {readinessScore != null ? (
              <SegmentedReadinessBar score={readinessScore} style={styles.summarySegments} />
            ) : null}

            {weakTopics.length > 0 ? (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.weakBoxText, { marginBottom: 8 }]}>Accuracy by weak topic</Text>
                <SimpleBarChart
                  data={weakTopics.slice(0, 5).map((t) => ({
                    label: t.topicName.slice(0, 8),
                    value: Math.round(t.accuracy),
                  }))}
                  maxValue={100}
                  accessibilityLabel="Weak topic accuracy chart"
                />
              </View>
            ) : null}
          </View>

          <View style={{ gap: 12, marginBottom: 16 }}>
            <StudyTrendChart points={studyTrend.length > 0 ? studyTrend : emptyTrend} />
            <SubjectStrengthChart subjects={subjects} mode="weak" limit={4} />
            <SubjectStrengthChart subjects={subjects} mode="strong" limit={4} />
            <AnalyticsInsightCards insights={insights} />
          </View>

          {subjects.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="bar-chart-outline" size={32} color={colors.primary} />}
              title="No topic data yet"
              description="Answer practice questions to see your subject and topic mastery here."
              actionLabel="Start practicing"
              onAction={() =>
                router.push({ pathname: '/practice/quiz', params: { examSlug } })
              }
            />
          ) : (
            subjects.map((subject) => {
              const subjectPct =
                subject.averageAccuracy > 0 ? Math.round(subject.averageAccuracy) : 0;
              const hasSubjectData = subject.topics.some((t) => t.attempts > 0);

              return (
                <View key={subject.subjectName} style={styles.subjectCard}>
                  <View style={styles.subjectHead}>
                    <Text style={styles.subjectName}>{subject.subjectName}</Text>
                    <Text style={styles.subjectPct}>
                      {hasSubjectData ? `${subjectPct}%` : '—'}
                    </Text>
                  </View>

                  {subject.topics.map((topic, topicIndex) => {
                    const pct = topic.attempts > 0 ? Math.round(topic.accuracy) : 0;
                    const started = topic.attempts > 0;

                    return (
                      <View
                        key={topic.topicId}
                        style={[styles.topicRow, topicIndex === 0 && styles.topicRowFirst]}
                      >
                        <View style={styles.topicMeta}>
                          <Text style={styles.topicName} numberOfLines={2}>
                            {topic.topicName}
                          </Text>
                          <Text style={styles.topicPct}>
                            {started
                              ? `${pct}% · ${topic.attempts} ${topic.attempts === 1 ? 'try' : 'tries'}`
                              : 'Not started'}
                          </Text>
                        </View>
                        <MasteryBar
                          accuracy={pct}
                          attempts={topic.attempts}
                          style={styles.topicBar}
                          trackColor={colors.primaryMuted}
                        />
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          {weakTopics.length > 0 ? (
            <PrimaryButton
              label="Quick 10 · weak areas"
              icon="flash"
              size="lg"
              onPress={startQuick10}
              style={styles.cta}
            />
          ) : (
            <PrimaryButton
              label="Start practice to find weak areas"
              icon="flash"
              size="lg"
              onPress={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
              style={styles.cta}
            />
          )}
        </View>
      </ScrollView>

      <ReadinessBreakdownSheet
        visible={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        readiness={readiness}
      />
    </View>
  );
}
