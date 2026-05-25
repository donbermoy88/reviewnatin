import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  current: number;
  total: number;
  labels?: string[];
  icons?: IconName[];
  compact?: boolean;
};

export function StepIndicator({ current, total, labels, icons, compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => {
          const active = i <= current;
          const done = i < current;

          return (
            <View key={i} style={styles.stepCol}>
              <View style={[styles.dot, active && styles.dotActive, done && styles.dotDone]} />
              {!compact && icons?.[i] ? (
                <View style={[styles.iconBubble, i === current && styles.iconBubbleActive]}>
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
          <Text style={styles.compactMeta}>
            {labels[current]} · Step {current + 1} of {total}
          </Text>
        ) : (
          <>
            <View style={styles.labelRow}>
              {icons?.[current] ? (
                <Ionicons name={icons[current]} size={16} color={colors.primary} style={{ marginRight: 6 }} />
              ) : null}
              <Text style={styles.label}>{labels[current]}</Text>
            </View>
            <Text style={styles.step}>
              Step {current + 1} of {total}
            </Text>
          </>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  wrapCompact: { marginBottom: spacing.sm },
  dots: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  compactMeta: {
    ...type.caption,
    color: colors.primary,
    fontFamily: type.label.fontFamily,
  },
  stepCol: { flex: 1, alignItems: 'center', gap: 6 },
  dot: {
    width: '100%',
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
  dotDone: { backgroundColor: colors.accent },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { ...type.subtitle, color: colors.primary, fontFamily: type.label.fontFamily },
  step: { ...type.caption, marginTop: 2 },
});
