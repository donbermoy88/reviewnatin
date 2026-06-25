import { isSupabaseConfigured, supabase } from '../supabase';
import {
  mapComment,
  mapCursor,
  mapPost,
  type CommunityComment,
  type CommunityModerationStatus,
  type CommunityPost,
  type CommunityScope,
  type CommunitySort,
  type FeedCursor,
} from './community-map';

export type { CommunityComment, CommunityModerationStatus, CommunityPost, CommunityScope, CommunitySort, FeedCursor };

export type CommunityProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
};

export type CommunityReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_or_abusive'
  | 'inappropriate'
  | 'violence_or_harmful'
  | 'copyrighted_or_leaked'
  | 'personal_information'
  | 'wrong_info'
  | 'other';

export type CommunityReportTargetType = 'post' | 'comment' | 'image' | 'user';

export async function fetchCommunityFeed(
  examSlug: string,
  cursor: FeedCursor,
  limit = 20,
  opts?: { scope?: CommunityScope; sort?: CommunitySort }
): Promise<{ items: CommunityPost[]; nextCursor: FeedCursor }> {
  if (!isSupabaseConfigured) return { items: [], nextCursor: null };

  const { data, error } = await supabase.rpc('get_community_feed', {
    p_exam_slug: examSlug,
    p_cursor_created_at: cursor?.kind === 'keyset' ? cursor.createdAt : null,
    p_cursor_id: cursor?.kind === 'keyset' ? cursor.id : null,
    p_limit: limit,
    p_scope: opts?.scope ?? 'all',
    p_sort: opts?.sort ?? 'latest',
    p_offset: cursor?.kind === 'offset' ? cursor.offset : 0,
  });
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  const fallbackExam = { slug: row.exam_slug as string, name: (row.exam_name as string) ?? null };
  const items = ((row.items as Record<string, unknown>[]) ?? []).map((r) => mapPost(r, fallbackExam));
  return { items, nextCursor: mapCursor(row.next_cursor, row.next_offset) };
}

export async function fetchCommunityPost(postId: string): Promise<CommunityPost | null> {
  const { data, error } = await supabase.rpc('get_community_post', { p_post_id: postId });
  if (error) throw error;
  if (!data) return null;
  return mapPost(data as Record<string, unknown>);
}

export async function createCommunityPost(body: string, imageUrl?: string): Promise<{ id: string; createdAt: string }> {
  const { data, error } = await supabase.rpc('create_community_post', {
    p_body: body,
    p_image_url: imageUrl ?? null,
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return { id: row.id as string, createdAt: row.created_at as string };
}

export async function toggleCommunityLike(postId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_community_like', { p_post_id: postId });
  if (error) throw error;
  return Boolean((data as Record<string, unknown>).liked);
}

export async function toggleCommunityPostSave(postId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_community_save', { p_post_id: postId });
  if (error) throw error;
  return Boolean((data as Record<string, unknown>).saved);
}

export async function fetchCommunityComments(
  postId: string,
  cursor: FeedCursor,
  limit = 20
): Promise<{ items: CommunityComment[]; nextCursor: FeedCursor }> {
  const { data, error } = await supabase.rpc('get_community_comments', {
    p_post_id: postId,
    p_cursor_created_at: cursor?.kind === 'keyset' ? cursor.createdAt : null,
    p_cursor_id: cursor?.kind === 'keyset' ? cursor.id : null,
    p_limit: limit,
  });
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  const items = ((row.items as Record<string, unknown>[]) ?? []).map(mapComment);
  return { items, nextCursor: mapCursor(row.next_cursor, null) };
}

export async function createCommunityComment(postId: string, body: string): Promise<{ id: string; createdAt: string }> {
  const { data, error } = await supabase.rpc('create_community_comment', {
    p_post_id: postId,
    p_body: body,
  });
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return { id: row.id as string, createdAt: row.created_at as string };
}

export async function toggleCommunityFollow(followeeId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_community_follow', { p_followee_id: followeeId });
  if (error) throw error;
  return Boolean((data as Record<string, unknown>).following);
}

export async function reportCommunityContent(
  targetType: CommunityReportTargetType,
  targetId: string,
  reason: CommunityReportReason,
  details?: string
): Promise<{ duplicate: boolean }> {
  const { data, error } = await supabase.rpc('report_community_content', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
    p_details: details ?? null,
  });
  if (error) throw error;
  return { duplicate: Boolean((data as Record<string, unknown>)?.duplicate) };
}

export async function toggleCommunityUserBlock(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_community_user_block', { p_blocked_user_id: userId });
  if (error) throw error;
  return Boolean((data as Record<string, unknown>).blocked);
}

export type CommunityBlockedUser = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
};

export async function fetchBlockedUsers(): Promise<CommunityBlockedUser[]> {
  const { data, error } = await supabase.rpc('fetch_community_blocked_users');
  if (error) throw error;
  return ((data as Record<string, unknown>[]) ?? []).map((row) => ({
    userId: row.user_id as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) ?? null,
    blockedAt: row.blocked_at as string,
  }));
}

/** RLS already restricts this to the post's own author (community_posts_owner_update). */
export async function updateCommunityPost(postId: string, body: string): Promise<void> {
  const { error } = await supabase.from('community_posts').update({ body }).eq('id', postId);
  if (error) throw error;
}

/** RLS already restricts this to the comment's own author (community_comments_owner_update). */
export async function updateCommunityComment(commentId: string, body: string): Promise<void> {
  const { error } = await supabase.from('community_comments').update({ body }).eq('id', commentId);
  if (error) throw error;
}

export async function deleteCommunityPost(postId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_community_post', { p_post_id: postId });
  if (error) throw error;
}

export async function deleteCommunityComment(commentId: string): Promise<void> {
  const { error } = await supabase.rpc('soft_delete_community_comment', { p_comment_id: commentId });
  if (error) throw error;
}

/** Direct table read — community_posts has a public RLS SELECT policy, no RPC needed.
 *  Unlike get_community_feed/get_community_post, RLS can't redact columns, so the
 *  under_review/removed redaction is applied client-side here to match. */
export async function fetchUserCommunityPosts(authorId: string, limit = 20): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, author_id, body, image_url, like_count, comment_count, created_at, moderation_status, exam_types ( slug, name )')
    .eq('author_id', authorId)
    .neq('moderation_status', 'hidden')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const exam = row.exam_types as unknown as { slug: string; name: string } | null;
    const moderationStatus = row.moderation_status as CommunityModerationStatus;
    const redacted = moderationStatus === 'under_review' || moderationStatus === 'removed';
    return {
      id: row.id,
      authorId: row.author_id,
      authorDisplayName: '',
      authorAvatarUrl: null,
      body: redacted
        ? moderationStatus === 'under_review'
          ? 'This content is under review.'
          : 'This content was removed.'
        : row.body,
      imageUrl: redacted ? null : row.image_url,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at,
      likedByMe: false,
      savedByMe: false,
      isOwn: false,
      examSlug: exam?.slug ?? null,
      examName: exam?.name ?? null,
      moderationStatus,
    };
  });
}

export async function fetchCommunityProfile(userId: string): Promise<CommunityProfile | null> {
  const { data, error } = await supabase.rpc('get_community_profile', { p_user_id: userId });
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    userId: row.user_id as string,
    displayName: row.display_name as string,
    avatarUrl: (row.avatar_url as string) ?? null,
    postCount: row.post_count as number,
    followerCount: row.follower_count as number,
    followingCount: row.following_count as number,
    isFollowing: Boolean(row.is_following),
    isSelf: Boolean(row.is_self),
  };
}
