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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">ReviewNatin Admin</h1>
        <p className="text-sm text-slate-600">Sign in with a staff account.</p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
