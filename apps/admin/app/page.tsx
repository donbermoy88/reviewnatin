import Link from 'next/link';
import { AdminCard, AdminMetric, AdminShell } from '@/components/admin-shell';

const workflowCards = [
  {
    href: '/content/review',
    label: 'Review Queue',
    title: 'Resolve flagged questions and drafts',
    detail: 'Triage reports from practice quizzes, mock exams, board mode, flashcards, and review materials.',
  },
  {
    href: '/content/import',
    label: 'CSV Import',
    title: 'Load verified question batches',
    detail: 'Validate exam metadata, duplicate risk, answer keys, and image-ready fields before publishing.',
  },
  {
    href: '/content/materials',
    label: 'Materials',
    title: 'Manage notes, lessons, and cheat sheets',
    detail: 'Keep the Study Notes tab and offline packs aligned with the mobile exam subjects.',
  },
  {
    href: '/content/checkouts',
    label: 'Checkouts',
    title: 'Fulfill subscription upgrades',
    detail: 'Monitor web checkout intent and match manual payment flows with ReviewNatin Plus entitlements.',
  },
];

const readinessItems = [
  'Question flags are visible to content reviewers before publication.',
  'CSV import blocks malformed rows before they reach the mobile app.',
  'Study materials support offline packs and subject-level filtering.',
  'Subscription plans stay consistent with the mobile paywall and entitlement logic.',
  'Operational metrics are available before production launch.',
];

export default function AdminHome() {
  return (
    <AdminShell
      title="Mobile App Operations Dashboard"
      description="Run ReviewNatin content, QA, subscription support, and publishing workflows from one admin command center."
      actions={
        <Link
          href="/content/review"
          className="inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
        >
          Open QA queue
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetric label="App Surface" value="Mobile" detail="iOS + Expo workflows" />
        <AdminMetric label="Catalog" value="Phase 1" detail="CSE, LET, PNLE" tone="green" />
        <AdminMetric label="Paywall" value="Plus" detail="1, 6, 12 months" tone="amber" />
        <AdminMetric label="Mode" value="QA" detail="Pre-production" tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <AdminCard>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Content Pipeline</p>
              <h2 className="mt-2 text-2xl font-black text-[#08183f]">What needs admin attention</h2>
            </div>
            <code className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              templates/questions_import_v1.csv
            </code>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {workflowCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-[1.35rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                  {card.label}
                </span>
                <h3 className="mt-4 text-lg font-black text-[#08183f] group-hover:text-blue-700">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.detail}</p>
              </Link>
            ))}
          </div>
        </AdminCard>

        <AdminCard className="bg-[#08183f] text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Launch Readiness</p>
          <h2 className="mt-2 text-2xl font-black">Admin controls connected to the app</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-blue-50">
            {readinessItems.map((item) => (
              <li key={item} className="rounded-2xl bg-white/10 p-3">
                {item}
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <AdminCard className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Staff Access</p>
            <h2 className="mt-2 text-xl font-black text-[#08183f]">Roles allowed in this console</h2>
            <p className="mt-2 text-sm text-slate-600">
              Admin, content_reviewer, and content_author accounts can access protected admin routes.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Set staff roles in the Supabase <code className="font-black">users</code> table.
          </div>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
