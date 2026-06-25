import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState } from '../../../components/error-state';
import { PrimaryButton } from '../../../components/primary-button';
import { useAppTheme } from '../../../hooks/use-app-theme';
import {
  fetchCommunityProfile,
  fetchUserCommunityPosts,
  toggleCommunityFollow,
  type CommunityPost,
  type CommunityProfile,
} from '../../../lib/api/community';
import { toUserFacingError } from '../../../lib/errors/user-facing';
import { stackScrollPadding } from '../../../lib/layout/content-padding';
import { formatRelativeTimeAgo } from '../../../lib/format/relative-time';
import { useAuth } from '../../../providers/auth-provider';

function Avatar({ url, name, size = 72 }: { url: string | null; name: string; size?: number }) {
  const { colors, fonts } = useAppTheme();
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.displayBold, fontSize: size * 0.36, color: '#fff' }}>
        {name[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

export default function CommunityProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fonts, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      // Without this, a missing/not-yet-resolved userId param leaves
      // `loading` stuck at true forever — no error, no escape but back.
      setLoadError('Profile not found.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [p, userPosts] = await Promise.all([
        fetchCommunityProfile(userId),
        fetchUserCommunityPosts(userId),
      ]);
      setProfile(p);
      setPosts(userPosts);
    } catch (err) {
      setLoadError(toUserFacingError(err));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Refetch on focus, not just on mount — e.g. returning here after opening
  // one of this user's posts should reflect any like/follow changes made
  // along the way, not the stale snapshot from the last mount.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const onToggleFollow = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!profile || followBusy) return;
    setFollowBusy(true);
    const wasFollowing = profile.isFollowing;
    setProfile({
      ...profile,
      isFollowing: !wasFollowing,
      followerCount: profile.followerCount + (wasFollowing ? -1 : 1),
    });
    try {
      await toggleCommunityFollow(profile.userId);
    } catch {
      setProfile((prev) => (prev ? { ...prev, isFollowing: wasFollowing, followerCount: profile.followerCount } : prev));
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <ErrorState description={loadError ?? 'Profile not found.'} onRetry={() => { setLoading(true); void load(); }} />
      </View>
    );
  }

  const Header = (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: insets.top + spacing.sm }}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={{ marginBottom: spacing.md }}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Avatar url={profile.avatarUrl} name={profile.displayName} />
        <Text style={{ fontFamily: fonts.displayBold, fontSize: 20, color: colors.text }}>
          {profile.displayName}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.xl, marginTop: spacing.xs }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text }}>{profile.postCount}</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>Posts</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text }}>{profile.followerCount}</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>Followers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text }}>{profile.followingCount}</Text>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>Following</Text>
          </View>
        </View>

        {!profile.isSelf ? (
          <PrimaryButton
            label={profile.isFollowing ? 'Following' : 'Follow'}
            variant={profile.isFollowing ? 'outline' : 'primary'}
            icon={profile.isFollowing ? 'checkmark' : 'person-add-outline'}
            disabled={followBusy}
            onPress={() => void onToggleFollow()}
            style={{ marginTop: spacing.sm, minWidth: 140 }}
          />
        ) : null}
      </View>

      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginBottom: spacing.sm }}>
        Posts
      </Text>
    </View>
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      style={{ backgroundColor: colors.background }}
      ListHeaderComponent={Header}
      contentContainerStyle={stackScrollPadding(insets)}
      ListEmptyComponent={
        <Text
          style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, paddingHorizontal: spacing.md }}
        >
          Walang post pa.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push({ pathname: '/community/[postId]', params: { postId: item.id } })}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
            padding: spacing.md,
          }}
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 }} numberOfLines={4}>
            {item.body}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight }}>
              {formatRelativeTimeAgo(item.createdAt)}
            </Text>
            {item.examName ? (
              <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: colors.primaryMuted }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.primary }}>{item.examName}</Text>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="heart-outline" size={13} color={colors.textLight} />
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight }}>{item.likeCount}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="chatbubble-outline" size={13} color={colors.textLight} />
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textLight }}>{item.commentCount}</Text>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}
