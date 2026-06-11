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
};

type AdminMetricProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'blue' | 'green' | 'amber' | 'slate';
};

const navGroups = [
  {
    label: 'Command',
    items: [
      { href: '/', label: 'Dashboard', detail: 'Ops overview' },
      { href: '/content/review', label: 'Review Queue', detail: 'Flags, drafts, QA' },
      { href: '/content/import', label: 'CSV Import', detail: 'Bulk questions' },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/content/materials', label: 'Materials', detail: 'Lessons and cheat sheets' },
      { href: '/content/announcements', label: 'Announcements', detail: 'App updates' },
      { href: '/content/schedules', label: 'Schedules', detail: 'Exam calendar' },
      { href: '/content/changelog', label: 'Changelog', detail: 'Release notes' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/content/checkouts', label: 'Checkouts', detail: 'Manual fulfillment' },
      { href: '/content/stats', label: 'Stats', detail: 'Catalog metrics' },
      { href: '/content/waitlist', label: 'Waitlist', detail: 'Beta signups' },
    ],
  },
];

const mobileNavItems = navGroups.flatMap((group) => group.items);

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function todayLabel(): string {
  return new Intl.DateTimeFormat('en-PH', {
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
    <div className="min-h-screen bg-[#eef4ff] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(20,99,255,0.20),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,190,38,0.18),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_45%,#f6f8fb_100%)]" />
      <div className="flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-white/10 bg-[#071a44] text-white shadow-2xl lg:flex lg:flex-col">
          <div className="p-6">
            <Link href="/" className="block rounded-[1.75rem] border border-white/10 bg-white/10 p-5 shadow-xl shadow-blue-950/30">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-200">ReviewNatin</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Admin Command</h2>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Content QA, subscription ops, and mobile app publishing controls.
              </p>
            </Link>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 text-[11px] font-black uppercase tracking-[0.22em] text-blue-200/80">{group.label}</p>
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-2xl px-4 py-3 transition ${
                          active
                            ? 'bg-white text-[#0b255f] shadow-lg shadow-blue-950/20'
                            : 'text-blue-50 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="block text-sm font-black">{item.label}</span>
                        <span className={`mt-0.5 block text-xs ${active ? 'text-slate-500' : 'text-blue-200'}`}>{item.detail}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-5">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Today</p>
              <p className="mt-1 text-sm font-semibold text-white">{todayLabel()}</p>
              <button
                type="button"
                onClick={signOut}
                className="mt-4 w-full rounded-xl border border-white/15 bg-white px-4 py-2 text-sm font-black text-[#0b255f] transition hover:bg-blue-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className={`mx-auto ${maxWidth}`}>
            <div className="mb-5 rounded-[1.75rem] border border-white/70 bg-[#071a44] p-4 text-white shadow-xl shadow-blue-950/20 lg:hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200">ReviewNatin</p>
                  <p className="mt-1 text-xl font-black">Admin Command</p>
                </div>
                <button type="button" onClick={signOut} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-[#0b255f]">
                  Sign out
                </button>
              </div>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${
                      isActive(pathname, item.href) ? 'bg-white text-[#0b255f]' : 'bg-white/10 text-blue-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <header className="mb-8 overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-xl shadow-blue-950/10 backdrop-blur sm:p-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">{eyebrow}</p>
                  <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-[#08183f] sm:text-4xl">{title}</h1>
                  {description ? <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p> : null}
                </div>
                {actions ? <div className="shrink-0">{actions}</div> : null}
              </div>
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AdminCard({ children, className = '' }: AdminCardProps) {
  return (
    <section className={`rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-blue-950/5 backdrop-blur ${className}`}>
      {children}
    </section>
  );
}

export function AdminMetric({ label, value, detail, tone = 'blue' }: AdminMetricProps) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    slate: 'bg-slate-50 text-slate-700 ring-slate-100',
  }[tone];

  return (
    <div className={`rounded-[1.25rem] p-4 ring-1 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      {detail ? <p className="mt-1 text-sm font-semibold opacity-75">{detail}</p> : null}
    </div>
  );
}
