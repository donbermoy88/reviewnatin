import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createLeaderboardStyles } from '../../lib/themed-styles';
import { fetchExamSchedules, formatEventType, type ExamScheduleEvent } from '../../lib/api/exam-calendar';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG, DISCLAIMERS } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ExamCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing, fonts } = theme;
  const styles = useMemo(() => createLeaderboardStyles(theme), [theme]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [events, setEvents] = useState<ExamScheduleEvent[]>([]);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    try {
      setEvents(await fetchExamSchedules(slug));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const openSource = async (url: string | null) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}>
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.sm }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Exam calendar</Text>
          <Text style={styles.headerSub}>
            Official-style dates for {examSlug.replace(/-/g, ' ')} — always verify on CSC/PRC sites
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="calendar-outline" size={32} color={colors.primary} />}
              title="Walang schedules pa"
              description="Exam dates will appear here once we add them for your exam track."
            />
          ) : (
            events.map((event) => (
              <Pressable
                key={event.id}
                style={styles.row}
                onPress={() => void openSource(event.sourceUrl)}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>
                      {formatEventType(event.eventType)}
                    </Text>
                    {event.daysUntil >= 0 ? (
                      <Pill color={event.daysUntil <= 14 ? colors.flame : colors.primary}>
                        {event.daysUntil === 0 ? 'Today' : `${event.daysUntil}d`}
                      </Pill>
                    ) : null}
                  </View>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
                    {formatDate(event.eventDate)}
                  </Text>
                  {event.notes ? (
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight, marginTop: 4 }}>
                      {event.notes}
                    </Text>
                  ) : null}
                </View>
                {event.sourceUrl ? (
                  <Ionicons name="open-outline" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            ))
          )}

          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, marginTop: spacing.lg, lineHeight: 16 }}>
            {DISCLAIMERS.short} Dates are for planning only — confirm requirements and schedules on official government websites.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
