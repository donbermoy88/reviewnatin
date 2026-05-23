import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  streak: number;
  completedDays?: boolean[];
};

export function StreakWeek({ streak, completedDays = [false, false, false, false, false, false, false] }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🔥 {streak}</Text>
      </View>
      <View style={styles.days}>
        {DAYS.map((d, i) => (
          <View key={`${d}-${i}`} style={styles.dayCol}>
            <View style={[styles.dot, completedDays[i] && styles.dotDone]} />
            <Text style={styles.dayLabel}>{d}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.sm,
  },
  badgeText: { ...type.caption, fontFamily: type.label.fontFamily, color: colors.text },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center', gap: 4 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'transparent',
  },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: type.caption.fontFamily },
});
