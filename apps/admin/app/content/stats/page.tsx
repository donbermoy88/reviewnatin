'use client';

import { AdminCard, AdminMetric, AdminShell } from '@/components/admin-shell';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type ContentRow = {
  slug: string;
  name: string;
  questions: number;
  mockExams: number;
  lessons: number;
  flashcards: number;
};

type DashboardStats = {
  users: number;
  waitlist: number;
  published_questions: number;
  draft_questions: number;
  open_reports: number;
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rows, setRows] = useState<ContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: statsData, error: statsErr } = await supabase.rpc('get_admin_dashboard_stats');
      if (statsErr) {
        setError(statsErr.message);
        setLoading(false);
        return;
      }
      const parsed = statsData as DashboardStats & { error?: string };
      if (parsed.error) {
        setError(parsed.error);
        setLoading(false);
        return;
      }
      setStats(parsed);

      const { data: exams } = await supabase.from('exam_types').select('slug, name').eq('is_active', true);
      const contentRows = await Promise.all(
        (exams ?? []).map(async (exam) => {
          const { data: counts } = await supabase.rpc('get_content_counts', { p_exam_slug: exam.slug });
          const c = counts as { questions: number; mock_exams: number; lessons: number; flashcards: number } | null;
          return {
            slug: exam.slug,
            name: exam.name,
            questions: c?.questions ?? 0,
            mockExams: c?.mock_exams ?? 0,
            lessons: c?.lessons ?? 0,
            flashcards: c?.flashcards ?? 0,
          };
        })
      );
      setRows(contentRows);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminShell
      title="Content and Platform Stats"
      description="Monitor catalog readiness, user growth, draft backlog, and open content quality reports."
    >
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetric label="Users" value={stats?.users ?? '—'} detail="Registered" />
        <AdminMetric label="Waitlist" value={stats?.waitlist ?? '—'} detail="Marketing signups" tone="green" />
        <AdminMetric label="Published Q" value={stats?.published_questions ?? '—'} detail="Live catalog" tone="blue" />
        <AdminMetric label="Draft Q" value={stats?.draft_questions ?? '—'} detail="Needs review" tone="amber" />
        <AdminMetric label="Open reports" value={stats?.open_reports ?? '—'} detail="QA queue" tone="slate" />
      </div>

      <AdminCard className="mt-6 overflow-hidden" padding="none">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text)]">Catalog by exam</h2>
          <span className="text-xs text-[var(--text-muted)]">{loading ? 'Loading…' : `${rows.length} active exams`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-muted)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3 text-right">Questions</th>
                <th className="px-5 py-3 text-right">Mocks</th>
                <th className="px-5 py-3 text-right">Lessons</th>
                <th className="px-5 py-3 text-right">Flashcards</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[var(--text-muted)]">
                    Loading catalog counts…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-[var(--text-muted)]">
                    No active exams.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.slug} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-muted)]">
                    <td className="px-5 py-3 font-medium text-[var(--text)]">{row.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.questions}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.mockExams}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.lessons}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{row.flashcards}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
