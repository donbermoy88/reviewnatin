import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveOnboardingGoal } from './api/goals';
import { hasCompletedDiagnostic } from './api/diagnostic';
import { getOnboarding, saveOnboarding } from './onboarding-store';
import { getAppEntryHref, getPostOnboardingHref, isOnboardingComplete } from './onboarding-nav';

vi.mock('./api/goals', () => ({
  resolveOnboardingGoal: vi.fn(),
}));

vi.mock('./api/diagnostic', () => ({
  hasCompletedDiagnostic: vi.fn(),
}));

vi.mock('./onboarding-store', () => ({
  getOnboarding: vi.fn(),
  saveOnboarding: vi.fn(),
}));

const mockGetOnboarding = vi.mocked(getOnboarding);
const mockSaveOnboarding = vi.mocked(saveOnboarding);
const mockResolveGoal = vi.mocked(resolveOnboardingGoal);
const mockHasDiagnostic = vi.mocked(hasCompletedDiagnostic);

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
});

describe('getPostOnboardingHref', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends guests to dashboard', async () => {
    await expect(getPostOnboardingHref()).resolves.toBe('/(tabs)');
  });

  it('prompts diagnostic when not taken', async () => {
    mockResolveGoal.mockResolvedValue({ ...sampleGoal(), examSlug: 'cse-professional' });
    mockHasDiagnostic.mockResolvedValue(false);
    await expect(getPostOnboardingHref('user-1')).resolves.toBe('/diagnostic/intro');
  });

  it('skips diagnostic when already completed', async () => {
    mockResolveGoal.mockResolvedValue({ ...sampleGoal(), examSlug: 'cse-professional' });
    mockHasDiagnostic.mockResolvedValue(true);
    await expect(getPostOnboardingHref('user-1')).resolves.toBe('/(tabs)');
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
