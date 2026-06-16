import { LinearGradient } from 'expo-linear-gradient';
import { View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  rounded?: boolean;
};

export function GradientHeader({ children, style, rounded = true }: Props) {
  const { gradients, radii } = useAppTheme();

  return (
    <LinearGradient
      colors={[...gradients.hero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        { paddingBottom: 24, overflow: 'hidden' },
        rounded && { borderBottomLeftRadius: radii.xxl, borderBottomRightRadius: radii.xxl },
        style,
      ]}
    >
      <View>{children}</View>
    </LinearGradient>
  );
}
