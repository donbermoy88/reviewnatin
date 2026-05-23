import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { fetchRecentSessions } from '../../lib/api/quiz';
import { useAuth } from '../../providers/auth-provider';

export default function ProgressScreen() {
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Progress</Text>

      {!user && (
        <Text style={styles.hint}>Mag-login para makita ang quiz history mula sa Supabase.</Text>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : sessions.length === 0 ? (
        <Text style={styles.hint}>Wala pang completed quizzes. Simulan ang practice sa Home.</Text>
      ) : (
        sessions.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.cardTitle}>{s.mode} · {s.item_count} items</Text>
            <Text style={styles.cardScore}>{s.score_percent ?? '—'}%</Text>
            <Text style={styles.cardDate}>
              {s.completed_at ? new Date(s.completed_at).toLocaleString() : ''}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  hint: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  cardScore: { fontSize: 24, fontWeight: '800', color: colors.primary, marginVertical: 4 },
  cardDate: { fontSize: 12, color: colors.textMuted },
});
