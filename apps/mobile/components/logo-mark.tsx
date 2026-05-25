import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colors } from '../constants/theme';

type Props = { size?: number };

/** Official ReviewNatin mark — Claude Design handoff (book-check + gold star) */
export function LogoMark({ size = 48 }: Props) {
  const id = `logoGrad${size}`;
  const pageId = `pageGrad${size}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#1A72FF" />
          <Stop offset="100%" stopColor={colors.primaryDark} />
        </LinearGradient>
        <LinearGradient id={pageId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E8EFFF" />
        </LinearGradient>
      </Defs>
      <Rect width="100" height="100" rx="22" fill={`url(#${id})`} />
      <Rect x="10" y="6" width="80" height="30" rx="14" fill="#fff" fillOpacity={0.06} />
      <Path
        d="M46.53,55.92 L18.53,71.92 L25.47,84.08 L53.47,68.08 Z"
        fill={`url(#${pageId})`}
      />
      <Circle cx="22" cy="78" r="6.3" fill={`url(#${pageId})`} />
      <Path
        d="M55.40,66.45 L83.40,32.45 L72.60,23.55 L44.60,57.55 Z"
        fill={`url(#${pageId})`}
      />
      <Circle cx="78" cy="28" r="6.3" fill={`url(#${pageId})`} />
      <Circle cx="50" cy="62" r="5.95" fill={`url(#${pageId})`} />
      <Path
        d="M50.00,17.50 L51.60,22.23 L56.50,21.25 L53.20,25.00 L56.50,28.75 L51.60,27.77 L50.00,32.50 L48.40,27.77 L43.50,28.75 L46.80,25.00 L43.50,21.25 L48.40,22.23 Z"
        fill={colors.accent}
      />
    </Svg>
  );
}
