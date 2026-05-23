/** ReviewNatin design tokens — shared by mobile and web */

export const colors = {
  primary: '#1E4FD9',
  primaryDark: '#1539A8',
  accent: '#F5B800',
  accentDark: '#D9A000',
  background: '#F7F9FC',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#16A34A',
  error: '#DC2626',
  ringTrack: '#E2E8F0',
  ringFill: '#1E4FD9',
  primaryMuted: '#EEF3FF',
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
  xl: 24,
  full: 9999,
} as const;

export const touchTarget = {
  min: 48,
} as const;

export const typography = {
  fontDisplay: 'Syne_800ExtraBold',
  fontDisplayBold: 'Syne_700Bold',
  fontBody: 'DMSans_400Regular',
  fontBodyMedium: 'DMSans_500Medium',
  fontBodySemiBold: 'DMSans_600SemiBold',
  fontBodyBold: 'DMSans_700Bold',
  sizes: {
    caption: 12,
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
    shadowColor: '#1E4FD9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;
