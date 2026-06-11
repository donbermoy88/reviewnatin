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
      setMessage('Nadagdag ang freeze! Protektado ang streak mo sa isang araw na ma-miss.');
    } else if (result.error === 'insufficient_xp') {
      setMessage(`Kailangan mo ng ${STREAK_FREEZE_COST_XP} XP. Mag-quiz para makaipon pa.`);
    } else if (result.error === 'cap_reached') {
      setMessage(`Nasa max ka na — ${STREAK_FREEZE_CAP} freezes.`);
    } else {
      setMessage('Hindi nabili ang freeze. Pakisubukan ulit.');
    }
    setBuying(false);
  }, [buying]);

  if (!user) {
    return (
      <StackShell title="Streak freeze" subtitle="Protektahan ang daily streak mo">
        <EmptyState
          icon={<Ionicons name="snow-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="Kailangan ng naka-sign in na account para sa streak freeze."
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
    <StackShell title="Streak freeze" subtitle="Makaligtaan ang isang araw nang hindi nawawala ang streak">
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
              freeze{freezes === 1 ? '' : 's'} · max {STREAK_FREEZE_CAP}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs }}>
              <Ionicons name="flame" size={16} color={colors.flame} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
                {status?.streakCount ?? 0}-day streak · {xp} XP
              </Text>
            </View>
          </View>

          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, lineHeight: 20 }}>
            Awtomatikong sinasaklaw ng streak freeze ang isang araw na nakaligtaan, kaya tuloy ang streak mo pagbalik.
            {STREAK_FREEZE_COST_XP} XP bawat freeze. Kung dalawang araw na sunod ang ma-miss, magre-reset pa rin ang streak.
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
                  ? 'Max na ang freezes'
                  : `Bumili ng freeze (${STREAK_FREEZE_COST_XP} XP)`
            }
            size="lg"
            disabled={buying || atCap || !canAfford}
            onPress={() => void buy()}
          />
          {!atCap && !canAfford ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight, textAlign: 'center' }}>
              {STREAK_FREEZE_COST_XP - xp} XP na lang para makabili ng freeze.
            </Text>
          ) : null}
        </View>
      )}
    </StackShell>
  );
}
