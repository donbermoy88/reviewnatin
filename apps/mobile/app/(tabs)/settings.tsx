import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { AppSheet } from '../../components/app-sheet';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../../components/error-boundary';
import { ManagePlusCard } from '../../components/manage-plus-card';
import { Pill } from '../../components/pill';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createSettingsStyles } from '../../lib/themed-styles';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { DEFAULT_EXAM_SLUG, DISCLAIMERS, LEGAL, SITE_URL } from '@reviewnatin/shared';
import { deleteUserAccount } from '../../lib/auth/delete-account';
import { clearOnboarding } from '../../lib/onboarding-store';
import { signOutAndRedirect } from '../../lib/auth/sign-out';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { usePreferences } from '../../providers/preferences-provider';
import { useOnboardingGate } from '../../providers/onboarding-gate';
import { useUserProfile } from '../../hooks/use-user-profile';
import { useNetworkStatus } from '../../hooks/use-network-status';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import {
  deleteOfflinePack,
  downloadOfflinePack,
  getOfflinePackMeta,
  type OfflinePackMeta,
} from '../../lib/offline/pack';
import {
  flushOfflineSync,
  getPendingOfflineSyncCount,
  type OfflineSyncCounts,
} from '../../lib/offline/sync-status';
import { formatEntitlementSummary } from '../../lib/entitlements/format';
import { openBetaFeedback } from '../../lib/beta-feedback';
import { PREMIUM_ACTIVE, PREMIUM_LOCK_CTA } from '../../lib/subscription/paywall-copy';
import { SETTINGS_SUPPORT } from '../../lib/product-copy';

type SettingsStyles = ReturnType<typeof createSettingsStyles>;

function SettingsGroup({ children, styles }: { children: React.ReactNode; styles: SettingsStyles }) {
  return <View style={styles.group}>{children}</View>;
}

function SettingsRow({
  styles,
  colors,
  icon,
  label,
  sub,
  right,
  danger,
  last,
  onPress,
}: {
  styles: SettingsStyles;
  colors: ReturnType<typeof useAppTheme>['colors'];
  icon: React.ReactNode;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder]} onPress={onPress} disabled={!onPress}>
      <View style={[styles.rowIcon, danger && { backgroundColor: colors.errorBg }]}>{icon}</View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && { color: colors.error }]}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

function SettingsScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const { user, signOut } = useAuth();
  const { prefs, setDarkMode, setNotificationsEnabled, setExplanationLocale, setExamRemindersEnabled } = usePreferences();
  const { isPremium, entitlements, restoreStorePurchases } = useEntitlements();
  const { refresh: refreshOnboarding } = useOnboardingGate();
  const { displayName, initials } = useUserProfile('Guest');
  const { isOnline, hasProbed } = useNetworkStatus();
  const premiumActive = isPremium();
  const entitlementSummary = formatEntitlementSummary(entitlements);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [offlineMeta, setOfflineMeta] = useState<OfflinePackMeta | null>(null);
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [syncCounts, setSyncCounts] = useState<OfflineSyncCounts>({ answerSessions: 0, contentReports: 0, total: 0 });
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [toast, setToast] = useState<string | null>(null);
  const [sheet, setSheet] = useState<
    | null
    | 'premium_offline'
    | 'remove_offline'
    | 'delete_account'
    | 'switch_exam'
    | { kind: 'restore'; ok: boolean; message: string }
    | { kind: 'error'; title: string; message: string }
  >(null);

  const refreshOfflineMeta = useCallback(async () => {
    const goal = await resolveOnboardingGoal(user?.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    setOfflineMeta(await getOfflinePackMeta(slug));
  }, [user?.id]);

  useEffect(() => {
    void refreshOfflineMeta();
  }, [refreshOfflineMeta]);

  const refreshSyncCounts = useCallback(async () => {
    setSyncCounts(await getPendingOfflineSyncCount(user?.id));
  }, [user?.id]);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const counts = await getPendingOfflineSyncCount(user?.id);
      if (alive) setSyncCounts(counts);
    };

    void load();
    const interval = setInterval(() => void load(), 15_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  const syncStatusCopy = useMemo(() => {
    if (!user) return 'Sign in to sync saved progress and reports';
    if (!hasProbed) return 'Checking connection…';
    if (!isOnline) {
      return syncCounts.total > 0
        ? `${syncCounts.total} item${syncCounts.total === 1 ? '' : 's'} waiting · syncs when online`
        : 'Offline · no pending study data';
    }
    if (syncingOffline) return 'Syncing saved progress and reports…';
    if (syncCounts.total === 0) return 'All study progress and reports are synced';

    const parts = [];
    if (syncCounts.answerSessions > 0) {
      parts.push(`${syncCounts.answerSessions} quiz session${syncCounts.answerSessions === 1 ? '' : 's'}`);
    }
    if (syncCounts.contentReports > 0) {
      parts.push(`${syncCounts.contentReports} flagged question${syncCounts.contentReports === 1 ? '' : 's'}`);
    }
    return `${parts.join(' · ')} waiting to sync`;
  }, [hasProbed, isOnline, syncCounts.answerSessions, syncCounts.contentReports, syncCounts.total, syncingOffline, user]);

  const handleManualOfflineSync = async () => {
    if (!user || !hasProbed || !isOnline || syncCounts.total === 0 || syncingOffline) return;

    setSyncingOffline(true);
    try {
      const result = await flushOfflineSync(user.id);
      await refreshSyncCounts();
      if (result.remaining > 0 || result.failed > 0) {
        setToast(
          `${result.flushed} synced. ${result.remaining} item${result.remaining === 1 ? '' : 's'} still waiting for the next retry.`
        );
      } else {
        setToast(`${result.flushed} offline item${result.flushed === 1 ? '' : 's'} synced successfully.`);
      }
    } catch {
      setSheet({
        kind: 'error',
        title: 'Sync failed',
        message: 'Your offline data is still saved on this device. Try again when the connection is stable.',
      });
    } finally {
      setSyncingOffline(false);
    }
  };

  const handleOfflinePack = async () => {
    if (!premiumActive) {
      setSheet('premium_offline');
      return;
    }

    if (offlineMeta) {
      setSheet('remove_offline');
      return;
    }

    setOfflineBusy(true);
    try {
      const result = await downloadOfflinePack(examSlug);
      if (!result.ok) {
        setSheet({
          kind: 'error',
          title: 'Download failed',
          message: result.error === 'premium_required' ? 'Premium required.' : result.error ?? 'Please try again.',
        });
        return;
      }
      setOfflineMeta(result.meta);
      setToast(
        `${result.meta.questionCount} questions · ${result.meta.flashcardCount} flashcards · ${result.meta.materialCount} lessons — saved for offline use.`
      );
    } finally {
      setOfflineBusy(false);
    }
  };

  const resetOnboarding = async () => {
    await clearOnboarding();
    await refreshOnboarding();
    router.replace('/onboarding');
  };

  const handleSignOut = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          void signOutAndRedirect(signOut, refreshOnboarding, router);
        },
      },
    ]);
  };

  const handleRestorePurchases = async () => {
    setRestoring(true);
    try {
      const result = await restoreStorePurchases();
      setSheet({ kind: 'restore', ok: result.ok, message: result.message });
    } finally {
      setRestoring(false);
    }
  };

  const confirmDeleteAccount = () => {
    setSheet('delete_account');
  };

  const switchTrack = { false: colors.border, true: colors.primary };
  const reportProblem = (currentRoute = '/settings') =>
    openBetaFeedback({
      userId: user?.id,
      cohortHint: !user ? 'guest' : premiumActive ? 'premium' : 'free',
      currentRoute,
    });

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={tabScrollPadding(insets)}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.body}>
          {toast ? (
            <View
              style={{
                marginBottom: spacing.md,
                padding: spacing.md,
                borderRadius: 12,
                backgroundColor: colors.successBg,
                borderWidth: 1,
                borderColor: colors.success,
              }}
            >
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 14, color: colors.text, lineHeight: 20 }}>
                {toast}
              </Text>
              <Pressable onPress={() => setToast(null)} hitSlop={8} style={{ marginTop: spacing.xs }}>
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: colors.primary }}>OK</Text>
              </Pressable>
            </View>
          ) : null}

          <Pressable
            style={styles.userCard}
            onPress={user ? () => router.push('/profile/edit') : undefined}
            disabled={!user}
          >
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user?.email ?? 'Not signed in'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Pill color={colors.primary}>{user ? (premiumActive ? 'PREMIUM' : 'FREE') : 'GUEST'}</Pill>
              {user ? <Ionicons name="chevron-forward" size={16} color={colors.textLight} /> : null}
            </View>
          </Pressable>

          <Pressable onPress={() => router.push('/subscribe')}>
            <LinearGradient colors={[...gradients.challenge]} style={styles.premiumCard}>
              <View style={styles.premiumIcon}>
                <Ionicons name="flash" size={22} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumTitle}>{premiumActive ? 'ReviewNatin Plus active' : 'Upgrade to Premium'}</Text>
                <Text style={styles.premiumSub}>
                  {premiumActive ? PREMIUM_ACTIVE.settingsSubtitle : 'Subscribe through secure Google Play payment'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </LinearGradient>
          </Pressable>
          {/* Restore attaches store purchases to an account — hidden for
              signed-out guests (onRestore undefined hides the button). */}
          <ManagePlusCard
            entitlements={entitlements}
            restoring={restoring}
            onRestore={user ? () => void handleRestorePurchases() : undefined}
            onViewPlans={() => router.push('/subscribe')}
            compact
          />
          {premiumActive ? (
            <Text style={styles.entitlementNote}>{PREMIUM_ACTIVE.syncHint}</Text>
          ) : entitlementSummary ? (
            <Text style={styles.entitlementNote}>{entitlementSummary}</Text>
          ) : entitlements.length > 0 ? (
            <Text style={styles.entitlementNote}>
              Active: {entitlements.map((e) => e.sku).join(', ')}
            </Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.primaryLight,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: 'rgba(30,79,217,0.16)',
                padding: spacing.md,
                marginBottom: spacing.lg,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            onPress={() => void reportProblem('/settings/support-card')}
            accessibilityRole="button"
            accessibilityLabel={SETTINGS_SUPPORT.ctaReport}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="help-buoy-outline" size={21} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{SETTINGS_SUPPORT.title}</Text>
              <Text style={[styles.rowSub, { lineHeight: 18 }]}>{SETTINGS_SUPPORT.subtitle}</Text>
            </View>
            <View
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: 999,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: colors.primary }}>
                {SETTINGS_SUPPORT.ctaReport}
              </Text>
            </View>
          </Pressable>

          <Text style={styles.sectionLbl}>Preferences</Text>
          <SettingsGroup styles={styles}>
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="notifications-outline" size={18} color={colors.primary} />}
              label="Notifications"
              sub="Daily reminders, streaks, results"
              right={
                <Switch
                  value={prefs.notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={switchTrack}
                />
              }
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
              label="Exam date reminders"
              sub="14, 7, and 1 day before calendar events"
              right={
                <Switch
                  value={prefs.examRemindersEnabled}
                  onValueChange={setExamRemindersEnabled}
                  trackColor={switchTrack}
                />
              }
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="language-outline" size={18} color={colors.primary} />}
              label="Explanation language"
              sub={prefs.explanationLocale === 'fil' ? 'Taglish / Filipino default' : 'English default'}
              right={
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['en', 'fil'] as const).map((l) => (
                    <Pressable
                      key={l}
                      onPress={() => void setExplanationLocale(l)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 8,
                        backgroundColor: prefs.explanationLocale === l ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor: prefs.explanationLocale === l ? colors.primary : colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fonts.bodyBold,
                          fontSize: 12,
                          color: prefs.explanationLocale === l ? '#fff' : colors.textMuted,
                        }}
                      >
                        {l === 'en' ? 'EN' : 'TL'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              }
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Text style={{ fontSize: 18 }}>🌙</Text>}
              label="Dark mode"
              sub="Override automatic appearance"
              right={
                <Switch value={prefs.darkMode} onValueChange={setDarkMode} trackColor={switchTrack} />
              }
              last
            />
          </SettingsGroup>

          <Text style={styles.sectionLbl}>Study</Text>
          <SettingsGroup styles={styles}>
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />}
              label="Switch exam track"
              sub="Change CSE / LET / PNLE goal — may prompt new diagnostic"
              onPress={() => setSheet('switch_exam')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="bookmark-outline" size={18} color={colors.primary} />}
              label="Bookmarks"
              sub="Saved questions for later review"
              onPress={() => router.push('/bookmarks')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
              label="Study notes"
              sub="Your private notes — formulas, mnemonics, reminders"
              onPress={() => router.push('/notes')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="timer-outline" size={18} color={colors.primary} />}
              label="Focus timer"
              sub="Distraction-free study sessions"
              onPress={() => router.push('/focus')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="snow-outline" size={18} color={colors.primary} />}
              label="Streak freeze"
              sub="Protect your streak from a missed day"
              onPress={() => router.push('/streak-freeze')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />}
              label="AI tutor"
              sub={premiumActive ? 'Chat about weak topics & study plan' : 'Premium feature'}
              onPress={() => router.push('/tutor')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="newspaper-outline" size={18} color={colors.primary} />}
              label="Content updates"
              sub="New questions, lessons, and fixes"
              onPress={() => router.push('/changelog')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="cloud-download-outline" size={18} color={colors.primary} />}
              label="Offline pack"
              sub={
                offlineMeta
                  ? `${offlineMeta.questionCount} Q · ${offlineMeta.flashcardCount} cards downloaded`
                  : offlineBusy
                    ? 'Downloading…'
                    : 'Premium · save content for offline review'
              }
              onPress={handleOfflinePack}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={
                syncingOffline ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={syncCounts.total > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
                    size={18}
                    color={syncCounts.total > 0 ? colors.primary : colors.success}
                  />
                )
              }
              label="Offline sync"
              sub={syncStatusCopy}
              onPress={user && hasProbed && isOnline && syncCounts.total > 0 && !syncingOffline ? handleManualOfflineSync : undefined}
              right={
                user && hasProbed && isOnline && syncCounts.total > 0 ? (
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 12, color: colors.primary }}>
                    {syncingOffline ? 'Syncing' : 'Sync now'}
                  </Text>
                ) : (
                  <Ionicons
                    name={isOnline ? 'checkmark-circle-outline' : 'cloud-offline-outline'}
                    size={16}
                    color={isOnline ? colors.success : colors.textLight}
                  />
                )
              }
            />
            {offlineMeta ? (
              <>
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="airplane-outline" size={18} color={colors.primary} />}
                  label="Practice offline"
                  sub="Quiz from downloaded pack"
                  onPress={() =>
                    router.push({
                      pathname: '/practice/quiz',
                      params: { examSlug, mode: 'offline' },
                    })
                  }
                  right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                />
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="albums-outline" size={18} color={colors.primary} />}
                  label="Offline flashcards"
                  sub={`${offlineMeta.flashcardCount} cards saved`}
                  onPress={() =>
                    router.push({
                      pathname: '/flashcards',
                      params: { examSlug, mode: 'offline' },
                    })
                  }
                  right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                />
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="book-outline" size={18} color={colors.primary} />}
                  label="Offline lessons"
                  sub={`${offlineMeta.materialCount} lessons & cheat sheets`}
                  onPress={() => router.push('/offline-lessons')}
                  right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                  last
                />
              </>
            ) : (
              <SettingsRow
                styles={styles}
                colors={colors}
                icon={<Ionicons name="airplane-outline" size={18} color={colors.textLight} />}
                label="Practice offline"
                sub="Download pack first"
                onPress={handleOfflinePack}
                right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                last
              />
            )}
          </SettingsGroup>

          <Text style={styles.sectionLbl}>Account</Text>
          <SettingsGroup styles={styles}>
            {!user ? (
              <SettingsRow
                styles={styles}
                colors={colors}
                icon={<Ionicons name="log-in-outline" size={18} color={colors.primary} />}
                label="Log in"
                onPress={() => router.push('/(auth)/login')}
                right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
              />
            ) : (
              <>
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
                  label="Edit profile"
                  sub="Display name for Profile & Leaderboard"
                  onPress={() => router.push('/profile/edit')}
                  right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                />
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
                  label="Change password"
                  sub="Send reset link to your email"
                  onPress={() => router.push('/(auth)/forgot-password')}
                  right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                />
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="refresh-circle-outline" size={18} color={colors.primary} />}
                  label="Restore purchases"
                  sub={restoring ? 'Restoring…' : 'Sync App Store / Play subscriptions'}
                  onPress={handleRestorePurchases}
                  right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
                />
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="log-out-outline" size={18} color={colors.error} />}
                  label="Log out"
                  danger
                  onPress={handleSignOut}
                />
                <SettingsRow
                  styles={styles}
                  colors={colors}
                  icon={<Ionicons name="trash-outline" size={18} color={colors.error} />}
                  label="Delete account"
                  sub={deleting ? 'Deleting…' : 'Permanently remove your data'}
                  danger
                  onPress={confirmDeleteAccount}
                  last
                />
              </>
            )}
            {__DEV__ && (
              <SettingsRow
                styles={styles}
                colors={colors}
                icon={<Ionicons name="refresh-outline" size={18} color={colors.primary} />}
                label="Reset onboarding"
                sub="Developer"
                onPress={resetOnboarding}
                last={!user}
              />
            )}
          </SettingsGroup>

          <Text style={styles.sectionLbl}>Legal</Text>
          <SettingsGroup styles={styles}>
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="document-text-outline" size={18} color={colors.primary} />}
              label="Disclaimers & policies"
              sub="Not affiliated with CSC / PRC"
              onPress={() => router.push('/legal')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
              label="Privacy Policy"
              onPress={() => Linking.openURL(LEGAL.privacyUrl)}
              right={<Ionicons name="open-outline" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="reader-outline" size={18} color={colors.primary} />}
              label="Terms of Service"
              onPress={() => Linking.openURL(LEGAL.termsUrl)}
              right={<Ionicons name="open-outline" size={16} color={colors.textLight} />}
              last
            />
          </SettingsGroup>

          <Text style={styles.sectionLbl}>Support</Text>
          <SettingsGroup styles={styles}>
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="bug-outline" size={18} color={colors.primary} />}
              label="Report a problem"
              sub="Beta feedback — pre-fills device & version info"
              onPress={() => void reportProblem('/settings')}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="open-outline" size={18} color={colors.primary} />}
              label="Open website"
              onPress={() => Linking.openURL(SITE_URL)}
              right={<Ionicons name="chevron-forward" size={16} color={colors.textLight} />}
            />
            <SettingsRow
              styles={styles}
              colors={colors}
              icon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}
              label="About"
              sub={`Version 1.0.0 · ${isSupabaseConfigured ? 'Connected' : 'Offline'}`}
              last
            />
          </SettingsGroup>

          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accentDark} />
            <Text style={styles.disclaimer}>{DISCLAIMERS.short}</Text>
          </View>

          <Text style={styles.footer}>Made with ❤️ for Filipino learners</Text>
        </View>
      </ScrollView>

      <AppSheet
        visible={sheet === 'premium_offline'}
        title="ReviewNatin Plus required"
        subtitle="Offline packs are available for premium subscribers only."
        onClose={() => setSheet(null)}
        actions={[
          { label: PREMIUM_LOCK_CTA, onPress: () => { setSheet(null); router.push('/subscribe'); } },
          { label: 'Not now', onPress: () => setSheet(null), variant: 'outline' },
        ]}
      />

      <AppSheet
        visible={sheet === 'remove_offline'}
        title="Offline pack"
        subtitle="Remove the downloaded content from this device?"
        onClose={() => setSheet(null)}
        actions={[
          {
            label: 'Remove',
            onPress: () => {
              setSheet(null);
              void (async () => {
                await deleteOfflinePack(examSlug);
                await refreshOfflineMeta();
              })();
            },
            destructive: true,
          },
          { label: 'Cancel', onPress: () => setSheet(null), variant: 'outline' },
        ]}
      />

      <AppSheet
        visible={sheet === 'switch_exam'}
        title="Switch exam?"
        subtitle="This will change your active exam track. Recommended: run a new diagnostic after switching."
        onClose={() => setSheet(null)}
        actions={[
          {
            label: 'Continue',
            onPress: () => {
              setSheet(null);
              router.push({ pathname: '/onboarding', params: { switch: '1' } });
            },
          },
          { label: 'Cancel', onPress: () => setSheet(null), variant: 'outline' },
        ]}
      />

      <AppSheet
        visible={sheet === 'delete_account'}
        title="Delete account?"
        subtitle="This is permanent — your progress, bookmarks, and entitlements will be lost and cannot be recovered."
        onClose={() => setSheet(null)}
        actions={[
          {
            label: 'Delete account',
            destructive: true,
            onPress: () => {
              setSheet(null);
              void (async () => {
                setDeleting(true);
                const result = await deleteUserAccount();
                setDeleting(false);
                if (!result.ok) {
                  setSheet({ kind: 'error', title: 'Could not delete', message: result.error ?? 'Please try again.' });
                  return;
                }
                await refreshOnboarding();
                router.replace('/(auth)/login');
              })();
            },
          },
          { label: 'Cancel', onPress: () => setSheet(null), variant: 'outline' },
        ]}
      />

      <AppSheet
        visible={sheet !== null && typeof sheet === 'object' && sheet.kind === 'restore'}
        title={sheet && typeof sheet === 'object' && sheet.kind === 'restore' && sheet.ok ? 'Purchases restored' : 'Could not restore'}
        subtitle={sheet && typeof sheet === 'object' && sheet.kind === 'restore' ? sheet.message : undefined}
        onClose={() => setSheet(null)}
        actions={[{ label: 'OK', onPress: () => setSheet(null), variant: 'outline' }]}
      />

      <AppSheet
        visible={sheet !== null && typeof sheet === 'object' && sheet.kind === 'error'}
        title={sheet && typeof sheet === 'object' && sheet.kind === 'error' ? sheet.title : ''}
        subtitle={sheet && typeof sheet === 'object' && sheet.kind === 'error' ? sheet.message : undefined}
        onClose={() => setSheet(null)}
        actions={[{ label: 'OK', onPress: () => setSheet(null), variant: 'outline' }]}
      />
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <ErrorBoundary>
      <SettingsScreenContent />
    </ErrorBoundary>
  );
}
