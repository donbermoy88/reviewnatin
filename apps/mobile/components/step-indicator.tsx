import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

type Props = {
  current: number;
  total: number;
  labels?: string[];
};

export function StepIndicator({ current, total, labels }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i <= current && styles.dotActive, i < current && styles.dotDone]}
          />
        ))}
      </View>
      {labels?.[current] ? <Text style={styles.label}>{labels[current]}</Text> : null}
      <Text style={styles.step}>
        Step {current + 1} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  dots: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
  dotDone: { backgroundColor: colors.accent },
  label: { ...type.subtitle, color: colors.primary },
  step: { ...type.caption, marginTop: 2 },
});
