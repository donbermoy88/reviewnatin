import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
  accessibilityLabel?: string;
  disabled?: boolean;
};

type Props<T extends string> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel = 'Choose a section',
  style,
}: Props<T>) {
  const { colors, fonts, radii, spacing, touchTarget } = useAppTheme();

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          flexDirection: 'row',
          gap: spacing.xs,
          padding: spacing.xs,
          borderRadius: radii.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={option.disabled}
            accessibilityRole="tab"
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{ selected, disabled: !!option.disabled }}
            android_ripple={{ color: colors.primaryMuted, borderless: false }}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: touchTarget.min,
                borderRadius: radii.full,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.sm,
                backgroundColor: selected ? colors.primary : 'transparent',
                opacity: option.disabled ? 0.45 : pressed ? 0.78 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 13,
                color: selected ? '#fff' : colors.textMuted,
                letterSpacing: -0.1,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
