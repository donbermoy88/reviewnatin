import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/use-app-theme';
import { createChoiceOptionStyles } from '../lib/themed-styles';

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
  const theme = useAppTheme();
  const styles = useMemo(() => createChoiceOptionStyles(theme), [theme]);
  const filled = selected && !correct && !wrong;

  let stateLabel = 'Hindi napili';
  if (correct) stateLabel = 'Tama';
  else if (wrong) stateLabel = 'Mali';
  else if (selected) stateLabel = 'Napili';

  return (
    <Pressable
      style={[
        styles.option,
        filled && styles.filled,
        correct && styles.correct,
        wrong && styles.wrong,
        disabled && !filled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Opsyon ${letter}. ${label}. ${stateLabel}`}
      accessibilityState={{ selected, disabled: !!disabled }}
    >
      <View style={[styles.badge, filled && styles.badgeFilled, correct && styles.badgeCorrect]}>
        <Text style={[styles.letter, (filled || correct) && styles.letterLight]}>{letter}</Text>
      </View>
      <Text style={[styles.text, filled && styles.textFilled, correct && styles.textCorrect]}>{label}</Text>
      {filled ? (
        <View style={styles.checkWrap}>
          <Ionicons name="checkmark" size={14} color={theme.colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}
