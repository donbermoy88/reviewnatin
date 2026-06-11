import { AdminShell } from '@/components/admin-shell';
import { ACard, ACell, ARow, ATable, AIcon, EmptyState, ExamTag, T } from '@/components/admin-ui';
import { ScheduleForm } from '@/components/content-forms';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type ScheduleRow = {
  id: string;
  event_type: string;
  event_date: string;
  source_url: string | null;
  exam_types: { slug?: string; name?: string } | null;
};

const EVENT_LABELS: Record<string, string> = {
  application_open: 'Application opens',
  application_close: 'Registration closes',
  exam_date: 'Exam day',
  results_release: 'Results release',
};

function fmt(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(d);
}

export default async function SchedulesAdminPage() {
  let rows: ScheduleRow[] = [];
  if (isAdminConfigured()) {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from('exam_schedules')
      .select('id, event_type, event_date, source_url, exam_types ( slug, name )')
      .order('event_date', { ascending: true })
      .limit(100);
    rows = (data ?? []) as ScheduleRow[];
  }
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AdminShell
      title="Exam schedules"
      description="Powers the exam calendar and countdown in the mobile app."
      actions={<a href="#create" className="rn-btn rn-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: T.primary, color: '#fff', textDecoration: 'none', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}><AIcon name="plus" size={15} /> Add schedule</a>}
    >
      <ACard title={`Scheduled dates (${rows.length})`} padding={0} style={{ marginBottom: 18 }}>
        {rows.length === 0 ? (
          <EmptyState icon="calendar" title="No schedules yet" body="Add official exam dates below." />
        ) : (
          <ATable columns={[{ label: 'Track' }, { label: 'Event' }, { label: 'Date' }, { label: 'Status' }, { label: 'Source' }]}>
            {rows.map((s) => {
              const upcoming = s.event_date >= today;
              return (
                <ARow key={s.id}>
                  <ACell>{s.exam_types?.slug ? <ExamTag slug={s.exam_types.slug} /> : <span style={{ color: T.textLight }}>—</span>}</ACell>
                  <ACell><span style={{ fontWeight: 600 }}>{EVENT_LABELS[s.event_type] ?? s.event_type}</span></ACell>
                  <ACell><span style={{ fontWeight: 600 }}>{fmt(s.event_date)}</span></ACell>
                  <ACell><span style={{ fontSize: 11.5, fontWeight: 700, color: upcoming ? T.success : T.textLight }}>{upcoming ? 'Upcoming' : 'Past'}</span></ACell>
                  <ACell>{s.source_url ? <a href={s.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: T.primary, textDecoration: 'none' }}>Source ↗</a> : <span style={{ color: T.textLight }}>—</span>}</ACell>
                </ARow>
              );
            })}
          </ATable>
        )}
      </ACard>

      <ACard title="Add an exam schedule" subtitle="Official-style dates for the mobile exam calendar" style={{ scrollMarginTop: 80 }}>
        <div id="create" />
        <ScheduleForm />
      </ACard>
    </AdminShell>
  );
}
