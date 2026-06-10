'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') === 'staff' ? 'Staff account required (admin or content role).' : null
  );
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      const next = params.get('next') ?? '/';
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between bg-[var(--sidebar)] p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-[var(--primary)] text-base font-bold">R</span>
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">ReviewNatin Admin</span>
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            The command center for mobile app quality.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
            Manage content QA, CSV imports, study materials, schedules, checkouts, and platform metrics before they
            reach ReviewNatin users.
          </p>
          <div className="mt-8 grid max-w-md gap-2.5 sm:grid-cols-2">
            {['Content QA reports', 'Question imports', 'Study materials', 'Plus fulfillment'].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} ReviewNatin · Staff access only</p>
      </section>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--app-bg)] px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-2 flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
              R
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              ReviewNatin Admin
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--text)]">Sign in</h2>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            Use an admin, content reviewer, or content author account.
          </p>

          {error ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="field-label">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field-input"
              />
            </label>
            <label className="block">
              <span className="field-label">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
            </label>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary mt-6 w-full py-3">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
