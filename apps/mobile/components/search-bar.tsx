import { useState } from 'react';
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** Called after the field is cleared via the clear button. */
  onClear?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Standard search field: leading magnifier, a focus ring, and a cross-platform
 * clear button (replaces the iOS-only `clearButtonMode`). Consolidates the
 * inline "Search subjects…" TextInputs.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  onClear,
  containerStyle,
  accessibilityLabel,
  ...rest
}: Props) {
  const { colors, spacing, radii, fonts } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 48,
          borderWidth: 1.5,
          borderColor: focused ? colors.primary : colors.border,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
        },
        containerStyle,
      ]}
    >
      <Ionicons name="search-outline" size={18} color={focused ? colors.primary : colors.textLight} />
      <TextInput
        style={{
          flex: 1,
          paddingVertical: spacing.sm,
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.text,
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        accessibilityRole="search"
        returnKeyType="search"
        autoCorrect={false}
        {...rest}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.textLight} />
        </Pressable>
      ) : null}
    </View>
  );
}
