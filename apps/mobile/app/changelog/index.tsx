import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createLeaderboardStyles } from '../../lib/themed-styles';
import { fetchContentChangelog, type ChangelogEntry } from '../../lib/api/changelog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG, getExamCatalogItem } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const SEPT2026_LET_NONPDF_UPDATE: ChangelogEntry = {
  id: 'local-sept2026-let-nonpdf-import',
  title: 'Sept2026 LET non-PDF reviewers added',
  body:
    'Added 350 ready LET questions and 330 flashcards from Word and PowerPoint reviewer files. Image-based reviewer screenshots were OCR-audited and held for manual review before upload.',
  examSlug: 'let-secondary',
  publishedAt: '2026-06-25T00:00:00.000Z',
};

function localUpdatesForExam(examSlug: string): ChangelogEntry[] {
  return examSlug === 'let-elementary' || examSlug === 'let-secondary' ? [SEPT2026_LET_NONPDF_UPDATE] : [];
}

export default function ChangelogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing, fonts } = theme;
  const styles = useMemo(() => createLeaderboardStyles(theme), [theme]);
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);

  const load = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    try {
      setEntries(await fetchContentChangelog(slug, 20));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const visibleEntries = useMemo(() => {
    const localEntries = localUpdatesForExam(examSlug);
    const remoteIds = new Set(entries.map((entry) => entry.id));
    return [...localEntries.filter((entry) => !remoteIds.has(entry.id)), ...entries];
  }, [entries, examSlug]);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.sm }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Content updates</Text>
          <Text style={styles.headerSub}>
            New questions, lessons, and fixes for{' '}
            {getExamCatalogItem(examSlug)?.name ?? examSlug.replace(/-/g, ' ')}
          </Text>
        </LinearGradient>

        <View style={styles.body}>
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : visibleEntries.length === 0 ? (
            <EmptyState
              icon={<Ionicons name="newspaper-outline" size={32} color={colors.primary} />}
              title="No updates yet"
              description="Content changelog entries will appear here as we publish new material."
            />
          ) : (
            visibleEntries.map((entry) => (
              <View
                key={entry.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, flex: 1 }}>
                    {entry.title}
                  </Text>
                  {entry.examSlug ? <Pill color={colors.primary}>{entry.examSlug.split('-')[0].toUpperCase()}</Pill> : null}
                </View>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>
                  {formatDate(entry.publishedAt)}
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                  {entry.body}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
