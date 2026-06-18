/**
 * Central registry of AsyncStorage / SecureStore keys.
 *
 * These string values are a persistence contract: changing one orphans every
 * device's existing data under the old key. They previously lived as ad-hoc
 * literals scattered across ~15 modules (with `reviewnatin:prefs` duplicated in
 * two files), which made collisions and accidental renames easy. Keep the
 * literals here and import them; never re-type a `reviewnatin:` string inline.
 */

/** Fixed, single-value keys. */
export const StorageKeys = {
  /** User preferences blob (mirror of the server profile prefs). */
  prefs: 'reviewnatin:prefs',
  /** Guest-mode quiz history (pre-auth sessions). */
  guestQuizHistory: 'reviewnatin:guest-quiz-history',
  /** Pending web-checkout reference awaiting reconciliation. */
  pendingCheckoutRef: 'reviewnatin:pending_checkout_ref',
  /** Store/web checkout attribution payload. */
  checkoutAttribution: 'reviewnatin:checkout-attribution',
  /** Timestamp of the last shown interstitial ad. */
  lastInterstitial: 'reviewnatin:last-interstitial',
  /** Last-selected focus-session duration (minutes). */
  focusLastMinutes: 'reviewnatin:focus:last-minutes',
  /** Offline answer queue (pending quiz sessions). */
  offlinePendingSessions: 'reviewnatin:offline:pending-sessions:v1',
  /** Offline content-report queue. */
  offlineContentReports: 'reviewnatin:offline:content-reports:v1',
} as const;

/** Prefixes for namespaced key families (callers append their own suffix). */
export const StorageKeyPrefix = {
  cache: 'reviewnatin:cache:v1:',
  secure: 'reviewnatin:secure:',
  examResume: 'reviewnatin:exam-resume:',
} as const;

/** Builders for per-entity keys. Centralized so the format stays consistent. */
export const storageKeyFor = {
  /** Downloaded offline question pack for one exam. */
  offlinePack: (examSlug: string) => `reviewnatin:offline:${examSlug}`,
  /** A user's locally-cached bookmark id set. */
  bookmarks: (userId: string) => `reviewnatin:bookmarks:${userId}`,
  /** Per-user, per-exam "diagnostic prompt dismissed" marker. */
  diagnosticDismissed: (userId: string, examSlug: string) =>
    `reviewnatin:diagnostic-dismissed:${userId}:${examSlug}`,
} as const;
