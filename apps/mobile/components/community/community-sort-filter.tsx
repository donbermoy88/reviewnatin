import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import type { CommunitySort } from '../../lib/api/community';
import { AppSheet } from '../app-sheet';

const SORTS: { sort: CommunitySort; label: string }[] = [
  { sort: 'latest', label: 'Latest' },
  { sort: 'most_liked', label: 'Most Liked' },
  { sort: 'most_commented', label: 'Most Commented' },
  { sort: 'unanswered', label: 'Unanswered' },
];

type Props = {
  sort: CommunitySort;
  onChange: (sort: CommunitySort) => void;
};

/** Filter icon is a placeholder — there's no second filter dimension (e.g. tags) in the schema yet. */
export function CommunitySortFilter({ sort, onChange }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [open, setOpen] = useState(false);
  const activeLabel = SORTS.find((s) => s.sort === sort)?.label ?? 'Latest';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Sort posts"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radii.full,
          paddingHorizontal: spacing.sm,
          paddingVertical: 6,
        }}
      >
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.text }}>{activeLabel}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
      </Pressable>

      <Pressable
        onPress={() => Alert.alert('Coming soon', 'More filters are coming soon.')}
        accessibilityRole="button"
        accessibilityLabel="More filters (coming soon)"
        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, padding: 7 }}
      >
        <Ionicons name="filter-outline" size={14} color={colors.textMuted} />
      </Pressable>

      <AppSheet visible={open} title="Sort by" onClose={() => setOpen(false)}>
        <View style={{ gap: spacing.sm }}>
          {SORTS.map((option) => {
            const active = option.sort === sort;
            return (
              <Pressable
                key={option.sort}
                onPress={() => {
                  onChange(option.sort);
                  setOpen(false);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                style={{
                  minHeight: 42,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primaryMuted : colors.surface,
                  paddingHorizontal: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <Ionicons
                  name={active ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={active ? colors.primary : colors.textLight}
                />
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 13,
                    color: active ? colors.primary : colors.text,
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </AppSheet>
    </View>
  );
}
