'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { ABtn, ACell, ARow, ATable, Avatar, EmptyState, SegTabs, StatusBadge, T } from '@/components/admin-ui';

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
function relAge(iso: string | null): string {
  if (!iso) return '—';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(mins)) return '—';
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

function PayMethod({ m }: { m: string }) {
  const key = m.toLowerCase();
  const c = key.includes('maya') ? { bg: '#e8f7f0', color: '#047857' } : { bg: '#e4edfd', color: '#1e40af' };
  return <span style={{ background: c.bg, color: c.color, borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 700 }}>{m.toUpperCase()}</span>;
}

export default function CheckoutsAdminPage() {
  const [rows, setRows] = useState<CheckoutRow[]>([]);
  const [tab, setTab] = useState<'submitted' | 'all'>('submitted');
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
    queueMicrotask(() => void load());
  }, [load]);

  const fulfill = async (referenceCode: string) => {
    setFulfilling(referenceCode);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/content/checkouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referenceCode }) });
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

  const submittedCount = rows.filter((r) => r.status === 'submitted').length;
  const visible = useMemo(() => (tab === 'submitted' ? rows.filter((r) => r.status === 'submitted') : rows), [rows, tab]);

  return (
    <AdminShell
      title="Web checkouts"
      description="Manual fulfillment for GCash and Maya payments from the marketing site. Verify the reference number before granting Pro access."
      actions={<ABtn variant="secondary" icon="refresh" disabled={loading} onClick={() => void load()}>{loading ? 'Refreshing…' : 'Refresh'}</ABtn>}
    >
      <div style={{ marginBottom: 14 }}>
        <SegTabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'submitted', label: 'Needs fulfillment', count: submittedCount },
            { id: 'all', label: 'All active', count: rows.length },
          ]}
        />
      </div>

      {error ? <p style={{ color: T.danger, fontSize: 13, marginBottom: 12 }}>{error}</p> : null}
      {message ? <p style={{ color: T.success, fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{message}</p> : null}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow }}>
        {loading ? (
          <p style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Loading checkouts…</p>
        ) : visible.length === 0 ? (
          <EmptyState icon="card" title="Nothing to fulfill" body="No checkouts match this filter." />
        ) : (
          <ATable columns={[{ label: 'Customer' }, { label: 'Plan' }, { label: 'Amount', align: 'right' }, { label: 'Method' }, { label: 'Reference #' }, { label: 'Source' }, { label: 'Status' }, { label: 'Age', align: 'right' }, { label: '', width: 130 }]}>
            {visible.map((row) => {
              const email = emailFrom(row);
              return (
                <ARow key={row.id}>
                  <ACell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={email} size={30} />
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{email}</div>
                    </div>
                  </ACell>
                  <ACell><span style={{ fontSize: 12.5, fontWeight: 600 }}>{skuFrom(row)}</span></ACell>
                  <ACell align="right"><span style={{ fontWeight: 700 }}>₱{row.amount_php.toLocaleString('en-PH')}</span></ACell>
                  <ACell><PayMethod m={row.provider} /></ACell>
                  <ACell><code style={{ background: '#eef1f7', borderRadius: 5, padding: '2px 8px', fontSize: 11.5 }}>{row.reference_code}</code></ACell>
                  <ACell><span style={{ fontSize: 12, color: T.textMuted }}>{row.source ?? '—'}{row.utm_source ? ` · ${row.utm_source}` : ''}</span></ACell>
                  <ACell><StatusBadge status={row.status} /></ACell>
                  <ACell align="right"><span style={{ fontSize: 12.5, color: T.textMuted }}>{relAge(row.submitted_at ?? row.created_at)}</span></ACell>
                  <ACell align="right">
                    {row.status === 'submitted' ? (
                      <ABtn size="sm" variant="success" icon="check" disabled={fulfilling === row.reference_code} onClick={() => fulfill(row.reference_code)}>
                        {fulfilling === row.reference_code ? '…' : 'Fulfill'}
                      </ABtn>
                    ) : (
                      <span style={{ fontSize: 12, color: T.textLight }}>Awaiting submit</span>
                    )}
                  </ACell>
                </ARow>
              );
            })}
          </ATable>
        )}
      </div>
    </AdminShell>
  );
}
