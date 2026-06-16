import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  current: number;
  total: number;
  labels?: string[];
  icons?: IconName[];
  compact?: boolean;
};

export function StepIndicator({ current, total, labels, icons, compact = false }: Props) {
  const { colors, radii, spacing, type } = useAppTheme();

  return (
    <View style={{ marginBottom: compact ? spacing.sm : spacing.lg }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs }}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i <= current;
          const done = i < current;

          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: radii.full,
                  backgroundColor: done ? colors.accent : active ? colors.primary : colors.border,
                }}
              />
              {!compact && icons?.[i] ? (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: i === current ? colors.primaryMuted : colors.surface,
                    borderWidth: 1,
                    borderColor: i === current ? colors.primary : colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={icons[i]}
                    size={14}
                    color={i === current ? colors.primary : done ? colors.accentDark : colors.textMuted}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {labels?.[current] ? (
        compact ? (
          <Text style={[type.caption, { color: colors.primary, fontFamily: type.label.fontFamily }]}>
            {labels[current]} · Step {current + 1} of {total}
          </Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {icons?.[current] ? (
                <Ionicons name={icons[current]} size={16} color={colors.primary} style={{ marginRight: 6 }} />
              ) : null}
              <Text style={[type.subtitle, { color: colors.primary, fontFamily: type.label.fontFamily }]}>
                {labels[current]}
              </Text>
            </View>
            <Text style={[type.caption, { marginTop: 2 }]}>
              Step {current + 1} of {total}
            </Text>
          </>
        )
      ) : null}
    </View>
  );
}
