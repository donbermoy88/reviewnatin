'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type AdminShellProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
};

type AdminCardProps = {
  children: ReactNode;
  className?: string;
  variant?: 'surface' | 'raised' | 'dark' | 'tint';
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

type AdminMetricProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'blue' | 'green' | 'amber' | 'slate' | 'rose';
};

const navGroups = [
  {
    label: 'Operations',
    items: [
      { href: '/', label: 'Dashboard', detail: 'Overview', mark: 'D' },
      { href: '/content/review', label: 'Review Queue', detail: 'Flags & QA', mark: 'Q' },
      { href: '/content/import', label: 'CSV Import', detail: 'Bulk questions', mark: 'I' },
      { href: '/content/stats', label: 'Stats', detail: 'Catalog metrics', mark: 'S' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/content/materials', label: 'Materials', detail: 'Lessons & cheat sheets', mark: 'M' },
      { href: '/content/announcements', label: 'Announcements', detail: 'App updates', mark: 'A' },
      { href: '/content/schedules', label: 'Schedules', detail: 'Exam calendar', mark: 'C' },
      { href: '/content/changelog', label: 'Changelog', detail: 'Release notes', mark: 'L' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/content/checkouts', label: 'Checkouts', detail: 'Manual fulfillment', mark: 'P' },
      { href: '/content/waitlist', label: 'Waitlist', detail: 'Beta signups', mark: 'W' },
    ],
  },
];

const mobileNavItems = navGroups.flatMap((group) => group.items);

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date());
}

export function AdminShell({
  title,
  eyebrow = 'ReviewNatin Admin',
  description,
  actions,
  children,
  maxWidth = 'max-w-7xl',
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col bg-[var(--sidebar)] text-slate-100 lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-[var(--sidebar-border)] px-6">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
              R
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">ReviewNatin</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Admin Console</p>
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {group.label}
                </p>
                <div className="mt-2 space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span
                          className={`grid size-7 shrink-0 place-items-center rounded-md text-[11px] font-semibold transition ${
                            active
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-slate-200'
                          }`}
                        >
                          {item.mark}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{item.label}</span>
                          <span className={`block truncate text-[11px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>
                            {item.detail}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-[var(--sidebar-border)] p-4">
            <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Production linked · {todayLabel()}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--sidebar)] text-white lg:hidden">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-md bg-[var(--primary)] text-xs font-bold text-white">
                  R
                </span>
                <span className="text-sm font-semibold">ReviewNatin Admin</span>
              </div>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium"
              >
                Sign out
              </button>
            </div>
            <nav className="flex gap-1.5 overflow-x-auto px-4 pb-2.5">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    isActive(pathname, item.href) ? 'bg-white text-[var(--sidebar)]' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
            <div className={`mx-auto ${maxWidth}`}>
              <header className="mb-7 flex flex-col gap-4 border-b border-[var(--border)] pb-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">{eyebrow}</p>
                  <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">{title}</h1>
                  {description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>
                  ) : null}
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
              </header>

              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminCard({ children, className = '', variant = 'surface', padding = 'md' }: AdminCardProps) {
  const variantClass = {
    surface: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm',
    raised: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-md',
    dark: 'border-white/10 bg-[var(--sidebar)] text-slate-100',
    tint: 'border-blue-100 bg-[var(--primary-soft)] text-[var(--text)]',
  }[variant];
  const paddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  return (
    <section className={`rounded-xl border ${variantClass} ${paddingClass} ${className}`}>{children}</section>
  );
}

export function AdminMetric({ label, value, detail, tone = 'blue' }: AdminMetricProps) {
  const accent = {
    blue: 'text-[var(--primary)]',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-slate-500',
    rose: 'text-rose-600',
  }[tone];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">{value}</p>
      {detail ? <p className={`mt-1 text-xs font-medium ${accent}`}>{detail}</p> : null}
    </div>
  );
}

type BadgeTone = 'neutral' | 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'purple';

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
  }[tone];
  return <span className={`badge ${toneClass}`}>{children}</span>;
}

/** Labelled form field wrapper. */
export function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
