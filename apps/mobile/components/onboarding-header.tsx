import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

type Props = {
  step: number;
  total: number;
  onBack?: () => void;
  variant?: 'light' | 'dark';
};

export function OnboardingHeader({ step, total, onBack, variant = 'light' }: Props) {
  const pct = ((step + 1) / total) * 100;
  const dark = variant === 'dark';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={dark ? '#fff' : colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={[styles.track, dark && styles.trackDark]}>
          <View style={[styles.fill, dark && styles.fillDark, { width: `${pct}%` }]} />
        </View>
        <Text style={[styles.counter, dark && styles.counterDark]}>
          {step + 1} / {total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backBtn: { width: 28, height: 28, justifyContent: 'center' },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radii.full,
  },
  trackDark: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  fillDark: {
    backgroundColor: colors.accent,
  },
  counter: {
    ...type.caption,
    color: colors.textLight,
    fontFamily: type.label.fontFamily,
    minWidth: 36,
    textAlign: 'right',
  },
  counterDark: {
    color: 'rgba(255,255,255,0.75)',
  },
});
