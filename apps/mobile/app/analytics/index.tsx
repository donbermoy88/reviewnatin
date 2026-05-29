import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { MasteryBar } from '../../components/mastery-bar';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessBreakdownSheet } from '../../components/readiness-breakdown-sheet';
import { ScreenBackground } from '../../components/screen-background';
import { SegmentedReadinessBar } from '../../components/segmented-readiness-bar';
import { useAppTheme } from '../../hooks/use-app-theme';
import { fetchTopicAnalytics, type SubjectAnalytics } from '../../lib/api/analytics';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import {
  fetchLatestReadiness,
  getReadinessBand,
  type ReadinessSnapshot,
} from '../../lib/api/readiness';
import { createAnalyticsStyles } from '../../lib/themed-styles';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
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
  const [readiness, setReadiness] = useState<ReadinessSnapshot | null>(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [analytics, latestReadiness] = await Promise.all([
        fetchTopicAnalytics(slug),
        fetchLatestReadiness(slug),
      ]);
      setSubjects(analytics.subjects);
      setReadiness(latestReadiness);
    } catch {
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
  const weakTopicNames = subjects
    .flatMap((s) => s.weakTopics)
    .map((t) => t.topicName)
    .slice(0, 6);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <View style={{ paddingTop: insets.top, flex: 1 }}>
          <EmptyState
            icon={<Ionicons name="analytics-outline" size={32} color={colors.primary} />}
            title="Log in to continue"
            description="Analytics and weak-topic tracking require a signed-in account."
            actionLabel="Log in"
            onAction={() => router.push('/(auth)/login')}
          />
        </View>
      </View>
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
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.primaryDark} />
          </Pressable>
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

            {weakTopicNames.length > 0 ? (
              <View style={styles.weakBox}>
                <Text style={styles.weakBoxText}>
                  Weak areas: {weakTopicNames.join(', ')}
                </Text>
              </View>
            ) : null}
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

          <PrimaryButton
            label="Quick 10 · weak areas"
            icon="flash"
            size="lg"
            onPress={startQuick10}
            style={styles.cta}
          />
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
