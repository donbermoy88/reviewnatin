import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import { createPillStyles } from '../lib/themed-styles';

type Props = {
  children: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
};

export function Pill({ children, color, bg, style }: Props) {
  const theme = useAppTheme();
  const styles = useMemo(() => createPillStyles(theme), [theme]);
  const textColor = color ?? theme.colors.primary;
  const backgroundColor = bg ?? theme.colors.primaryMuted;

  return (
    <View style={[styles.pill, { backgroundColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{children}</Text>
    </View>
  );
}
