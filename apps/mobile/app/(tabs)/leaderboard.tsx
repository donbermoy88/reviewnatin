import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createLeaderboardStyles } from '../../lib/themed-styles';
import { fetchLeaderboard, type LeaderboardEntry, type LeaderboardPeriod } from '../../lib/api/leaderboard';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG, getExamCatalogItem } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createLeaderboardStyles(theme), [theme]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    try {
      setEntries(await fetchLeaderboard(slug, 50, period));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, period]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentUser = entries.find((e) => e.isCurrentUser);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={tabScrollPadding(insets)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSub}>
            {period === 'week' ? 'Weekly XP' : 'All-time XP'} — {getExamCatalogItem(examSlug)?.name ?? examSlug.replace(/-/g, ' ')}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            {([
              { id: 'week' as const, label: 'This week' },
              { id: 'all' as const, label: 'All-time' },
            ]).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => {
                  setLoading(true);
                  setPeriod(p.id);
                }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: period === p.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: '#fff' }}>{p.label}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="trophy-outline" size={32} color={colors.primary} />}
              title="Wala pang ranks this week"
              description="Mag-practice muna — XP comes from completed quiz sessions."
              actionLabel="Simulan ang practice"
              onAction={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
            />
          ) : (
            <>
              <View style={styles.podium}>
                {top3.map((e, i) => (
                  <View key={e.userId} style={[styles.podiumSlot, i === 0 && styles.podiumFirst]}>
                    <Text style={styles.podiumRank}>#{e.rank}</Text>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumInitial}>{e.displayName[0]?.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {e.isCurrentUser ? 'You' : e.displayName}
                    </Text>
                    <Text style={styles.podiumXp}>{e.xp} XP</Text>
                  </View>
                ))}
              </View>

              {rest.map((e) => (
                <View key={e.userId} style={[styles.row, e.isCurrentUser && styles.rowYou]}>
                  <Text style={styles.rowRank}>{e.rank}</Text>
                  <View style={styles.rowAvatar}>
                    <Text style={styles.rowInitial}>{e.displayName[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.rowName}>{e.isCurrentUser ? 'You' : e.displayName}</Text>
                  <Text style={styles.rowXp}>{e.xp}</Text>
                </View>
              ))}

              {currentUser && currentUser.rank > 3 ? (
                <View style={styles.youChip}>
                  <Pill color={colors.primary}>{`Your rank: #${currentUser.rank}`}</Pill>
                </View>
              ) : null}

              <PrimaryButton
                label="Barkada challenge →"
                variant="outline"
                icon="people-outline"
                onPress={() => router.push('/barkada')}
                style={{ marginTop: spacing.lg }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
