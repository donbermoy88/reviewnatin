import { AdminShell } from '@/components/admin-shell';
import { ACard, ACell, ARow, ATable, AIcon, EmptyState, ExamTag, StatusBadge, T } from '@/components/admin-ui';
import { AnnouncementForm } from '@/components/content-forms';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type AnnouncementRow = {
  id: string;
  title: string;
  published_at: string | null;
  exam_types: { slug?: string } | null;
};

function fmt(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }).format(d);
}

export default async function AnnouncementsAdminPage() {
  let rows: AnnouncementRow[] = [];
  if (isAdminConfigured()) {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from('announcements')
      .select('id, title, published_at, exam_types ( slug )')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(100);
    rows = (data ?? []) as AnnouncementRow[];
  }

  return (
    <AdminShell
      title="Announcements"
      description="In-app banners and Home announcements, published from one source of truth."
      actions={<a href="#create" className="rn-btn rn-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: T.primary, color: '#fff', textDecoration: 'none', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}><AIcon name="send" size={15} /> New announcement</a>}
    >
      <ACard title={`Published announcements (${rows.length})`} padding={0} style={{ marginBottom: 18 }}>
        {rows.length === 0 ? (
          <EmptyState icon="megaphone" title="No announcements yet" body="Publish your first announcement below." />
        ) : (
          <ATable columns={[{ label: 'Announcement' }, { label: 'Audience' }, { label: 'Status' }, { label: 'Published', align: 'right' }]}>
            {rows.map((a) => (
              <ARow key={a.id}>
                <ACell><span style={{ fontWeight: 600 }}>{a.title}</span></ACell>
                <ACell>{a.exam_types?.slug ? <ExamTag slug={a.exam_types.slug} /> : <span style={{ fontSize: 12.5, color: T.textMuted }}>All exams</span>}</ACell>
                <ACell><StatusBadge status={a.published_at ? 'sent' : 'draft'} label={a.published_at ? 'Published' : 'Draft'} /></ACell>
                <ACell align="right"><span style={{ fontSize: 12.5, color: T.textMuted }}>{fmt(a.published_at)}</span></ACell>
              </ARow>
            ))}
          </ATable>
        )}
      </ACard>

      <ACard title="Publish an announcement" subtitle="Visible in the app Home feed and marketing site" style={{ scrollMarginTop: 80 }}>
        <div id="create" />
        <AnnouncementForm />
      </ACard>
    </AdminShell>
  );
}
