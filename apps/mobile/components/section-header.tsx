import { Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  const { spacing, type } = useAppTheme();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={type.title}>{title}</Text>
      {subtitle ? <Text style={[type.subtitle, { marginTop: spacing.xs }]}>{subtitle}</Text> : null}
    </View>
  );
}
