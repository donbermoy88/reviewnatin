import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from '../../../components/primary-button';
import { StackShell } from '../../../components/stack-shell';
import { useAppTheme, type AppTheme } from '../../../hooks/use-app-theme';
import { acceptCommunityGuidelines } from '../../../lib/api/community-guidelines';
import { toUserFacingError } from '../../../lib/errors/user-facing';
import { useAuth } from '../../../providers/auth-provider';

const ALLOWED = [
  'Exam-related questions',
  'Review tips',
  'Study strategies',
  'Clarifications',
  'App-related questions',
  'Motivational study posts',
];

const DISALLOWED = [
  'Harassment, bullying, threats, or hate speech',
  'Sexual, violent, offensive, or harmful content',
  'Spam, scams, ads, or unrelated promotions',
  'Personal information of others',
  'Copyrighted reviewer books or paid review center materials',
  'Leaked or confidential actual exam questions',
  'Impersonation or misleading content',
  'Illegal or harmful content',
];

export default function CommunityGuidelinesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { user } = useAuth();
  const [accepting, setAccepting] = useState(false);

  const onAccept = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setAccepting(true);
    try {
      await acceptCommunityGuidelines(user.id);
      router.back();
    } catch (err) {
      Alert.alert('Could not save', toUserFacingError(err));
    } finally {
      setAccepting(false);
    }
  };

  return (
    <StackShell
      gradient="challenge"
      title="Community Guidelines"
      subtitle="Keep ReviewNatin Community safe and useful for everyone"
    >
      <Text style={styles.sectionTitle}>You may post</Text>
      <View style={styles.card}>
        {ALLOWED.map((item) => (
          <View key={item} style={styles.row}>
            <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>You must not post</Text>
      <View style={styles.card}>
        {DISALLOWED.map((item) => (
          <View key={item} style={styles.row}>
            <Ionicons name="close-circle" size={18} color={theme.colors.error} />
            <Text style={styles.rowText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warnBox}>
        <Ionicons name="alert-circle-outline" size={18} color={theme.colors.accentDark} />
        <Text style={styles.warnText}>
          Do not post copyrighted reviewer pages, paid materials, or leaked actual exam questions.
        </Text>
      </View>

      <View style={styles.enforcementBox}>
        <Text style={styles.enforcementText}>
          ReviewNatin may remove content, hide posts, suspend users, ban users, and review reports.
        </Text>
      </View>

      <PrimaryButton
        label="I Understand"
        loadingLabel="Saving…"
        loading={accepting}
        size="lg"
        onPress={() => void onAccept()}
        style={styles.acceptButton}
      />
    </StackShell>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii } = theme;
  return StyleSheet.create({
    sectionTitle: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: colors.textLight,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    rowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.text },
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
    enforcementBox: {
      backgroundColor: colors.background,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: spacing.sm,
    },
    enforcementText: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18, color: colors.textMuted },
    acceptButton: { marginTop: spacing.lg },
  });
}
