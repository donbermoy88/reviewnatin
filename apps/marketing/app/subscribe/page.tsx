'use client';

import { useEffect, useMemo, useState } from 'react';
import { SITE_URL } from '@reviewnatin/shared';

const plans = [
  {
    name: 'Plus Monthly',
    price: '₱159/month',
    positioning: 'Starter access',
    items: [
      'Access to all Phase 1 exams',
      'Practice quizzes',
      'Mock exams',
      'Flashcards',
      'Diagnostic exams',
      'Progress tracking',
      'No ads',
      'Basic PasaPath access',
    ],
    highlight: false,
  },
  {
    name: 'Plus 6 Months',
    price: '₱699/6 months',
    positioning: 'Best for one exam preparation season',
    badge: 'BEST VALUE',
    savings: 'Save around 27%',
    items: [
      'All features in Plus Monthly',
      'Full PasaPath access',
      'Offline review packs',
      'Weakness-based recommendations',
      'Priority access to newly added questions',
      'Save compared with monthly billing',
    ],
    highlight: true,
  },
  {
    name: 'Plus Yearly',
    price: '₱1,499/year',
    positioning: 'Best for long-term review and multiple exam preparation',
    savings: 'Save around 21%',
    items: [
      'All features in Plus Monthly',
      'Full 12-month access',
      'Full PasaPath access',
      'Offline review packs',
      'Weakness-based recommendations',
      'Priority access to newly added questions',
      'Access to future Phase 1 question updates',
    ],
    highlight: false,
  },
];

function buildAppUrl(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `reviewnatin://subscribe?${qs}` : 'reviewnatin://subscribe';
}

function buildUniversalUrl(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `${SITE_URL}/subscribe?${qs}` : `${SITE_URL}/subscribe`;
}

export default function SubscribePage() {
  const [mounted, setMounted] = useState(false);
  const [params, setParams] = useState<URLSearchParams>(new URLSearchParams());

  useEffect(() => {
    // Defer to avoid synchronous setState chain in effect commit phase
    // (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setParams(new URLSearchParams(window.location.search));
      setMounted(true);
    });
  }, []);

  const appUrl = useMemo(() => buildAppUrl(params), [params]);
  const universalUrl = useMemo(() => buildUniversalUrl(params), [params]);

  const openApp = () => {
    window.location.href = appUrl;
    window.setTimeout(() => {
      window.location.href = universalUrl;
    }, 1200);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--rn-blue)]">ReviewNatin Plus</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Choose your Plus plan</h1>
      <p className="mt-3 text-slate-600">
        Monthly, 6 Months, and Yearly are all ReviewNatin Plus subscriptions. The duration controls how long your
        subscription stays active.
      </p>

      <div className="mt-8 space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-5 shadow-sm ${
              plan.highlight ? 'border-[var(--rn-blue)] bg-[var(--rn-blue)]/5' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {plan.badge ? (
                  <span className="mb-2 inline-flex rounded-full bg-amber-300 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-950">
                    {plan.badge}
                  </span>
                ) : null}
                <h2 className="font-display text-lg font-bold text-slate-900">{plan.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{plan.positioning}</p>
              </div>
              <span className="text-right text-sm font-semibold text-[var(--rn-blue)]">{plan.price}</span>
            </div>
            {plan.savings ? <p className="mt-3 text-sm font-semibold text-emerald-600">{plan.savings}</p> : null}
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {plan.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {mounted ? (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={openApp}
            className="w-full rounded-xl bg-[var(--rn-blue)] px-4 py-3 font-semibold text-white transition hover:bg-[#1735a8]"
          >
            Buksan sa ReviewNatin app
          </button>
          <a
            href={appUrl}
            className="block text-center text-sm font-medium text-[var(--rn-blue)] underline-offset-2 hover:underline"
          >
            reviewnatin://subscribe
          </a>
        </div>
      ) : (
        <p className="mt-8 text-slate-500">Loading...</p>
      )}

      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Wala pang app? Sumali sa waitlist sa{' '}
        <a href={SITE_URL} className="font-medium text-[var(--rn-blue)] hover:underline">
          reviewnatinph.com
        </a>
        . Pag may checkout reference ka na, pumunta sa{' '}
        <a href={`${SITE_URL}/checkout`} className="font-medium text-[var(--rn-blue)] hover:underline">
          checkout page
        </a>
        .
      </p>
    </main>
  );
}
