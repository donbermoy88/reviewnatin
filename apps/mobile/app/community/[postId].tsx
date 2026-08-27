import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { Avatar } from '../../components/community/avatar';
import { BlockUserConfirmModal } from '../../components/community/block-user-confirm-modal';
import { CommunityGuidelinesModal } from '../../components/community/community-guidelines-modal';
import { PostImage } from '../../components/community/post-image';
import { RemovedContentPlaceholder } from '../../components/community/removed-content-placeholder';
import { ReportContentModal } from '../../components/community/report-content-modal';
import { UnderReviewPlaceholder } from '../../components/community/under-review-placeholder';
import { ErrorState } from '../../components/error-state';
import { PrimaryButton } from '../../components/primary-button';
import { communityAccessMessage, useCommunityAccess } from '../../hooks/use-community-access';
import { IconButton } from '../../components/icon-button';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useUserProfile } from '../../hooks/use-user-profile';
import {
  createCommunityComment,
  deleteCommunityComment,
  deleteCommunityPost,
  fetchCommunityComments,
  fetchCommunityPost,
  toggleCommunityLike,
  toggleCommunityPostSave,
  updateCommunityComment,
  updateCommunityPost,
  type CommunityComment,
  type CommunityPost,
  type FeedCursor,
} from '../../lib/api/community';
import { hasAcceptedCommunityGuidelines } from '../../lib/api/community-guidelines';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { stackScrollPadding } from '../../lib/layout/content-padding';
import { formatRelativeTimeAgo } from '../../lib/format/relative-time';
import { useAuth } from '../../providers/auth-provider';

function CommentRow({
  comment,
  isOwn,
  isEditing,
  editText,
  savingEdit,
  onChangeEditText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onOpenProfile,
  onBlockedAuthor,
}: {
  comment: CommunityComment;
  isOwn: boolean;
  isEditing: boolean;
  editText: string;
  savingEdit: boolean;
  onChangeEditText: (text: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onOpenProfile: () => void;
  onBlockedAuthor: (authorId: string) => void;
}) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [reportVisible, setReportVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);
  const isVisible = comment.moderationStatus === 'visible';

  const onOverflow = () => {
    Alert.alert('Comment options', undefined, [
      { text: 'Report comment', onPress: () => setReportVisible(true) },
      { text: `Block ${comment.authorDisplayName}`, style: 'destructive', onPress: () => setBlockVisible(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.sm }}>
      <Pressable onPress={onOpenProfile} hitSlop={4}>
        <Avatar url={comment.authorAvatarUrl} name={comment.authorDisplayName} size={30} />
      </Pressable>
      <View style={{ flex: 1 }}>
        {isEditing ? (
          <View style={{ gap: spacing.xs }}>
            <TextInput
              value={editText}
              onChangeText={onChangeEditText}
              multiline
              maxLength={1000}
              autoFocus
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.background,
                padding: spacing.sm,
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.text,
              }}
            />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable onPress={onSaveEdit} disabled={savingEdit} hitSlop={8}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary }}>
                  {savingEdit ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
              <Pressable onPress={onCancelEdit} disabled={savingEdit} hitSlop={8}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable onPress={onOpenProfile} hitSlop={4} style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
                    {comment.authorDisplayName}
                  </Text>
                </Pressable>
                {!isOwn ? (
                  <Pressable onPress={onOverflow} hitSlop={8} accessibilityLabel="Comment options">
                    <Ionicons name="ellipsis-horizontal" size={14} color={colors.textLight} />
                  </Pressable>
                ) : null}
              </View>
              {isVisible ? (
                <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, marginTop: 2 }}>
                  {comment.body}
                </Text>
              ) : comment.moderationStatus === 'under_review' ? (
                <View style={{ marginTop: spacing.xs }}>
                  <UnderReviewPlaceholder />
                </View>
              ) : (
                <View style={{ marginTop: spacing.xs }}>
                  <RemovedContentPlaceholder />
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4, marginLeft: 4 }}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textLight }}>
                {formatRelativeTimeAgo(comment.createdAt)}
              </Text>
              {isOwn ? (
                <>
                  <Pressable onPress={onStartEdit} hitSlop={8}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.primary }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={onDelete} hitSlop={8}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.error }}>Delete</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </>
        )}
      </View>

      <ReportContentModal
        visible={reportVisible}
        targetType="comment"
        targetId={comment.id}
        onClose={() => setReportVisible(false)}
      />
      <BlockUserConfirmModal
        visible={blockVisible}
        userId={comment.authorId}
        displayName={comment.authorDisplayName}
        onClose={() => setBlockVisible(false)}
        onBlocked={() => onBlockedAuthor(comment.authorId)}
      />
    </View>
  );
}

export default function PostDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, fonts, spacing, radii } = useAppTheme();
  const { user } = useAuth();
  const { displayName, avatarUrl } = useUserProfile('Guest');
  const access = useCommunityAccess();
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [cursor, setCursor] = useState<FeedCursor>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);
  const [editingPostBody, setEditingPostBody] = useState(false);
  const [editPostText, setEditPostText] = useState('');
  const [savingPostEdit, setSavingPostEdit] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [reportPostVisible, setReportPostVisible] = useState(false);
  const [blockPostAuthorVisible, setBlockPostAuthorVisible] = useState(false);
  const [guidelinesModalVisible, setGuidelinesModalVisible] = useState(false);

  const load = useCallback(async () => {
    if (!postId) {
      // Without this, a missing/not-yet-resolved postId param (e.g. after a
      // cold JS reload restores this route before params are ready) leaves
      // `loading` stuck at true forever — no error, no escape but back.
      setLoadError('Post not found.');
      setLoading(false);
      return;
    }
    try {
      setLoadError(null);
      const [p, page] = await Promise.all([
        fetchCommunityPost(postId),
        fetchCommunityComments(postId, null, 30),
      ]);
      setPost(p);
      setComments(page.items);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (err) {
      setLoadError(toUserFacingError(err));
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Refetch on focus, not just on mount — e.g. returning here after viewing
  // the author's profile (and possibly following/unfollowing) should show
  // current data, not the snapshot from the last time this screen mounted.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const loadMore = useCallback(async () => {
    if (!postId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchCommunityComments(postId, cursor, 30);
      setComments((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch {
      // pagination failure shouldn't disrupt what's already loaded
    } finally {
      setLoadingMore(false);
    }
  }, [postId, cursor, hasMore, loadingMore]);

  const onLike = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!post) return;
    setPost({ ...post, likedByMe: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) });
    try {
      await toggleCommunityLike(post.id);
    } catch {
      setPost(post);
    }
  };

  const onSave = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!post) return;
    setPost({ ...post, savedByMe: !post.savedByMe });
    try {
      await toggleCommunityPostSave(post.id);
    } catch {
      setPost(post);
    }
  };

  const onDeletePost = () => {
    if (!post) return;
    Alert.alert('Delete post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommunityPost(post.id);
            router.back();
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  const onManagePost = () => {
    if (!post) return;
    Alert.alert('Manage post', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => { setEditPostText(post.body); setEditingPostBody(true); } },
      { text: 'Delete', style: 'destructive', onPress: onDeletePost },
    ]);
  };

  const onOverflowPost = () => {
    if (!post) return;
    Alert.alert('Post options', undefined, [
      { text: 'Report post', onPress: () => setReportPostVisible(true) },
      { text: `Block ${post.authorDisplayName}`, style: 'destructive', onPress: () => setBlockPostAuthorVisible(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const onBlockedCommentAuthor = (authorId: string) => {
    setComments((prev) => prev.filter((c) => c.authorId !== authorId));
  };

  const saveEditedPost = async () => {
    if (!post || savingPostEdit) return;
    const body = editPostText.trim();
    if (!body) return;
    setSavingPostEdit(true);
    try {
      await updateCommunityPost(post.id, body);
      setPost({ ...post, body });
      setEditingPostBody(false);
    } catch (err) {
      Alert.alert('Could not save', toUserFacingError(err));
    } finally {
      setSavingPostEdit(false);
    }
  };

  const startEditComment = (comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.body);
  };

  const saveEditedComment = async () => {
    if (!editingCommentId || savingCommentEdit) return;
    const body = editCommentText.trim();
    if (!body) return;
    setSavingCommentEdit(true);
    try {
      await updateCommunityComment(editingCommentId, body);
      setComments((prev) => prev.map((c) => (c.id === editingCommentId ? { ...c, body } : c)));
      setEditingCommentId(null);
    } catch (err) {
      Alert.alert('Could not save', toUserFacingError(err));
    } finally {
      setSavingCommentEdit(false);
    }
  };

  const onDeleteComment = (comment: CommunityComment) => {
    Alert.alert('Delete comment?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCommunityComment(comment.id);
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
            setPost((p) => (p ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p));
          } catch {
            Alert.alert('Could not delete', 'Please try again.');
          }
        },
      },
    ]);
  };

  const sendComment = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    const body = commentText.trim();
    if (!body || sending || !post) return;
    if (!access.canPost) {
      Alert.alert('Commenting unavailable', communityAccessMessage(access.communityStatus));
      return;
    }
    const accepted = await hasAcceptedCommunityGuidelines(user.id);
    if (!accepted) {
      setGuidelinesModalVisible(true);
      return;
    }

    setSending(true);
    try {
      const result = await createCommunityComment(post.id, body);
      const optimistic: CommunityComment = {
        id: result.id,
        authorId: user.id,
        authorDisplayName: displayName,
        authorAvatarUrl: avatarUrl,
        body,
        createdAt: result.createdAt,
        moderationStatus: 'visible',
      };
      setComments((prev) => [...prev, optimistic]);
      setPost({ ...post, commentCount: post.commentCount + 1 });
      setCommentText('');
    } catch (err) {
      Alert.alert('Could not comment', toUserFacingError(err));
    } finally {
      setSending(false);
    }
  };

  const Header = (
    <View style={{ paddingHorizontal: spacing.md, paddingTop: insets.top + spacing.sm, paddingBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <IconButton
          variant="plain"
          buttonSize={28}
          size={22}
          icon="chevron-back"
          color={colors.text}
          hitSlop={8}
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: colors.text, marginLeft: spacing.sm }}>
          Post
        </Text>
      </View>

      {post ? (
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Pressable
              onPress={() => router.push({ pathname: '/community/profile/[userId]', params: { userId: post.authorId } })}
              hitSlop={4}
            >
              <Avatar url={post.authorAvatarUrl} name={post.authorDisplayName} />
            </Pressable>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push({ pathname: '/community/profile/[userId]', params: { userId: post.authorId } })}
              hitSlop={4}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text }}>
                {post.authorDisplayName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
                  {formatRelativeTimeAgo(post.createdAt)}
                </Text>
                {post.examName ? (
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 999,
                      backgroundColor: colors.primaryMuted,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: colors.primary }}>
                      {post.examName}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
            <Pressable
              onPress={() => (post.isOwn ? onManagePost() : onOverflowPost())}
              hitSlop={8}
              accessibilityLabel={post.isOwn ? 'Manage post' : 'Post options'}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textLight} />
            </Pressable>
          </View>

          {post.moderationStatus === 'under_review' ? (
            <UnderReviewPlaceholder />
          ) : post.moderationStatus === 'removed' ? (
            <RemovedContentPlaceholder />
          ) : (
            <>
              <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.text, lineHeight: 21 }}>
                {post.body}
              </Text>
              {post.imageUrl ? <PostImage uri={post.imageUrl} postId={post.id} height={200} /> : null}
            </>
          )}

          {post.moderationStatus === 'visible' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Pressable
                onPress={onLike}
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
                  {post.likeCount} like{post.likeCount === 1 ? '' : 's'}
                </Text>
              </Pressable>

              <View style={{ flex: 1 }} />

              <Pressable
                onPress={() => void onSave()}
                accessibilityRole="button"
                accessibilityLabel={post.savedByMe ? 'Unsave post' : 'Save post'}
                hitSlop={8}
              >
                <Ionicons
                  name={post.savedByMe ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={post.savedByMe ? colors.primary : colors.textMuted}
                />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text, marginTop: spacing.lg }}>
        Comments
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (loadError || !post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <ErrorState description={loadError ?? 'Post not found.'} onRetry={() => { setLoading(true); void load(); }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={Header}
        contentContainerStyle={stackScrollPadding(insets, 96)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <CommentRow
            comment={item}
            isOwn={item.authorId === user?.id}
            isEditing={editingCommentId === item.id}
            editText={editCommentText}
            savingEdit={savingCommentEdit}
            onChangeEditText={setEditCommentText}
            onStartEdit={() => startEditComment(item)}
            onSaveEdit={() => void saveEditedComment()}
            onCancelEdit={() => setEditingCommentId(null)}
            onDelete={() => onDeleteComment(item)}
            onOpenProfile={() => router.push({ pathname: '/community/profile/[userId]', params: { userId: item.authorId } })}
            onBlockedAuthor={onBlockedCommentAuthor}
          />
        )}
        ListEmptyComponent={
          <Text
            style={{
              fontFamily: fonts.bodyMedium,
              fontSize: 13,
              color: colors.textMuted,
              paddingHorizontal: spacing.md,
            }}
          >
            Walang comment pa. Ikaw na ang una!
          </Text>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} /> : null
        }
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          placeholder={user ? 'Write a comment…' : 'Log in to comment'}
          placeholderTextColor={colors.textLight}
          editable={!sending}
          onFocus={() => { if (!user) router.push('/(auth)/login'); }}
          multiline
          maxLength={1000}
          style={{
            flex: 1,
            maxHeight: 100,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.background,
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.text,
          }}
        />
        <PrimaryButton
          label="Send"
          loading={sending}
          size="md"
          disabled={!commentText.trim()}
          onPress={() => void sendComment()}
        />
      </View>

      <AppSheet
        visible={editingPostBody}
        title="Edit post"
        onClose={() => { if (!savingPostEdit) setEditingPostBody(false); }}
      >
        <TextInput
          value={editPostText}
          onChangeText={setEditPostText}
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
          label="Save changes"
          loadingLabel="Saving…"
          loading={savingPostEdit}
          size="lg"
          disabled={!editPostText.trim()}
          onPress={() => void saveEditedPost()}
        />
        <PrimaryButton
          label="Cancel"
          variant="ghost"
          disabled={savingPostEdit}
          onPress={() => setEditingPostBody(false)}
        />
      </AppSheet>

      {post ? (
        <>
          <ReportContentModal
            visible={reportPostVisible}
            targetType="post"
            targetId={post.id}
            onClose={() => setReportPostVisible(false)}
          />
          <BlockUserConfirmModal
            visible={blockPostAuthorVisible}
            userId={post.authorId}
            displayName={post.authorDisplayName}
            onClose={() => setBlockPostAuthorVisible(false)}
            onBlocked={() => router.back()}
          />
        </>
      ) : null}

      <CommunityGuidelinesModal
        visible={guidelinesModalVisible}
        onClose={() => setGuidelinesModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
