import { StyleSheet } from 'react-native';
import type { AppTheme } from '../../hooks/use-app-theme';

export function createSettingsStyles(theme: AppTheme) {
  const { colors, type, spacing, radii } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: { width: 28, height: 28, justifyContent: 'center' },
    headerTitle: { fontFamily: type.headline.fontFamily, fontSize: 17, color: colors.text, letterSpacing: -0.3 },
    body: { padding: spacing.md },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    userAvatar: {
      width: 50,
      height: 50,
      borderRadius: radii.lg,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    userInitial: { fontFamily: type.display.fontFamily, fontSize: 18, color: colors.primaryDark },
    userName: { ...type.label, fontSize: 15 },
    userEmail: { ...type.caption, textTransform: 'none', marginTop: 1 },
    premiumCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderRadius: radii.xl,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    premiumIcon: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    premiumTitle: { fontFamily: type.label.fontFamily, fontSize: 14, color: '#fff' },
    premiumSub: { fontFamily: type.bodyMedium.fontFamily, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    entitlementNote: { ...type.caption, textTransform: 'none', marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
    sectionLbl: {
      ...type.caption,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      overflow: 'hidden',
      marginBottom: spacing.lg,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      backgroundColor: colors.iconBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowLabel: { ...type.label, fontSize: 14 },
    rowSub: { ...type.caption, textTransform: 'none', marginTop: 2 },
    rowValue: { ...type.subtitle, marginRight: 4 },
    disclaimerBox: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.warnBg,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.warnBorder,
    },
    disclaimer: {
      ...type.caption,
      flex: 1,
      lineHeight: 16,
      color: colors.disclaimerText,
      textTransform: 'none',
    },
    footer: { textAlign: 'center', ...type.caption, marginTop: spacing.lg, textTransform: 'none' },
  });
}

export function createTabLayoutStyles(theme: AppTheme) {
  const { colors, fonts, radii } = theme;
  return StyleSheet.create({
    tabItem: { paddingTop: 4, paddingBottom: 2, minHeight: 58 },
    tabLabel: {
      fontFamily: fonts.bodyBold,
      fontSize: 11,
      letterSpacing: 0.1,
      marginTop: 4,
      includeFontPadding: false,
      textAlign: 'center',
    },
    iconWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 34,
      minWidth: 50,
      paddingHorizontal: 14,
      borderRadius: radii.full,
    },
    iconWrapActive: {
      backgroundColor: colors.primaryMuted,
    },
    activeBar: {
      position: 'absolute',
      top: 3,
      width: 4,
      height: 4,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
  });
}

export function createScreenShellStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, letterSpacing: -0.15 },
    cardMeta: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 17, color: colors.text, letterSpacing: -0.15 },
  });
}
