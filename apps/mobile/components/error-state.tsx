import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { PrimaryButton } from './primary-button';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: IconName;
};

/** Standard error/retry state. Friendly, professional Taglish default copy. */
export function ErrorState({
  title = 'Hindi ma-load ang content',
  description = 'May problema sa koneksyon o server. Subukan ulit.',
  onRetry,
  retryLabel = 'Subukan ulit',
  icon = 'cloud-offline-outline',
}: Props) {
  const { colors, spacing, type, radii } = useAppTheme();

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg, gap: spacing.sm }}>
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: radii.xl,
          backgroundColor: colors.errorBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name={icon} size={34} color={colors.error} />
      </View>
      <Text style={[type.title, { textAlign: 'center' }]}>{title}</Text>
      <Text style={[type.bodyMuted, { textAlign: 'center', maxWidth: 300 }]}>{description}</Text>
      {onRetry ? (
        <PrimaryButton
          label={retryLabel}
          variant="outline"
          icon="refresh"
          iconPosition="left"
          onPress={onRetry}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}
