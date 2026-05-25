import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { IconBadge } from './icon-badge';
import { colors, spacing, type } from '../constants/theme';

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
  return (
    <View style={[styles.row, compact && styles.rowCompact, isLast && styles.rowLast]}>
      <IconBadge name={icon} size="sm" variant={variant} />
      <View style={styles.text}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
        <Text style={[styles.desc, compact && styles.descCompact]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  rowCompact: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  rowLast: { marginBottom: 0 },
  text: { flex: 1 },
  title: { ...type.label, fontSize: 15 },
  titleCompact: { fontSize: 14 },
  desc: { ...type.caption, marginTop: 2, lineHeight: 18 },
  descCompact: { fontSize: 12, lineHeight: 16 },
});
