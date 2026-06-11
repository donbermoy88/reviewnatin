'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { T } from '@/components/admin-ui';

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="19" fill="rgba(255,255,255,0.1)" />
      <circle cx="20" cy="20" r="12" fill={T.primary} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
        const r = (a * Math.PI) / 180;
        return <line key={i} x1={20 + 13.5 * Math.cos(r)} y1={20 + 13.5 * Math.sin(r)} x2={20 + 18 * Math.cos(r)} y2={20 + 18 * Math.sin(r)} stroke={T.gold} strokeWidth="2.2" strokeLinecap="round" />;
      })}
      <path d="M14 20.5l3.5 3.5 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(params.get('error') === 'staff' ? 'Staff account required (admin or content role).' : null);
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
    <div style={{ display: 'grid', minHeight: '100vh', gridTemplateColumns: '1fr 1fr', fontFamily: T.fontBody }} className="rn-two-col">
      {/* Brand panel */}
      <section className="max-lg:hidden" style={{ position: 'relative', background: `linear-gradient(180deg, ${T.sideBg} 0%, ${T.sideBg2} 100%)`, color: '#fff', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Logo />
          <span className="font-head" style={{ fontWeight: 800, fontSize: 18 }}>Review<span style={{ color: T.gold }}>Natin</span></span>
        </div>
        <div>
          <h1 className="font-head" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em', maxWidth: 420 }}>The command center for mobile app quality.</h1>
          <p style={{ marginTop: 16, fontSize: 15, lineHeight: 1.6, color: T.sideText, maxWidth: 420 }}>
            Manage content QA, CSV imports, study materials, schedules, checkouts, and platform metrics before they reach ReviewNatin users.
          </p>
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 420 }}>
            {['Content QA reports', 'Question imports', 'Study materials', 'Plus fulfillment'].map((item) => (
              <div key={item} style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#dbe3f5' }}>{item}</div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(147,165,214,0.6)' }}>© {new Date().getFullYear()} ReviewNatin · Staff access only</p>
      </section>

      {/* Form panel */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, padding: 24 }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 360 }}>
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Logo /><span className="font-head" style={{ fontWeight: 800, fontSize: 18, color: T.text }}>Review<span style={{ color: T.gold }}>Natin</span></span>
          </div>
          <h2 className="font-head" style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>Sign in</h2>
          <p style={{ marginTop: 6, fontSize: 13.5, color: T.textMuted }}>Use an admin, content reviewer, or content author account.</p>

          {error ? (
            <p style={{ marginTop: 20, borderRadius: 10, border: '1px solid #f6caca', background: T.dangerBg, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: T.danger }}>{error}</p>
          ) : null}

          <div style={{ marginTop: 24, display: 'grid', gap: 16 }}>
            <label style={{ display: 'block' }}>
              <span className="field-label">Email</span>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" />
            </label>
            <label style={{ display: 'block' }}>
              <span className="field-label">Password</span>
              <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" />
            </label>
          </div>

          <button type="submit" disabled={loading} className="rn-btn rn-btn-primary" style={{ marginTop: 24, width: '100%', padding: '11px 16px', fontSize: 14, fontWeight: 600, borderRadius: 8, background: T.primary, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
