import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../hooks/use-app-theme';

export function createChoiceOptionStyles(theme: AppTheme) {
  const { colors, type, radii, spacing, touchTarget, shadows } = theme;
  return StyleSheet.create({
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      marginBottom: spacing.sm,
      minHeight: touchTarget.min,
      gap: spacing.md,
      ...shadows.card,
    },
    filled: { backgroundColor: colors.primary, ...shadows.button },
    correct: { backgroundColor: colors.successBg, borderWidth: 2, borderColor: colors.success },
    wrong: { backgroundColor: colors.errorBg, borderWidth: 2, borderColor: colors.error },
    disabled: { opacity: 0.95 },
    badge: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeFilled: { backgroundColor: 'rgba(255,255,255,0.18)' },
    badgeCorrect: { backgroundColor: colors.success },
    letter: { ...type.label, fontSize: 14, color: colors.textMuted },
    letterLight: { color: '#fff' },
    text: { ...type.label, fontSize: 15, flex: 1, letterSpacing: -0.1 },
    textFilled: { color: '#fff' },
    textCorrect: { color: colors.text },
    checkWrap: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

export function createPrimaryButtonStyles(theme: AppTheme) {
  const { colors, type, radii, spacing, shadows } = theme;
  return StyleSheet.create({
    base: {
      paddingVertical: 0,
      paddingHorizontal: spacing.lg,
      borderRadius: radii.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    primary: { backgroundColor: colors.primary, ...shadows.button },
    accent: { backgroundColor: colors.accent, ...shadows.soft },
    outline: {
      backgroundColor: theme.isDark ? 'rgba(59,130,255,0.12)' : colors.primaryMuted,
      borderColor: colors.primary,
    },
    white: { backgroundColor: colors.surface },
    ghost: { backgroundColor: 'transparent', borderColor: colors.border },
    success: { backgroundColor: colors.success },
    pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
    disabled: { opacity: 0.5 },
    text: { ...type.label, color: '#fff' },
    textLg: { fontSize: 16 },
    textAccent: { ...type.label, color: colors.text },
    textOutline: { ...type.label, color: colors.primary },
    textWhite: { ...type.label, color: colors.primary },
    iconLeft: { marginRight: spacing.sm },
    iconRight: { marginLeft: spacing.sm },
  });
}

export function createEmptyStateStyles(theme: AppTheme) {
  const { colors, spacing, type, radii } = theme;
  return StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
    iconWrap: {
      width: 84,
      height: 84,
      borderRadius: radii.xl,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: { ...type.title, textAlign: 'center' },
    description: { ...type.bodyMuted, textAlign: 'center', marginTop: spacing.sm, maxWidth: 300 },
    btn: { marginTop: spacing.lg, alignSelf: 'stretch', width: '100%' },
  });
}

export function createPillStyles(theme: AppTheme) {
  const { type, radii } = theme;
  return StyleSheet.create({
    pill: {
      alignSelf: 'flex-start',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radii.sm,
    },
    text: {
      fontFamily: type.label.fontFamily,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
  });
}
