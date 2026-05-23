import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { fetchExamBySlug, fetchSubjectAreas } from '../../lib/api/catalog';
import type { SubjectArea } from '../../lib/types';
import { getOnboarding } from '../../lib/onboarding-store';

export default function StudyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectArea[]>([]);
  const [examName, setExamName] = useState('');
  const [examSlug, setExamSlug] = useState('cse-professional');

  const load = useCallback(async () => {
    const onboarding = await getOnboarding();
    const slug = onboarding?.examSlug ?? 'cse-professional';
    setExamSlug(slug);
    const exam = await fetchExamBySlug(slug);
    if (!exam) {
      setLoading(false);
      return;
    }
    setExamName(exam.name);
    const areas = await fetchSubjectAreas(exam.id);
    setSubjects(areas);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={styles.title}>Study by subject</Text>
      <Text style={styles.subtitle}>{examName}</Text>

      {subjects.map((s) => (
        <Pressable
          key={s.id}
          style={styles.card}
          onPress={() =>
            router.push({
              pathname: '/practice/quiz',
              params: { examSlug },
            })
          }
        >
          <Text style={styles.cardTitle}>{s.name}</Text>
          <Text style={styles.cardMeta}>Tap to practice →</Text>
        </Pressable>
      ))}

      {subjects.length === 0 && (
        <Text style={styles.empty}>Walang subjects — check Supabase seed.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
  empty: { color: colors.textMuted, fontSize: 14 },
});
