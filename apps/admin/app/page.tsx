import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import {
  ABtn, ACard, AIcon, ATable, ARow, ACell, EmptyState, ExamTag, KpiCard, ProgressBar, T,
} from '@/components/admin-ui';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type Stats = { users: number; waitlist: number; published_questions: number; draft_questions: number; open_reports: number };
type ExamRow = { slug: string; name: string; active: boolean; questions: number; lessons: number; flashcards: number; mocks: number };
type ScheduleRow = { title: string; slug: string; eventLabel: string; date: string };
type ActivityRow = { who: string; action: string; entity: string; when: string };

const EVENT_LABELS: Record<string, string> = {
  application_open: 'Application opens',
  application_close: 'Registration closes',
  exam_date: 'Exam day',
  results_release: 'Results release',
};

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-PH', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }).format(new Date()));
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function fmtDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(d);
}

function relTime(value: string): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

async function loadData() {
  const supabase = getAdminSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: statsData }, { data: exams }, schedulesRes, activityRes, checkoutsRes] = await Promise.all([
    supabase.rpc('get_admin_dashboard_stats'),
    supabase.from('exam_types').select('slug, name, is_active').order('name'),
    supabase
      .from('exam_schedules')
      .select('event_type, event_date, exam_types ( slug, name )')
      .gte('event_date', today)
      .order('event_date', { ascending: true })
      .limit(5),
    supabase
      .from('admin_logs')
      .select('action, entity_type, created_at, users ( display_name, email )')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('web_checkout_sessions').select('id', { count: 'exact', head: true }).in('status', ['submitted']),
  ]);

  const stats = (statsData as Stats) ?? { users: 0, waitlist: 0, published_questions: 0, draft_questions: 0, open_reports: 0 };

  const examRows: ExamRow[] = [];
  for (const e of (exams ?? []) as Array<{ slug: string; name: string; is_active: boolean }>) {
    const { data: counts } = await supabase.rpc('get_content_counts', { p_exam_slug: e.slug });
    const c = counts as { questions?: number; mock_exams?: number; lessons?: number; flashcards?: number } | null;
    examRows.push({
      slug: e.slug, name: e.name, active: e.is_active,
      questions: c?.questions ?? 0, lessons: c?.lessons ?? 0, flashcards: c?.flashcards ?? 0, mocks: c?.mock_exams ?? 0,
    });
  }

  const schedules: ScheduleRow[] = ((schedulesRes.data ?? []) as Array<{ event_type: string; event_date: string; exam_types: { slug?: string; name?: string } | null }>).map((s) => ({
    title: s.exam_types?.name ?? 'Exam',
    slug: s.exam_types?.slug ?? '',
    eventLabel: EVENT_LABELS[s.event_type] ?? s.event_type,
    date: fmtDate(s.event_date),
  }));

  const activity: ActivityRow[] = ((activityRes.data ?? []) as Array<{ action: string; entity_type: string; created_at: string; users: { display_name?: string; email?: string } | null }>).map((a) => ({
    who: a.users?.display_name || a.users?.email?.split('@')[0] || 'Staff',
    action: a.action,
    entity: a.entity_type,
    when: relTime(a.created_at),
  }));

  return { stats, examRows, schedules, activity, pendingCheckouts: checkoutsRes.count ?? 0 };
}

function ActionItem({ href, n, label, sub, icon, color, bg }: { href: string; n: number; label: string; sub: string; icon: string; color: string; bg: string }) {
  return (
    <Link href={href} className="rn-action"
      style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, padding: '16px 18px', transition: 'all .15s' }}>
      <span style={{ width: 42, height: 42, borderRadius: 11, background: bg, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AIcon name={icon} size={19} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="font-head" style={{ display: 'block', fontSize: 15, fontWeight: 800, color: T.text }}>
          {n.toLocaleString()} <span style={{ fontSize: 13, fontWeight: 600, fontFamily: T.fontBody }}>{label}</span>
        </span>
        <span style={{ display: 'block', fontSize: 12, color: T.textMuted, marginTop: 3 }}>{sub}</span>
      </span>
      <span style={{ marginLeft: 'auto', color: T.textLight }}><AIcon name="chevronRight" size={16} /></span>
    </Link>
  );
}

export default async function AdminHome() {
  if (!isAdminConfigured()) {
    return (
      <AdminShell title={`${greeting()}`} description="Admin Supabase environment variables are required before the dashboard can load.">
        <ACard><p style={{ color: T.danger, fontFamily: T.fontBody }}>Admin Supabase not configured.</p></ACard>
      </AdminShell>
    );
  }

  const { stats, examRows, schedules, activity, pendingCheckouts } = await loadData();
  const target = 3000;

  const kpis = [
    { label: 'Questions published', value: stats.published_questions.toLocaleString(), delta: 'Live in the app', up: true as const, icon: 'question' },
    { label: 'Registered users', value: stats.users.toLocaleString(), delta: 'All accounts', icon: 'users' },
    { label: 'Draft backlog', value: stats.draft_questions.toLocaleString(), delta: 'Awaiting review', up: false as const, icon: 'upload' },
    { label: 'Open QA reports', value: stats.open_reports.toLocaleString(), delta: 'In review queue', up: stats.open_reports === 0 ? (true as const) : (false as const), icon: 'flag' },
  ];

  return (
    <AdminShell title={greeting()} description="Here's what needs your attention across ReviewNatin today."
      actions={<Link href="/content/import" className="rn-btn rn-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: T.primary, color: '#fff', textDecoration: 'none', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}><AIcon name="plus" size={15} /> Import questions</Link>}
    >
      {/* Action items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
        <ActionItem href="/content/review" n={stats.draft_questions} label="questions awaiting review" sub="Drafts queued for QA" icon="review" color={T.gold} bg={T.goldBg} />
        <ActionItem href="/content/review" n={stats.open_reports} label="open content reports" sub="Learner-flagged questions" icon="flag" color={T.danger} bg={T.dangerBg} />
        <ActionItem href="/content/checkouts" n={pendingCheckouts} label="checkouts to fulfill" sub="GCash / Maya payments waiting" icon="card" color={T.primary} bg={T.infoBg} />
      </div>

      <div className="rn-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {kpis.map((k) => <KpiCard key={k.label} kpi={k} />)}
          </div>

          <ACard title="Content health by exam" subtitle="Published catalog coverage toward the 3,000-question target" padding={0}
            action={<Link href="/content/questions" style={{ textDecoration: 'none' }}><ABtn variant="ghost" size="sm">Question bank</ABtn></Link>}>
            {examRows.length === 0 ? (
              <EmptyState icon="question" title="No exams yet" body="Active exam tracks will appear here." />
            ) : (
              <ATable columns={[{ label: 'Exam' }, { label: 'Coverage', width: '26%' }, { label: 'Questions', align: 'right' }, { label: 'Lessons', align: 'right' }, { label: 'Flashcards', align: 'right' }, { label: 'Mocks', align: 'right' }]}>
                {examRows.map((row) => (
                  <ARow key={row.slug}>
                    <ACell><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ExamTag slug={row.slug} />{!row.active ? <span style={{ fontSize: 11, color: T.textLight }}>(soon)</span> : null}</div></ACell>
                    <ACell><ProgressBar value={row.questions} target={target} /></ACell>
                    <ACell align="right"><span style={{ fontWeight: 600 }}>{row.questions.toLocaleString()}</span></ACell>
                    <ACell align="right"><span style={{ color: T.textMuted }}>{row.lessons}</span></ACell>
                    <ACell align="right"><span style={{ color: T.textMuted }}>{row.flashcards}</span></ACell>
                    <ACell align="right"><span style={{ color: T.textMuted }}>{row.mocks}</span></ACell>
                  </ARow>
                ))}
              </ATable>
            )}
          </ACard>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <ACard title="Upcoming exam dates" padding={14}
            action={<Link href="/content/schedules" style={{ textDecoration: 'none' }}><ABtn variant="ghost" size="sm">Manage</ABtn></Link>}>
            {schedules.length === 0 ? (
              <EmptyState icon="calendar" title="No upcoming dates" body="Add exam schedules to power the app calendar." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {schedules.map((s, i) => {
                  const [mon, day] = s.date.split(' ');
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px' }}>
                      <span style={{ width: 42, height: 44, borderRadius: 9, background: T.infoBg, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: T.primary, textTransform: 'uppercase' }}>{mon}</span>
                        <span className="font-head" style={{ fontSize: 17, fontWeight: 800, color: T.primaryDark, lineHeight: 1 }}>{day?.replace(',', '')}</span>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>{s.eventLabel} · {s.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ACard>

          <ACard title="Recent activity" padding={16}>
            {activity.length === 0 ? (
              <EmptyState icon="clock" title="No recent activity" body="Admin actions are recorded here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < activity.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: T.infoBg, color: T.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <AIcon name="clock" size={13} />
                    </span>
                    <div style={{ fontSize: 12.5, lineHeight: 1.5, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: T.text }}>{a.who}</span>{' '}
                      <span style={{ color: T.textMuted }}>{a.action.replace(/[._]/g, ' ')} · {a.entity}</span>
                      <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ACard>
        </div>
      </div>
    </AdminShell>
  );
}
