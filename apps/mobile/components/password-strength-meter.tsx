import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { evaluatePasswordStrength } from '../lib/auth/password-strength';

type Props = {
  password: string;
};

export function PasswordStrengthMeter({ password }: Props) {
  const theme = useAppTheme();
  const { colors, spacing, type } = theme;
  const result = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  const barColors: Record<typeof result.score, string> = {
    weak: colors.error,
    fair: colors.accentDark ?? '#F59E0B',
    good: colors.primary,
    strong: colors.success ?? '#16A34A',
  };

  const segments = 4;
  const filled =
    result.score === 'weak' ? 1 : result.score === 'fair' ? 2 : result.score === 'good' ? 3 : 4;

  return (
    <View style={{ marginTop: spacing.sm }} accessibilityLiveRegion="polite">
      <View style={styles.row}>
        {Array.from({ length: segments }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: i < filled ? barColors[result.score] : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[type.caption, styles.label, { color: colors.textMuted }]}>
        Password strength: {result.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  label: {
    marginTop: 4,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
