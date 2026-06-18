import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../hooks/use-app-theme';

export function createResultStyles(theme: AppTheme) {
  const { colors, fonts, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 50,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      alignItems: 'center',
    },
    sparkleA: { position: 'absolute', top: 80, left: 40 },
    heroLbl: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: '#fff',
      textAlign: 'center',
      marginTop: spacing.sm,
      letterSpacing: -0.5,
    },
    statsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, marginTop: -30 },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.md,
      alignItems: 'center',
    },
    statLbl: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.textLight, letterSpacing: 0.5 },
    statVal: { fontFamily: fonts.display, fontSize: 22, marginTop: 4, letterSpacing: -0.4 },
    reviewBox: {
      marginHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    reviewTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, marginBottom: spacing.sm },
    reviewEmpty: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
    reviewItem: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: spacing.sm },
    reviewHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    reviewQ: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
    reviewBody: { marginTop: spacing.sm, gap: spacing.xs },
    explanation: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
    reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingVertical: 4 },
    reportBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
    actions: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  });
}
