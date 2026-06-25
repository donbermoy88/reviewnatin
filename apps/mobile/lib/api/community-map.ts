export type CommunityModerationStatus = 'visible' | 'under_review' | 'hidden' | 'removed';

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
  savedByMe: boolean;
  isOwn: boolean;
  examSlug: string | null;
  examName: string | null;
  moderationStatus: CommunityModerationStatus;
};

export type CommunityScope = 'all' | 'mine' | 'saved';
export type CommunitySort = 'latest' | 'unanswered' | 'most_liked' | 'most_commented';

export type CommunityComment = {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  body: string;
  createdAt: string;
  moderationStatus: CommunityModerationStatus;
};

export type FeedCursor =
  | { kind: 'keyset'; createdAt: string; id: string }
  | { kind: 'offset'; offset: number }
  | null;

export function mapPost(
  row: Record<string, unknown>,
  fallbackExam?: { slug: string; name: string | null }
): CommunityPost {
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
    savedByMe: Boolean(row.saved_by_me),
    isOwn: Boolean(row.is_own),
    examSlug: (row.exam_slug as string) ?? fallbackExam?.slug ?? null,
    examName: (row.exam_name as string) ?? fallbackExam?.name ?? null,
    moderationStatus: (row.moderation_status as CommunityModerationStatus) ?? 'visible',
  };
}

export function mapComment(row: Record<string, unknown>): CommunityComment {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorDisplayName: row.author_display_name as string,
    authorAvatarUrl: (row.author_avatar_url as string) ?? null,
    body: row.body as string,
    createdAt: row.created_at as string,
    moderationStatus: (row.moderation_status as CommunityModerationStatus) ?? 'visible',
  };
}

/** `next_cursor` (keyset) and `next_offset` (offset-mode sorts) are mutually exclusive in the RPC response. */
export function mapCursor(nextCursor: unknown, nextOffset: unknown): FeedCursor {
  if (typeof nextOffset === 'number') return { kind: 'offset', offset: nextOffset };
  if (!nextCursor || typeof nextCursor !== 'object') return null;
  const c = nextCursor as Record<string, unknown>;
  if (!c.created_at || !c.id) return null;
  return { kind: 'keyset', createdAt: c.created_at as string, id: c.id as string };
}
