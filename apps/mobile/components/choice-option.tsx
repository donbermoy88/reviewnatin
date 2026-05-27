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
  /** When true, this choice was eliminated by a hint — shown struck-through and dimmed */
  eliminated?: boolean;
  onPress: () => void;
};

export function ChoiceOption({ letter, label, selected, correct, wrong, disabled, eliminated, onPress }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createChoiceOptionStyles(theme), [theme]);
  const filled = selected && !correct && !wrong;

  let stateLabel = 'Not selected';
  if (eliminated) stateLabel = 'Eliminated by hint';
  else if (correct) stateLabel = 'Correct';
  else if (wrong) stateLabel = 'Incorrect';
  else if (selected) stateLabel = 'Selected';

  return (
    <Pressable
      style={[
        styles.option,
        filled && styles.filled,
        correct && styles.correct,
        wrong && styles.wrong,
        (disabled && !filled) && styles.disabled,
        eliminated && eliminatedStyle.option,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Option ${letter}. ${label}. ${stateLabel}`}
      accessibilityState={{ selected, disabled: !!disabled }}
    >
      <View style={[styles.badge, filled && styles.badgeFilled, correct && styles.badgeCorrect, eliminated && eliminatedStyle.badge]}>
        <Text style={[styles.letter, (filled || correct) && styles.letterLight, eliminated && eliminatedStyle.letter]}>
          {eliminated ? '✕' : letter}
        </Text>
      </View>
      <Text style={[
        styles.text,
        filled && styles.textFilled,
        correct && styles.textCorrect,
        eliminated && eliminatedStyle.text,
      ]}>
        {label}
      </Text>
      {filled ? (
        <View style={styles.checkWrap}>
          <Ionicons name="checkmark" size={14} color={theme.colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

// Eliminated style: strike-through text, dim the whole row
const eliminatedStyle = StyleSheet.create({
  option: {
    opacity: 0.38,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  letter: {
    color: '#94a3b8',
  },
  text: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
});
