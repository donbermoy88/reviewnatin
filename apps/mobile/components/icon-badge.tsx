import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radii } from '../constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'accent' | 'success' | 'muted';
  style?: ViewStyle;
};

const BADGE = { sm: 36, md: 48, lg: 64 };
const ICON = { sm: 18, md: 24, lg: 32 };

const VARIANTS = {
  primary: { bg: colors.primaryMuted, fg: colors.primary },
  accent: { bg: '#FFF4CC', fg: colors.accentDark },
  success: { bg: '#DCFCE7', fg: colors.success },
  muted: { bg: colors.background, fg: colors.textMuted },
};

export function IconBadge({ name, size = 'md', variant = 'primary', style }: Props) {
  const dim = BADGE[size];
  const palette = VARIANTS[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          width: dim,
          height: dim,
          borderRadius: radii.lg,
          backgroundColor: palette.bg,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={ICON[size]} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
