import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing, type } from '../constants/theme';

type Props = { percent: number; label?: string; hint?: string; size?: number };

export function ReadinessRing({ percent, label = 'Exam-ready', hint, size = 72 }: Props) {
  const stroke = Math.max(4, Math.round(size * 0.08));

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
          },
        ]}
      >
        <Text style={[styles.pct, { fontSize: Math.round(size * 0.24) }]}>
          {Math.round(percent)}%
        </Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ring: {
    borderColor: colors.ringFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    backgroundColor: colors.surface,
  },
  pct: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  meta: { flex: 1 },
  label: { ...type.title, fontSize: 17 },
  hint: { ...type.caption, marginTop: 4, color: '#475569' },
});
