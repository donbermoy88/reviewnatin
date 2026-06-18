import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../hooks/use-app-theme';

export function createLeaderboardStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii, shadows } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
    },
    headerTitle: { fontFamily: fonts.display, fontSize: 22, color: '#fff', letterSpacing: -0.4 },
    headerSub: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    body: { padding: spacing.lg },
    podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.lg },
    podiumSlot: { alignItems: 'center', flex: 1, backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.md },
    podiumFirst: { transform: [{ translateY: -8 }], borderWidth: 2, borderColor: colors.accent },
    podiumRank: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
    podiumAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: spacing.sm,
    },
    podiumInitial: { fontFamily: fonts.display, fontSize: 18, color: colors.primary },
    podiumName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text, maxWidth: 90 },
    podiumXp: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.accentDark, marginTop: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    rowYou: { borderWidth: 1.5, borderColor: colors.primary },
    rowRank: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted, width: 28 },
    rowAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowInitial: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
    rowName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
    rowXp: { fontFamily: fonts.display, fontSize: 16, color: colors.primary },
    youChip: { alignItems: 'center', marginTop: spacing.md },
  });
}
