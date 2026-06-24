import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  clearLoginLockout,
  getLoginLockoutMessage,
  recordFailedLoginAttempt,
} from './login-lockout';
import { deleteSecureItem, getSecureItem, setSecureItem } from '../secure-storage';

vi.mock('../secure-storage', () => ({
  getSecureItem: vi.fn(),
  setSecureItem: vi.fn(),
  deleteSecureItem: vi.fn(),
}));

describe('login lockout', () => {
  beforeEach(() => {
    vi.stubGlobal('__DEV__', false);
    vi.mocked(getSecureItem).mockResolvedValue(null);
    vi.mocked(setSecureItem).mockResolvedValue();
    vi.mocked(deleteSecureItem).mockResolvedValue();
  });

  it('allows attempts under threshold', async () => {
    vi.mocked(getSecureItem).mockResolvedValue(JSON.stringify({ attempts: 2, lockedUntil: null }));
    const msg = await recordFailedLoginAttempt();
    expect(msg).toBeNull();
  });

  it('locks after 5 failures', async () => {
    vi.mocked(getSecureItem).mockResolvedValue(JSON.stringify({ attempts: 4, lockedUntil: null }));
    const msg = await recordFailedLoginAttempt();
    expect(msg).toMatch(/15 minutes/i);
  });

  it('reports lockout message when active', async () => {
    const lockedUntil = Date.now() + 60_000;
    vi.mocked(getSecureItem).mockResolvedValue(JSON.stringify({ attempts: 5, lockedUntil }));
    const msg = await getLoginLockoutMessage();
    expect(msg).toMatch(/Try again/i);
  });

  it('clears lockout via secure delete', async () => {
    await clearLoginLockout();
    expect(deleteSecureItem).toHaveBeenCalledWith('reviewnatin:login_lockout');
  });
});
