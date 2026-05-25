/** ReviewNatin design tokens — Claude Design handoff (ReviewNatin PH) */

export const colors = {
  primary: '#0B5FFF',
  primaryLight: '#3B82FF',
  primaryDark: '#08245C',
  accent: '#FFC928',
  accentDark: '#F5A623',
  accentLight: '#FFF4DC',
  background: '#F4F7FC',
  surface: '#FFFFFF',
  text: '#0E1B3D',
  textMuted: '#5B6B8C',
  textLight: '#9AA7BF',
  border: '#E7ECF5',
  success: '#22C55E',
  successBg: '#E4F8EC',
  error: '#DC2626',
  errorBg: '#FFEEE4',
  flame: '#FF7A3D',
  ringTrack: '#E7ECF5',
  ringFill: '#0B5FFF',
  primaryMuted: '#E8F0FF',
  warnBg: '#FFF8E6',
  warnBorder: '#FFEABB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const touchTarget = {
  min: 48,
} as const;

export const typography = {
  fontDisplay: 'PlusJakartaSans_800ExtraBold',
  fontDisplayBold: 'PlusJakartaSans_700Bold',
  fontBody: 'PlusJakartaSans_400Regular',
  fontBodyMedium: 'PlusJakartaSans_500Medium',
  fontBodySemiBold: 'PlusJakartaSans_600SemiBold',
  fontBodyBold: 'PlusJakartaSans_700Bold',
  sizes: {
    caption: 11,
    body: 15,
    bodyLg: 16,
    subtitle: 14,
    title: 20,
    headline: 24,
    display: 32,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.55,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#08245C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  soft: {
    shadowColor: '#08245C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  button: {
    shadowColor: '#0B5FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;
