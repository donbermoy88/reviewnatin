import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../primary-button';
import { SkeletonCard } from '../skeleton';
import { useAppTheme } from '../../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Action = {
  label: string;
  onPress: () => void;
  variant?: ComponentProps<typeof PrimaryButton>['variant'];
  accessibilityLabel?: string;
};

type ScreenStateProps = {
  title: string;
  description?: string;
  icon?: IconName | ReactNode;
  tone?: 'neutral' | 'primary' | 'warning' | 'error' | 'success';
  action?: Action;
  secondaryAction?: Action;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

type LoadingStateProps = {
  title?: string;
  description?: string;
  cards?: number;
  style?: StyleProp<ViewStyle>;
};

function toneColors(theme: ReturnType<typeof useAppTheme>, tone: NonNullable<ScreenStateProps['tone']>) {
  const { colors } = theme;
  switch (tone) {
    case 'error':
      return { bg: colors.errorBg, fg: colors.error, border: colors.errorBg };
    case 'success':
      return { bg: colors.successBg, fg: colors.success, border: colors.successBg };
    case 'warning':
      return { bg: colors.warnBg, fg: colors.accentDark, border: colors.warnBorder };
    case 'primary':
      return { bg: colors.primaryMuted, fg: colors.primary, border: colors.primaryMuted };
    case 'neutral':
    default:
      return { bg: colors.iconBg, fg: colors.textMuted, border: colors.border };
  }
}

export function ScreenState({
  title,
  description,
  icon = 'sparkles-outline',
  tone = 'neutral',
  action,
  secondaryAction,
  compact = false,
  style,
}: ScreenStateProps) {
  const theme = useAppTheme();
  const { colors, radii, spacing, type } = theme;
  const palette = toneColors(theme, tone);
  const renderedIcon =
    typeof icon === 'string' ? <Ionicons name={icon as IconName} size={compact ? 24 : 32} color={palette.fg} /> : icon;

  return (
    <View
      style={[
        {
          alignItems: 'center',
          paddingVertical: compact ? spacing.xl : spacing.xxl,
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <View accessible accessibilityRole="summary" accessibilityLabel={description ? `${title}. ${description}` : title}>
        <View
          style={{
            width: compact ? 64 : 84,
            height: compact ? 64 : 84,
            borderRadius: compact ? radii.lg : radii.xl,
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: palette.border,
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
          }}
        >
          {renderedIcon}
        </View>
        <Text style={[type.title, { textAlign: 'center', maxWidth: 320, marginTop: spacing.sm }]}>{title}</Text>
        {description ? (
          <Text style={[type.bodyMuted, { textAlign: 'center', maxWidth: 320, marginTop: spacing.sm }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {action ? (
        <PrimaryButton
          label={action.label}
          variant={action.variant ?? 'primary'}
          onPress={action.onPress}
          accessibilityLabel={action.accessibilityLabel ?? action.label}
          style={{ alignSelf: 'stretch', marginTop: spacing.sm }}
        />
      ) : null}
      {secondaryAction ? (
        <PrimaryButton
          label={secondaryAction.label}
          variant={secondaryAction.variant ?? 'outline'}
          onPress={secondaryAction.onPress}
          accessibilityLabel={secondaryAction.accessibilityLabel ?? secondaryAction.label}
          style={{ alignSelf: 'stretch' }}
        />
      ) : null}
      <View style={{ height: 1, backgroundColor: colors.footerFade }} />
    </View>
  );
}

export function LoadingState({
  title = 'Loading content',
  description = 'Preparing your reviewer...',
  cards = 3,
  style,
}: LoadingStateProps) {
  const { colors, spacing, type } = useAppTheme();

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={[{ padding: spacing.lg, gap: spacing.md }, style]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <ActivityIndicator color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={type.label}>{title}</Text>
          {description ? <Text style={type.bodyMuted}>{description}</Text> : null}
        </View>
      </View>
      {Array.from({ length: cards }).map((_, index) => (
        <SkeletonCard key={index} lines={index === 0 ? 3 : 2} />
      ))}
    </View>
  );
}
