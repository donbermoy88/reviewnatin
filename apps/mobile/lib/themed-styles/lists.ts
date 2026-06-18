import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../hooks/use-app-theme';

export function createListScreenStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii, shadows } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    backBtn: { width: 28, height: 28, justifyContent: 'center' },
    title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginTop: spacing.sm },
    sub: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 4 },
    card: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    cardSubject: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary, textTransform: 'uppercase' },
    cardStem: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text, marginTop: 4 },
    cardMeta: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 6 },
  });
}

export function createFlashcardStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii } = theme;
  return StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    topLbl: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: colors.textLight,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    topTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, marginTop: 1 },
    counter: {
      textAlign: 'center',
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.md,
    },
    stackArea: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center' },
    cardFront: {
      minHeight: 380,
      backgroundColor: colors.surface,
      borderRadius: 26,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
    term: {
      fontFamily: fonts.display,
      fontSize: 32,
      color: theme.isDark ? colors.text : colors.primaryDark,
      textAlign: 'center',
      lineHeight: 38,
    },
    termSmall: { fontSize: 18, lineHeight: 26 },
    topicLbl: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
    flipHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    flipText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textLight },
    actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
    actionBtn: { flex: 1 },
    completeBanner: {
      position: 'absolute',
      bottom: 120,
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.successBg,
      borderRadius: radii.lg,
      padding: spacing.md,
      alignItems: 'center',
    },
    completeText: { fontFamily: fonts.bodyBold, color: colors.success },
  });
}
