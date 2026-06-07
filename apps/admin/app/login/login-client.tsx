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
    <div className="min-h-screen bg-[#eef4ff] p-6 text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,99,255,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,190,38,0.20),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#f6f8fb_100%)]" />
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-[2.5rem] bg-[#071a44] p-8 text-white shadow-2xl shadow-blue-950/20 sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">ReviewNatin Admin</p>
          <h1 className="mt-5 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">Command center for mobile app quality.</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100">
            Manage content QA, CSV imports, study materials, schedules, checkouts, and platform metrics before they reach ReviewNatin users.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {['Content QA reports', 'Question imports', 'Study materials', 'Plus fulfillment'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm font-black">
                {item}
              </div>
            ))}
          </div>
        </section>

      <form onSubmit={submit} className="w-full space-y-5 rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-xl shadow-blue-950/10 backdrop-blur">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Staff Access</p>
          <h2 className="mt-3 text-3xl font-black text-[#08183f]">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Use an admin, content reviewer, or content author account.</p>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      </div>
    </div>
  );
}
