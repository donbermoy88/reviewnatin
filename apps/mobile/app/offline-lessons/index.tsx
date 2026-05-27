import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { EmptyState } from '../../components/empty-state';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme } from '../../hooks/use-app-theme';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { getOfflineMaterials, type OfflineMaterial } from '../../lib/offline/pack';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

export default function OfflineLessonsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { colors, spacing, fonts, radii } = theme;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<OfflineMaterial[]>([]);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    setMaterials(await getOfflineMaterials(slug));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <StackShell
      title="Offline lessons"
      subtitle="From your downloaded pack — no internet needed"
    >
      {materials.length === 0 ? (
        <EmptyState
          icon={<Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />}
          title="No offline lessons"
          description="Download the offline pack in Settings to view lessons here."
          actionLabel="Go to Settings"
          onAction={() => router.push('/(tabs)/settings')}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
          {materials.map((m) => (
            <Pressable
              key={m.id}
              onPress={() =>
                router.push({
                  pathname: '/study/lesson/[id]',
                  params: { id: m.id, examSlug, offline: '1' },
                })
              }
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text }}>{m.title}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                {m.subjectName} · {m.materialType === 'cheat_sheet' ? 'Cheat sheet' : 'Lesson'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </StackShell>
  );
}
