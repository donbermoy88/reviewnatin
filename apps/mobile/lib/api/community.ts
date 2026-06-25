import { isSupabaseConfigured, supabase } from '../supabase';

export type CommunityPost = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  likedByMe: boolean;
  isOwn: boolean;
  examSlug: string | null;
  examName: string | null;
};

export type CommunityComment = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
};

export type FeedCursor = { createdAt: string; id: string } | null;

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

export type CommunityReportReason = 'spam' | 'harassment' | 'wrong_info' | 'inappropriate' | 'other';

function mapPost(row: Record<string, unknown>, fallbackExam?: { slug: string; name: string | null }): CommunityPost {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorDisplayName: row.author_display_name as string,
    authorAvatarUrl: (row.author_avatar_url as string) ?? null,
    body: row.body as string,
    imageUrl: (row.image_url as string) ?? null,
    likeCount: row.like_count as number,
    commentCount: row.comment_count as number,
    createdAt: row.created_at as string,
    likedByMe: Boolean(row.liked_by_me),
    isOwn: Boolean(row.is_own),
    examSlug: (row.exam_slug as string) ?? fallbackExam?.slug ?? null,
    examName: (row.exam_name as string) ?? fallbackExam?.name ?? null,
  };
}

function mapComment(row: Record<string, unknown>): CommunityComment {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorDisplayName: row.author_display_name as string,
    authorAvatarUrl: (row.author_avatar_url as string) ?? null,
    body: row.body as string,
    createdAt: row.created_at as string,
  };
}

function mapCursor(raw: unknown): FeedCursor {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (!c.created_at || !c.id) return null;
  return { createdAt: c.created_at as string, id: c.id as string };
}

export async function fetchCommunityFeed(
  examSlug: string,
  cursor: FeedCursor,
  limit = 20
): Promise<{ items: CommunityPost[]; nextCursor: FeedCursor }> {
  if (!isSupabaseConfigured) return { items: [], nextCursor: null };

  const { data, error } = await supabase.rpc('get_community_feed', {
    p_exam_slug: examSlug,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit,
  });
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  const fallbackExam = { slug: row.exam_slug as string, name: (row.exam_name as string) ?? null };
  const items = ((row.items as Record<string, unknown>[]) ?? []).map((r) => mapPost(r, fallbackExam));
  return { items, nextCursor: mapCursor(row.next_cursor) };
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

export async function fetchCommunityComments(
  postId: string,
  cursor: FeedCursor,
  limit = 20
): Promise<{ items: CommunityComment[]; nextCursor: FeedCursor }> {
  const { data, error } = await supabase.rpc('get_community_comments', {
    p_post_id: postId,
    p_cursor_created_at: cursor?.createdAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: limit,
  });
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  const items = ((row.items as Record<string, unknown>[]) ?? []).map(mapComment);
  return { items, nextCursor: mapCursor(row.next_cursor) };
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
  reason: CommunityReportReason,
  details?: string,
  target?: { postId?: string; commentId?: string }
): Promise<void> {
  const { error } = await supabase.rpc('report_community_content', {
    p_post_id: target?.postId ?? null,
    p_comment_id: target?.commentId ?? null,
    p_reason: reason,
    p_details: details ?? null,
  });
  if (error) throw error;
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

/** Direct table read — community_posts has a public RLS SELECT policy, no RPC needed. */
export async function fetchUserCommunityPosts(authorId: string, limit = 20): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from('community_posts')
    .select('id, author_id, body, image_url, like_count, comment_count, created_at, exam_types ( slug, name )')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const exam = row.exam_types as unknown as { slug: string; name: string } | null;
    return {
      id: row.id,
      authorId: row.author_id,
      authorDisplayName: '',
      authorAvatarUrl: null,
      body: row.body,
      imageUrl: row.image_url,
      likeCount: row.like_count,
      commentCount: row.comment_count,
      createdAt: row.created_at,
      likedByMe: false,
      isOwn: false,
      examSlug: exam?.slug ?? null,
      examName: exam?.name ?? null,
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
