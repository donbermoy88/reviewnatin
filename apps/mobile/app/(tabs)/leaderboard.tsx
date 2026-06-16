import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
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

/** Crown SVG for #1 */
function CrownIcon({ color = '#FFC928' }: { color?: string }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: -4 }}>
      <View style={{ width: 28, height: 20, position: 'relative' }}>
        {/* Crown simplified using Views */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 10, backgroundColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
        {/* Three points */}
        <View style={{ position: 'absolute', bottom: 8, left: 2, width: 6, height: 10, backgroundColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3, transform: [{ rotate: '-12deg' }] }} />
        <View style={{ position: 'absolute', bottom: 10, left: 11, width: 6, height: 12, backgroundColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
        <View style={{ position: 'absolute', bottom: 8, right: 2, width: 6, height: 10, backgroundColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3, transform: [{ rotate: '12deg' }] }} />
      </View>
    </View>
  );
}

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
      {isFirst && <CrownIcon />}
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
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff', letterSpacing: -0.2 }} numberOfLines={1}>
          {entry.isCurrentUser ? 'You' : entry.displayName}
        </Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.accent, marginTop: 2 }}>
          {xpFormatted} XP
        </Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, gradients, spacing } = theme;
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={loading ? [] : rest}
        keyExtractor={(e) => e.userId}
        extraData={period}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        windowSize={11}
        contentContainerStyle={[
          tabScrollPadding(insets),
          showStickyRank ? { paddingBottom: (insets.bottom || 0) + 72 } : undefined,
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          /* ── Header ── */
          <LinearGradient
            colors={[...gradients.hero]}
            style={{
              paddingTop: insets.top + spacing.md,
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.xl,
              borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
            }}
          >
            {/* Title row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
              <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: '#fff', letterSpacing: -0.5 }}>
                Leaderboard
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 }}>
                <Ionicons name="flash" size={14} color={colors.accent} />
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: '#fff' }}>
                  {period === 'week' ? 'This week' : 'All-time'}
                </Text>
              </View>
            </View>

            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: spacing.md }}>
              {period === 'week' ? 'Weekly XP' : 'All-time XP'} — {examName}
            </Text>

            {/* Period tabs — pill style matching design */}
            <View style={{
              flexDirection: 'row', gap: 0,
              backgroundColor: 'rgba(255,255,255,0.12)',
              padding: 4, borderRadius: 14, marginBottom: spacing.xl,
            }}>
              {([
                { id: 'week' as const, label: 'This week' },
                { id: 'all' as const, label: 'All-time' },
              ]).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => { setLoading(true); setPeriod(p.id); }}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${p.label.toLowerCase()} leaderboard`}
                  style={{
                    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                    backgroundColor: period === p.id ? '#fff' : 'transparent',
                  }}
                >
                  <Text style={{
                    fontFamily: fonts.bodyBold, fontSize: 13,
                    color: period === p.id ? colors.primary : 'rgba(255,255,255,0.85)',
                  }}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Podium ── */}
            {!loading && rank1 && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.md }}>
                {/* Slot order: 2nd (left), 1st (center/tallest), 3rd (right) */}
                {rank2 ? <PodiumSlot entry={rank2} position={2} theme={theme} /> : <View style={{ width: 80 }} />}
                {rank1 ? <PodiumSlot entry={rank1} position={1} theme={theme} /> : null}
                {rank3 ? <PodiumSlot entry={rank3} position={3} theme={theme} /> : <View style={{ width: 80 }} />}
              </View>
            )}
            {loading && <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />}
          </LinearGradient>
        }
        ListEmptyComponent={
          !loading && entries.length === 0 ? (
            <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
              <EmptyState
                icon={<Ionicons name="trophy-outline" size={32} color={colors.primary} />}
                title="No ranks this week yet"
                description="Practice to earn XP — it comes from completed quiz sessions."
                actionLabel="Start practicing"
                onAction={() => router.push({ pathname: '/practice/quiz', params: { examSlug } })}
              />
            </View>
          ) : null
        }
        renderItem={({ item: e, index: i }) => {
          const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];
          const isYou = e.isCurrentUser;
          return (
            <View
              style={{
                marginHorizontal: spacing.md,
                marginBottom: spacing.sm,
                marginTop: i === 0 ? spacing.md : 0,
                backgroundColor: isYou ? colors.primaryMuted : '#fff',
                borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
                flexDirection: 'row', alignItems: 'center', gap: 12,
                borderWidth: isYou ? 2 : 0, borderColor: isYou ? colors.primary : 'transparent',
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
                elevation: 1,
              }}
            >
              {/* Rank number */}
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted, width: 24, textAlign: 'center' }}>
                {e.rank}
              </Text>
              {/* Avatar */}
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isYou ? colors.primary : avatarColor, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' }}>
                  {e.displayName[0]?.toUpperCase() ?? '?'}
                </Text>
              </View>
              {/* Name + XP */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: isYou ? colors.primary : colors.text, letterSpacing: -0.2 }}>
                  {isYou ? 'You' : e.displayName}
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                  {e.xp.toLocaleString()} XP this {period === 'week' ? 'week' : 'time'}
                </Text>
              </View>
              {/* "You" badge */}
              {isYou && (
                <View style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: '#fff' }}>YOU</Text>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ paddingHorizontal: spacing.md, paddingTop: rest.length > 0 ? 0 : spacing.md, gap: spacing.sm }}>
            {/* Invite prompt when list is short */}
            {!loading && entries.length > 0 && entries.length < 5 && (
              <View style={{
                marginTop: spacing.sm, padding: spacing.md,
                backgroundColor: colors.primaryMuted, borderRadius: 14, alignItems: 'center', gap: spacing.sm,
              }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, textAlign: 'center' }}>
                  Challenge your study group
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 }}>
                  The leaderboard fills up as more reviewers join. Invite friends to compete!
                </Text>
              </View>
            )}

            {!loading && entries.length > 0 && (
              <PrimaryButton
                label="Barkada challenge →"
                variant="outline"
                icon="people-outline"
                onPress={() => router.push('/barkada')}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        }
      />

      {/* Sticky "Your rank" footer pill */}
      {showStickyRank && (
        <View style={{ position: 'absolute', bottom: insets.bottom + spacing.md, left: spacing.lg, right: spacing.lg, alignItems: 'center' }}>
          <View style={{
            backgroundColor: colors.primary, borderRadius: 999,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}>
            <Text style={{ fontSize: 16 }}>🏅</Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' }}>
              Your rank: #{currentUser!.rank}
            </Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
              · {currentUser!.xp.toLocaleString()} XP
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
