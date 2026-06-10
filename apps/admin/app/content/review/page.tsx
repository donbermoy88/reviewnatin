import Link from 'next/link';
import { AdminCard, AdminMetric, AdminShell, Badge } from '@/components/admin-shell';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';
import { ReportTriageActions } from '@/components/report-triage-actions';

type SearchParams = Record<string, string | string[] | undefined>;

type StaffMember = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
};

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

type ReportEventRow = {
  id: string;
  report_id: string;
  event_type: string;
  from_value: string | null;
  to_value: string | null;
  note: string | null;
  created_at: string;
  actor_id: string | null;
};

function pickParam(params: SearchParams, key: string, fallback: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function severityTone(severity: string): 'red' | 'orange' | 'neutral' | 'amber' {
  if (severity === 'critical') return 'red';
  if (severity === 'high') return 'orange';
  if (severity === 'low') return 'neutral';
  return 'amber';
}

function statusTone(status: string): 'green' | 'blue' | 'neutral' {
  if (status === 'fixed') return 'green';
  if (status === 'triaged') return 'blue';
  return 'neutral';
}

function assigneeName(staff: StaffMember[], id: string | null): string {
  if (!id) return 'Unassigned';
  const person = staff.find((member) => member.id === id);
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

export default async function ReviewQueuePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  if (!isAdminConfigured()) {
    return (
      <AdminShell title="Review Queue" description="Admin Supabase environment variables are required before QA can load.">
        <AdminCard>
          <p className="text-red-600">Admin Supabase not configured.</p>
        </AdminCard>
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
    .select(
      'id, content_type, question_id, flashcard_id, review_material_id, reason, details, status, severity, assigned_to, triage_labels, admin_notes, duplicate_group_key, created_at, updated_at, questions ( stem ), flashcards ( front, back ), review_materials ( title )'
    )
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
      .select('id, stem, status, difficulty, topics ( name, subject_areas ( name, exam_types ( slug ) ) )')
      .in('status', ['draft', 'in_review'])
      .order('created_at', { ascending: false })
      .limit(50),
    contentReportQuery,
    supabase
      .from('reported_questions')
      .select('id, question_id, reason, details, status, created_at, questions ( stem )')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('users')
      .select('id, email, display_name, role')
      .in('role', ['admin', 'content_reviewer', 'content_author'])
      .order('display_name'),
  ]);

  const contentRows = (contentReports ?? []) as ContentReportRow[];
  const staffRows = (staff ?? []) as StaffMember[];
  const reportIds = contentRows.map((row) => row.id);
  const { data: eventRows } = reportIds.length
    ? await supabase
      .from('content_report_events')
      .select('id, report_id, event_type, from_value, to_value, note, created_at, actor_id')
      .in('report_id', reportIds)
      .order('created_at', { ascending: false })
      .limit(300)
    : { data: [] };
  const eventsByReport = ((eventRows ?? []) as ReportEventRow[]).reduce<Record<string, ReportEventRow[]>>((acc, event) => {
    acc[event.report_id] = [...(acc[event.report_id] ?? []), event];
    return acc;
  }, {});
  const duplicateCounts = contentRows.reduce<Record<string, number>>((acc, row) => {
    const key = row.duplicate_group_key ?? `${row.content_type}:${row.question_id ?? row.flashcard_id ?? row.review_material_id}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminShell
      title="Content QA Review Queue"
      description="Audit draft content and user-submitted reports before incorrect questions, flashcards, or notes stay live in the mobile app."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric label="Draft review" value={drafts?.length ?? 0} detail="Questions pending" />
        <AdminMetric label="QA reports" value={contentRows.length} detail={`${statusFilter} filter`} tone="amber" />
        <AdminMetric label="Legacy reports" value={reports?.length ?? 0} detail="Open question flags" tone="slate" />
        <AdminMetric label="Staff" value={staffRows.length} detail="Review-capable users" tone="green" />
      </div>

        <AdminCard className="mt-6">
          <h2 className="text-base font-semibold text-[var(--text)]">Draft / in review ({drafts?.length ?? 0})</h2>
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {(drafts ?? []).map((q) => {
              const topic = q.topics as { name?: string; subject_areas?: { name?: string; exam_types?: { slug?: string } } } | null;
              const examSlug = topic?.subject_areas?.exam_types?.slug ?? '—';
              return (
                <li key={q.id} className="py-3">
                  <Link href={`/content/questions/${q.id}`} className="font-medium text-[var(--primary)] hover:underline">
                    {q.stem}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {examSlug} · {topic?.subject_areas?.name}/{topic?.name} · {q.status} · {q.id.slice(0, 8)}…
                  </p>
                </li>
              );
            })}
            {!drafts?.length ? <li className="py-3 text-[var(--text-muted)]">No pending questions.</li> : null}
          </ul>
        </AdminCard>

        <AdminCard className="mt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">Content QA reports ({contentRows.length})</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Filter, assign, group duplicates, and resolve reported questions, flashcards, and lessons.
              </p>
            </div>
            <form className="grid w-full gap-2 text-xs sm:grid-cols-2 lg:w-auto lg:grid-cols-[repeat(4,9rem)_auto]">
              <select name="status" defaultValue={statusFilter} className="field-input px-2.5 py-1.5 text-xs">
                <option value="open">Open</option>
                <option value="triaged">Triaged</option>
                <option value="fixed">Fixed</option>
                <option value="rejected">Rejected</option>
                <option value="all">All status</option>
              </select>
              <select name="type" defaultValue={typeFilter} className="field-input px-2.5 py-1.5 text-xs">
                <option value="all">All content</option>
                <option value="question">Questions</option>
                <option value="flashcard">Flashcards</option>
                <option value="review_material">Materials</option>
              </select>
              <select name="severity" defaultValue={severityFilter} className="field-input px-2.5 py-1.5 text-xs">
                <option value="all">All severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select name="assignee" defaultValue={assigneeFilter} className="field-input px-2.5 py-1.5 text-xs">
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {staffRows.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name || member.email || member.id.slice(0, 8)}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm">Apply filters</button>
            </form>
          </div>
          <ul className="mt-4 divide-y divide-[var(--border)] text-sm">
            {contentRows.map((r) => {
              const question = r.questions as { stem?: string } | null;
              const flashcard = r.flashcards as { front?: string; back?: string } | null;
              const material = r.review_materials as { title?: string } | null;
              const targetId = r.question_id ?? r.flashcard_id ?? r.review_material_id ?? '';
              const duplicateKey = r.duplicate_group_key ?? `${r.content_type}:${targetId}`;
              const duplicateCount = duplicateCounts[duplicateKey] ?? 1;
              const targetLabel =
                r.content_type === 'question'
                  ? question?.stem ?? 'Question'
                  : r.content_type === 'flashcard'
                    ? flashcard?.front ?? 'Flashcard'
                    : material?.title ?? 'Review material';
              const href =
                r.content_type === 'question' && r.question_id
                  ? `/content/questions/${r.question_id}`
                  : undefined;

              return (
                <li key={r.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{r.content_type.replace('_', ' ')}</Badge>
                    <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    {duplicateCount > 1 ? <Badge tone="purple">{duplicateCount} duplicate reports</Badge> : null}
                    <span className="text-xs text-[var(--text-muted)]">
                      {r.reason} · {new Date(r.updated_at).toLocaleDateString()} · {assigneeName(staffRows, r.assigned_to)}
                    </span>
                  </div>
                  {href ? (
                    <Link href={href} className="mt-2 block font-medium text-[var(--primary)] hover:underline">
                      {targetLabel}
                    </Link>
                  ) : (
                    <p className="mt-2 font-medium text-[var(--text)]">{targetLabel}</p>
                  )}
                  {flashcard?.back ? <p className="mt-1 text-xs text-[var(--text-muted)]">Answer: {flashcard.back}</p> : null}
                  {r.details ? (
                    <p className="mt-2 rounded-lg border border-amber-100 bg-[var(--warning-soft)] p-3 text-xs leading-5 text-amber-900">
                      Reporter note: {r.details}
                    </p>
                  ) : null}
                  {r.admin_notes ? (
                    <p className="mt-2 rounded-lg bg-[var(--surface-sunken)] p-3 text-xs leading-5 text-[var(--text-muted)]">
                      Admin note: {r.admin_notes}
                    </p>
                  ) : null}
                  {r.triage_labels?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.triage_labels.map((label) => (
                        <span key={label} className="rounded-full bg-[var(--surface-sunken)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                          {label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {eventsByReport[r.id]?.length ? (
                    <details className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--text-muted)]">
                      <summary className="cursor-pointer font-medium text-[var(--text)]">
                        Recent history ({eventsByReport[r.id].length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {eventsByReport[r.id].slice(0, 5).map((event) => (
                          <li key={event.id}>
                            {eventText(event, staffRows)} · {new Date(event.created_at).toLocaleString()}
                            {event.note ? <span className="block text-[var(--text-subtle)]">“{event.note}”</span> : null}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                  <ReportTriageActions
                    reportId={r.id}
                    targetId={targetId}
                    reportKind="content"
                    severity={r.severity}
                    assignedTo={r.assigned_to}
                    labels={r.triage_labels ?? []}
                    staff={staffRows}
                  />
                </li>
              );
            })}
            {!contentRows.length ? <li className="py-3 text-[var(--text-muted)]">No content reports match these filters.</li> : null}
          </ul>
        </AdminCard>

        <AdminCard className="mt-6">
          <h2 className="text-base font-semibold text-[var(--text)]">Legacy question reports ({reports?.length ?? 0})</h2>
          <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
            {(reports ?? []).map((r) => {
              const q = r.questions as { stem?: string } | null;
              return (
                <li key={r.id} className="py-3">
                  <Link href={`/content/questions/${r.question_id}`} className="font-medium text-[var(--primary)] hover:underline">
                    {q?.stem ?? 'Question'}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {r.reason} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  {r.details ? (
                    <p className="mt-2 rounded-lg border border-amber-100 bg-[var(--warning-soft)] p-3 text-xs leading-5 text-amber-900">
                      Reporter note: {r.details}
                    </p>
                  ) : null}
                  <ReportTriageActions reportId={r.id} targetId={r.question_id} />
                </li>
              );
            })}
            {!reports?.length ? <li className="py-3 text-[var(--text-muted)]">No open reports.</li> : null}
          </ul>
        </AdminCard>
    </AdminShell>
  );
}
