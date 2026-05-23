import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing, touchTarget, type } from '../constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.selected]}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.accent, borderColor: colors.accentDark },
  text: { ...type.subtitle, color: colors.text },
  textSelected: { ...type.subtitle, color: colors.text, fontFamily: type.label.fontFamily },
});
