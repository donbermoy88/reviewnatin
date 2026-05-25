'use client';

import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <AdminNav />
        <Link href="/" className="text-sm font-medium text-blue-600">
          ← Admin home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Beta waitlist</h1>
        <p className="mt-2 text-sm text-slate-600">Signups from reviewnatinph.com marketing site.</p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
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
        </div>
      </div>
    </div>
  );
}
