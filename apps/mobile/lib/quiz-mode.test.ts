import { describe, expect, it } from 'vitest';
import { resolveQuizMode, toQuizSessionMode } from './quiz-mode';

describe('resolveQuizMode (descriptive / result-route mode)', () => {
  it('passes through modes that have a dedicated descriptive label', () => {
    for (const mode of ['diagnostic', 'mock', 'board', 'timed', 'weak_area', 'barkada', 'bookmark_review']) {
      expect(resolveQuizMode({ mode })).toBe(mode);
    }
  });

  it('maps mistake_review to practice (matches the result-route mapping)', () => {
    expect(resolveQuizMode({ mode: 'mistake_review' })).toBe('practice');
  });

  it('falls back to practice for an unknown online mode', () => {
    expect(resolveQuizMode({ mode: undefined })).toBe('practice');
    expect(resolveQuizMode({ mode: 'something-else' })).toBe('practice');
  });

  it('falls back to offline when offline and no specific mode matched', () => {
    expect(resolveQuizMode({ mode: 'offline', offline: true })).toBe('offline');
    expect(resolveQuizMode({ mode: undefined, offline: true })).toBe('offline');
  });

  it('keeps the specific mode even when offline (mode wins over offline)', () => {
    expect(resolveQuizMode({ mode: 'mock', offline: true })).toBe('mock');
  });
});

describe('toQuizSessionMode (DB quiz_sessions.mode enum)', () => {
  it('passes through modes that map to a server enum value', () => {
    for (const mode of ['diagnostic', 'mock', 'board', 'timed', 'mistake_review', 'barkada']) {
      expect(toQuizSessionMode({ mode })).toBe(mode);
    }
  });

  it('collapses modes without a server enum to practice', () => {
    expect(toQuizSessionMode({ mode: 'weak_area' })).toBe('practice');
    expect(toQuizSessionMode({ mode: 'bookmark_review' })).toBe('practice');
    expect(toQuizSessionMode({ mode: 'offline' })).toBe('practice');
    expect(toQuizSessionMode({ mode: undefined })).toBe('practice');
  });
});
