import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { SparkleStar } from '../../components/sparkle-star';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createProfileStyles } from '../../lib/themed-styles';
import { fetchRecentSessions } from '../../lib/api/quiz';
import { fetchPracticeStats } from '../../lib/api/stats';
import { fetchGuestPracticeStats, fetchGuestRecentSessions } from '../../lib/guest-quiz-history';
import { fetchUserBadges, type UserBadge } from '../../lib/api/achievements';
import { fetchMockExamHistory, MOCK_PASS_THRESHOLD, type MockExamHistoryRow } from '../../lib/api/mock-history';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { fetchWeeklySummary, type WeeklySummary } from '../../lib/api/weekly-summary';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useUserProfile } from '../../hooks/use-user-profile';

function dailyQuestionTarget(dailyMinutes: number): number {
  const map: Record<number, number> = { 15: 5, 30: 15, 45: 30, 60: 60 };
  return map[dailyMinutes] ?? 15;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createProfileStyles(theme), [theme]);
  const { user } = useAuth();
  const { displayName, initials } = useUserProfile('Guest reviewer');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streakDays: 0,
    totalAnswered: 0,
    accuracyPercent: null as number | null,
    sessionCount: 0,
  });
  const [sessions, setSessions] = useState<
    { id: string; score_percent: number | null; item_count: number; completed_at: string | null; mode: string }[]
  >([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [mockHistory, setMockHistory] = useState<MockExamHistoryRow[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    const target = dailyQuestionTarget(goal?.dailyMinutes ?? 30);

    if (!user) {
      try {
        const [guestSessions, guestStats] = await Promise.all([
          fetchGuestRecentSessions(),
          fetchGuestPracticeStats(target),
        ]);
        setSessions(guestSessions);
        setStats(guestStats);
      } catch {
        setSessions([]);
        setStats({ streakDays: 0, totalAnswered: 0, accuracyPercent: null, sessionCount: 0 });
      }
      setLoading(false);
      return;
    }

    try {
      const [data, practiceStats, userBadges, mocks, weekly] = await Promise.all([
        fetchRecentSessions(user.id),
        fetchPracticeStats(user.id, target),
        fetchUserBadges(),
        fetchMockExamHistory(slug),
        fetchWeeklySummary(slug),
      ]);
      setSessions(data);
      setStats(practiceStats);
      setBadges(userBadges);
      setMockHistory(mocks);
      setWeeklySummary(weekly);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const hasActivity = stats.sessionCount > 0;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={tabScrollPadding(insets)}>
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.sparkle}>
            <SparkleStar size={80} opacity={0.1} />
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile</Text>
            <Pressable style={styles.settingsBtn} onPress={() => router.push('/(tabs)/settings')}>
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </Pressable>
          </View>

          <Pressable
            style={styles.avatarRow}
            onPress={user ? () => router.push('/profile/edit') : undefined}
            disabled={!user}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userSub}>
                {user ? user.email : 'Log in to save your progress'}
              </Text>
            </View>
          </Pressable>
        </LinearGradient>

        <View style={[styles.statsCard, { marginTop: -46 }]}>
          {[
            { v: hasActivity ? String(stats.streakDays) : '0', l: 'Day streak', c: colors.flame },
            { v: hasActivity ? String(stats.totalAnswered) : '0', l: 'Answered', c: colors.primary },
            {
              v: stats.accuracyPercent != null ? `${stats.accuracyPercent}%` : '—',
              l: 'Accuracy',
              c: colors.success,
            },
          ].map((s) => (
            <View key={s.l} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.c }]}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>

        {user && weeklySummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This week</Text>
            <View style={styles.sessionCard}>
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 15, color: colors.text }}>
                {weeklySummary.questionsAnswered} questions · {weeklySummary.sessionsCompleted} sessions
              </Text>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
                {weeklySummary.accuracyPercent != null
                  ? `${weeklySummary.accuracyPercent}% accuracy`
                  : 'Accuracy —'}{' '}
                · {weeklySummary.streakDays}-day streak
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <PrimaryButton
            label="View analytics"
            variant="outline"
            icon="analytics-outline"
            iconPosition="left"
            size="lg"
            onPress={() => router.push('/analytics')}
          />
        </View>

        {user && badges.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {badges.map((b) => (
                <View
                  key={b.slug}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: spacing.sm,
                    minWidth: '30%',
                    flexGrow: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 22 }}>{b.emoji}</Text>
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 13, color: colors.text, marginTop: 4 }}>
                    {b.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {user && mockHistory.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mock exam history</Text>
            {mockHistory.map((m) => (
              <Pressable
                key={m.sessionId}
                style={styles.sessionCard}
                onPress={() =>
                  router.push({
                    pathname: '/mock-review/[sessionId]',
                    params: {
                      sessionId: m.sessionId,
                      score: String(m.scorePercent),
                      title: m.mockTitle,
                    },
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>{m.mockTitle}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(m.completedAt).toLocaleString()} · {m.passed ? 'PASS' : 'REVIEW'} (≥{MOCK_PASS_THRESHOLD}%)
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sessionScore,
                    { color: m.passed ? colors.success : colors.flame },
                  ]}
                >
                  {Math.round(m.scorePercent)}%
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!user ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz history (on this device)</Text>
            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
            {!loading && sessions.length === 0 && (
              <EmptyState
                icon={<Ionicons name="person-outline" size={32} color={colors.primary} />}
                title="Guest mode"
                description="Quiz results are saved on this device. Sign up to sync across devices."
                actionLabel="Log in"
                onAction={() => router.push('/(auth)/login')}
              />
            )}
            {!loading &&
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <View>
                    <Text style={styles.sessionTitle}>
                      {s.mode} · {s.item_count} items
                    </Text>
                    <Text style={styles.sessionDate}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleString() : ''}
                    </Text>
                  </View>
                  <Text style={styles.sessionScore}>{s.score_percent ?? '—'}%</Text>
                </View>
              ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiz history</Text>
            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}
            {!loading && sessions.length === 0 && (
              <EmptyState
                icon={<Ionicons name="stats-chart-outline" size={32} color={colors.primary} />}
                title="No quizzes yet"
                description="Start practicing from the Home tab."
                actionLabel="Start practicing"
                onAction={() => router.push('/practice/quiz')}
              />
            )}
            {!loading &&
              sessions.map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <View>
                    <Text style={styles.sessionTitle}>
                      {s.mode} · {s.item_count} items
                    </Text>
                    <Text style={styles.sessionDate}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleString() : ''}
                    </Text>
                  </View>
                  <Text style={styles.sessionScore}>{s.score_percent ?? '—'}%</Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
