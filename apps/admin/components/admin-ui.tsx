'use client';

// ReviewNatin Admin — UI kit ported from the design handoff.
// Tokens mirror the design's AT object; primitives use inline styles for
// pixel fidelity with the source mock.

import type { CSSProperties, ReactNode } from 'react';

export const T = {
  primary: '#2563eb', primaryHover: '#1d4ed8', primaryDark: '#1e40af',
  navy: '#1e3a8a',
  sideBg: '#0d1b3e', sideBg2: '#132451', sideText: '#93a5d6',
  gold: '#f59e0b', goldBg: '#fef3c7',
  bg: '#f5f7fc', surface: '#ffffff',
  text: '#0f172a', textMuted: '#5b6b85', textLight: '#93a0b8',
  border: '#e4e9f4', borderStrong: '#d4dcec',
  success: '#059669', successBg: '#e8f7f0',
  danger: '#dc2626', dangerBg: '#fdecec',
  warn: '#b45309', warnBg: '#fdf3df',
  info: '#1e40af', infoBg: '#e4edfd',
  purple: '#6d28d9', purpleBg: '#f0eafc',
  shadow: '0 1px 3px rgba(15,29,62,0.06), 0 1px 2px rgba(15,29,62,0.04)',
  shadowMd: '0 4px 16px rgba(15,29,62,0.08)',
  fontHead: 'var(--font-head), ui-sans-serif, system-ui, sans-serif',
  fontBody: 'var(--font-body), ui-sans-serif, system-ui, sans-serif',
};

const ICONS: Record<string, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>,
  question: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  review: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
  book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  megaphone: <><path d="M3 11l18-7v18l-18-7v-4z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>,
  card: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronRight: <polyline points="9 18 15 12 9 6" />,
  chevronLeft: <polyline points="15 18 9 12 15 6" />,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
  alert: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  dots: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
  trending: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.18-4.96" /></>,
};

export function AIcon({ name, size = 18, color = 'currentColor', strokeWidth = 1.8 }: {
  name: string; size?: number; color?: string; strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {ICONS[name] || ICONS.dashboard}
    </svg>
  );
}

export function Avatar({ name, size = 30, color }: { name: string; size?: number; color?: string }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const palette = ['#2563eb', '#0e7490', '#b45309', '#6d28d9', '#be185d', '#047857'];
  const c = color || palette[name.length % palette.length];
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', background: c, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>{initials}</span>
  );
}

const BTN_VARIANTS: Record<string, CSSProperties> = {
  primary: { background: T.primary, color: '#fff', boxShadow: '0 1px 2px rgba(37,99,235,.3)' },
  secondary: { background: '#fff', color: T.text, border: `1px solid ${T.border}`, boxShadow: T.shadow },
  ghost: { background: 'transparent', color: T.textMuted },
  danger: { background: T.danger, color: '#fff' },
  dangerSoft: { background: T.dangerBg, color: T.danger },
  success: { background: T.success, color: '#fff' },
  gold: { background: T.gold, color: '#fff' },
};

export function ABtn({ children, onClick, variant = 'primary', size = 'md', icon, type = 'button', style = {}, disabled = false, title }: {
  children?: ReactNode; onClick?: () => void; variant?: keyof typeof BTN_VARIANTS;
  size?: 'sm' | 'md' | 'lg'; icon?: string; type?: 'button' | 'submit'; style?: CSSProperties; disabled?: boolean; title?: string;
}) {
  const pad = { sm: '6px 12px', md: '9px 16px', lg: '11px 20px' }[size];
  const fsz = { sm: 12.5, md: 13.5, lg: 14 }[size];
  const cls = `rn-btn rn-btn-${variant}`;
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={cls}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: pad, fontSize: fsz, fontWeight: 600, fontFamily: T.fontBody, borderRadius: 8, border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, transition: 'all .14s', whiteSpace: 'nowrap', ...(BTN_VARIANTS[variant] || BTN_VARIANTS.primary), ...style }}>
      {icon ? <AIcon name={icon} size={size === 'sm' ? 14 : 15} /> : null}
      {children}
    </button>
  );
}

export function ACard({ children, style = {}, padding = 20, title, action, subtitle }: {
  children: ReactNode; style?: CSSProperties; padding?: number; title?: ReactNode; action?: ReactNode; subtitle?: ReactNode;
}) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, ...style }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h3 className="font-head" style={{ fontSize: 14.5, fontWeight: 700, color: T.text, margin: 0 }}>{title}</h3>
            {subtitle ? <p style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textMuted, margin: '3px 0 0' }}>{subtitle}</p> : null}
          </div>
          {action || null}
        </div>
      )}
      <div style={{ padding }}>{children}</div>
    </div>
  );
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Published', color: T.success, bg: T.successBg },
  draft: { label: 'Draft', color: T.textMuted, bg: '#eef1f7' },
  in_review: { label: 'In review', color: T.warn, bg: T.warnBg },
  archived: { label: 'Archived', color: T.textLight, bg: '#f1f3f8' },
  open: { label: 'Open', color: T.danger, bg: T.dangerBg },
  triaged: { label: 'Triaged', color: T.info, bg: T.infoBg },
  fixed: { label: 'Fixed', color: T.success, bg: T.successBg },
  resolved: { label: 'Resolved', color: T.success, bg: T.successBg },
  rejected: { label: 'Rejected', color: T.textMuted, bg: '#eef1f7' },
  dismissed: { label: 'Dismissed', color: T.textMuted, bg: '#eef1f7' },
  submitted: { label: 'Submitted', color: T.warn, bg: T.warnBg },
  pending: { label: 'Pending', color: T.textMuted, bg: '#eef1f7' },
  fulfilled: { label: 'Fulfilled', color: T.success, bg: T.successBg },
  paid: { label: 'Paid', color: T.success, bg: T.successBg },
  expired: { label: 'Expired', color: T.textLight, bg: '#f1f3f8' },
  active: { label: 'Active', color: T.success, bg: T.successBg },
  invited: { label: 'Invited', color: T.info, bg: T.infoBg },
  scheduled: { label: 'Scheduled', color: T.info, bg: T.infoBg },
  sent: { label: 'Sent', color: T.success, bg: T.successBg },
  verified: { label: 'Verified', color: T.info, bg: T.infoBg },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const m = STATUS_META[status] || { label: status, color: T.textMuted, bg: '#eef1f7' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: m.bg, color: m.color, borderRadius: 999, padding: '3px 10px', fontSize: 11.5, fontWeight: 600, fontFamily: T.fontBody, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />
      {label || m.label}
    </span>
  );
}

export function ExamTag({ slug }: { slug: string }) {
  const m = ({
    'cse-pro': { label: 'CSE Pro', color: '#1e40af', bg: '#e4edfd' },
    'cse-professional': { label: 'CSE Pro', color: '#1e40af', bg: '#e4edfd' },
    'cse-sub': { label: 'CSE Sub', color: '#0e7490', bg: '#e0f5fa' },
    'cse-subprofessional': { label: 'CSE Sub', color: '#0e7490', bg: '#e0f5fa' },
    'let-elem': { label: 'LET Elem', color: '#92400e', bg: '#fdf0d4' },
    'let-sec': { label: 'LET Sec', color: '#b45309', bg: '#fdf3df' },
    pnle: { label: 'PNLE', color: '#6d28d9', bg: '#f0eafc' },
  } as Record<string, { label: string; color: string; bg: string }>)[slug] || { label: slug, color: T.textMuted, bg: '#eef1f7' };
  return <span style={{ background: m.bg, color: m.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700, fontFamily: T.fontBody, whiteSpace: 'nowrap' }}>{m.label}</span>;
}

type Col = { label?: string; align?: 'left' | 'right' | 'center'; width?: number | string };

export function ATable({ columns, children, dense }: { columns: Col[]; children: ReactNode; dense?: boolean }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fontBody, fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} style={{ textAlign: c.align || 'left', padding: dense ? '8px 12px' : '10px 14px', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}`, background: '#fafbfe', whiteSpace: 'nowrap', width: c.width }}>{c.label ?? ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function ARow({ children, onClick, selected, href }: { children: ReactNode; onClick?: () => void; selected?: boolean; href?: string }) {
  return (
    <tr onClick={onClick} className="rn-row" data-clickable={onClick || href ? '1' : undefined}
      style={{ background: selected ? '#eef4ff' : 'transparent', cursor: onClick || href ? 'pointer' : 'default', transition: 'background .1s' }}>
      {children}
    </tr>
  );
}

export function ACell({ children, align, dense, style = {} }: { children?: ReactNode; align?: 'left' | 'right' | 'center'; dense?: boolean; style?: CSSProperties }) {
  return <td style={{ padding: dense ? '8px 12px' : '11px 14px', textAlign: align || 'left', borderBottom: `1px solid ${T.border}`, color: T.text, verticalAlign: 'middle', ...style }}>{children}</td>;
}

export function EmptyState({ icon = 'check', title, body }: { icon?: string; title: string; body?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '36px 20px', fontFamily: T.fontBody }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eef2fa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, marginBottom: 12 }}>
        <AIcon name={icon} size={20} />
      </div>
      <p style={{ fontSize: 13.5, fontWeight: 600, color: T.text, margin: 0 }}>{title}</p>
      {body ? <p style={{ fontSize: 12.5, color: T.textMuted, margin: '5px 0 0' }}>{body}</p> : null}
    </div>
  );
}

export function SegTabs<K extends string>({ tabs, active, onChange }: {
  tabs: Array<{ id: K; label: string; count?: number }>; active: K; onChange: (id: K) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, background: '#eef1f7', borderRadius: 9, padding: 3 }}>
      {tabs.map((t) => {
        const a = active === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)}
            style={{ border: 'none', background: a ? '#fff' : 'transparent', color: a ? '#0f172a' : '#5b6b85', fontFamily: 'var(--font-body)', fontSize: 12.5, fontWeight: 600, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', boxShadow: a ? '0 1px 3px rgba(15,29,62,0.06)' : 'none', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .14s' }}>
            {t.label}
            {t.count != null ? <span style={{ background: a ? '#e4edfd' : '#e0e5ef', color: a ? '#1e40af' : '#5b6b85', borderRadius: 999, padding: '1px 7px', fontSize: 10.5, fontWeight: 700 }}>{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="rn-chip"
      style={{ border: `1px solid ${active ? T.primary : T.border}`, background: active ? T.infoBg : '#fff', color: active ? T.primaryDark : T.textMuted, fontFamily: T.fontBody, fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 999, cursor: 'pointer', transition: 'all .14s', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <h1 className="font-head" style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle ? <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textMuted, margin: '5px 0 0', maxWidth: 620 }}>{subtitle}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}

export function Toast({ kind = 'success', children }: { kind?: 'success' | 'error' | 'info'; children: ReactNode }) {
  const m = { success: { c: T.success, bg: T.successBg, i: 'check' }, error: { c: T.danger, bg: T.dangerBg, i: 'alert' }, info: { c: T.info, bg: T.infoBg, i: 'bell' } }[kind];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: m.bg, color: m.c, borderRadius: 9, padding: '10px 14px', fontFamily: T.fontBody, fontSize: 13, fontWeight: 600 }}>
      <AIcon name={m.i} size={15} /> {children}
    </div>
  );
}

export function Sparkline({ data, color = T.primary, width = 96, height = 30 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - 3 - ((v - min) / (max - min || 1)) * (height - 6)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

export function KpiCard({ kpi }: { kpi: { label: string; value: string; delta?: string; up?: boolean; icon: string; spark?: number[] } }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: T.fontBody, fontSize: 12.5, fontWeight: 600, color: T.textMuted }}>{kpi.label}</span>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: T.infoBg, color: T.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <AIcon name={kpi.icon} size={16} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="font-head" style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: '-0.02em', lineHeight: 1 }}>{kpi.value}</div>
          {kpi.delta ? <div style={{ fontFamily: T.fontBody, fontSize: 11.5, fontWeight: 600, color: kpi.up ? T.success : kpi.up === false ? T.danger : T.textLight, marginTop: 7 }}>{kpi.delta}</div> : null}
        </div>
        {kpi.spark ? <Sparkline data={kpi.spark} color={kpi.up === false ? T.danger : T.primary} /> : null}
      </div>
    </div>
  );
}

export function ProgressBar({ value, target, width = 90 }: { value: number; target: number; width?: number }) {
  const pct = Math.round((value / target) * 100);
  const color = pct >= 80 ? T.success : pct >= 40 ? T.gold : T.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width, height: 6, borderRadius: 999, background: '#eef1f7', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11.5, color: T.textMuted, fontWeight: 600 }}>{pct}%</span>
    </div>
  );
}

export function SearchBox({ placeholder, width = 240 }: { placeholder?: string; width?: number | string }) {
  return (
    <div className="rn-search" style={{ position: 'relative', width }}>
      <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textLight, display: 'flex' }}><AIcon name="search" size={14} /></span>
      <input placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px 8px 33px', fontSize: 12.5, fontFamily: T.fontBody, color: T.text, background: '#fff', border: `1px solid ${T.border}`, borderRadius: 999, outline: 'none', transition: 'all .14s' }} />
    </div>
  );
}

export function AInput({ label, value, onChange, placeholder, type = 'text', style = {}, hint, required }: {
  label?: string; value?: string; onChange?: (v: string) => void; placeholder?: string; type?: string; style?: CSSProperties; hint?: string; required?: boolean;
}) {
  return (
    <label style={{ display: 'block', fontFamily: T.fontBody, ...style }}>
      {label ? <span className="field-label">{label}{required ? <span style={{ color: T.danger }}> *</span> : null}</span> : null}
      <input className="field-input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange && onChange(e.target.value)} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function ATextarea({ label, value, onChange, placeholder, rows = 4, style = {}, hint }: {
  label?: string; value?: string; onChange?: (v: string) => void; placeholder?: string; rows?: number; style?: CSSProperties; hint?: string;
}) {
  return (
    <label style={{ display: 'block', fontFamily: T.fontBody, ...style }}>
      {label ? <span className="field-label">{label}</span> : null}
      <textarea className="field-input" value={value} placeholder={placeholder} rows={rows} onChange={(e) => onChange && onChange(e.target.value)} />
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function ASelect({ label, value, onChange, options, style = {}, hint }: {
  label?: string; value?: string; onChange?: (v: string) => void; options: Array<{ value: string; label: string } | string>; style?: CSSProperties; hint?: string;
}) {
  return (
    <label style={{ display: 'block', fontFamily: T.fontBody, ...style }}>
      {label ? <span className="field-label">{label}</span> : null}
      <div style={{ position: 'relative' }}>
        <select className="field-input" value={value} onChange={(e) => onChange && onChange(e.target.value)}
          style={{ padding: '9px 32px 9px 12px', appearance: 'none', cursor: 'pointer' }}>
          {options.map((o) => {
            const val = typeof o === 'string' ? o : o.value;
            const lab = typeof o === 'string' ? o : o.label;
            return <option key={val} value={val}>{lab}</option>;
          })}
        </select>
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.textMuted, display: 'flex' }}><AIcon name="chevronDown" size={14} /></span>
      </div>
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}
