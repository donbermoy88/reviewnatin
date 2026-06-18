/**
 * Canonical quiz-mode resolution.
 *
 * The practice quiz screen derives several mode strings from the route's
 * `mode` param plus a runtime `offline` flag:
 *
 *   - a "descriptive" mode used for analytics tags, the guest history record,
 *     and the result-screen route param, and
 *   - a DB `quiz_sessions.mode` enum value sent when persisting a session.
 *
 * These were inline ternary chains copy-pasted across four call sites, which
 * had already drifted (some Sentry tags collapsed `weak_area`/`barkada` to
 * `practice`). Centralizing them keeps every consumer consistent.
 */
import type { QuizMode } from './api/quiz';

/**
 * The `mode` values the practice quiz route understands. The raw param is still
 * typed `string` (expo-router hands back arbitrary strings), but this union
 * documents the recognized set and is the input to {@link isQuizRouteMode}.
 */
export type QuizRouteMode =
  | 'practice'
  | 'timed'
  | 'mock'
  | 'board'
  | 'diagnostic'
  | 'mistake_review'
  | 'bookmark_review'
  | 'weak_area'
  | 'barkada'
  | 'offline';

/** The descriptive mode {@link resolveQuizMode} produces. */
export type DescriptiveQuizMode =
  | 'diagnostic'
  | 'mock'
  | 'board'
  | 'timed'
  | 'weak_area'
  | 'barkada'
  | 'bookmark_review'
  | 'mistake_review'
  | 'offline'
  | 'practice';

const QUIZ_ROUTE_MODES = new Set<string>([
  'practice',
  'timed',
  'mock',
  'board',
  'diagnostic',
  'mistake_review',
  'bookmark_review',
  'weak_area',
  'barkada',
  'offline',
]);

/** Narrow a raw route param to a recognized {@link QuizRouteMode}. */
export function isQuizRouteMode(value: string | undefined): value is QuizRouteMode {
  return value != null && QUIZ_ROUTE_MODES.has(value);
}

export type QuizModeInput = {
  /** Raw `mode` route param (one of {@link QuizRouteMode}, or undefined). */
  mode?: string;
  /** Whether the session ran against the offline pack. */
  offline?: boolean;
};

/**
 * Descriptive mode used for analytics, guest history, and result routing.
 * Falls back to `offline`/`practice` for any unrecognized mode, matching the
 * original "no specific mode matched" branch.
 *
 * `mistake_review` is a first-class value here: the result screen renders it
 * identically to `practice` (it is not special-cased in any branch), so routing
 * it through is behavior-preserving while keeping analytics/guest-history/DB all
 * in agreement.
 */
export function resolveQuizMode({ mode, offline = false }: QuizModeInput): DescriptiveQuizMode {
  switch (mode) {
    case 'diagnostic':
    case 'mock':
    case 'board':
    case 'timed':
    case 'weak_area':
    case 'barkada':
    case 'bookmark_review':
    case 'mistake_review':
      return mode;
    default:
      return offline ? 'offline' : 'practice';
  }
}

/**
 * DB `quiz_sessions.mode` enum value. Modes without a dedicated server enum
 * (`weak_area`, `bookmark_review`, `offline`) persist as `practice`, exactly
 * as the original session-create mapping did.
 */
export function toQuizSessionMode({ mode }: QuizModeInput): QuizMode {
  switch (mode) {
    case 'diagnostic':
    case 'mock':
    case 'board':
    case 'timed':
    case 'mistake_review':
    case 'barkada':
      return mode;
    default:
      return 'practice';
  }
}
