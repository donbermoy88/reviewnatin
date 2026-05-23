import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/card';
import { EmptyState } from '../../components/empty-state';
import { ProgressBar } from '../../components/progress-bar';
import { ScreenScroll } from '../../components/screen-scroll';
import { SectionHeader } from '../../components/section-header';
import { colors, spacing, type } from '../../constants/theme';
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
    <ScreenScroll withTabBar>
      <SectionHeader title="Study by subject" subtitle={examName} />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="book-outline" size={32} color={colors.primary} />}
          title="Walang subjects"
          description="Check Supabase seed for your exam catalog."
          actionLabel="Refresh"
          onAction={load}
        />
      ) : (
        subjects.map((s) => (
          <Pressable
            key={s.id}
            onPress={() =>
              router.push({
                pathname: '/study/[subjectSlug]',
                params: { subjectSlug: s.slug, examSlug },
              })
            }
          >
            <Card style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
              </View>
              <ProgressBar progress={0} label="Mastery" />
              <Text style={styles.cardMeta}>Tap para sa topics →</Text>
            </Card>
          </Pressable>
        ))
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  subjectCard: { marginBottom: spacing.sm },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { ...type.title, fontSize: 16, flex: 1 },
  cardMeta: { ...type.caption, color: colors.primary, marginTop: spacing.sm },
});
