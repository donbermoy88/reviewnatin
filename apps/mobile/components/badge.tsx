import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type Variant = 'neutral' | 'primary' | 'accent' | 'success' | 'error' | 'premium';

type Props = {
  label: string;
  variant?: Variant;
  icon?: IconName;
  style?: ViewStyle;
};

/** Brand ink for text sitting on the gold accent — readable in light and dark. */
const INK_ON_ACCENT = '#0E1B3D';

/** Small status/label pill. Centralizes the badge styling re-implemented across screens. */
export function Badge({ label, variant = 'neutral', icon, style }: Props) {
  const { colors, radii, spacing, fonts } = useAppTheme();

  const map = {
    neutral: { bg: colors.iconBg, fg: colors.textMuted },
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    accent: { bg: colors.accentLight, fg: colors.accentDark },
    success: { bg: colors.successBg, fg: colors.success },
    error: { bg: colors.errorBg, fg: colors.error },
    premium: { bg: colors.accent, fg: INK_ON_ACCENT },
  } as const;

  const c = map[variant];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          backgroundColor: c.bg,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
          borderRadius: radii.full,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={11} color={c.fg} /> : null}
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: c.fg, letterSpacing: 0.3 }}>{label}</Text>
    </View>
  );
}
