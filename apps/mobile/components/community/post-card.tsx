import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { type CommunityPost } from '../../lib/api/community';
import { formatRelativeTimeAgo } from '../../lib/format/relative-time';
import { Avatar } from './avatar';
import { BlockUserConfirmModal } from './block-user-confirm-modal';
import { PostImage } from './post-image';
import { RemovedContentPlaceholder } from './removed-content-placeholder';
import { ReportContentModal } from './report-content-modal';
import { UnderReviewPlaceholder } from './under-review-placeholder';

type Props = {
  post: CommunityPost;
  onLike: (post: CommunityPost) => void;
  onSave: (post: CommunityPost) => void;
  onManage: (post: CommunityPost) => void;
  onOpenPost: (post: CommunityPost) => void;
  onOpenProfile: (userId: string) => void;
  onBlockedAuthor: (authorId: string) => void;
};

export function PostCard({ post, onLike, onSave, onManage, onOpenPost, onOpenProfile, onBlockedAuthor }: Props) {
  const { colors, fonts, spacing, radii } = useAppTheme();
  const [reportVisible, setReportVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);
  const isVisible = post.moderationStatus === 'visible';

  const onOverflow = () => {
    Alert.alert('Post options', undefined, [
      { text: 'Report post', onPress: () => setReportVisible(true) },
      { text: `Block ${post.authorDisplayName}`, style: 'destructive', onPress: () => setBlockVisible(true) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
              {formatRelativeTimeAgo(post.createdAt)}
            </Text>
            {post.examName ? (
              <>
                <Text style={{ fontSize: 12, color: colors.textLight }}>·</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
                  {post.examName}
                </Text>
              </>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          onPress={() => (post.isOwn ? onManage(post) : onOverflow())}
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
          <Pressable onPress={() => onOpenPost(post)}>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, lineHeight: 20 }}>
              {post.body}
            </Text>
          </Pressable>
          {post.imageUrl ? <PostImage uri={post.imageUrl} postId={post.id} /> : null}
        </>
      )}

      {isVisible ? (
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

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={() => void Share.share({ message: post.body })}
            accessibilityRole="button"
            accessibilityLabel="Share post"
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => onSave(post)}
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

      <ReportContentModal
        visible={reportVisible}
        targetType="post"
        targetId={post.id}
        onClose={() => setReportVisible(false)}
      />
      <BlockUserConfirmModal
        visible={blockVisible}
        userId={post.authorId}
        displayName={post.authorDisplayName}
        onClose={() => setBlockVisible(false)}
        onBlocked={() => onBlockedAuthor(post.authorId)}
      />
    </View>
  );
}
