import { describe, expect, it } from 'vitest';
import {
  DEFERRED_DASHBOARD_FETCHES,
  NETWORK_PROBE_FAILURES_BEFORE_OFFLINE,
  VIRTUALIZED_LIST_SCREENS,
} from './perf-catalog';

describe('perf-catalog', () => {
  it('requires two probe failures before offline', () => {
    expect(NETWORK_PROBE_FAILURES_BEFORE_OFFLINE).toBe(2);
  });

  it('lists virtualized long-list screens', () => {
    expect(VIRTUALIZED_LIST_SCREENS.length).toBeGreaterThanOrEqual(4);
  });

  it('defers heavy dashboard analytics fetches', () => {
    expect(DEFERRED_DASHBOARD_FETCHES).toContain('fetchTopicAnalytics');
    expect(DEFERRED_DASHBOARD_FETCHES).toContain('fetchDailyStudyTrend');
  });
});
