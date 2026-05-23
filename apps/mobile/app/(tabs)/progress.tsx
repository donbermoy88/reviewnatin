import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/card';
import { EmptyState } from '../../components/empty-state';
import { ScreenScroll } from '../../components/screen-scroll';
import { SectionHeader } from '../../components/section-header';
import { colors, spacing, type } from '../../constants/theme';
import { fetchRecentSessions } from '../../lib/api/quiz';
import { useAuth } from '../../providers/auth-provider';

export default function ProgressScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<
    { id: string; score_percent: number | null; item_count: number; completed_at: string | null; mode: string }[]
  >([]);

  const load = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchRecentSessions(user.id);
      setSessions(data);
    } catch {
      setSessions([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScreenScroll>
      <SectionHeader title="Progress" subtitle="Quiz history at readiness" />

      {!user && (
        <EmptyState
          icon={<Ionicons name="person-outline" size={32} color={colors.primary} />}
          title="Mag-login muna"
          description="I-save at tingnan ang quiz history mula sa Supabase."
          actionLabel="Mag-login"
          onAction={() => router.push('/(auth)/login')}
        />
      )}

      {user && loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />}

      {user && !loading && sessions.length === 0 && (
        <EmptyState
          icon={<Ionicons name="stats-chart-outline" size={32} color={colors.primary} />}
          title="Wala pang quizzes"
          description="Simulan ang practice sa Home tab para makita ang scores dito."
          actionLabel="Go to Home"
          onAction={() => router.replace('/(tabs)')}
        />
      )}

      {user &&
        !loading &&
        sessions.map((s) => (
          <Card key={s.id} style={styles.sessionCard}>
            <Text style={styles.cardTitle}>
              {s.mode} · {s.item_count} items
            </Text>
            <Text style={styles.cardScore}>{s.score_percent ?? '—'}%</Text>
            <Text style={styles.cardDate}>
              {s.completed_at ? new Date(s.completed_at).toLocaleString() : ''}
            </Text>
          </Card>
        ))}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sessionCard: { marginBottom: spacing.sm },
  cardTitle: { ...type.subtitle, color: colors.text },
  cardScore: { fontFamily: type.display.fontFamily, fontSize: 28, color: colors.primary, marginVertical: spacing.xs },
  cardDate: { ...type.caption },
});
