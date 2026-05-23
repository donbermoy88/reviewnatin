import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessRing } from '../../components/readiness-ring';
import { colors, spacing } from '../../constants/theme';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { fetchActiveGoal } from '../../lib/api/goals';
import { EXAM_TYPES } from '@reviewnatin/shared';
import { getOnboarding, type OnboardingData } from '../../lib/onboarding-store';
import { useAuth } from '../../providers/auth-provider';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [goal, setGoal] = useState<OnboardingData | null>(null);
  const [examName, setExamName] = useState('');

  const load = useCallback(async () => {
    const local = await getOnboarding();
    setGoal(local);

    if (user) {
      try {
        const remote = await fetchActiveGoal(user.id);
        if (remote?.exam_types && typeof remote.exam_types === 'object' && 'name' in remote.exam_types) {
          setExamName((remote.exam_types as { name: string }).name);
        }
        if (remote?.target_exam_date) {
          setGoal((g) => ({
            examSlug: g?.examSlug ?? 'cse-professional',
            targetDate: remote.target_exam_date,
            dailyMinutes: remote.daily_minutes ?? g?.dailyMinutes ?? 30,
            level: (remote.current_level as OnboardingData['level']) ?? g?.level ?? 'beginner',
            completed: true,
          }));
        }
      } catch {
        /* use local */
      }
    }

    const slug = local?.examSlug ?? 'cse-professional';
    const exam = await fetchExamBySlug(slug);
    if (exam) setExamName(exam.name);
    else {
      const found = EXAM_TYPES.find((e) => e.slug === slug);
      if (found) setExamName(found.name);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const days = goal ? daysUntil(goal.targetDate) : 0;
  const readiness = 42;
  const examSlug = goal?.examSlug ?? 'cse-professional';

  const startPractice = () => {
    router.push({ pathname: '/practice/quiz', params: { examSlug } });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.greeting}>Kumusta, reviewer!</Text>
      {examName ? <Text style={styles.examLabel}>{examName}</Text> : null}
      <Text style={styles.countdown}>{days} days before your exam</Text>

      {!user && (
        <Pressable style={styles.banner} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.bannerText}>Mag-login para i-save ang quiz scores →</Text>
        </Pressable>
      )}

      <ReadinessRing percent={readiness} hint="Mock avg · topic coverage · mistakes (Week 3)" />

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
        <PrimaryButton label="Start practice quiz" variant="accent" onPress={startPractice} />
      </View>

      <View style={styles.quickRow}>
        <Pressable style={styles.quickCard} onPress={startPractice}>
          <Text style={styles.quickEmoji}>✏️</Text>
          <Text style={styles.quickLabel}>Practice</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/study')}>
          <Text style={styles.quickEmoji}>📚</Text>
          <Text style={styles.quickLabel}>Subjects</Text>
        </Pressable>
        <Pressable style={styles.quickCard} onPress={() => router.push('/(tabs)/progress')}>
          <Text style={styles.quickEmoji}>📈</Text>
          <Text style={styles.quickLabel}>Progress</Text>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.text },
  examLabel: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: 4 },
  countdown: { fontSize: 15, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  banner: {
    backgroundColor: '#EEF3FF',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bannerText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  pasapathCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  pasapathHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pasapathTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  streakBadge: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakText: { fontWeight: '700', fontSize: 13 },
  pasapathSub: { color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs, marginBottom: spacing.md },
  task: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  taskBullet: { color: colors.accent, marginRight: spacing.sm, fontSize: 16 },
  taskText: { color: '#fff', fontSize: 14, flex: 1 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  quickEmoji: { fontSize: 24, marginBottom: spacing.xs },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },
  disclaimer: { fontSize: 11, color: colors.textMuted, lineHeight: 16, textAlign: 'center' },
});
