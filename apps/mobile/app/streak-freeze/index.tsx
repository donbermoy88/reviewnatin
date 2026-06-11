import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme } from '../../hooks/use-app-theme';
import {
  buyStreakFreeze,
  fetchStreakStatus,
  STREAK_FREEZE_CAP,
  STREAK_FREEZE_COST_XP,
  type StreakStatus,
} from '../../lib/api/streak';
import { useAuth } from '../../providers/auth-provider';

export default function StreakFreezeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { colors, spacing, fonts, radii } = theme;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StreakStatus | null>(null);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setStatus(await fetchStreakStatus(user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const buy = useCallback(async () => {
    if (buying) return;
    setBuying(true);
    setMessage(null);
    const result = await buyStreakFreeze();
    if (result.ok) {
      setStatus((prev) => (prev ? { ...prev, streakFreezes: result.streakFreezes, totalXp: result.totalXp } : prev));
      setMessage('Freeze added! Your streak is protected for one missed day.');
    } else if (result.error === 'insufficient_xp') {
      setMessage(`You need ${STREAK_FREEZE_COST_XP} XP. Earn more by completing quizzes.`);
    } else if (result.error === 'cap_reached') {
      setMessage(`You already hold the maximum of ${STREAK_FREEZE_CAP} freezes.`);
    } else {
      setMessage('Could not buy a freeze. Please try again.');
    }
    setBuying(false);
  }, [buying]);

  if (!user) {
    return (
      <StackShell title="Streak freeze" subtitle="Protect your daily streak">
        <EmptyState
          icon={<Ionicons name="snow-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="Streak freezes require a signed-in account."
          actionLabel="Log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  const freezes = status?.streakFreezes ?? 0;
  const xp = status?.totalXp ?? 0;
  const atCap = freezes >= STREAK_FREEZE_CAP;
  const canAfford = xp >= STREAK_FREEZE_COST_XP;

  return (
    <StackShell title="Streak freeze" subtitle="Miss a day without losing your streak">
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <View style={{ gap: spacing.md }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.xl,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              alignItems: 'center',
              gap: spacing.xs,
            }}
          >
            <Ionicons name="snow" size={40} color={colors.primary} />
            <Text style={{ fontFamily: fonts.display, fontSize: 40, color: colors.text, letterSpacing: -1 }}>{freezes}</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
              freeze{freezes === 1 ? '' : 's'} owned · max {STREAK_FREEZE_CAP}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs }}>
              <Ionicons name="flame" size={16} color={colors.flame} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
                {status?.streakCount ?? 0}-day streak · {xp} XP
              </Text>
            </View>
          </View>

          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>
            A streak freeze automatically covers one missed day, so your streak keeps going when you return the next day.
            Each freeze costs {STREAK_FREEZE_COST_XP} XP. Missing two days in a row still resets your streak.
          </Text>

          {message ? (
            <View
              style={{
                backgroundColor: colors.primaryMuted,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text, lineHeight: 19 }}>{message}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={
              buying
                ? 'Processing…'
                : atCap
                  ? 'Maximum freezes held'
                  : `Buy a freeze (${STREAK_FREEZE_COST_XP} XP)`
            }
            size="lg"
            disabled={buying || atCap || !canAfford}
            onPress={() => void buy()}
          />
          {!atCap && !canAfford ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight, textAlign: 'center' }}>
              Earn {STREAK_FREEZE_COST_XP - xp} more XP to afford a freeze.
            </Text>
          ) : null}
        </View>
      )}
    </StackShell>
  );
}
