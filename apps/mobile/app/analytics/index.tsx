import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { fetchTopicAnalytics, type SubjectAnalytics } from '../../lib/api/analytics';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchLatestReadiness, getReadinessBand } from '../../lib/api/readiness';
import { fetchReadinessHistory, type ReadinessHistoryPoint } from '../../lib/api/readiness-history';
import { createAnalyticsStyles } from '../../lib/themed-styles';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

function barColor(accuracy: number, colors: ReturnType<typeof useAppTheme>['colors']): string {
  if (accuracy >= 80) return colors.success;
  if (accuracy >= 70) return colors.primary;
  if (accuracy >= 50) return colors.accentDark;
  return colors.error;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const styles = useMemo(() => createAnalyticsStyles(theme), [theme]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [examName, setExamName] = useState('');
  const [subjects, setSubjects] = useState<SubjectAnalytics[]>([]);
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [readinessHistory, setReadinessHistory] = useState<ReadinessHistoryPoint[]>([]);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [analytics, readiness, history] = await Promise.all([
        fetchTopicAnalytics(slug),
        fetchLatestReadiness(slug),
        fetchReadinessHistory(slug, 12),
      ]);
      setSubjects(analytics.subjects);
      setReadinessScore(readiness?.score ?? null);
      setReadinessHistory(history);
      setExamName(slug.replace(/-/g, ' ').toUpperCase());
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const startQuick10 = () => {
    router.push({
      pathname: '/practice/quiz',
      params: { examSlug, mode: 'weak_area' },
    });
  };

  const weakTopics = subjects.flatMap((s) => s.weakTopics).slice(0, 5);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="analytics-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="Analytics and weak-topic tracking require a signed-in account."
          actionLabel="Log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  const readinessBand = readinessScore != null ? getReadinessBand(readinessScore) : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>
              {readinessScore != null ? `${readinessScore}% exam ready` : 'Building your baseline'}
            </Text>
            <Text style={styles.summarySub}>
              {readinessBand?.label ?? 'Complete quizzes to unlock topic mastery charts.'}
            </Text>
            {readinessHistory.length >= 2 ? (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: spacing.md, height: 52 }}>
                {readinessHistory.map((point, i) => (
                  <View
                    key={`${point.computedAt}-${i}`}
                    style={{
                      flex: 1,
                      height: Math.max(8, Math.round((point.score / 100) * 48)),
                      backgroundColor: barColor(point.score, colors),
                      borderRadius: 4,
                    }}
                  />
                ))}
              </View>
            ) : null}
            {weakTopics.length > 0 ? (
              <View style={styles.weakChip}>
                <Text style={styles.weakChipText}>
                  Weak areas: {weakTopics.map((t) => t.topicName).join(', ')}
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
            subjects.map((subject) => (
              <View key={subject.subjectName} style={styles.subjectCard}>
                <View style={styles.subjectHead}>
                  <Text style={styles.subjectName}>{subject.subjectName}</Text>
                  <Text style={styles.subjectPct}>
                    {subject.averageAccuracy > 0 ? `${subject.averageAccuracy}%` : '—'}
                  </Text>
                </View>
                {subject.topics.map((topic) => {
                  const pct = topic.attempts > 0 ? Math.round(topic.accuracy) : 0;
                  return (
                    <View key={topic.topicId} style={styles.topicRow}>
                      <View style={styles.topicMeta}>
                        <Text style={styles.topicName} numberOfLines={1}>
                          {topic.topicName}
                        </Text>
                        <Text style={styles.topicPct}>
                          {topic.attempts > 0 ? `${pct}% · ${topic.attempts} ${topic.attempts === 1 ? 'try' : 'tries'}` : 'Not started'}
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.max(pct, topic.attempts > 0 ? 4 : 0)}%`,
                              backgroundColor: barColor(pct, colors),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}

          <PrimaryButton
            label="Quick 10 · weak areas"
            icon="flash"
            size="lg"
            onPress={startQuick10}
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
