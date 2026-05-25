'use client';

import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
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
    void load();
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <AdminNav />
        <Link href="/" className="text-sm font-medium text-blue-600">
          ← Admin home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Web checkouts</h1>
        <p className="mt-2 text-sm text-slate-600">
          GCash / Maya payments awaiting manual verification. Mark paid after confirming transfer.
        </p>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

        <div className="mt-6 overflow-hidden rounded-xl border bg-white shadow-sm">
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
                          className="rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}
