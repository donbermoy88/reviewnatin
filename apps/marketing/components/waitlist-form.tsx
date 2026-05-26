'use client';

import { useState } from 'react';

type Props = {
  dark?: boolean;
  centered?: boolean;
};

export function WaitlistForm({ dark = false, centered = false }: Props) {
  const [email, setEmail]       = useState('');
  const [platform, setPlatform] = useState('ios');
  const [status, setStatus]     = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [message, setMessage]   = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res  = await fetch('/api/waitlist', {
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
      setMessage('Salamat! We\'ll email you when the app is ready. 🎉');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Network error — subukan ulit.');
    }
  };

  const inputBase = dark
    ? 'border border-white/10 bg-white/8 text-white placeholder:text-white/30 focus:border-[var(--rn-blue)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--rn-blue)]/20'
    : 'border border-[var(--rn-muted)]/25 bg-white text-[var(--rn-text)] placeholder:text-[var(--rn-muted)] focus:border-[var(--rn-blue)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--rn-blue)]/10';

  if (status === 'ok') {
    return (
      <div className={`rounded-2xl border ${dark ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'} p-5 ${centered ? 'text-center' : ''}`}>
        <p className="text-lg">🎉</p>
        <p className={`mt-1 font-semibold ${dark ? 'text-white' : 'text-emerald-800'}`}>
          Na-join na ang waitlist mo!
        </p>
        <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-emerald-700'}`}>{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`space-y-3 ${centered ? 'mx-auto max-w-lg' : ''}`}>
      <div className={`flex flex-col gap-3 ${centered ? 'sm:flex-row' : 'sm:flex-row'}`}>
        <input
          type="email"
          required
          placeholder="Email mo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`min-w-0 flex-1 rounded-xl px-4 py-3 text-sm transition ${inputBase}`}
          style={dark ? { background: 'rgba(255,255,255,0.06)' } : undefined}
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={`rounded-xl px-4 py-3 text-sm transition ${inputBase}`}
          style={dark ? { background: 'rgba(255,255,255,0.06)' } : undefined}
        >
          <option value="ios">iPhone / iPad</option>
          <option value="android">Android</option>
          <option value="both">Both</option>
        </select>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-xl bg-[var(--rn-gold)] px-6 py-3 text-sm font-bold text-[#060d1f] shadow-lg shadow-[var(--rn-gold)]/20 transition hover:brightness-110 disabled:opacity-60"
        >
          {status === 'loading' ? 'Joining…' : 'Join beta →'}
        </button>
      </div>
      {message && status === 'error' ? (
        <p className={`text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>{message}</p>
      ) : null}
    </form>
  );
}
