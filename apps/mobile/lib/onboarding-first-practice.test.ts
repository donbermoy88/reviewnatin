import { describe, expect, it } from 'vitest';
import {
  firstPracticeHref,
  firstPracticeMode,
  firstPracticeQuizParams,
  previewReadinessPercent,
} from './onboarding-first-practice';

describe('onboarding-first-practice', () => {
  it('maps level to preview readiness', () => {
    expect(previewReadinessPercent('beginner')).toBe(18);
    expect(previewReadinessPercent('advanced')).toBe(52);
  });

  it('routes beginners to daily practice', () => {
    expect(firstPracticeMode('beginner')).toBe('daily');
    expect(firstPracticeMode('average')).toBe('daily');
    expect(firstPracticeMode('advanced')).toBe('weak_area');
  });

  it('builds quiz params and href', () => {
    expect(firstPracticeQuizParams('cse-professional', 'beginner')).toEqual({
      pathname: '/practice/quiz',
      params: { examSlug: 'cse-professional', mode: 'daily', source: 'onboarding' },
    });
    expect(firstPracticeHref('let-elementary', 'advanced')).toContain('mode=weak_area');
    expect(firstPracticeHref('let-elementary', 'advanced')).toContain('source=onboarding');
  });
});
