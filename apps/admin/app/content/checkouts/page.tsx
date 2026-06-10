'use client';

import { AdminCard, AdminShell, Badge } from '@/components/admin-shell';
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

function statusTone(status: string): 'green' | 'amber' | 'neutral' {
  if (status === 'paid' || status === 'fulfilled') return 'green';
  if (status === 'submitted') return 'amber';
  return 'neutral';
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
    queueMicrotask(() => {
      void load();
    });
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
      description="GCash and Maya payments awaiting manual verification. Mark paid only after confirming the transfer."
      actions={
        <button type="button" onClick={() => void load()} disabled={loading} className="btn btn-secondary">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      }
    >
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-emerald-700">{message}</p> : null}

      <AdminCard className="overflow-hidden" padding="none">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">Loading checkouts…</p>
          ) : rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">No pending checkouts.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-3 font-mono text-xs text-[var(--text)]">{row.reference_code}</td>
                    <td className="px-5 py-3 text-[var(--text)]">{emailFrom(row)}</td>
                    <td className="px-5 py-3 text-xs text-[var(--text-muted)]">
                      {row.source ?? '—'}
                      {row.utm_source ? ` · ${row.utm_source}` : ''}
                    </td>
                    <td className="px-5 py-3 text-[var(--text)]">
                      <span className="font-medium tabular-nums">₱{row.amount_php.toLocaleString('en-PH')}</span>
                      <span className="text-xs text-[var(--text-muted)]"> · {row.provider.toUpperCase()} · {skuFrom(row)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.status === 'submitted' ? (
                        <button
                          type="button"
                          disabled={fulfilling === row.reference_code}
                          onClick={() => fulfill(row.reference_code)}
                          className="btn btn-success btn-sm"
                        >
                          {fulfilling === row.reference_code ? 'Marking…' : 'Mark paid'}
                        </button>
                      ) : (
                        <span className="text-xs text-[var(--text-subtle)]">Awaiting user submit</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminCard>
    </AdminShell>
  );
}
