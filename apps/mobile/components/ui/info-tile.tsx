import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

type Props = {
  label: string;
  value: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function InfoTile({ label, value, icon, style }: Props) {
  const { colors, radii, spacing, type } = useAppTheme();

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}
      style={[
        {
          flex: 1,
          minWidth: 96,
          minHeight: 72,
          borderRadius: radii.lg,
          backgroundColor: 'rgba(255,255,255,0.13)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.14)',
          padding: spacing.sm,
          justifyContent: 'center',
          gap: 2,
        },
        style,
      ]}
    >
      {icon}
      <Text style={[type.caption, { color: 'rgba(255,255,255,0.72)' }]}>{label}</Text>
      <Text style={[type.label, { color: '#fff', fontSize: 15 }]} numberOfLines={1}>
        {value}
      </Text>
      <View style={{ height: 1, backgroundColor: colors.footerFade }} />
    </View>
  );
}
