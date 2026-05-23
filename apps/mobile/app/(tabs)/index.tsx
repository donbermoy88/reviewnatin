import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../components/primary-button';
import { ReadinessRing } from '../../components/readiness-ring';
import { ScreenScroll } from '../../components/screen-scroll';
import { StreakBadge, StreakWeek } from '../../components/streak-week';
import { Card } from '../../components/card';
import { colors, radii, spacing, type } from '../../constants/theme';
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

const PASA_TASKS = [
  { id: '1', label: 'Practice — weak topic (12 items)', done: false },
  { id: '2', label: 'Mistake Bank (5 items)', done: false },
  { id: '3', label: 'New lesson — read & quiz', done: false },
];

const QUICK_ACTIONS = [
  { id: 'practice', label: 'Practice', icon: 'create-outline' as const, enabled: true },
  { id: 'mock', label: 'Mock', icon: 'timer-outline' as const, enabled: false },
  { id: 'mistakes', label: 'Mistakes', icon: 'bookmark-outline' as const, enabled: false },
  { id: 'cards', label: 'Cards', icon: 'layers-outline' as const, enabled: false },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [goal, setGoal] = useState<OnboardingData | null>(null);
  const [examName, setExamName] = useState('');
  const [tasks, setTasks] = useState(PASA_TASKS);

  const load = useCallback(async () => {
    const local = await getOnboarding();
    setGoal(local);

    if (user) {
      try {
        const remote = await fetchActiveGoal(user.id);
        const et = remote?.exam_types as { name?: string } | null;
        if (et?.name) setExamName(et.name);
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
  const weekDone = [true, true, true, false, false, false, false];

  const startPractice = () => {
    router.push({ pathname: '/practice/quiz', params: { examSlug } });
  };

  const toggleTask = (id: string) => {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  };

  return (
    <ScreenScroll withTabBar safeTop>
      <Text style={styles.greeting}>Kumusta, reviewer!</Text>
      {examName ? <Text style={styles.examLabel}>{examName}</Text> : null}
      <Text style={styles.countdown}>
        {days} days before your exam
      </Text>

      {!user && (
        <Pressable style={styles.banner} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.bannerText}>Mag-login para i-save ang quiz scores →</Text>
        </Pressable>
      )}

      <View style={{ marginBottom: spacing.md }}>
        <ReadinessRing percent={readiness} hint="Mock avg · topic coverage · mistakes" />
      </View>

      <View style={styles.pasapathCard}>
        <View style={styles.pasapathHeader}>
          <Text style={styles.pasapathTitle}>PasaPath · Today</Text>
          <StreakBadge streak={12} />
        </View>
        <StreakWeek completedDays={weekDone} />
        <Text style={styles.pasapathSub}>~{goal?.dailyMinutes ?? 30} min · {tasks.length} tasks</Text>
        {tasks.map((task) => (
          <Pressable key={task.id} style={styles.taskRow} onPress={() => toggleTask(task.id)}>
            <Text style={styles.taskBullet}>{task.done ? '✓' : '○'}</Text>
            <Text style={[styles.taskText, task.done && styles.taskDone]}>{task.label}</Text>
          </Pressable>
        ))}
        <PrimaryButton label="Start practice quiz" variant="accent" onPress={startPractice} />
      </View>

      <Card style={styles.weaknessCard} variant="flat">
        <Text style={styles.weaknessLabel}>Last quiz weakness</Text>
        <Text style={styles.weaknessText}>Numerical — Word Problems</Text>
        <Text style={styles.weaknessHint}>Practice ulit bukas sa PasaPath</Text>
      </Card>

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            style={[styles.quickCard, !action.enabled && styles.quickDisabled]}
            onPress={() => {
              if (action.id === 'practice' && action.enabled) startPractice();
            }}
            disabled={!action.enabled && action.id !== 'practice'}
          >
            <Ionicons
              name={action.icon}
              size={26}
              color={action.enabled ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.quickLabel, !action.enabled && styles.quickLabelDisabled]}>
              {action.label}
            </Text>
            {!action.enabled ? <Text style={styles.soon}>Soon</Text> : null}
          </Pressable>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Hindi affiliated sa CSC o PRC. Para sa official registration, bisitahin ang csc.gov.ph o prc.gov.ph
      </Text>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  greeting: { ...type.headline },
  examLabel: { ...type.subtitle, color: colors.primary, marginTop: 4 },
  countdown: { ...type.subtitle, color: '#475569', marginTop: spacing.xs, marginBottom: spacing.md },
  banner: {
    backgroundColor: colors.primaryMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 48,
    justifyContent: 'center',
  },
  bannerText: { ...type.subtitle, color: colors.primary },
  pasapathCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pasapathHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pasapathTitle: {
    ...type.title,
    fontSize: 18,
    color: '#fff',
    flex: 1,
  },
  pasapathSub: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.md,
    fontFamily: type.body.fontFamily,
    fontSize: 14,
  },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, minHeight: 40 },
  taskBullet: { color: colors.accent, marginRight: spacing.sm, fontSize: 16, width: 20 },
  taskText: { color: '#fff', fontSize: 14, flex: 1, fontFamily: type.body.fontFamily },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.7 },
  weaknessCard: { marginBottom: spacing.lg },
  weaknessLabel: { ...type.caption, color: colors.primary },
  weaknessText: { ...type.title, fontSize: 16, marginTop: 4 },
  weaknessHint: { ...type.caption, marginTop: 4 },
  sectionTitle: { ...type.subtitle, marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  quickCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  quickDisabled: { opacity: 0.65 },
  quickLabel: { ...type.caption, fontFamily: type.label.fontFamily, color: colors.text },
  quickLabelDisabled: { color: colors.textMuted },
  soon: { fontSize: 10, color: colors.textMuted, fontFamily: type.caption.fontFamily },
  disclaimer: { ...type.caption, lineHeight: 18, textAlign: 'center' },
});
