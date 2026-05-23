import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/card';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { ScreenScroll } from '../../components/screen-scroll';
import { colors, spacing, type } from '../../constants/theme';
import { fetchTopicsBySubjectSlug } from '../../lib/api/topics';
import type { TopicRow } from '../../lib/api/topics';

export default function TopicListScreen() {
  const router = useRouter();
  const { subjectSlug, examSlug } = useLocalSearchParams<{ subjectSlug: string; examSlug: string }>();
  const slug = examSlug ?? 'cse-professional';
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicRow[]>([]);

  useEffect(() => {
    if (!subjectSlug) return;
    fetchTopicsBySubjectSlug(slug, subjectSlug)
      .then(setTopics)
      .finally(() => setLoading(false));
  }, [subjectSlug, slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenScroll>
      {topics.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="list-outline" size={32} color={colors.primary} />}
          title="Walang topics pa"
          description="Topics will appear after content import."
          actionLabel="Bumalik"
          onAction={() => router.back()}
        />
      ) : (
        topics.map((t) => (
          <Card key={t.id} style={styles.card}>
            <Text style={styles.title}>{t.name}</Text>
            <PrimaryButton
              label="Practice"
              onPress={() =>
                router.push({ pathname: '/practice/quiz', params: { examSlug: slug } })
              }
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ))
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  card: { marginBottom: spacing.sm },
  title: { ...type.title, fontSize: 16 },
});
