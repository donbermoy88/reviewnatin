import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionBlock({ title, subtitle, children, style }: Props) {
  const { spacing, type } = useAppTheme();

  return (
    <View style={[{ gap: spacing.sm }, style]}>
      <View style={{ gap: spacing.xs, marginBottom: spacing.xs }}>
        <Text style={type.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={type.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}
