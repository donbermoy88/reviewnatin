import { AdminShell } from '@/components/admin-shell';
import { ACard, ACell, ARow, ATable, Avatar, EmptyState, T } from '@/components/admin-ui';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type StaffRow = { id: string; email: string | null; display_name: string | null; role: string };

const ROLE_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  admin: { label: 'Admin', color: '#6d28d9', bg: '#f0eafc', desc: 'Full access — content, payments, team' },
  content_author: { label: 'Author', color: '#1e40af', bg: '#e4edfd', desc: 'Create & import questions and materials' },
  content_reviewer: { label: 'Reviewer', color: '#b45309', bg: '#fdf3df', desc: 'Approve, publish & resolve reports' },
};

export default async function TeamAdminPage() {
  let staff: StaffRow[] = [];
  const configured = isAdminConfigured();
  if (configured) {
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .in('role', ['admin', 'content_reviewer', 'content_author'])
      .order('role');
    staff = (data ?? []) as StaffRow[];
  }

  const counts = staff.reduce<Record<string, number>>((acc, s) => {
    acc[s.role] = (acc[s.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminShell
      title="Team & roles"
      description="Staff access to this console. Authors create content, reviewers approve it, and admins manage everything including payments."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
        {(['admin', 'content_reviewer', 'content_author'] as const).map((role) => {
          const m = ROLE_META[role];
          return (
            <div key={role} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, padding: '16px 18px' }}>
              <span style={{ background: m.bg, color: m.color, borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 700 }}>{m.label}</span>
              <div className="font-head" style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 10 }}>{counts[role] ?? 0}</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{m.desc}</div>
            </div>
          );
        })}
      </div>

      <ACard title={`Staff members (${staff.length})`} padding={0}>
        {!configured ? (
          <p style={{ padding: '20px', color: T.danger }}>Admin Supabase not configured.</p>
        ) : staff.length === 0 ? (
          <EmptyState icon="users" title="No staff yet" body="Assign roles in the Supabase users table to grant console access." />
        ) : (
          <ATable columns={[{ label: 'Member' }, { label: 'Role' }, { label: 'Permissions' }]}>
            {staff.map((s) => {
              const name = s.display_name || s.email?.split('@')[0] || 'Staff';
              const m = ROLE_META[s.role] ?? { label: s.role, color: T.textMuted, bg: '#eef1f7', desc: '—' };
              return (
                <ARow key={s.id}>
                  <ACell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar name={name} size={32} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
                        <div style={{ fontSize: 11.5, color: T.textLight }}>{s.email ?? '—'}</div>
                      </div>
                    </div>
                  </ACell>
                  <ACell><span style={{ background: m.bg, color: m.color, borderRadius: 6, padding: '3px 9px', fontSize: 11.5, fontWeight: 700 }}>{m.label}</span></ACell>
                  <ACell><span style={{ fontSize: 12.5, color: T.textMuted }}>{m.desc}</span></ACell>
                </ARow>
              );
            })}
          </ATable>
        )}
      </ACard>

      <p style={{ fontSize: 12, color: T.textLight, marginTop: 12 }}>
        Roles are managed in the Supabase <code style={{ background: '#eef1f7', borderRadius: 4, padding: '1px 6px' }}>users</code> table. Invite flow is handled in Supabase Auth.
      </p>
    </AdminShell>
  );
}
