import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'accent' | 'success' | 'muted';
  style?: ViewStyle;
};

const BADGE = { sm: 36, md: 48, lg: 64 };
const ICON = { sm: 18, md: 24, lg: 32 };

export function IconBadge({ name, size = 'md', variant = 'primary', style }: Props) {
  const { colors, radii } = useAppTheme();

  const VARIANTS = {
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    accent: { bg: colors.accentLight, fg: colors.accentDark },
    success: { bg: colors.successBg, fg: colors.success },
    muted: { bg: colors.iconBg, fg: colors.textMuted },
  } as const;

  const dim = BADGE[size];
  const palette = VARIANTS[variant];

  return (
    <View
      style={[
        { alignItems: 'center', justifyContent: 'center' },
        { width: dim, height: dim, borderRadius: radii.lg, backgroundColor: palette.bg },
        style,
      ]}
    >
      <Ionicons name={name} size={ICON[size]} color={palette.fg} />
    </View>
  );
}
