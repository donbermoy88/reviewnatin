import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'accent' | 'outline';
};

export function PrimaryButton({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  return (
    <Pressable
      style={({ pressed }) => {
        const base = [
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'accent' && styles.accent,
          variant === 'outline' && styles.outline,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ];
        if (typeof style === 'function') return [...base, style({ pressed })];
        return [...base, style];
      }}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          variant === 'outline' && styles.textOutline,
          variant === 'accent' && styles.textAccent,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  text: { color: '#fff', fontSize: 16, fontWeight: '700' },
  textAccent: { color: colors.text },
  textOutline: { color: colors.primary },
});
