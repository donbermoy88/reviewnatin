import { describe, expect, it } from 'vitest';
import { ANALYTICS_FUNNEL_EVENTS } from './funnel-catalog';
import type { AnalyticsEventName } from './events';

describe('ANALYTICS_FUNNEL_EVENTS', () => {
  it('lists core Phase 4 funnel events', () => {
    const names = ANALYTICS_FUNNEL_EVENTS.map((e) => e.event);
    expect(names).toContain('daily_active');
    expect(names).toContain('subscription_active');
    expect(names.length).toBeGreaterThanOrEqual(16);
  });

  it('uses valid AnalyticsEventName entries', () => {
    const catalog = ANALYTICS_FUNNEL_EVENTS.map((e) => e.event);
    const sample: AnalyticsEventName[] = [
      'registration_started',
      'practice_completed',
      'dashboard_charts_viewed',
    ];
    for (const name of sample) {
      expect(catalog).toContain(name);
    }
  });
});
