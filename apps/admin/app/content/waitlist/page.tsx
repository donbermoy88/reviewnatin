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
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data, error: err } = await supabase.rpc('get_waitlist_signups', { p_limit: 200 });
      if (err) {
        setError(err.message);
        return;
      }
      setRows((data ?? []) as WaitlistRow[]);
    })();
  }, []);

  return (
    <AdminShell
      title="Beta Waitlist"
      description="Inspect signups from reviewnatinph.com and identify exam demand before production launch."
    >
        <div className="grid gap-4 md:grid-cols-3">
          <AdminMetric label="Signups" value={rows.length} detail="Loaded latest 200" />
          <AdminMetric label="Source" value="Web" detail="Marketing site" tone="green" />
          <AdminMetric label="Use" value="Demand" detail="Exam interest planning" tone="amber" />
        </div>
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <AdminCard className="mt-6 overflow-hidden p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    No waitlist signups yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.platform ?? '—'}</td>
                    <td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </AdminCard>
    </AdminShell>
  );
}
