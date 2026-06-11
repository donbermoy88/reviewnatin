import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { ABtn, ACard, ACell, ARow, ATable, StatusBadge, T } from '@/components/admin-ui';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';
import { ReportTriageActions } from '@/components/report-triage-actions';
import { DraftsReview, type DraftRow } from '@/components/review-drafts';
import { TabSwitch } from '@/components/tab-switch';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

type StaffMember = { id: string; email: string | null; display_name: string | null; role: string };

type ContentReportRow = {
  id: string;
  content_type: 'question' | 'flashcard' | 'review_material';
  question_id: string | null;
  flashcard_id: string | null;
  review_material_id: string | null;
  reason: string;
  details: string | null;
  status: 'open' | 'triaged' | 'fixed' | 'rejected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  triage_labels: string[];
  admin_notes: string | null;
  duplicate_group_key: string | null;
  created_at: string;
  updated_at: string;
  questions: { stem?: string } | null;
  flashcards: { front?: string; back?: string } | null;
  review_materials: { title?: string } | null;
};

type ReportEventRow = { id: string; report_id: string; event_type: string; from_value: string | null; to_value: string | null; note: string | null; created_at: string; actor_id: string | null };

function pickParam(params: SearchParams, key: string, fallback: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function severityTone(severity: string): string {
  if (severity === 'critical') return 'open';
  if (severity === 'high') return 'submitted';
  if (severity === 'low') return 'draft';
  return 'in_review';
}

function assigneeName(staff: StaffMember[], id: string | null): string {
  if (!id) return 'Unassigned';
  const person = staff.find((m) => m.id === id);
  return person?.display_name || person?.email || id.slice(0, 8);
}

function eventText(event: ReportEventRow, staff: StaffMember[]): string {
  const actor = assigneeName(staff, event.actor_id);
  if (event.event_type === 'assigned') return `${actor} assigned this report`;
  if (event.event_type === 'severity_changed') return `${actor} changed severity ${event.from_value ?? '—'} → ${event.to_value ?? '—'}`;
  if (event.event_type === 'status_changed') return `${actor} changed status ${event.from_value ?? '—'} → ${event.to_value ?? '—'}`;
  if (event.event_type === 'labels_changed') return `${actor} updated labels`;
  if (event.event_type === 'note_added') return `${actor} added a note`;
  return `${actor} updated this report`;
}

function relAge(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (Number.isNaN(mins)) return '';
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}

export default async function ReviewQueuePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  if (!isAdminConfigured()) {
    return (
      <AdminShell title="Review queue" description="Admin Supabase environment variables are required before QA can load.">
        <ACard><p style={{ color: T.danger }}>Admin Supabase not configured.</p></ACard>
      </AdminShell>
    );
  }

  const supabase = getAdminSupabase();
  const params = (await searchParams) ?? {};
  const statusFilter = pickParam(params, 'status', 'open');
  const typeFilter = pickParam(params, 'type', 'all');
  const severityFilter = pickParam(params, 'severity', 'all');
  const assigneeFilter = pickParam(params, 'assignee', 'all');

  let contentReportQuery = supabase
    .from('content_reports')
    .select('id, content_type, question_id, flashcard_id, review_material_id, reason, details, status, severity, assigned_to, triage_labels, admin_notes, duplicate_group_key, created_at, updated_at, questions ( stem ), flashcards ( front, back ), review_materials ( title )')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (statusFilter !== 'all') contentReportQuery = contentReportQuery.eq('status', statusFilter);
  if (typeFilter !== 'all') contentReportQuery = contentReportQuery.eq('content_type', typeFilter);
  if (severityFilter !== 'all') contentReportQuery = contentReportQuery.eq('severity', severityFilter);
  if (assigneeFilter === 'unassigned') contentReportQuery = contentReportQuery.is('assigned_to', null);
  else if (assigneeFilter !== 'all') contentReportQuery = contentReportQuery.eq('assigned_to', assigneeFilter);

  const [{ data: drafts }, { data: contentReports }, { data: reports }, { data: staff }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, stem, status, created_at, topics ( name, subject_areas ( name, exam_types ( slug ) ) )')
      .in('status', ['draft', 'in_review'])
      .order('created_at', { ascending: false })
      .limit(100),
    contentReportQuery,
    supabase.from('reported_questions').select('id, question_id, reason, details, status, created_at, questions ( stem )').eq('status', 'open').order('created_at', { ascending: false }).limit(50),
    supabase.from('users').select('id, email, display_name, role').in('role', ['admin', 'content_reviewer', 'content_author']).order('display_name'),
  ]);

  const contentRows = (contentReports ?? []) as ContentReportRow[];
  const staffRows = (staff ?? []) as StaffMember[];
  const reportIds = contentRows.map((r) => r.id);
  const { data: eventRows } = reportIds.length
    ? await supabase.from('content_report_events').select('id, report_id, event_type, from_value, to_value, note, created_at, actor_id').in('report_id', reportIds).order('created_at', { ascending: false }).limit(300)
    : { data: [] };
  const eventsByReport = ((eventRows ?? []) as ReportEventRow[]).reduce<Record<string, ReportEventRow[]>>((acc, e) => {
    acc[e.report_id] = [...(acc[e.report_id] ?? []), e];
    return acc;
  }, {});
  const duplicateCounts = contentRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.duplicate_group_key ?? `${row.content_type}:${row.question_id ?? row.flashcard_id ?? row.review_material_id}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const draftRows: DraftRow[] = ((drafts ?? []) as Array<{ id: string; stem: string; status: string; created_at: string; topics: { name?: string; subject_areas?: { name?: string; exam_types?: { slug?: string } } } | null }>).map((q) => ({
    id: q.id,
    stem: q.stem,
    status: q.status,
    examSlug: q.topics?.subject_areas?.exam_types?.slug ?? '',
    subject: q.topics?.subject_areas?.name ?? '',
    topic: q.topics?.name ?? '',
    age: relAge(q.created_at),
  }));

  const openReportCount = (reports?.length ?? 0) + contentRows.filter((r) => r.status === 'open').length;

  const reportsView = (
    <div style={{ display: 'grid', gap: 16 }}>
      <ACard title={`Content QA reports (${contentRows.length})`} subtitle="Filter, assign, group duplicates, and resolve reported content.">
        <form className="rn-filters" style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, 1fr) auto', marginBottom: 16 }}>
          <select name="status" defaultValue={statusFilter} className="field-input" style={{ fontSize: 12.5, padding: '7px 10px' }}>
            <option value="open">Open</option><option value="triaged">Triaged</option><option value="fixed">Fixed</option><option value="rejected">Rejected</option><option value="all">All status</option>
          </select>
          <select name="type" defaultValue={typeFilter} className="field-input" style={{ fontSize: 12.5, padding: '7px 10px' }}>
            <option value="all">All content</option><option value="question">Questions</option><option value="flashcard">Flashcards</option><option value="review_material">Materials</option>
          </select>
          <select name="severity" defaultValue={severityFilter} className="field-input" style={{ fontSize: 12.5, padding: '7px 10px' }}>
            <option value="all">All severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select name="assignee" defaultValue={assigneeFilter} className="field-input" style={{ fontSize: 12.5, padding: '7px 10px' }}>
            <option value="all">All assignees</option><option value="unassigned">Unassigned</option>
            {staffRows.map((m) => <option key={m.id} value={m.id}>{m.display_name || m.email || m.id.slice(0, 8)}</option>)}
          </select>
          <ABtn type="submit" size="sm">Apply</ABtn>
        </form>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {contentRows.map((r) => {
            const targetId = r.question_id ?? r.flashcard_id ?? r.review_material_id ?? '';
            const duplicateKey = r.duplicate_group_key ?? `${r.content_type}:${targetId}`;
            const duplicateCount = duplicateCounts[duplicateKey] ?? 1;
            const targetLabel = r.content_type === 'question' ? r.questions?.stem ?? 'Question' : r.content_type === 'flashcard' ? r.flashcards?.front ?? 'Flashcard' : r.review_materials?.title ?? 'Review material';
            const href = r.content_type === 'question' && r.question_id ? `/content/questions/${r.question_id}` : undefined;
            return (
              <li key={r.id} style={{ padding: '14px 0', borderTop: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={severityTone(r.severity)} label={r.severity} />
                  <StatusBadge status={r.status} />
                  <span style={{ background: T.infoBg, color: T.info, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{r.content_type.replace('_', ' ')}</span>
                  {duplicateCount > 1 ? <span style={{ background: T.purpleBg, color: T.purple, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{duplicateCount} duplicates</span> : null}
                  <span style={{ fontSize: 12, color: T.textLight }}>{r.reason} · {assigneeName(staffRows, r.assigned_to)}</span>
                </div>
                {href ? <Link href={href} style={{ display: 'block', marginTop: 8, fontWeight: 600, color: T.primary, textDecoration: 'none' }}>{targetLabel}</Link> : <p style={{ marginTop: 8, fontWeight: 600, color: T.text }}>{targetLabel}</p>}
                {r.details ? <p style={{ marginTop: 8, background: T.warnBg, color: '#7c4a03', borderRadius: 8, padding: '8px 12px', fontSize: 12, lineHeight: 1.5 }}>Reporter: {r.details}</p> : null}
                {r.admin_notes ? <p style={{ marginTop: 8, background: '#eef1f7', color: T.textMuted, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>Admin note: {r.admin_notes}</p> : null}
                {eventsByReport[r.id]?.length ? (
                  <details style={{ marginTop: 8, border: `1px solid ${T.border}`, background: T.surface, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: T.textMuted }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 600, color: T.text }}>History ({eventsByReport[r.id].length})</summary>
                    <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
                      {eventsByReport[r.id].slice(0, 5).map((e) => (
                        <li key={e.id}>{eventText(e, staffRows)} · {new Date(e.created_at).toLocaleString()}{e.note ? <span style={{ display: 'block', color: T.textLight }}>“{e.note}”</span> : null}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                <ReportTriageActions reportId={r.id} targetId={targetId} reportKind="content" severity={r.severity} assignedTo={r.assigned_to} labels={r.triage_labels ?? []} staff={staffRows} />
              </li>
            );
          })}
          {!contentRows.length ? <li style={{ padding: '20px 0', color: T.textMuted, textAlign: 'center' }}>No content reports match these filters.</li> : null}
        </ul>
      </ACard>

      {reports?.length ? (
        <ACard title={`Legacy question reports (${reports.length})`} padding={0}>
          <ATable columns={[{ label: 'Question' }, { label: 'Reason' }, { label: 'Reported', align: 'right' }, { label: '', width: 220 }]}>
            {(reports ?? []).map((r) => (
              <ARow key={r.id}>
                <ACell><Link href={`/content/questions/${r.question_id}`} style={{ fontWeight: 600, color: T.primary, textDecoration: 'none' }}>{(r.questions as { stem?: string } | null)?.stem ?? 'Question'}</Link></ACell>
                <ACell><span style={{ fontSize: 12.5, color: T.textMuted }}>{r.reason}</span></ACell>
                <ACell align="right"><span style={{ fontSize: 12.5, color: T.textMuted }}>{new Date(r.created_at).toLocaleDateString()}</span></ACell>
                <ACell align="right"><ReportTriageActions reportId={r.id} targetId={r.question_id} /></ACell>
              </ARow>
            ))}
          </ATable>
        </ACard>
      ) : null}
    </div>
  );

  return (
    <AdminShell
      title="Review queue"
      description="Approve drafted questions and triage learner-reported issues before they reach the app."
      actions={<Link href="/content/import" className="rn-btn rn-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: '#fff', color: T.text, border: `1px solid ${T.border}`, textDecoration: 'none' }}>Import CSV</Link>}
    >
      <TabSwitch
        tabs={[
          { id: 'drafts', label: 'Drafts to review', count: draftRows.length },
          { id: 'reports', label: 'Reported questions', count: openReportCount },
        ]}
        views={{ drafts: <DraftsReview drafts={draftRows} />, reports: reportsView }}
      />
    </AdminShell>
  );
}
