import { AdminCard, AdminMetric, AdminShell } from '@/components/admin-shell';
import { CommunityReportTriageActions } from '@/components/community-report-triage-actions';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

type SearchParams = Record<string, string | string[] | undefined>;

type CommunityReportRow = {
  id: string;
  target_type: 'post' | 'comment' | 'image' | 'user';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'open' | 'triaged' | 'fixed' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: { id: string; display_name: string | null; email: string | null } | null;
  reported_user: { id: string; display_name: string | null; email: string | null; community_status: string } | null;
  post: { id: string; body: string; image_url: string | null; moderation_status: string } | null;
  comment: { id: string; body: string; moderation_status: string } | null;
};

function pickParam(params: SearchParams, key: string, fallback: string): string {
  const value = params[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function targetLabel(row: CommunityReportRow): string {
  if (row.target_type === 'user') return row.reported_user?.display_name || row.reported_user?.email || 'User';
  if (row.target_type === 'comment') return row.comment?.body ?? 'Comment';
  return row.post?.body ?? 'Post';
}

function targetModerationStatus(row: CommunityReportRow): string | null {
  if (row.target_type === 'comment') return row.comment?.moderation_status ?? null;
  if (row.target_type === 'post' || row.target_type === 'image') return row.post?.moderation_status ?? null;
  return null;
}

export default async function CommunityReportsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  if (!isAdminConfigured()) {
    return (
      <AdminShell
        title="Community Reports"
        description="Admin Supabase environment variables are required before this can load."
      >
        <AdminCard>
          <p className="text-red-600">Admin Supabase not configured.</p>
        </AdminCard>
      </AdminShell>
    );
  }

  const supabase = getAdminSupabase();
  const params = (await searchParams) ?? {};
  const statusFilter = pickParam(params, 'status', 'open');
  const targetTypeFilter = pickParam(params, 'target_type', 'all');

  let query = supabase
    .from('community_reports')
    .select(
      `id, target_type, target_id, reason, details, status, admin_notes, created_at, resolved_at,
       reporter:users!community_reports_reporter_id_fkey ( id, display_name, email ),
       reported_user:users!community_reports_reported_user_id_fkey ( id, display_name, email, community_status ),
       post:community_posts ( id, body, image_url, moderation_status ),
       comment:community_comments ( id, body, moderation_status )`
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (statusFilter !== 'all') query = query.eq('status', statusFilter);
  if (targetTypeFilter !== 'all') query = query.eq('target_type', targetTypeFilter);

  const { data: reports } = await query;
  const rows = (reports ?? []) as unknown as CommunityReportRow[];

  const openCount = rows.filter((r) => r.status === 'open').length;
  const underReviewCount = rows.filter((r) => targetModerationStatus(r) === 'under_review').length;

  return (
    <AdminShell
      title="Community Reports"
      description="Review user-submitted reports on posts, comments, images, and users in the Community feature."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <AdminMetric label="Reports" value={rows.length} detail={`${statusFilter} filter`} tone="amber" />
        <AdminMetric label="Open" value={openCount} detail="Awaiting triage" tone="blue" />
        <AdminMetric label="Under Review" value={underReviewCount} detail="Auto-escalated (3+ reports)" tone="slate" />
      </div>

      <AdminCard className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#08183f]">Reports ({rows.length})</h2>
            <p className="mt-1 text-xs text-slate-500">
              Resolve reports, moderate content, and manage user community status.
            </p>
          </div>
          <form className="grid gap-2 text-xs sm:grid-cols-2">
            <select name="status" defaultValue={statusFilter} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <option value="open">Open</option>
              <option value="triaged">Triaged</option>
              <option value="fixed">Fixed</option>
              <option value="rejected">Rejected</option>
              <option value="all">All status</option>
            </select>
            <select
              name="target_type"
              defaultValue={targetTypeFilter}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <option value="all">All targets</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="image">Images</option>
              <option value="user">Users</option>
            </select>
            <button className="rounded-xl bg-[#08183f] px-4 py-2 font-black text-white sm:col-span-2">
              Apply filters
            </button>
          </form>
        </div>

        <ul className="mt-4 divide-y text-sm">
          {rows.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {r.target_type}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{r.status}</span>
                {targetModerationStatus(r) ? (
                  <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-800">
                    {targetModerationStatus(r)}
                  </span>
                ) : null}
                <span className="text-xs text-slate-500">
                  {r.reason} · {new Date(r.created_at).toLocaleDateString()} · reported by{' '}
                  {r.reporter?.display_name || r.reporter?.email || 'unknown'}
                </span>
              </div>

              <p className="mt-2 font-medium text-slate-900">{targetLabel(r)}</p>
              {r.target_type !== 'user' && r.reported_user ? (
                <p className="text-xs text-slate-500">
                  Author: {r.reported_user.display_name || r.reported_user.email} · status:{' '}
                  {r.reported_user.community_status}
                </p>
              ) : null}

              {r.details ? (
                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                  Reporter note: {r.details}
                </p>
              ) : null}
              {r.admin_notes ? (
                <p className="mt-2 rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-700">
                  Admin note: {r.admin_notes}
                </p>
              ) : null}

              <CommunityReportTriageActions
                reportId={r.id}
                targetType={r.target_type}
                targetId={r.target_id}
                reportedUserId={r.reported_user?.id ?? null}
                currentModerationStatus={targetModerationStatus(r)}
                currentUserStatus={r.reported_user?.community_status ?? null}
              />
            </li>
          ))}
          {!rows.length ? <li className="py-3 text-slate-500">No reports match these filters.</li> : null}
        </ul>
      </AdminCard>
    </AdminShell>
  );
}
