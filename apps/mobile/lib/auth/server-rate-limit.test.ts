import { describe, expect, it, vi } from 'vitest';

vi.mock('../supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('../monitoring/events', () => ({
  addAppBreadcrumb: vi.fn(),
}));

import { supabase } from '../supabase';
import {
  assertLoginRateLimitAllowed,
  assertOtpResendRateLimitAllowed,
} from './server-rate-limit';

describe('assertLoginRateLimitAllowed', () => {
  it('returns null when RPC allows login', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as never);
    await expect(assertLoginRateLimitAllowed('user@example.com')).resolves.toBeNull();
  });

  it('returns Taglish message when RPC denies login', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as never);
    const msg = await assertLoginRateLimitAllowed('user@example.com');
    expect(msg).toMatch(/15 minuto/i);
  });

  it('fails open when RPC errors', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'missing' } } as never);
    await expect(assertLoginRateLimitAllowed('user@example.com')).resolves.toBeNull();
  });
});

describe('assertOtpResendRateLimitAllowed', () => {
  it('returns null when RPC allows resend', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: true, error: null } as never);
    await expect(assertOtpResendRateLimitAllowed('user@example.com')).resolves.toBeNull();
  });

  it('returns Taglish message when resend cap reached', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: false, error: null } as never);
    const msg = await assertOtpResendRateLimitAllowed('user@example.com');
    expect(msg).toMatch(/resend limit/i);
  });

  it('fails open when RPC errors', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: 'missing' } } as never);
    await expect(assertOtpResendRateLimitAllowed('user@example.com')).resolves.toBeNull();
  });
});
