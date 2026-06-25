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
    isOwn: Boolean(row.is_own),
    examSlug: (row.exam_slug as string) ?? fallbackExam?.slug ?? null,
    examName: (row.exam_name as string) ?? fallbackExam?.name ?? null,
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
  };
}

export function mapCursor(raw: unknown): FeedCursor {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;
  if (!c.created_at || !c.id) return null;
  return { createdAt: c.created_at as string, id: c.id as string };
}
