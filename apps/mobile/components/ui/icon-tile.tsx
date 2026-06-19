import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IconName;
  color: string;
  backgroundColor: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconTile({ icon, color, backgroundColor, size = 22, style }: Props) {
  const { radii } = useAppTheme();

  return (
    <View
      style={[
        {
          width: 44,
          height: 44,
          borderRadius: radii.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </View>
  );
}
