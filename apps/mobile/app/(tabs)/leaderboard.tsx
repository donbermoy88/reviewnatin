import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { fetchLeaderboard, type LeaderboardEntry, type LeaderboardPeriod } from '../../lib/api/leaderboard';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG, getExamCatalogItem } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

/** Avatar background colors cycling for rank rows */
const AVATAR_COLORS = [
  '#7B2CBF', '#FF7A3D', '#0B5FFF', '#22C55E', '#EF4444',
  '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6', '#10B981',
];

/** Podium slot — design-spec version */
function PodiumSlot({ entry, position, theme }: { entry: LeaderboardEntry; position: 1 | 2 | 3; theme: ReturnType<typeof useAppTheme> }) {
  const { colors, fonts } = theme;
  const isFirst = position === 1;
  const avatarSize = isFirst ? 68 : 54;
  const avatarColor = position === 1 ? colors.primary : position === 2 ? '#7B2CBF' : colors.accentDark;
  const badgeBg = position === 1 ? colors.accent : position === 2 ? '#D1D5DB' : '#E8B888';
  const xpFormatted = entry.xp.toLocaleString();

  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      {isFirst && <Ionicons name="trophy" size={24} color={colors.accent} style={{ marginBottom: -4 }} />}
      {!isFirst && <View style={{ height: 20 }} />}

      <View style={{ position: 'relative' }}>
        <View style={{
          width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2,
          backgroundColor: avatarColor, alignItems: 'center', justifyContent: 'center',
          borderWidth: 3, borderColor: isFirst ? colors.accent : '#fff',
        }}>
          <Text style={{ fontFamily: fonts.displayBold, fontSize: isFirst ? 24 : 18, color: '#fff' }}>
            {entry.displayName[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        {/* Rank badge */}
        <View style={{
          position: 'absolute', bottom: -8, left: '50%', marginLeft: -11,
          width: 22, height: 22, borderRadius: 11,
          backgroundColor: badgeBg,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: '#fff',
        }}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primaryDark }}>
            {position}
          </Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff', letterSpacing: 0 }} numberOfLines={1}>
          {entry.isCurrentUser ? 'You' : entry.displayName}
        </Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.accent, marginTop: 2 }}>
          {xpFormatted} XP
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>) {
  const { colors, fonts, spacing, radii, shadows } = theme;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    headerTitle: { fontFamily: fonts.displayBold, fontSize: 24, color: '#fff', letterSpacing: 0 },
    headerSub: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: 'rgba(255,255,255,0.72)',
      marginBottom: spacing.md,
    },
    periodBadge: {
      minHeight: 32,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: radii.full,
    },
    periodBadgeText: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' },
    periodControl: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255,255,255,0.12)',
      padding: 4,
      borderRadius: radii.lg,
      marginBottom: spacing.xl,
    },
    periodTab: {
      minHeight: 44,
      flex: 1,
      borderRadius: radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    periodTabActive: { backgroundColor: colors.surface },
    periodTabPressed: { opacity: 0.85 },
    periodTabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    periodTabTextActive: { color: colors.primary },
    podium: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'center',
      gap: spacing.md,
    },
    body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
    rankRow: {
      minHeight: 68,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    rankRowYou: { backgroundColor: colors.primaryMuted, borderWidth: 2, borderColor: colors.primary },
    rankNumber: {
      width: 28,
      textAlign: 'center',
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      color: colors.textMuted,
    },
    rankName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, letterSpacing: 0 },
    rankNameYou: { color: colors.primary },
    rankXp: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    youBadge: {
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: colors.primary,
    },
    youBadgeText: { fontFamily: fonts.bodyBold, fontSize: 11, color: '#fff' },
    inviteCard: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.primaryMuted,
      borderRadius: radii.lg,
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inviteTitle: {
      fontFamily: fonts.bodyBold,
      fontSize: 15,
      color: colors.text,
      textAlign: 'center',
    },
    inviteText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 19,
    },
    stickyRankWrap: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      alignItems: 'center',
      pointerEvents: 'none',
    },
    stickyRank: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary,
      borderRadius: radii.full,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      shadowColor: colors.primary,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },
    stickyRankText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
    stickyRankSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  });
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
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

  const onRefresh = useCallback(() => { setRefreshing(true); void load(); }, [load]);

  useEffect(() => { load(); }, [load]);

  const rank1 = entries.find(e => e.rank === 1);
  const rank2 = entries.find(e => e.rank === 2);
  const rank3 = entries.find(e => e.rank === 3);
  const rest  = entries.filter(e => e.rank > 3);
  const currentUser = entries.find((e) => e.isCurrentUser);
  const showStickyRank = !loading && !!currentUser && currentUser.rank > 3;
  const examName = getExamCatalogItem(examSlug)?.name ?? examSlug.replace(/-/g, ' ');

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          tabScrollPadding(insets),
          showStickyRank ? { paddingBottom: (insets.bottom || 0) + 96 } : undefined,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Ranks</Text>
            <View style={styles.periodBadge}>
              <Ionicons name="flash" size={14} color={colors.accent} />
              <Text style={styles.periodBadgeText}>
                {period === 'week' ? 'This week' : 'All-time'}
              </Text>
            </View>
          </View>

          <Text style={styles.headerSub}>
            {period === 'week' ? 'Weekly XP' : 'All-time XP'} — {examName}
          </Text>

          <View style={styles.periodControl}>
            {([
              { id: 'week' as const, label: 'This week' },
              { id: 'all' as const, label: 'All-time' },
            ]).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => { setLoading(true); setPeriod(p.id); }}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Show ${p.label.toLowerCase()} leaderboard`}
                accessibilityState={{ selected: period === p.id }}
                style={({ pressed }) => [
                  styles.periodTab,
                  period === p.id && styles.periodTabActive,
                  pressed && styles.periodTabPressed,
                ]}
              >
                <Text style={[styles.periodTabText, period === p.id && styles.periodTabTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {!loading && rank1 && (
            <View style={styles.podium}>
              {rank2 ? <PodiumSlot entry={rank2} position={2} theme={theme} /> : <View style={{ width: 80 }} />}
              {rank1 ? <PodiumSlot entry={rank1} position={1} theme={theme} /> : null}
              {rank3 ? <PodiumSlot entry={rank3} position={3} theme={theme} /> : <View style={{ width: 80 }} />}
            </View>
          )}
          {loading && <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />}
        </LinearGradient>

        <View style={styles.body}>
          {!loading && entries.length === 0 && (
            <EmptyState
              icon={<Ionicons name="trophy-outline" size={32} color={colors.primary} />}
              title="No ranks this week yet"
              description="Practice to earn XP — it comes from completed quiz sessions."
              actionLabel="Start practicing"
              onAction={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
            />
          )}

          {rest.map((e, i) => {
            const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
            const isYou = e.isCurrentUser;
            return (
              <View
                key={e.userId}
                style={[styles.rankRow, isYou && styles.rankRowYou]}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Rank ${e.rank}. ${isYou ? 'You' : e.displayName}. ${e.xp.toLocaleString()} XP.`}
              >
                <Text style={styles.rankNumber}>
                  {e.rank}
                </Text>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isYou ? colors.primary : avatarColor, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' }}>
                    {e.displayName[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rankName, isYou && styles.rankNameYou]} numberOfLines={1}>
                    {isYou ? 'You' : e.displayName}
                  </Text>
                  <Text style={styles.rankXp}>
                    {e.xp.toLocaleString()} XP this {period === 'week' ? 'week' : 'time'}
                  </Text>
                </View>
                {isYou && (
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>YOU</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Invite prompt when list is short */}
          {!loading && entries.length > 0 && entries.length < 5 && (
            <View style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>
                Challenge your study group
              </Text>
              <Text style={styles.inviteText}>
                The leaderboard fills up as more reviewers join. Invite friends to compete!
              </Text>
            </View>
          )}

          {!loading && entries.length > 0 && (
            <PrimaryButton
              label="Barkada challenge"
              variant="outline"
              icon="people-outline"
              iconPosition="left"
              onPress={() => router.push('/barkada')}
              style={{ marginTop: spacing.sm }}
            />
          )}
        </View>
      </ScrollView>

      {/* Sticky "Your rank" footer pill */}
      {showStickyRank && (
        <View style={[styles.stickyRankWrap, { bottom: insets.bottom + spacing.md }]}>
          <View style={styles.stickyRank}>
            <Ionicons name="medal" size={18} color="#fff" />
            <Text style={styles.stickyRankText}>
              Your rank: #{currentUser!.rank}
            </Text>
            <Text style={styles.stickyRankSub}>
              · {currentUser!.xp.toLocaleString()} XP
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
