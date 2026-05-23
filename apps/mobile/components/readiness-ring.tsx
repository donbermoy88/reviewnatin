import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = { percent: number; label?: string; hint?: string };

export function ReadinessRing({ percent, label = 'Exam-ready', hint }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.ring}>
        <Text style={styles.pct}>{percent}%</Text>
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
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: colors.ringFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pct: { fontSize: 18, fontWeight: '800', color: colors.primary },
  meta: { flex: 1 },
  label: { fontSize: 17, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
