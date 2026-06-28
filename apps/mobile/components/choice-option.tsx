import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/use-app-theme';
import { useReducedMotion } from '../hooks/use-reduced-motion';
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
  const reduceMotion = useReducedMotion();
  const styles = useMemo(() => createChoiceOptionStyles(theme), [theme]);
  const filled = selected && !correct && !wrong;

  // Subtle pop when this choice is revealed as correct — only on the actual
  // false→true transition, so the review screen's already-correct rows (which
  // mount with correct=true) stay still.
  const [popScale] = useState(() => new Animated.Value(1));
  const prevCorrect = useRef(!!correct);
  useEffect(() => {
    if (correct && !prevCorrect.current && !reduceMotion) {
      Animated.sequence([
        Animated.timing(popScale, { toValue: 1.03, duration: theme.motion.duration.fast, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(popScale, { toValue: 1, duration: theme.motion.duration.base, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
    prevCorrect.current = !!correct;
  }, [correct, reduceMotion, popScale, theme.motion]);

  let stateLabel = 'Not selected';
  if (eliminated) stateLabel = 'Eliminated by hint';
  else if (correct) stateLabel = 'Correct';
  else if (wrong) stateLabel = 'Incorrect';
  else if (selected) stateLabel = 'Selected';

  return (
    <Animated.View style={{ transform: [{ scale: popScale }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.option,
          filled && styles.filled,
          correct && styles.correct,
          wrong && styles.wrong,
          (disabled && !filled) && styles.disabled,
          eliminated && eliminatedOptionStyle,
          pressed && !disabled && (reduceMotion ? styles.pressedReducedMotion : styles.pressed),
        ]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Option ${letter}. ${label}. ${stateLabel}`}
        accessibilityState={{ selected, disabled: !!disabled }}
      >
        <View style={[styles.badge, filled && styles.badgeFilled, correct && styles.badgeCorrect, eliminated && styles.eliminatedBadge]}>
          <Text style={[styles.letter, (filled || correct) && styles.letterLight, eliminated && styles.eliminatedLetter]}>
            {eliminated ? '✕' : letter}
          </Text>
        </View>
        <Text style={[
          styles.text,
          filled && styles.textFilled,
          correct && styles.textCorrect,
          eliminated && styles.eliminatedText,
        ]}>
          {label}
        </Text>
        {filled ? (
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark" size={14} color={theme.colors.primary} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

// Eliminated row: dimmed overall (theme-independent); badge/letter/text color
// variants live in createChoiceOptionStyles since they must follow the theme.
const eliminatedOptionStyle = StyleSheet.create({
  option: { opacity: 0.38 },
}).option;
