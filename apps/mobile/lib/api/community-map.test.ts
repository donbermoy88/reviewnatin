import { describe, expect, it } from 'vitest';
import { mapComment, mapCursor, mapPost } from './community-map';

describe('mapPost', () => {
  const baseRow = {
    id: 'post-1',
    author_id: 'user-1',
    author_display_name: 'Juan',
    author_avatar_url: null,
    body: 'Hello world',
    image_url: null,
    like_count: 3,
    comment_count: 1,
    created_at: '2026-06-25T00:00:00Z',
    liked_by_me: true,
    is_own: false,
  };

  it('maps a full row correctly', () => {
    const post = mapPost({ ...baseRow, exam_slug: 'cse-professional', exam_name: 'CSE Professional' });
    expect(post).toEqual({
      id: 'post-1',
      authorId: 'user-1',
      authorDisplayName: 'Juan',
      authorAvatarUrl: null,
      body: 'Hello world',
      imageUrl: null,
      likeCount: 3,
      commentCount: 1,
      createdAt: '2026-06-25T00:00:00Z',
      likedByMe: true,
      isOwn: false,
      examSlug: 'cse-professional',
      examName: 'CSE Professional',
    });
  });

  it('coerces missing liked_by_me/is_own to false rather than undefined', () => {
    const post = mapPost({ ...baseRow, liked_by_me: undefined, is_own: undefined });
    expect(post.likedByMe).toBe(false);
    expect(post.isOwn).toBe(false);
  });

  it('falls back to the page-level exam info when the row has none (feed rows)', () => {
    const post = mapPost(baseRow, { slug: 'let-elementary', name: 'LET Elementary' });
    expect(post.examSlug).toBe('let-elementary');
    expect(post.examName).toBe('LET Elementary');
  });

  it('prefers the row-level exam info over the fallback when both are present (single-post fetch)', () => {
    const post = mapPost(
      { ...baseRow, exam_slug: 'pnle', exam_name: 'PNLE' },
      { slug: 'let-elementary', name: 'LET Elementary' }
    );
    expect(post.examSlug).toBe('pnle');
    expect(post.examName).toBe('PNLE');
  });

  it('defaults exam info to null when neither row nor fallback has it', () => {
    const post = mapPost(baseRow);
    expect(post.examSlug).toBeNull();
    expect(post.examName).toBeNull();
  });
});

describe('mapComment', () => {
  it('maps a comment row correctly', () => {
    const comment = mapComment({
      id: 'comment-1',
      author_id: 'user-2',
      author_display_name: 'Maria',
      author_avatar_url: 'https://example.com/a.png',
      body: 'Nice post!',
      created_at: '2026-06-25T01:00:00Z',
    });
    expect(comment).toEqual({
      id: 'comment-1',
      authorId: 'user-2',
      authorDisplayName: 'Maria',
      authorAvatarUrl: 'https://example.com/a.png',
      body: 'Nice post!',
      createdAt: '2026-06-25T01:00:00Z',
    });
  });
});

describe('mapCursor', () => {
  it('returns null for null/undefined input', () => {
    expect(mapCursor(null)).toBeNull();
    expect(mapCursor(undefined)).toBeNull();
  });

  it('returns null for a non-object input', () => {
    expect(mapCursor('not-an-object')).toBeNull();
    expect(mapCursor(42)).toBeNull();
  });

  it('returns null when created_at or id is missing (end of pagination)', () => {
    expect(mapCursor({})).toBeNull();
    expect(mapCursor({ created_at: '2026-06-25T00:00:00Z' })).toBeNull();
    expect(mapCursor({ id: 'abc' })).toBeNull();
  });

  it('maps a valid cursor object', () => {
    expect(mapCursor({ created_at: '2026-06-25T00:00:00Z', id: 'post-9' })).toEqual({
      createdAt: '2026-06-25T00:00:00Z',
      id: 'post-9',
    });
  });
});
