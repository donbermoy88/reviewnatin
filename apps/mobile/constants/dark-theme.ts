/** Dark mode palette — mirrors light tokens from @reviewnatin/shared */
export const darkColors = {
  primary: '#3B82FF',
  primaryLight: '#60A5FA',
  primaryDark: '#1E3A8A',
  accent: '#FFC928',
  accentDark: '#F5A623',
  accentLight: '#3D3520',
  background: '#0B1220',
  surface: '#141E33',
  text: '#E8EEF9',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  border: '#1E293B',
  success: '#22C55E',
  successBg: '#166534',
  error: '#F87171',
  errorBg: '#450A0A',
  flame: '#FF7A3D',
  ringTrack: '#1E293B',
  ringFill: '#3B82FF',
  primaryMuted: '#1E3A5F',
  warnBg: '#422006',
  warnBorder: '#78350F',
} as const;

export type ThemeColors = typeof import('@reviewnatin/shared').colors;
