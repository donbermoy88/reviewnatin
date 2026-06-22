import { describe, expect, it, vi, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearLoginLockout,
  getLoginLockoutMessage,
  recordFailedLoginAttempt,
} from './login-lockout';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('login lockout', () => {
  beforeEach(() => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();
  });

  it('allows attempts under threshold', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ attempts: 2, lockedUntil: null }));
    const msg = await recordFailedLoginAttempt();
    expect(msg).toBeNull();
  });

  it('locks after 5 failures', async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ attempts: 4, lockedUntil: null }));
    const msg = await recordFailedLoginAttempt();
    expect(msg).toMatch(/15 minutes/i);
  });

  it('reports lockout message when active', async () => {
    const lockedUntil = Date.now() + 60_000;
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(JSON.stringify({ attempts: 5, lockedUntil }));
    const msg = await getLoginLockoutMessage();
    expect(msg).toMatch(/Try again/i);
  });

  it('clears lockout', async () => {
    await clearLoginLockout();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'reviewnatin:login_lockout',
      JSON.stringify({ attempts: 0, lockedUntil: null })
    );
  });
});
