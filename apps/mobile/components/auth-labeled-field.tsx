import { type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useAppTheme, type AppTheme } from '../hooks/use-app-theme';

type Props = {
  label: string;
  children: ReactNode;
  onLayout?: (event: LayoutChangeEvent) => void;
  onFocusField: () => void;
  disabled?: boolean;
};

/** Tapping the label focuses the paired TextInput (keyboard was not opening on label tap). */
export function AuthLabeledField({ label, children, onLayout, onFocusField, disabled }: Props) {
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const focus = () => {
    if (disabled) return;
    onFocusField();
    if (Platform.OS === 'android') {
      setTimeout(onFocusField, 64);
    }
  };

  return (
    <View style={styles.field} onLayout={onLayout}>
      <Pressable
        onPress={focus}
        disabled={disabled}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Focus ${label} field`}
      >
        <Text style={styles.fieldLabel}>{label}</Text>
      </Pressable>
      {children}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts } = theme;
  return StyleSheet.create({
    field: {
      marginBottom: theme.spacing.md,
    },
    fieldLabel: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: colors.text,
      marginBottom: 6,
    },
  });
}
