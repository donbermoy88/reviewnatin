import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_EXAM_SLUG, getExamCatalogItem } from '@reviewnatin/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { CommunityReportButton } from '../../components/community-report-button';
import { EmptyState } from '../../components/empty-state';
import { ErrorBoundary } from '../../components/error-boundary';
import { ErrorState } from '../../components/error-state';
import { PrimaryButton } from '../../components/primary-button';
import { Skeleton } from '../../components/skeleton';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useUserProfile } from '../../hooks/use-user-profile';
import {
  deleteCommunityPost,
  fetchCommunityFeed,
  toggleCommunityLike,
  createCommunityPost,
  updateCommunityPost,
  type CommunityPost,
  type FeedCursor,
} from '../../lib/api/community';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { formatRelativeTime } from '../../lib/format/relative-time';
import { useAuth } from '../../providers/auth-provider';

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const { colors, fonts } = useAppTheme();
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: size * 0.36, color: '#fff' }}>
        {name[0]?.toUpperCase() ?? '?'}
      </Text>
    </View>
  );
}

function PostCard({
  post,
  onLike,
  onManage,
  onOpenPost,
  onOpenProfile,
}: {
  post: CommunityPost;
  onLike: (post: CommunityPost) => void;
  onManage: (post: CommunityPost) => void;
  onOpenPost: (post: CommunityPost) => void;
  onOpenProfile: (userId: string) => void;
}) {
  const { colors, fonts, spacing, radii } = useAppTheme();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable onPress={() => onOpenProfile(post.authorId)} hitSlop={4}>
          <Avatar url={post.authorAvatarUrl} name={post.authorDisplayName} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onOpenProfile(post.authorId)} hitSlop={4}>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
            {post.authorDisplayName}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
            {formatRelativeTime(post.createdAt)} ago
          </Text>
        </Pressable>
        {post.isOwn ? (
          <Pressable onPress={() => onManage(post)} hitSlop={8} accessibilityLabel="Manage post">
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.textLight} />
          </Pressable>
        ) : (
          <CommunityReportButton postId={post.id} />
        )}
      </View>

      <Pressable onPress={() => onOpenPost(post)}>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 }}>
          {post.body}
        </Text>
      </Pressable>

      {post.imageUrl ? (
        <Image
          source={{ uri: post.imageUrl }}
          style={{ width: '100%', height: 180, borderRadius: radii.md, backgroundColor: colors.background }}
          resizeMode="cover"
        />
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: 2 }}>
        <Pressable
          onPress={() => onLike(post)}
          accessibilityRole="button"
          accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          hitSlop={8}
        >
          <Ionicons
            name={post.likedByMe ? 'heart' : 'heart-outline'}
            size={18}
            color={post.likedByMe ? colors.error : colors.textMuted}
          />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
            {post.likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onOpenPost(post)}
          accessibilityRole="button"
          accessibilityLabel="View comments"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          hitSlop={8}
        >
          <Ionicons name="chatbubble-outline" size={17} color={colors.textMuted} />
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
            {post.commentCount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function CommunityScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const { user } = useAuth();
  const { displayName, avatarUrl } = useUserProfile('Guest');

  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [noExamSelected, setNoExamSelected] = useState(false);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<FeedCursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const examName = getExamCatalogItem(examSlug)?.name ?? examSlug.replace(/-/g, ' ');

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      // A truly-null goal (no local draft and no remote goal) means this user
      // never picked an exam — don't silently default them into the CSE feed.
      const goal = await resolveOnboardingGoal(user?.id);
      if (!goal?.examSlug) {
        setNoExamSelected(true);
        setPosts([]);
        return;
      }
      setNoExamSelected(false);
      setExamSlug(goal.examSlug);
      const page = await fetchCommunityFeed(goal.examSlug, null, 20);
      setPosts(page.items);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (err) {
      setLoadError(toUserFacingError(err));
      setPosts([]);
      // Otherwise FlatList's onEndReached keeps firing on the empty list and
      // loadMore() retries this same failing request in a tight loop.
      setHasMore(false);
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

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await fetchCommunityFeed(examSlug, cursor, 20);
      setPosts((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch {
      // Silent — pagination failures shouldn't interrupt the already-loaded feed.
      // Stop further onEndReached retries so this doesn't loop indefinitely.
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [examSlug, cursor, hasMore, loading, loadingMore]);

  const submitPost = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    const body = composerText.trim();
    if (!body || posting) return;

    setPosting(true);
    try {
      const result = await createCommunityPost(body);
      const optimistic: CommunityPost = {
        id: result.id,
        authorId: user.id,
        authorDisplayName: displayName,
        authorAvatarUrl: avatarUrl,
        body,
        imageUrl: null,
        likeCount: 0,
        commentCount: 0,
        createdAt: result.createdAt,
        likedByMe: false,
        isOwn: true,
        examSlug,
        examName,
      };
      setPosts((prev) => [optimistic, ...prev]);
      setComposerText('');
    } catch (err) {
      Alert.alert('Could not post', toUserFacingError(err));
    } finally {
      setPosting(false);
    }
  };

  const onLike = async (post: CommunityPost) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
          : p
      )
    );
    try {
      await toggleCommunityLike(post.id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: post.likedByMe, likeCount: post.likeCount }
            : p
        )
      );
    }
  };

  const onDelete = (post: CommunityPost) => {
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommunityPost(post.id);
            setPosts((prev) => prev.filter((p) => p.id !== post.id));
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  const onManage = (post: CommunityPost) => {
    Alert.alert('Manage post', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => { setEditingPost(post); setEditText(post.body); } },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post) },
    ]);
  };

  const closeEditSheet = () => {
    if (savingEdit) return;
    setEditingPost(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingPost || savingEdit) return;
    const body = editText.trim();
    if (!body) return;
    setSavingEdit(true);
    try {
      await updateCommunityPost(editingPost.id, body);
      setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? { ...p, body } : p)));
      setEditingPost(null);
      setEditText('');
    } catch (err) {
      Alert.alert('Could not save', toUserFacingError(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const onOpenPost = (post: CommunityPost) => {
    router.push({ pathname: '/community/[postId]', params: { postId: post.id } });
  };

  const onOpenProfile = (userId: string) => {
    router.push({ pathname: '/community/profile/[userId]', params: { userId } });
  };

  const ListHeader = (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.sm }}>
      <Text style={{ fontFamily: fonts.displayBold, fontSize: 22, color: colors.text, letterSpacing: -0.5 }}>
        Community
      </Text>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md }}>
        {examName} reviewers
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Avatar url={avatarUrl} name={displayName} size={36} />
          {user ? (
            <TextInput
              value={composerText}
              onChangeText={setComposerText}
              placeholder={`Share something with ${examName} reviewers…`}
              placeholderTextColor={colors.textLight}
              editable={!posting}
              multiline
              maxLength={2000}
              style={{
                flex: 1,
                minHeight: 40,
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.text,
                paddingTop: 8,
              }}
            />
          ) : (
            // Plain TextInput with editable=false never fires onFocus on tap (Android
            // swallows the touch), so guests need an actual Pressable to redirect.
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Log in to post"
              style={{ flex: 1, minHeight: 40, justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.textLight }}>
                Log in to post
              </Text>
            </Pressable>
          )}
        </View>
        {composerText.trim().length > 0 && (
          <PrimaryButton
            label={posting ? 'Posting…' : 'Post'}
            size="md"
            disabled={posting}
            onPress={() => void submitPost()}
            style={{ alignSelf: 'flex-end' }}
          />
        )}
      </View>
    </View>
  );

  const ListEmpty = loading ? (
    <View style={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={120} radius={14} />
      ))}
    </View>
  ) : loadError ? (
    <ErrorState description={loadError} onRetry={() => { setLoading(true); void load(); }} />
  ) : (
    <View style={{ paddingHorizontal: spacing.md }}>
      <EmptyState
        icon={<Ionicons name="people-outline" size={32} color={colors.primary} />}
        title="Wala pang post dito"
        description={`Maging unang mag-share sa ${examName} community!`}
      />
    </View>
  );

  if (!loading && noExamSelected) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg }}>
          <EmptyState
            icon={<Ionicons name="flag-outline" size={32} color={colors.primary} />}
            title="Pumili muna ng exam"
            description="Kailangan mong pumili ng target exam para makita ang community na ito."
            actionLabel="Pumili ng exam"
            onAction={() => router.push('/onboarding')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={tabScrollPadding(insets)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={8}
        windowSize={11}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onLike={onLike}
            onManage={onManage}
            onOpenPost={onOpenPost}
            onOpenProfile={onOpenProfile}
          />
        )}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} /> : null
        }
      />

      <AppSheet
        visible={!!editingPost}
        title="Edit post"
        onClose={closeEditSheet}
      >
        <TextInput
          value={editText}
          onChangeText={setEditText}
          multiline
          maxLength={2000}
          autoFocus
          textAlignVertical="top"
          style={{
            minHeight: 100,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            padding: spacing.md,
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
          }}
        />
        <PrimaryButton
          label={savingEdit ? 'Saving…' : 'Save changes'}
          size="lg"
          disabled={savingEdit || !editText.trim()}
          onPress={() => void saveEdit()}
        />
        <PrimaryButton label="Cancel" variant="ghost" disabled={savingEdit} onPress={closeEditSheet} />
      </AppSheet>
    </View>
  );
}

export default function CommunityScreen() {
  return (
    <ErrorBoundary>
      <CommunityScreenContent />
    </ErrorBoundary>
  );
}
