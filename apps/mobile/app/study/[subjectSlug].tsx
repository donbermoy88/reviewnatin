import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { MasteryBar } from '../../components/mastery-bar';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { fetchTopicAnalytics, type TopicAnalyticsRow } from '../../lib/api/analytics';
import { fetchTopicsBySubjectSlug } from '../../lib/api/topics';
import type { TopicRow } from '../../lib/api/topics';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

function titleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TopicListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createSubjectTopicStyles(theme), [theme]);
  const { user } = useAuth();
  const { subjectSlug, examSlug } = useLocalSearchParams<{ subjectSlug: string; examSlug: string }>();
  const slug = examSlug ?? DEFAULT_EXAM_SLUG;
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [topicAnalytics, setTopicAnalytics] = useState<Map<string, TopicAnalyticsRow>>(new Map());
  const subjectName = subjectSlug ? titleCase(subjectSlug) : 'Subject';

  const load = useCallback(async () => {
    if (!subjectSlug) return;

    try {
      const [topicRows, analytics] = await Promise.all([
        fetchTopicsBySubjectSlug(slug, subjectSlug),
        user ? fetchTopicAnalytics(slug).catch(() => ({ subjects: [], allTopics: [] })) : Promise.resolve({ subjects: [], allTopics: [] }),
      ]);

      setTopics(topicRows);

      const bySlug = new Map<string, TopicAnalyticsRow>();
      for (const t of analytics.allTopics) {
        if (t.subjectName.toLowerCase() === subjectName.toLowerCase()) {
          bySlug.set(t.topicSlug, t);
        }
      }
      setTopicAnalytics(bySlug);
    } finally {
      setLoading(false);
    }
  }, [subjectSlug, slug, user, subjectName]);

  useEffect(() => {
    void load();
  }, [load]);

  const subjectAvg = useMemo(() => {
    const rows = [...topicAnalytics.values()].filter((t) => t.attempts > 0);
    if (rows.length === 0) return null;
    return Math.round(rows.reduce((sum, t) => sum + t.accuracy, 0) / rows.length);
  }, [topicAnalytics]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.hero]}
        style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Bumalik"
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </Pressable>
        <Text style={styles.headerTag}>SUBJECT</Text>
        <Text style={styles.headerTitle}>{subjectName}</Text>
        <Text style={styles.headerSub}>
          {topics.length} topic{topics.length === 1 ? '' : 's'} · tap to practice
        </Text>
        {subjectAvg != null ? (
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLbl}>Subject mastery</Text>
              <Text style={styles.progressPct}>{subjectAvg}%</Text>
            </View>
            <MasteryBar accuracy={subjectAvg} attempts={1} />
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <Pressable
          style={styles.flashcardRow}
          onPress={() =>
            router.push({
              pathname: '/flashcards',
              params: { examSlug: slug, subjectSlug },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`Flashcards for ${subjectName}`}
        >
          <View style={styles.flashcardIcon}>
            <Ionicons name="albums-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.flashcardTitle}>Flashcards</Text>
            <Text style={styles.flashcardSub}>Due cards for {subjectName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        {topics.length === 0 ? (
          <EmptyState
            icon={<Ionicons name="list-outline" size={32} color={colors.primary} />}
            title="No topics yet"
            description="Topics will appear as we add more content."
            actionLabel="Go back"
            onAction={() => router.back()}
          />
        ) : (
          topics.map((t, i) => {
            const analytics = topicAnalytics.get(t.slug);
            const pct = analytics && analytics.attempts > 0 ? Math.round(analytics.accuracy) : 0;
            return (
              <Pressable
                key={t.id}
                style={styles.topicCard}
                onPress={() =>
                  router.push({
                    pathname: '/practice/quiz',
                    params: { examSlug: slug, topicSlug: t.slug },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Practice topic ${t.name}`}
              >
                <View style={styles.topicIcon}>
                  <Text style={styles.topicNum}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicTitle}>{t.name}</Text>
                  <Text style={styles.topicMeta}>
                    {analytics && analytics.attempts > 0
                      ? `${pct}% · ${analytics.attempts} tries`
                      : 'Practice questions for this topic'}
                  </Text>
                  {analytics && analytics.attempts > 0 ? (
                    <MasteryBar accuracy={pct} attempts={analytics.attempts} style={{ marginTop: 6 }} />
                  ) : null}
                </View>
                <View style={styles.playCircle}>
                  <Ionicons name="play" size={14} color="#fff" />
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

function createSubjectTopicStyles(theme: AppTheme) {
  const { colors, fonts, radii, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    headerTag: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontFamily: fonts.display,
      fontSize: 26,
      color: '#fff',
      marginTop: spacing.xs,
      lineHeight: 30,
      letterSpacing: -0.6,
    },
    headerSub: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    progressCard: {
      marginTop: spacing.lg,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
    progressLbl: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    progressPct: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.accent },
    body: { padding: spacing.lg, gap: spacing.sm },
    flashcardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    flashcardIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flashcardTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    flashcardSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    topicCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topicIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.md,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicNum: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.primary },
    topicTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text },
    topicMeta: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    playCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
