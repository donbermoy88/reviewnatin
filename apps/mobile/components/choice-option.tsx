import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, spacing } from '../constants/theme';

type Props = {
  label: string;
  selected: boolean;
  correct?: boolean;
  wrong?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function ChoiceOption({ label, selected, correct, wrong, disabled, onPress }: Props) {
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
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  selected: { borderColor: colors.primary, backgroundColor: '#EEF3FF' },
  correct: { borderColor: colors.success, backgroundColor: '#ECFDF3' },
  wrong: { borderColor: colors.error, backgroundColor: '#FEF2F2' },
  disabled: { opacity: 0.9 },
  text: { fontSize: 15, color: colors.text, lineHeight: 22 },
  textSelected: { fontWeight: '600', color: colors.primary },
});
