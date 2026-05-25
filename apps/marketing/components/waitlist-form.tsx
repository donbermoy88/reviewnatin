'use client';

import { useState } from 'react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState('ios');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, platform }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data.error ?? 'Could not join waitlist');
        return;
      }
      setStatus('ok');
      setMessage('Salamat! We will email you when the app is ready.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error — try again.');
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          placeholder="Email mo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-[var(--rn-muted)]/30 bg-white px-4 py-3 text-sm"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-xl border border-[var(--rn-muted)]/30 bg-white px-4 py-3 text-sm"
        >
          <option value="ios">iPhone / iPad</option>
          <option value="android">Android</option>
          <option value="both">Both</option>
        </select>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-xl bg-[var(--rn-blue)] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Join beta waitlist'}
        </button>
      </div>
      {message ? (
        <p className={`text-sm ${status === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{message}</p>
      ) : null}
    </form>
  );
}
