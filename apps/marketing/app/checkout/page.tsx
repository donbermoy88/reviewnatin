'use client';

import { useCallback, useEffect, useState } from 'react';
import { SITE_URL, SUPPORT_EMAIL } from '@reviewnatin/shared';

type CheckoutStatus = {
  found: boolean;
  referenceCode?: string;
  status?: string;
  amountPhp?: number;
  provider?: string;
};

export default function CheckoutPage() {
  const [ref, setRef] = useState('');
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref') ?? '';
    setRef(refParam);

    if (!refParam || !supabaseUrl || !anonKey) return;

    const utmSource = [params.get('utm_source'), params.get('utm_medium'), params.get('utm_campaign')]
      .filter(Boolean)
      .join('|');
    const source = params.get('source') ?? 'marketing_checkout';

    void fetch(`${supabaseUrl}/rest/v1/rpc/patch_web_checkout_attribution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        p_reference_code: refParam,
        p_utm_source: utmSource || null,
        p_source: source,
      }),
    });
  }, [supabaseUrl, anonKey]);

  const loadStatus = useCallback(async () => {
    if (!ref || !supabaseUrl || !anonKey) return;
    setLoading(true);
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_web_checkout_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ p_reference_code: ref }),
      });
      const data = (await res.json()) as CheckoutStatus;
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }, [ref, supabaseUrl, anonKey]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const submitPayment = async (confirmDemo: boolean) => {
    if (!ref || !supabaseUrl || !anonKey) return;
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/web-checkout-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ reference_code: ref, confirm_demo: confirmDemo }),
      });
      const data = (await res.json()) as { success?: boolean; status?: string; message?: string; error?: string };
      if (data.success) {
        setMessage(data.message ?? `Status: ${data.status}`);
        await loadStatus();
      } else {
        setMessage(data.error ?? 'Could not submit payment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const providerLabel =
    status?.provider === 'maya' ? 'Maya' : status?.provider === 'gcash' ? 'GCash' : 'E-wallet';

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">ReviewNatin Checkout</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Pay with {providerLabel}</h1>
      <p className="mt-3 text-slate-600">
        Complete your payment using the reference code below, then confirm in the app or on this page.
      </p>

      {!ref ? (
        <p className="mt-8 rounded-xl bg-amber-50 p-4 text-amber-900">Missing checkout reference. Open this page from the ReviewNatin app.</p>
      ) : loading ? (
        <p className="mt-8 text-slate-500">Loading checkout…</p>
      ) : !status?.found ? (
        <p className="mt-8 rounded-xl bg-red-50 p-4 text-red-800">Checkout session not found for {ref}.</p>
      ) : (
        <div className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Reference</span>
            <span className="font-mono text-lg font-bold text-violet-700">{status.referenceCode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Amount</span>
            <span className="text-2xl font-bold text-slate-900">₱{status.amountPhp}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Status</span>
            <span className="font-semibold capitalize text-slate-800">{status.status}</span>
          </div>

          {status.status === 'pending' || status.status === 'submitted' ? (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>Open {providerLabel} and send ₱{status.amountPhp} to our merchant account.</li>
              <li>Use reference <strong>{status.referenceCode}</strong> in the payment notes.</li>
              <li>Tap confirm below after sending.</li>
            </ol>
          ) : null}

          {status.status === 'paid' ? (
            <p className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
              Payment confirmed! Return to the ReviewNatin app — your access should be active.
            </p>
          ) : (
            <button
              type="button"
              disabled={submitting || status.status === 'expired'}
              onClick={() => void submitPayment(process.env.NODE_ENV !== 'production')}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'I sent payment — confirm'}
            </button>
          )}

          {message ? <p className="text-sm text-slate-600">{message}</p> : null}
        </div>
      )}

      <p className="mt-8 text-xs text-slate-500">
        Questions? Email {SUPPORT_EMAIL}. Not affiliated with CSC, PRC, or any government agency.
      </p>
      <a href={SITE_URL} className="mt-4 text-sm font-medium text-violet-700">
        ← Back to {SITE_URL.replace('https://', '')}
      </a>
    </main>
  );
}
