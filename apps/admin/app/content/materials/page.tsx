import { AdminShell } from '@/components/admin-shell';
import { ACard, ACell, ARow, ATable, AIcon, EmptyState, ExamTag, StatusBadge, T } from '@/components/admin-ui';
import { MaterialForm } from '@/components/content-forms';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type MaterialRow = {
  id: string;
  title: string;
  material_type: string;
  is_premium: boolean;
  topics: { name?: string; subject_areas?: { exam_types?: { slug?: string } } } | null;
};

const TYPE_LABEL: Record<string, string> = { lesson: 'Lesson', cheat_sheet: 'Cheat sheet', formula: 'Formula', note: 'Note' };

export default async function MaterialsAdminPage() {
  let rows: MaterialRow[] = [];
  if (isAdminConfigured()) {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from('review_materials')
      .select('id, title, material_type, is_premium, topics ( name, subject_areas ( exam_types ( slug ) ) )')
      .order('title')
      .limit(100);
    rows = (data ?? []) as MaterialRow[];
  }

  return (
    <AdminShell
      title="Lessons & cheat sheets"
      description="Study Notes tab content and the offline pack. Publishing adds material to the mobile app."
      actions={<a href="#create" className="rn-btn rn-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, background: T.primary, color: '#fff', textDecoration: 'none', boxShadow: '0 1px 2px rgba(37,99,235,.3)' }}><AIcon name="upload" size={15} /> New material</a>}
    >
      <ACard title={`Published materials (${rows.length})`} padding={0} style={{ marginBottom: 18 }}>
        {rows.length === 0 ? (
          <EmptyState icon="book" title="No materials yet" body="Publish your first lesson or cheat sheet below." />
        ) : (
          <ATable columns={[{ label: 'Material' }, { label: 'Exam' }, { label: 'Type' }, { label: 'Access' }]}>
            {rows.map((m) => {
              const slug = m.topics?.subject_areas?.exam_types?.slug;
              return (
                <ARow key={m.id}>
                  <ACell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: m.material_type === 'cheat_sheet' ? T.goldBg : T.infoBg, color: m.material_type === 'cheat_sheet' ? T.warn : T.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AIcon name={m.material_type === 'cheat_sheet' ? 'file' : 'book'} size={16} />
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</span>
                    </div>
                  </ACell>
                  <ACell>{slug ? <ExamTag slug={slug} /> : <span style={{ color: T.textLight }}>—</span>}</ACell>
                  <ACell><span style={{ fontSize: 12.5, color: T.textMuted }}>{TYPE_LABEL[m.material_type] ?? m.material_type}</span></ACell>
                  <ACell><StatusBadge status={m.is_premium ? 'verified' : 'published'} label={m.is_premium ? 'Premium' : 'Free'} /></ACell>
                </ARow>
              );
            })}
          </ATable>
        )}
      </ACard>

      <ACard title="Publish a lesson or cheat sheet" subtitle="Added to the Study Notes tab and the next offline pack" style={{ scrollMarginTop: 80 }}>
        <div id="create" />
        <MaterialForm />
      </ACard>
    </AdminShell>
  );
}
