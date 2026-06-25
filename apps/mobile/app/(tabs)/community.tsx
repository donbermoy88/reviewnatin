import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_EXAM_SLUG, getExamCatalogItem } from '@reviewnatin/shared';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { CommunityEmptyState } from '../../components/community/community-empty-state';
import { CommunityGuidelinesModal } from '../../components/community/community-guidelines-modal';
import { CommunityHeader } from '../../components/community/community-header';
import { CommunityLoadingState } from '../../components/community/community-loading-state';
import { CommunitySortFilter } from '../../components/community/community-sort-filter';
import { CommunityTabs } from '../../components/community/community-tabs';
import { CommunityWelcomeCard } from '../../components/community/community-welcome-card';
import { CreatePostFAB } from '../../components/community/create-post-fab';
import { CreatePostSheet } from '../../components/community/create-post-sheet';
import { PostCard } from '../../components/community/post-card';
import { PostComposerCard } from '../../components/community/post-composer-card';
import { ErrorBoundary } from '../../components/error-boundary';
import { ErrorState } from '../../components/error-state';
import { EmptyState } from '../../components/empty-state';
import { PrimaryButton } from '../../components/primary-button';
import { communityAccessMessage, useCommunityAccess } from '../../hooks/use-community-access';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useUserProfile } from '../../hooks/use-user-profile';
import {
  deleteCommunityPost,
  fetchCommunityFeed,
  toggleCommunityLike,
  toggleCommunityPostSave,
  createCommunityPost,
  updateCommunityPost,
  type CommunityPost,
  type CommunityScope,
  type CommunitySort,
  type FeedCursor,
} from '../../lib/api/community';
import { hasAcceptedCommunityGuidelines } from '../../lib/api/community-guidelines';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { tabScrollPadding } from '../../lib/layout/content-padding';
import { useAuth } from '../../providers/auth-provider';

function CommunityScreenContent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const { user } = useAuth();
  const { displayName, avatarUrl } = useUserProfile('Guest');
  const access = useCommunityAccess();

  const [examSlug, setExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [noExamSelected, setNoExamSelected] = useState(false);
  const [scope, setScope] = useState<CommunityScope>('all');
  const [sort, setSort] = useState<CommunitySort>('latest');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<FeedCursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [guidelinesModalVisible, setGuidelinesModalVisible] = useState(false);

  const examName = getExamCatalogItem(examSlug)?.name ?? examSlug.replace(/-/g, ' ');

  const fetchFirstPage = useCallback(
    async (slug: string) => {
      try {
        setLoadError(null);
        const page = await fetchCommunityFeed(slug, null, 20, { scope, sort });
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
    },
    [scope, sort]
  );

  const load = useCallback(async () => {
    // A truly-null goal (no local draft and no remote goal) means this user
    // never picked an exam — don't silently default them into the CSE feed.
    const goal = await resolveOnboardingGoal(user?.id);
    if (!goal?.examSlug) {
      setNoExamSelected(true);
      setPosts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setNoExamSelected(false);
    setExamSlug(goal.examSlug);
    await fetchFirstPage(goal.examSlug);
  }, [user, fetchFirstPage]);

  // Refetch whenever this tab regains focus — e.g. after posting a comment or
  // liking a post in the detail screen, returning here should show the
  // updated counts instead of the stale snapshot from the last visit.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  // Switching scope/sort while already focused needs its own refetch — focus
  // doesn't change just because a tab/sort was tapped. Skip the very first
  // run so this doesn't double-fetch alongside the mount-time useFocusEffect.
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (noExamSelected) return;
    setLoading(true);
    void fetchFirstPage(examSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, sort]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    try {
      const page = await fetchCommunityFeed(examSlug, cursor, 20, { scope, sort });
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
  }, [examSlug, cursor, hasMore, loading, loadingMore, scope, sort]);

  const openComposer = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!access.canPost) {
      Alert.alert('Posting unavailable', communityAccessMessage(access.communityStatus));
      return;
    }
    const accepted = await hasAcceptedCommunityGuidelines(user.id);
    if (!accepted) {
      setGuidelinesModalVisible(true);
      return;
    }
    setCreateVisible(true);
  };

  const onBlockedAuthor = (authorId: string) => {
    setPosts((prev) => prev.filter((p) => p.authorId !== authorId));
  };

  const submitPost = async (body: string) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
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
        savedByMe: false,
        isOwn: true,
        examSlug,
        examName,
        moderationStatus: 'visible',
      };
      // Only prepend when the current view would actually show it at the top —
      // a brand-new post with 0 likes/comments doesn't belong at the top of
      // Most Liked/Most Commented, and Saved never shows un-saved posts.
      if (sort === 'latest' && (scope === 'all' || scope === 'mine')) {
        setPosts((prev) => [optimistic, ...prev]);
      }
      setCreateVisible(false);
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
        prev.map((p) => (p.id === post.id ? { ...p, likedByMe: post.likedByMe, likeCount: post.likeCount } : p))
      );
    }
  };

  const onSave = async (post: CommunityPost) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    const wasSaved = post.savedByMe;
    setPosts((prev) => {
      const updated = prev.map((p) => (p.id === post.id ? { ...p, savedByMe: !p.savedByMe } : p));
      // Unsaving while viewing the Saved tab should drop the post immediately.
      return scope === 'saved' && wasSaved ? updated.filter((p) => p.id !== post.id) : updated;
    });
    try {
      await toggleCommunityPostSave(post.id);
    } catch {
      // Resync from the server rather than hand-rolling a revert for the filtered case too.
      void fetchFirstPage(examSlug);
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
    <View>
      <CommunityHeader examName={examName} insetsTop={insets.top} />
      <PostComposerCard avatarUrl={avatarUrl} displayName={displayName} isGuest={!user} onPress={openComposer} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        }}
      >
        <CommunityTabs scope={scope} onChange={setScope} />
        <CommunitySortFilter sort={sort} onChange={setSort} />
      </View>
      <CommunityWelcomeCard examSlug={examSlug} examName={examName} />
    </View>
  );

  const ListEmpty = loading ? (
    <CommunityLoadingState />
  ) : loadError ? (
    <ErrorState description={loadError} onRetry={() => { setLoading(true); void load(); }} />
  ) : (
    <View style={{ paddingHorizontal: spacing.md }}>
      <CommunityEmptyState scope={scope} examName={examName} onCreatePost={openComposer} />
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
            onSave={onSave}
            onManage={onManage}
            onOpenPost={onOpenPost}
            onOpenProfile={onOpenProfile}
            onBlockedAuthor={onBlockedAuthor}
          />
        )}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} /> : null
        }
      />

      <CreatePostFAB onPress={openComposer} />

      <CreatePostSheet
        visible={createVisible}
        examName={examName}
        posting={posting}
        onClose={() => setCreateVisible(false)}
        onSubmit={submitPost}
      />

      <AppSheet visible={!!editingPost} title="Edit post" onClose={closeEditSheet}>
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

      <CommunityGuidelinesModal
        visible={guidelinesModalVisible}
        onClose={() => setGuidelinesModalVisible(false)}
      />
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
