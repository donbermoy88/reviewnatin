import { useState } from 'react';
import {
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Error message — turns the border red and renders an icon + message below. */
  error?: string | null;
  /** Helper text shown below when there is no error. */
  hint?: string;
  leftIcon?: IconName;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard labeled text field with focus ring, inline error (icon + message,
 * not colour alone), and a disabled state. Consolidates the inline
 * `<View><TextInput/></View>` form fields used across screens.
 */
export function InputField({
  label,
  error,
  hint,
  leftIcon,
  containerStyle,
  editable = true,
  accessibilityLabel,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: Props) {
  const { colors, spacing, radii, fonts, type } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  const borderColor = hasError ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, marginBottom: 6 }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: spacing.sm,
          backgroundColor: editable ? colors.surface : colors.iconBg,
          borderWidth: 1.5,
          borderColor,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          minHeight: 52,
          opacity: editable ? 1 : 0.7,
        }}
      >
        {leftIcon ? (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? colors.primary : colors.textLight}
            style={{ marginTop: multiline ? 15 : 0 }}
          />
        ) : null}
        <TextInput
          style={{
            flex: 1,
            paddingVertical: multiline ? spacing.md : spacing.sm,
            fontFamily: fonts.body,
            fontSize: 16,
            color: colors.text,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
          placeholderTextColor={colors.textLight}
          editable={editable}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={accessibilityLabel ?? label}
          {...rest}
        />
      </View>
      {hasError ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.error }}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[type.small, { color: colors.textMuted, marginTop: 6, textTransform: 'none' }]}>{hint}</Text>
      ) : null}
    </View>
  );
}
