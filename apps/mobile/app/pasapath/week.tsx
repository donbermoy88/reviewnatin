import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme } from '../../hooks/use-app-theme';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { fetchPasaPathWeek, type PasaPathWeekDay } from '../../lib/api/pasapath';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

function dayLabel(dateStr: string, isToday: boolean): string {
  if (isToday) return 'Today';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

function DayRow({ day, onPressToday }: { day: PasaPathWeekDay; onPressToday?: () => void }) {
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const pct = day.tasks_total > 0 ? Math.round((day.tasks_completed / day.tasks_total) * 100) : 0;
  const done = day.tasks_total > 0 && day.tasks_completed >= day.tasks_total;

  return (
    <Pressable
      onPress={day.is_today ? onPressToday : undefined}
      disabled={!day.is_today}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: day.is_today ? colors.primaryMuted : colors.surface,
        borderRadius: radii.xl,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: day.is_today ? colors.primary : colors.border,
      }}
      accessibilityRole={day.is_today ? 'button' : 'text'}
      accessibilityLabel={`${dayLabel(day.date, day.is_today)} — ${day.tasks_completed} of ${day.tasks_total} tasks`}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: done ? colors.successBg : day.is_today ? colors.primary : colors.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={20} color={colors.success} />
        ) : (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: day.is_today ? '#fff' : colors.textMuted }}>
            {pct || '—'}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>
          {dayLabel(day.date, day.is_today)}
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
          {day.tasks_total > 0
            ? `${day.tasks_completed}/${day.tasks_total} tasks · ${day.daily_minutes ?? '—'} min`
            : 'No plan saved'}
        </Text>
      </View>
      {day.is_today ? <Ionicons name="chevron-forward" size={18} color={colors.primary} /> : null}
    </Pressable>
  );
}

export default function PasaPathWeekScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { colors, spacing } = theme;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<PasaPathWeekDay[]>([]);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const goal = await resolveOnboardingGoal(user.id);
      const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
      const week = await fetchPasaPathWeek(slug);
      setDays(week?.days ?? []);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const weekSummary = useMemo(() => {
    const withTasks = days.filter((d) => d.tasks_total > 0);
    const completedDays = withTasks.filter((d) => d.tasks_completed >= d.tasks_total && d.tasks_total > 0).length;
    return { completedDays, trackedDays: withTasks.length };
  }, [days]);

  if (!user) {
    return (
      <StackShell title="PasaPath week">
        <EmptyState
          icon={<Ionicons name="calendar-outline" size={32} color={colors.primary} />}
          title="Tingnan ang weekly path mo"
          description="Mag-log in para masubaybayan ang weekly path mo — daily tasks, completion streaks, at personalized study targets."
          actionLabel="Mag-log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </StackShell>
    );
  }

  return (
    <StackShell
      title="PasaPath week"
      subtitle={`Last 7 days · ${weekSummary.completedDays}/${weekSummary.trackedDays} days completed`}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : days.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="calendar-outline" size={32} color={colors.primary} />}
          title="Wala pang plano ngayong linggo"
          description="Complete a practice quiz on the Home tab to generate your personalized weekly study plan."
          actionLabel="Pumunta sa Home"
          onAction={() => router.replace('/(tabs)')}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {days.map((day) => (
            <DayRow
              key={day.date}
              day={day}
              onPressToday={() => router.replace('/(tabs)')}
            />
          ))}
        </View>
      )}
    </StackShell>
  );
}
