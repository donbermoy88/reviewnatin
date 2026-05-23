import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, type } from '../constants/theme';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  completedDays?: boolean[];
};

/** Weekly checkmark row only — streak badge lives in PasaPath header */
export function StreakWeek({
  completedDays = [false, false, false, false, false, false, false],
}: Props) {
  return (
    <View style={styles.days}>
      {DAYS.map((d, i) => (
        <View key={`day-${i}`} style={styles.dayCol}>
          <View style={[styles.dot, completedDays[i] && styles.dotDone]}>
            {completedDays[i] ? (
              <Text style={styles.check}>✓</Text>
            ) : null}
          </View>
          <Text style={styles.dayLabel}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>🔥 {streak}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  badgeText: {
    fontFamily: type.label.fontFamily,
    fontSize: 13,
    color: colors.text,
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  dayCol: { alignItems: 'center', flex: 1, gap: 4 },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  check: { fontSize: 12, color: colors.text, fontFamily: type.label.fontFamily },
  dayLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: type.caption.fontFamily,
  },
});
