import { Pressable, Text } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

/** Brand ink for text sitting on the gold accent — readable in light and dark. */
const INK_ON_ACCENT = '#0E1B3D';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  const { colors, radii, spacing, touchTarget, type } = useAppTheme();

  return (
    <Pressable
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.full,
        borderWidth: 1,
        borderColor: selected ? colors.accentDark : colors.border,
        backgroundColor: selected ? colors.accent : 'transparent',
        minHeight: touchTarget.min,
        justifyContent: 'center',
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
    >
      <Text
        style={[
          type.subtitle,
          {
            color: selected ? INK_ON_ACCENT : colors.text,
            fontFamily: selected ? type.label.fontFamily : type.subtitle.fontFamily,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
