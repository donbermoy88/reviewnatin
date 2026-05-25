import Svg, { Path } from 'react-native-svg';
import { colors } from '../constants/theme';

type Props = { size?: number; color?: string; opacity?: number };

export function SparkleStar({ size = 14, color = colors.accent, opacity = 0.8 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" opacity={opacity}>
      <Path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={color} />
    </Svg>
  );
}
