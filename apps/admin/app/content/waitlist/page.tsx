'use client';

import { AdminCard, AdminMetric, AdminShell } from '@/components/admin-shell';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type WaitlistRow = {
  id: string;
  email: string;
  platform: string | null;
  exam_interest: string | null;
  created_at: string;
};

export default function WaitlistAdminPage() {
  const [rows, setRows] = useState<WaitlistRow[]>([]);
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
      setRows((data ?? []) as WaitlistRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminShell
      title="Beta Waitlist"
      description="Inspect signups from reviewnatinph.com and identify exam demand before production launch."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <AdminMetric label="Signups" value={loading ? '—' : rows.length} detail="Latest 200" />
        <AdminMetric label="Source" value="Web" detail="Marketing site" tone="green" />
        <AdminMetric label="Use" value="Demand" detail="Exam interest planning" tone="amber" />
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <AdminCard className="mt-6 overflow-hidden" padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    Loading signups…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    No waitlist signups yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{row.email}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{row.platform ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
