'use client';

import { useEffect, useMemo, useState } from 'react';
import { SITE_URL } from '@reviewnatin/shared';

const plans = [
  {
    name: 'ReviewNatin Plus',
    price: '₱149/mo · ₱999/yr',
    items: ['All Phase 1 exams', 'Full PasaPath', 'Unlimited mocks', 'No ads'],
    highlight: true,
  },
  {
    name: 'Exam Pass',
    price: '₱499–599',
    items: ['One exam unlock', '6 months access', 'Offline pack', 'AI tutor'],
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
    setParams(new URLSearchParams(window.location.search));
    setMounted(true);
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
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-700">ReviewNatin Plus</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-slate-900">Mag-subscribe sa app</h1>
      <p className="mt-3 text-slate-600">
        GCash, Maya, Apple, at Google Play checkout ay nasa ReviewNatin app. Buksan ang app para pumili ng plan at
        magbayad.
      </p>

      <div className="mt-8 space-y-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-5 shadow-sm ${
              plan.highlight ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-slate-900">{plan.name}</h2>
              <span className="text-sm font-semibold text-violet-700">{plan.price}</span>
            </div>
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
            className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-700"
          >
            Buksan sa ReviewNatin app
          </button>
          <a
            href={appUrl}
            className="block text-center text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
          >
            reviewnatin://subscribe
          </a>
        </div>
      ) : (
        <p className="mt-8 text-slate-500">Loading…</p>
      )}

      <p className="mt-8 text-xs leading-relaxed text-slate-500">
        Wala pang app? Sumali sa waitlist sa{' '}
        <a href={SITE_URL} className="font-medium text-violet-700 hover:underline">
          reviewnatinph.com
        </a>
        . Pag may checkout reference ka na, pumunta sa{' '}
        <a href={`${SITE_URL}/checkout`} className="font-medium text-violet-700 hover:underline">
          checkout page
        </a>
        .
      </p>
    </main>
  );
}
