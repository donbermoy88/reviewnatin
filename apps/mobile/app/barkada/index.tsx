import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/empty-state';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { createLeaderboardStyles } from '../../lib/themed-styles';
import {
  buildBarkadaInviteMessage,
  createBarkadaChallenge,
  createBarkadaGroup,
  fetchMyBarkada,
  joinBarkadaGroup,
  type BarkadaGroup,
} from '../../lib/api/barkada';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';

export default function BarkadaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createLeaderboardStyles(theme), [theme]);
  const { fonts } = theme;
  const metaStyle = { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted };
  const sectionStyle = {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  };
  const { user } = useAuth();
  const params = useLocalSearchParams<{ code?: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [group, setGroup] = useState<BarkadaGroup | null>(null);
  const [joinCode, setJoinCode] = useState(params.code ?? '');
  const [groupName, setGroupName] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const goal = await resolveOnboardingGoal(user.id);
    const slug = goal?.examSlug ?? DEFAULT_EXAM_SLUG;
    setExamSlug(slug);
    try {
      setGroup(await fetchMyBarkada(slug));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (params.code) setJoinCode(params.code);
  }, [params.code]);

  const handleCreate = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setBusy(true);
    try {
      await createBarkadaGroup(examSlug, groupName || 'My Barkada');
      await load();
    } catch (e) {
      Alert.alert('Could not create group', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!joinCode.trim()) return;
    setBusy(true);
    try {
      await joinBarkadaGroup(joinCode.trim());
      await load();
    } catch (e) {
      Alert.alert('Invalid code', 'Check the invite code and try again.');
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (!group) return;
    await Share.share({
      message: buildBarkadaInviteMessage(group.inviteCode, group.name),
    });
  };

  const startChallenge = async () => {
    if (!group) return;
    setBusy(true);
    try {
      const challenge = await createBarkadaChallenge(group.groupId, 10);
      router.push({
        pathname: '/practice/quiz',
        params: {
          examSlug: challenge.examSlug,
          mode: 'barkada',
          barkadaChallengeId: challenge.challengeId,
          questionLimit: String(challenge.questionCount),
        },
      });
    } catch {
      Alert.alert('Challenge failed', 'Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState
          icon={<Ionicons name="people-outline" size={32} color={colors.primary} />}
          title="Log in to continue"
          description="Barkada mode lets you review with friends and compare scores."
          actionLabel="Log in"
          onAction={() => router.push('/(auth)/login')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <LinearGradient
          colors={[...gradients.hero]}
          style={[styles.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: spacing.sm }}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Barkada Mode</Text>
          <Text style={styles.headerSub}>Review together · compare scores · stronger as a team!</Text>
        </LinearGradient>

        <View style={styles.body}>
          {!group ? (
            <>
              <Text style={sectionStyle}>Start a group</Text>
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group name (optional)"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  fontFamily: theme.fonts.bodyMedium,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <PrimaryButton
                label={busy ? 'Creating…' : 'Create Barkada'}
                icon="people"
                onPress={() => void handleCreate()}
                disabled={busy}
              />

              <Text style={[sectionStyle, { marginTop: spacing.lg }]}>Or join with code</Text>
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="BARK-XXXXXX"
                autoCapitalize="characters"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: spacing.md,
                  marginBottom: spacing.sm,
                  fontFamily: theme.fonts.bodyMedium,
                  color: colors.text,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <PrimaryButton
                label={busy ? 'Joining…' : 'Join Barkada'}
                variant="outline"
                onPress={() => void handleJoin()}
                disabled={busy}
              />
            </>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={sectionStyle}>Your Barkada</Text>
                  <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 20, color: colors.text }}>{group.name}</Text>
                </View>
                <Pill color={colors.primary}>{group.inviteCode}</Pill>
              </View>

              <PrimaryButton
                label="Invite friends"
                icon="share-outline"
                onPress={() => void shareInvite()}
                style={{ marginTop: spacing.sm }}
              />

              <Text style={[sectionStyle, { marginTop: spacing.lg }]}>
                Members ({group.members.length})
              </Text>
              {group.members.map((m) => (
                <View key={m.userId} style={styles.row}>
                  <View style={styles.rowAvatar}>
                    <Text style={styles.rowInitial}>{m.displayName[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{m.displayName}</Text>
                    <Text style={metaStyle}>{m.isOwner ? 'Owner' : 'Member'}</Text>
                  </View>
                </View>
              ))}

              <Text style={[sectionStyle, { marginTop: spacing.lg }]}>Active challenge</Text>
              {group.activeChallenge ? (
                <>
                  <Text style={metaStyle}>
                    {group.activeChallenge.questionCount} questions · expires{' '}
                    {new Date(group.activeChallenge.expiresAt).toLocaleDateString()}
                  </Text>
                  <PrimaryButton
                    label={busy ? 'Starting…' : 'Take challenge quiz'}
                    icon="flash"
                    onPress={() => void startChallenge()}
                    disabled={busy}
                    style={{ marginTop: spacing.sm }}
                  />
                  {group.challengeResults.length > 0 ? (
                    <>
                      <Text style={[sectionStyle, { marginTop: spacing.md }]}>Scores</Text>
                      {group.challengeResults.map((r) => (
                        <View key={r.userId} style={styles.row}>
                          <Text style={[styles.rowName, { flex: 1 }]}>{r.displayName}</Text>
                          <Text style={{ fontFamily: theme.fonts.bodyBold, color: colors.primary }}>
                            {r.scorePercent}% ({r.correctCount}/{r.totalCount})
                          </Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={metaStyle}>No submissions yet — be the first!</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={metaStyle}>
                    {group.members.length < 2
                      ? 'Invite at least one friend to start a challenge.'
                      : 'Start a 10-question challenge for your Barkada.'}
                  </Text>
                  <PrimaryButton
                    label={busy ? 'Creating…' : 'Start new challenge'}
                    variant={group.members.length < 2 ? 'outline' : undefined}
                    icon="trophy-outline"
                    onPress={() => void startChallenge()}
                    disabled={busy || group.members.length < 2}
                    style={{ marginTop: spacing.sm }}
                  />
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
