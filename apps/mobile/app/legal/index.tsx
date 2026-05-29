import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { DISCLAIMERS, LEGAL, SITE_URL } from '@reviewnatin/shared';
import { StackShell } from '../../components/stack-shell';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';

export default function LegalScreen() {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <StackShell
      gradient="challenge"
      title="Legal & disclaimers"
      subtitle="Independent reviewer — not a government agency"
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{DISCLAIMERS.title}</Text>
        <Text style={styles.bodyText}>{DISCLAIMERS.body}</Text>
      </View>

      <Text style={styles.sectionTitle}>Official exam sites</Text>
      {DISCLAIMERS.officialLinks.map((link) => (
        <Pressable key={link.url} style={styles.linkRow} onPress={() => Linking.openURL(link.url)}>
          <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.linkLabel}>{link.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>Policies</Text>
      <Pressable style={styles.linkRow} onPress={() => Linking.openURL(LEGAL.privacyUrl)}>
        <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.linkLabel}>Privacy Policy</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
      </Pressable>
      <Pressable style={styles.linkRow} onPress={() => Linking.openURL(LEGAL.termsUrl)}>
        <Ionicons name="document-text-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.linkLabel}>Terms of Service</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
      </Pressable>
      <Pressable style={styles.linkRow} onPress={() => Linking.openURL(SITE_URL)}>
        <Ionicons name="globe-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.linkLabel}>reviewnatinph.com</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textLight} />
      </Pressable>

      <View style={styles.warnBox}>
        <Ionicons name="information-circle-outline" size={18} color={theme.colors.accentDark} />
        <Text style={styles.warnText}>{DISCLAIMERS.short}</Text>
      </View>
    </StackShell>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii } = theme;
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text },
    bodyText: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 22, color: colors.textMuted },
    sectionTitle: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    linkLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.text },
    warnBox: {
      flexDirection: 'row',
      gap: spacing.sm,
      backgroundColor: colors.warnBg,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.warnBorder,
      marginTop: spacing.lg,
    },
    warnText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18, color: colors.disclaimerText },
  });
}
