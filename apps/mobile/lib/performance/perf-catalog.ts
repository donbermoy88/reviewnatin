/**
 * Phase 5 performance inventory — used by beta:phase5:verify.
 */

export const NETWORK_PROBE_FAILURES_BEFORE_OFFLINE = 2;

/** Long lists must use FlatList (not ScrollView + map). */
export const VIRTUALIZED_LIST_SCREENS = [
  'apps/mobile/app/mock-review/[sessionId].tsx',
  'apps/mobile/app/(tabs)/leaderboard.tsx',
  'apps/mobile/app/mistakes/index.tsx',
  'apps/mobile/app/bookmarks/index.tsx',
] as const;

/** Dashboard sections deferred until after first interaction. */
export const DEFERRED_DASHBOARD_FETCHES = ['fetchTopicAnalytics', 'fetchDailyStudyTrend'] as const;

/** Guest dashboard work that must not block low-end first paint. */
export const DEFERRED_GUEST_DASHBOARD_FETCHES = [
  'fetchExamBySlug',
  'fetchSubjectAreas',
  'fetchTopicsBySubjectSlug',
  'fetchTopicQuestionCounts',
  'fetchContentGateStatus',
  'fetchAppAnnouncements',
] as const;
