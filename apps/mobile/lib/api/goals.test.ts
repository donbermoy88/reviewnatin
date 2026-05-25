import { describe, expect, it } from 'vitest';
import {
  mergeOnboardingWithRemote,
  requiresLetSecondaryMajor,
  type ActiveGoalRow,
} from './goals-merge';
import type { OnboardingData } from '../onboarding-store';

const baseLocal: OnboardingData = {
  examSlug: 'cse-professional',
  targetDate: '2026-12-01',
  dailyMinutes: 30,
  level: 'beginner',
  completed: true,
};

describe('mergeOnboardingWithRemote', () => {
  it('returns null when both sources empty', () => {
    expect(mergeOnboardingWithRemote(null, null)).toBeNull();
  });

  it('returns local when no remote goal', () => {
    expect(mergeOnboardingWithRemote(baseLocal, null)).toEqual(baseLocal);
  });

  it('prefers remote exam slug and dates', () => {
    const remote: ActiveGoalRow = {
      target_exam_date: '2027-01-15',
      daily_minutes: 45,
      current_level: 'intermediate',
      major_slug: null,
      exam_types: { slug: 'let-elementary', name: 'LET Elementary' },
    };
    const merged = mergeOnboardingWithRemote(baseLocal, remote);
    expect(merged?.examSlug).toBe('let-elementary');
    expect(merged?.targetDate).toBe('2027-01-15');
    expect(merged?.dailyMinutes).toBe(45);
    expect(merged?.level).toBe('intermediate');
    expect(merged?.completed).toBe(true);
  });

  it('keeps local major when remote omits it', () => {
    const local: OnboardingData = { ...baseLocal, majorSlug: 'english', examSlug: 'let-secondary' };
    const remote: ActiveGoalRow = {
      target_exam_date: '2026-06-01',
      daily_minutes: 30,
      current_level: 'beginner',
      major_slug: null,
      exam_types: { slug: 'let-secondary', name: 'LET Secondary' },
    };
    expect(mergeOnboardingWithRemote(local, remote)?.majorSlug).toBe('english');
  });
});

describe('requiresLetSecondaryMajor', () => {
  it('requires major for LET secondary', () => {
    expect(requiresLetSecondaryMajor({ examSlug: 'let-secondary' })).toBe(true);
    expect(requiresLetSecondaryMajor({ examSlug: 'let-secondary', majorSlug: 'english' })).toBe(false);
  });
});
