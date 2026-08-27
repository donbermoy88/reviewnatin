import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, Share, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/use-app-theme';
import { useReducedMotion } from '../../hooks/use-reduced-motion';
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
  const { colors, fonts, spacing, radii, motion } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const [reportVisible, setReportVisible] = useState(false);
  const [blockVisible, setBlockVisible] = useState(false);
  const isVisible = post.moderationStatus === 'visible';

  // Subtle heart pop when the viewer likes a post (not on unlike, and not on
  // the initial mount of an already-liked post). Respects reduced motion.
  const [heartScale] = useState(() => new Animated.Value(1));
  const prevLiked = useRef(post.likedByMe);
  useEffect(() => {
    if (post.likedByMe && !prevLiked.current && !reduceMotion) {
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.35, duration: motion.duration.fast, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(heartScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
      ]).start();
    }
    prevLiked.current = post.likedByMe;
  }, [post.likedByMe, reduceMotion, heartScale, motion]);

  const handleLike = () => {
    if (!post.likedByMe) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onLike(post);
  };

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
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: colors.text, letterSpacing: -0.1 }}>
            {post.authorDisplayName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: colors.textMuted }}>
              {formatRelativeTimeAgo(post.createdAt)}
            </Text>
            {post.examName ? (
              <>
                <Text style={{ fontSize: 13, color: colors.textLight }}>·</Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted }}>
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
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text, lineHeight: 22 }}>
              {post.body}
            </Text>
          </Pressable>
          {post.imageUrl ? <PostImage uri={post.imageUrl} postId={post.id} /> : null}
        </>
      )}

      {isVisible ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: 2 }}>
          <Pressable
            onPress={handleLike}
            accessibilityRole="button"
            accessibilityLabel={post.likedByMe ? 'Unlike' : 'Like'}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            hitSlop={8}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={post.likedByMe ? 'heart' : 'heart-outline'}
                size={18}
                color={post.likedByMe ? colors.error : colors.textMuted}
              />
            </Animated.View>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: post.likedByMe ? colors.error : colors.textMuted }}>
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
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted }}>
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
