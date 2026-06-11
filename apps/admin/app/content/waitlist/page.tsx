'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { ACell, ARow, ATable, EmptyState, ExamTag, T } from '@/components/admin-ui';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type WaitlistRow = { id: string; email: string; platform: string | null; exam_interest: string | null; created_at: string };
type Stats = { total: number; thisWeek: number; topSource: string };

function computeStats(rows: WaitlistRow[]): Stats {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = rows.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;
  const sources = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.platform ?? 'unknown';
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const top = Object.entries(sources).sort((a, b) => b[1] - a[1])[0];
  return { total: rows.length, thisWeek, topSource: top ? `${top[0]} (${Math.round((top[1] / (rows.length || 1)) * 100)}%)` : '—' };
}

export default function WaitlistAdminPage() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, thisWeek: 0, topSource: '—' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error: err } = await supabase.rpc('get_waitlist_signups', { p_limit: 200 });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const list = (data ?? []) as WaitlistRow[];
      setRows(list);
      setStats(computeStats(list));
      setLoading(false);
    })();
  }, []);

  const cards = [
    { n: loading ? '—' : stats.total.toLocaleString(), label: 'signups loaded (max 200)' },
    { n: loading ? '—' : `+${stats.thisWeek}`, label: 'joined this week' },
    { n: loading ? '—' : stats.topSource, label: 'top source' },
  ];

  return (
    <AdminShell title="Waitlist" description="Beta signups from the marketing site. Use exam interest to plan upcoming content tracks.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
        {cards.map((s, i) => (
          <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, padding: '16px 18px' }}>
            <div className="font-head" style={{ fontSize: 22, fontWeight: 800, color: T.text }}>{s.n}</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error ? <p style={{ color: T.danger, fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow }}>
        {loading ? (
          <p style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Loading signups…</p>
        ) : rows.length === 0 ? (
          <EmptyState icon="list" title="No signups yet" body="Marketing-site waitlist entries will show here." />
        ) : (
          <ATable columns={[{ label: 'Email' }, { label: 'Interested in' }, { label: 'Source' }, { label: 'Joined', align: 'right' }]}>
            {rows.map((r) => (
              <ARow key={r.id}>
                <ACell><span style={{ fontWeight: 600 }}>{r.email}</span></ACell>
                <ACell>{r.exam_interest ? <ExamTag slug={r.exam_interest} /> : <span style={{ color: T.textLight }}>—</span>}</ACell>
                <ACell><span style={{ fontSize: 12.5, color: T.textMuted }}>{r.platform ?? '—'}</span></ACell>
                <ACell align="right"><span style={{ fontSize: 12.5, color: T.textMuted }}>{new Date(r.created_at).toLocaleDateString()}</span></ACell>
              </ARow>
            ))}
          </ATable>
        )}
      </div>
    </AdminShell>
  );
}
