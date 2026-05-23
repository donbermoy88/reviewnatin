import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, touchTarget, type } from '../constants/theme';

type Props = {
  letter: string;
  label: string;
  selected: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ChoiceOption({ letter, label, selected, correct, wrong, disabled, onPress }: Props) {
  return (
    <Pressable
      style={[
        styles.option,
        selected && styles.selected,
        correct && styles.correct,
        wrong && styles.wrong,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.badge, selected && styles.badgeSelected]}>
        <Text style={[styles.letter, selected && styles.letterSelected]}>{letter}</Text>
      </View>
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    minHeight: touchTarget.min,
    gap: spacing.md,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  correct: { borderColor: colors.success, backgroundColor: '#ECFDF3' },
  wrong: { borderColor: colors.error, backgroundColor: '#FEF2F2' },
  disabled: { opacity: 0.95 },
  badge: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: { backgroundColor: colors.primary },
  letter: { ...type.label, fontSize: 14, color: colors.textMuted },
  letterSelected: { color: '#fff' },
  text: { ...type.body, flex: 1 },
  textSelected: { fontFamily: type.label.fontFamily, color: colors.primary },
});
