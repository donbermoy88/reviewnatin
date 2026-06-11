'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AIcon, Avatar, PageHeader, SearchBox, T } from '@/components/admin-ui';

type NavItem = { href: string; label: string; icon: string; badgeKey?: 'review' | 'checkouts'; badgeColor?: string };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  { label: 'Overview', items: [{ href: '/', label: 'Dashboard', icon: 'dashboard' }] },
  {
    label: 'Content',
    items: [
      { href: '/content/review', label: 'Review queue', icon: 'review', badgeKey: 'review' },
      { href: '/content/questions', label: 'Question bank', icon: 'question' },
      { href: '/content/import', label: 'CSV import', icon: 'upload' },
      { href: '/content/materials', label: 'Lessons & sheets', icon: 'book' },
      { href: '/content/schedules', label: 'Exam schedules', icon: 'calendar' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/content/checkouts', label: 'Checkouts', icon: 'card', badgeKey: 'checkouts', badgeColor: T.gold },
      { href: '/content/announcements', label: 'Announcements', icon: 'megaphone' },
      { href: '/content/waitlist', label: 'Waitlist', icon: 'list' },
    ],
  },
  { label: 'Settings', items: [{ href: '/content/team', label: 'Team & roles', icon: 'shield' }] },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function currentLabel(pathname: string): string {
  if (pathname.startsWith('/content/questions/')) return 'Question editor';
  const match = [...ALL_ITEMS].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href));
  return match?.label ?? 'Admin';
}

function AdminLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="19" fill="rgba(255,255,255,0.1)" />
        <circle cx="20" cy="20" r="12" fill={T.primary} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
          const r = (a * Math.PI) / 180;
          return <line key={i} x1={20 + 13.5 * Math.cos(r)} y1={20 + 13.5 * Math.sin(r)} x2={20 + 18 * Math.cos(r)} y2={20 + 18 * Math.sin(r)} stroke={T.gold} strokeWidth="2.2" strokeLinecap="round" />;
        })}
        <path d="M14 20.5l3.5 3.5 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!collapsed && (
        <div>
          <div className="font-head" style={{ fontWeight: 800, fontSize: 16, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Review<span style={{ color: T.gold }}>Natin</span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.sideText, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>Admin Console</div>
        </div>
      )}
    </div>
  );
}

function NavLink({ item, active, collapsed, badge, onNav }: { item: NavItem; active: boolean; collapsed: boolean; badge?: number; onNav: () => void }) {
  return (
    <Link href={item.href} onClick={onNav} title={collapsed ? item.label : undefined} aria-current={active ? 'page' : undefined}
      className="rn-nav-link"
      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textDecoration: 'none', background: active ? 'rgba(255,255,255,0.1)' : 'transparent', color: active ? '#fff' : T.sideText, borderRadius: 8, padding: collapsed ? '10px 0' : '8.5px 12px', justifyContent: collapsed ? 'center' : 'flex-start', fontSize: 13, fontWeight: active ? 700 : 500, position: 'relative', transition: 'all .13s' }}>
      {active ? <span style={{ position: 'absolute', left: collapsed ? 2 : -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 3, background: T.gold }} /> : null}
      <AIcon name={item.icon} size={17} strokeWidth={active ? 2 : 1.7} />
      {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
      {!collapsed && badge ? (
        <span style={{ background: item.badgeColor || T.primary, color: '#fff', borderRadius: 999, padding: '1.5px 8px', fontSize: 10.5, fontWeight: 700 }}>{badge > 999 ? '999+' : badge}</span>
      ) : null}
    </Link>
  );
}

type Profile = { name: string; role: string };

export function AdminShell({
  title,
  description,
  actions,
  children,
  maxWidth = 'max-w-[1240px]',
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(() => typeof window !== 'undefined' && localStorage.getItem('rn-admin-collapsed') === '1');
  const [drawer, setDrawer] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<{ review?: number; checkouts?: number }>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      const email = auth.user?.email ?? '';
      let name = email ? email.split('@')[0] : 'Staff';
      let role = 'staff';
      if (auth.user?.id) {
        const { data: prof } = await supabase.from('users').select('display_name, role').eq('id', auth.user.id).maybeSingle();
        if (prof?.display_name) name = prof.display_name;
        if (prof?.role) role = prof.role;
      }
      if (!cancelled) setProfile({ name, role });

      const { data: stats } = await supabase.rpc('get_admin_dashboard_stats');
      const s = stats as { draft_questions?: number } | null;
      let checkouts: number | undefined;
      try {
        const res = await fetch('/api/content/checkouts');
        if (res.ok) {
          const json = await res.json();
          checkouts = (json.rows ?? []).filter((r: { status?: string }) => r.status === 'submitted').length;
        }
      } catch {
        /* badge optional */
      }
      if (!cancelled) setBadges({ review: s?.draft_questions, checkouts });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('rn-admin-collapsed', next ? '1' : '0');
      return next;
    });
    setDrawer((d) => !d);
  };

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  const roleLabel = profile?.role
    ? profile.role.replace('content_', '').replace(/^\w/, (c) => c.toUpperCase()).replace('_', ' ')
    : '';

  const sidebarStyle: CSSProperties = {
    width: collapsed ? 68 : 232,
    background: `linear-gradient(180deg, ${T.sideBg} 0%, ${T.sideBg2} 100%)`,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: T.bg, overflow: 'hidden' }}>
      {/* Mobile backdrop */}
      {drawer ? (
        <button aria-label="Close menu" onClick={() => { setDrawer(false); setCollapsed(true); }}
          className="lg:hidden" style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(8,16,38,0.5)', border: 'none' }} />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`rn-sidebar max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:!w-[232px] ${drawer ? '' : 'max-lg:-translate-x-full'}`}
        style={{ ...sidebarStyle, flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '20px 14px', boxSizing: 'border-box', transition: 'width .2s ease, transform .2s ease', overflow: 'hidden' }}>
        <div style={{ padding: collapsed ? '0 0 4px' : '0 6px 4px' }}><AdminLogo collapsed={collapsed} /></div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, marginTop: 18, overflowY: 'auto' }}>
          {NAV_SECTIONS.map((sec) => (
            <div key={sec.label} style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
              {!collapsed && <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(147,165,214,0.55)', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px', marginBottom: 5 }}>{sec.label}</div>}
              {sec.items.map((it) => (
                <NavLink key={it.href} item={it} collapsed={collapsed} active={isActive(pathname, it.href)}
                  badge={it.badgeKey ? badges[it.badgeKey] : undefined} onNav={() => setDrawer(false)} />
              ))}
            </div>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Avatar name={profile?.name ?? 'Staff'} size={32} color={T.gold} />
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name ?? 'Staff'}</div>
              <div style={{ fontSize: 10.5, color: T.sideText, textTransform: 'capitalize' }}>{roleLabel}</div>
            </div>
          )}
          {!collapsed && (
            <button title="Sign out" onClick={signOut} style={{ border: 'none', background: 'none', color: T.sideText, cursor: 'pointer', padding: 4, display: 'flex' }}>
              <AIcon name="logout" size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 58, flexShrink: 0, background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px', boxSizing: 'border-box' }}>
          <button onClick={toggle} title="Toggle sidebar" style={{ border: 'none', background: 'none', color: T.textMuted, cursor: 'pointer', padding: 6, display: 'flex', borderRadius: 7 }}>
            <AIcon name="list" size={18} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.textMuted }}>{currentLabel(pathname)}</span>
          <span style={{ flex: 1 }} />
          <div className="max-md:hidden"><SearchBox placeholder="Search…  (⌘K)" width={240} /></div>
          <button title="Notifications" style={{ border: `1px solid ${T.border}`, background: '#fff', color: T.textMuted, cursor: 'pointer', width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, position: 'relative' }}>
            <AIcon name="bell" size={16} />
            {badges.review || badges.checkouts ? <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: T.danger, border: '1.5px solid #fff' }} /> : null}
          </button>
          <a href="https://reviewnatinph.com" target="_blank" rel="noreferrer" title="Open live app"
            className="max-sm:hidden"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 600, color: T.primary, textDecoration: 'none', border: `1px solid ${T.border}`, borderRadius: 9, padding: '7px 12px', background: '#fff' }}>
            View app <AIcon name="external" size={13} />
          </a>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '26px 32px 48px', boxSizing: 'border-box' }} className="max-sm:!px-4 max-sm:!py-5">
          <div className={`mx-auto w-full ${maxWidth}`}>
            <PageHeader title={title} subtitle={description} actions={actions} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Legacy primitives — kept so existing pages keep compiling while
   they are migrated to the new admin-ui kit.
   ────────────────────────────────────────────────────────────── */
export function AdminCard({ children, className = '', variant = 'surface', padding = 'md' }: {
  children: ReactNode; className?: string; variant?: 'surface' | 'raised' | 'dark' | 'tint'; padding?: 'none' | 'sm' | 'md' | 'lg';
}) {
  const variantClass = {
    surface: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-sm',
    raised: 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-md',
    dark: 'border-white/10 bg-[var(--side-bg)] text-slate-100',
    tint: 'border-blue-100 bg-[var(--info-bg)] text-[var(--text)]',
  }[variant];
  const paddingClass = { none: 'p-0', sm: 'p-4', md: 'p-5', lg: 'p-6' }[padding];
  return <section className={`rounded-xl border ${variantClass} ${paddingClass} ${className}`}>{children}</section>;
}

export function AdminMetric({ label, value, detail, tone = 'blue' }: {
  label: string; value: string | number; detail?: string; tone?: 'blue' | 'green' | 'amber' | 'slate' | 'rose';
}) {
  const accent = { blue: 'text-[var(--primary)]', green: 'text-emerald-600', amber: 'text-amber-600', slate: 'text-slate-500', rose: 'text-rose-600' }[tone];
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">{label}</p>
      <p className="font-head mt-2 text-3xl font-bold tracking-tight text-[var(--text)]">{value}</p>
      {detail ? <p className={`mt-1 text-xs font-medium ${accent}`}>{detail}</p> : null}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'orange' | 'red' | 'purple'; children: ReactNode }) {
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

export function Field({ label, hint, className = '', children }: { label: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
