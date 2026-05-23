import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, spacing, touchTarget, type } from '../constants/theme';

type Props = PressableProps & {
  label: string;
  variant?: 'primary' | 'accent' | 'outline';
};

export function PrimaryButton({ label, variant = 'primary', style, disabled, ...rest }: Props) {
  return (
    <Pressable
      style={(state) => {
        const base: StyleProp<ViewStyle>[] = [
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'accent' && styles.accent,
          variant === 'outline' && styles.outline,
          state.pressed && styles.pressed,
          disabled && styles.disabled,
        ];
        if (typeof style === 'function') return [...base, style(state)];
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
    borderRadius: radii.md,
    alignItems: 'center',
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.5 },
  text: { ...type.label, color: '#fff' },
  textAccent: { ...type.label, color: colors.text },
  textOutline: { ...type.label, color: colors.primary },
});
