import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../hooks/use-app-theme';

export function createStudyStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii, shadows } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
      overflow: 'hidden',
    },
    sparkle: { position: 'absolute', right: -30, top: 20 },
    headerNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
    headerTag: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    headerTitle: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: '#fff',
      lineHeight: 32,
      letterSpacing: -0.7,
    },
    headerSub: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
    noticeCard: {
      marginTop: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: radii.lg,
      padding: spacing.md,
    },
    noticeText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 18 },
    tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
    tab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radii.full,
      backgroundColor: colors.surface,
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, letterSpacing: -0.1 },
    tabTextActive: { color: '#fff' },
    body: { padding: spacing.lg, gap: spacing.sm },
    subjectCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    subjectTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    subjectIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
    subjectName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, letterSpacing: -0.15 },
    subjectMeta: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
    },
  });
}
