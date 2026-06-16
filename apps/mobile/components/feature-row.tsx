import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { IconBadge } from './icon-badge';
import { useAppTheme } from '../hooks/use-app-theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  title: string;
  description: string;
  variant?: 'primary' | 'accent' | 'success' | 'muted';
  compact?: boolean;
  isLast?: boolean;
};

export function FeatureRow({
  icon,
  title,
  description,
  variant = 'primary',
  compact = false,
  isLast = false,
}: Props) {
  const { spacing, type } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: compact ? spacing.sm : spacing.md,
        marginBottom: isLast ? 0 : compact ? spacing.sm : spacing.md,
      }}
    >
      <IconBadge name={icon} size="sm" variant={variant} />
      <View style={{ flex: 1 }}>
        <Text style={[type.label, { fontSize: compact ? 14 : 15 }]}>{title}</Text>
        <Text
          style={[
            type.caption,
            { marginTop: 2, lineHeight: compact ? 16 : 18, fontSize: compact ? 12 : type.caption.fontSize },
          ]}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
