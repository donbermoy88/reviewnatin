import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveOnboardingGoal } from './api/goals';
import { getOnboarding, saveOnboarding } from './onboarding-store';
import { getAppEntryHref, getPostOnboardingHref, isOnboardingComplete } from './onboarding-nav';

vi.mock('./api/goals', () => ({
  resolveOnboardingGoal: vi.fn(),
}));

vi.mock('./onboarding-store', () => ({
  getOnboarding: vi.fn(),
  saveOnboarding: vi.fn(),
}));

const mockGetOnboarding = vi.mocked(getOnboarding);
const mockSaveOnboarding = vi.mocked(saveOnboarding);
const mockResolveGoal = vi.mocked(resolveOnboardingGoal);

describe('isOnboardingComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when local onboarding completed', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: true });
    await expect(isOnboardingComplete()).resolves.toBe(true);
    expect(mockResolveGoal).not.toHaveBeenCalled();
  });

  it('syncs remote completed goal to local storage', async () => {
    mockGetOnboarding.mockResolvedValue(null);
    mockResolveGoal.mockResolvedValue({ ...sampleGoal(), completed: true });
    await expect(isOnboardingComplete('user-1')).resolves.toBe(true);
    expect(mockSaveOnboarding).toHaveBeenCalledOnce();
  });

  it('returns false for guest without local completion', async () => {
    mockGetOnboarding.mockResolvedValue(null);
    await expect(isOnboardingComplete()).resolves.toBe(false);
  });

  it('returns false when remote goal exists but is incomplete', async () => {
    mockGetOnboarding.mockResolvedValue(null);
    mockResolveGoal.mockResolvedValue({ ...sampleGoal(), completed: false });
    await expect(isOnboardingComplete('user-1')).resolves.toBe(false);
    expect(mockSaveOnboarding).not.toHaveBeenCalled();
  });

  it('falls back to local when remote goal fetch fails', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: false });
    mockResolveGoal.mockRejectedValue(new Error('network'));
    await expect(isOnboardingComplete('user-1')).resolves.toBe(false);
  });
});

describe('getAppEntryHref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes to tabs when onboarding complete', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: true });
    await expect(getAppEntryHref()).resolves.toBe('/(tabs)');
  });

  it('routes to onboarding when incomplete', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: false });
    await expect(getAppEntryHref()).resolves.toBe('/onboarding');
  });

  it('checks remote goal for signed-in users before routing', async () => {
    mockGetOnboarding.mockResolvedValue(null);
    mockResolveGoal.mockResolvedValue({ ...sampleGoal(), completed: true });
    await expect(getAppEntryHref('user-1')).resolves.toBe('/(tabs)');
  });
});

describe('getPostOnboardingHref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends guests to dashboard', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: true });
    await expect(getPostOnboardingHref()).resolves.toBe('/(tabs)');
  });

  it('sends signed-in users to dashboard', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: true });
    await expect(getPostOnboardingHref('user-1')).resolves.toBe('/(tabs)');
  });

  it('deep links to first practice when requested', async () => {
    mockGetOnboarding.mockResolvedValue({ ...sampleGoal(), completed: true, level: 'beginner' });
    await expect(getPostOnboardingHref('user-1', { startPractice: true })).resolves.toContain('/practice/quiz');
    await expect(getPostOnboardingHref('user-1', { startPractice: true })).resolves.toContain('mode=daily');
  });

  it('uses weak_area mode for advanced level', async () => {
    mockGetOnboarding.mockResolvedValue({
      ...sampleGoal(),
      completed: true,
      level: 'advanced',
    });
    await expect(getPostOnboardingHref(undefined, { startPractice: true })).resolves.toContain('mode=weak_area');
  });
});

function sampleGoal() {
  return {
    examSlug: 'cse-professional' as const,
    targetDate: '2026-12-01',
    dailyMinutes: 30,
    level: 'beginner' as const,
    completed: false,
  };
}
