import Link from 'next/link';
import { AdminCard, AdminMetric, AdminShell, Badge } from '@/components/admin-shell';

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
      title="Operations Dashboard"
      description="Run ReviewNatin content, QA, subscription support, and publishing workflows from one command center."
      actions={
        <Link href="/content/review" className="btn btn-primary">
          Open review queue
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric label="App surface" value="Mobile" detail="iOS + Expo workflows" />
        <AdminMetric label="Catalog" value="Phase 1" detail="CSE · LET · PNLE" tone="green" />
        <AdminMetric label="Paywall" value="Plus" detail="1, 6, 12 months" tone="amber" />
        <AdminMetric label="Mode" value="QA" detail="Pre-production" tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <AdminCard padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">Content pipeline</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">What needs admin attention</h2>
            </div>
            <code className="rounded-md bg-[var(--surface-sunken)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
              templates/questions_import_v1.csv
            </code>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {workflowCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-blue-200 hover:bg-[var(--surface-muted)] hover:shadow-sm"
              >
                <Badge tone="blue">{card.label}</Badge>
                <h3 className="mt-3 text-base font-semibold text-[var(--text)] group-hover:text-[var(--primary)]">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[var(--text-muted)]">{card.detail}</p>
              </Link>
            ))}
          </div>
        </AdminCard>

        <AdminCard variant="dark" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Launch readiness</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Admin controls connected to the app</h2>
          <ul className="mt-4 space-y-2.5">
            {readinessItems.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-6 text-slate-300">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </AdminCard>
      </div>

      <AdminCard className="mt-6" variant="tint" padding="lg">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">Staff access</p>
            <h2 className="mt-1 text-base font-semibold text-[var(--text)]">Roles allowed in this console</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Admin, content_reviewer, and content_author accounts can access protected admin routes.
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            Set staff roles in the Supabase <code className="font-semibold text-[var(--text)]">users</code> table.
          </div>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
