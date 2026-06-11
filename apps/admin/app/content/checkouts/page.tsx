'use client';

import { AdminCard, AdminShell } from '@/components/admin-shell';
import { useCallback, useEffect, useState } from 'react';

type CheckoutRow = {
  id: string;
  reference_code: string;
  status: string;
  provider: string;
  amount_php: number;
  source: string | null;
  utm_source: string | null;
  created_at: string;
  submitted_at: string | null;
  users: { email: string } | { email: string }[] | null;
  subscription_products: { sku: string } | { sku: string }[] | null;
};

function emailFrom(row: CheckoutRow): string {
  const u = row.users;
  if (Array.isArray(u)) return u[0]?.email ?? '—';
  return u?.email ?? '—';
}

function skuFrom(row: CheckoutRow): string {
  const p = row.subscription_products;
  if (Array.isArray(p)) return p[0]?.sku ?? '—';
  return p?.sku ?? '—';
}

export default function CheckoutsAdminPage() {
  const [rows, setRows] = useState<CheckoutRow[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [fulfilling, setFulfilling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/content/checkouts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Load failed');
      setRows(data.rows ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer the call by one microtask so the synchronous setState chain inside
    // `load()` does not run inside the effect's render-phase commit, which
    // would trip react-hooks/set-state-in-effect.
    queueMicrotask(() => { void load(); });
  }, [load]);

  const fulfill = async (referenceCode: string) => {
    setFulfilling(referenceCode);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/content/checkouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fulfill failed');
      setMessage(`Fulfilled ${referenceCode}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fulfill failed');
    } finally {
      setFulfilling(null);
    }
  };

  return (
    <AdminShell
      title="Web Checkouts"
      description="GCash and Maya payments awaiting manual verification. Mark paid only after confirming transfer."
    >
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

        <AdminCard className="mt-6 overflow-hidden p-0">
          {loading ? (
            <p className="px-4 py-8 text-sm text-slate-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="px-4 py-8 text-sm text-slate-500">No pending checkouts.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs">{row.reference_code}</td>
                    <td className="px-4 py-3">{emailFrom(row)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.source ?? '—'}
                      {row.utm_source ? ` · ${row.utm_source}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      ₱{row.amount_php} · {row.provider.toUpperCase()} · {skuFrom(row)}
                    </td>
                    <td className="px-4 py-3 capitalize">{row.status}</td>
                    <td className="px-4 py-3">
                      {row.status === 'submitted' ? (
                        <button
                          type="button"
                          disabled={fulfilling === row.reference_code}
                          onClick={() => fulfill(row.reference_code)}
                          className="rounded-xl bg-green-600 px-3 py-2 text-xs font-black text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {fulfilling === row.reference_code ? '…' : 'Mark paid'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Awaiting user submit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </AdminCard>
    </AdminShell>
  );
}
