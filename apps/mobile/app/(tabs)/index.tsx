import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { getOnboarding, type OnboardingData } from '../../lib/onboarding-store';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function DashboardScreen() {
  const [goal, setGoal] = useState<OnboardingData | null>(null);

  useEffect(() => {
    getOnboarding().then(setGoal);
  }, []);

  const days = goal ? daysUntil(goal.targetDate) : 0;
  const readiness = 42;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Kumusta, reviewer!</Text>
      <Text style={styles.countdown}>
        {days} days before your exam
      </Text>

      <View style={styles.readinessCard}>
        <View style={styles.ringOuter}>
          <Text style={styles.readinessPct}>{readiness}%</Text>
        </View>
        <View style={styles.readinessMeta}>
          <Text style={styles.readinessLabel}>Exam-ready</Text>
          <Text style={styles.readinessHint}>Mock avg · topic coverage · mistakes</Text>
        </View>
      </View>

      <View style={styles.pasapathCard}>
        <View style={styles.pasapathHeader}>
          <Text style={styles.pasapathTitle}>PasaPath · Today</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 0</Text>
          </View>
        </View>
        <Text style={styles.pasapathSub}>~{goal?.dailyMinutes ?? 30} min · 3 tasks</Text>
        <View style={styles.task}>
          <Text style={styles.taskBullet}>○</Text>
          <Text style={styles.taskText}>Practice — weak topic (12 items)</Text>
        </View>
        <View style={styles.task}>
          <Text style={styles.taskBullet}>○</Text>
          <Text style={styles.taskText}>Mistake Bank (5 items)</Text>
        </View>
        <View style={styles.task}>
          <Text style={styles.taskBullet}>○</Text>
          <Text style={styles.taskText}>New lesson — read & quiz</Text>
        </View>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Start first task</Text>
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard}>
          <Text style={styles.quickEmoji}>✏️</Text>
          <Text style={styles.quickLabel}>Practice</Text>
        </Pressable>
        <Pressable style={styles.quickCard}>
          <Text style={styles.quickEmoji}>⏱️</Text>
          <Text style={styles.quickLabel}>Mock</Text>
        </Pressable>
        <Pressable style={styles.quickCard}>
          <Text style={styles.quickEmoji}>📕</Text>
          <Text style={styles.quickLabel}>Mistakes</Text>
        </Pressable>
      </View>

      <Text style={styles.disclaimer}>
        Hindi affiliated sa CSC o PRC. Para sa official registration, bisitahin ang csc.gov.ph o prc.gov.ph
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  countdown: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  readinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: colors.ringFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  readinessPct: { fontSize: 18, fontWeight: '800', color: colors.primary },
  readinessMeta: { flex: 1 },
  readinessLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  readinessHint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  pasapathCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pasapathHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pasapathTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  streakBadge: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { fontWeight: '700', fontSize: 13 },
  pasapathSub: { color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, marginBottom: spacing.md },
  task: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  taskBullet: { color: colors.accent, marginRight: spacing.sm, fontSize: 16 },
  taskText: { color: '#fff', fontSize: 14, flex: 1 },
  primaryBtn: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: { fontWeight: '800', color: colors.text, fontSize: 15 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickEmoji: { fontSize: 24, marginBottom: spacing.xs },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  disclaimer: { fontSize: 11, color: colors.textMuted, lineHeight: 16, textAlign: 'center' },
});
