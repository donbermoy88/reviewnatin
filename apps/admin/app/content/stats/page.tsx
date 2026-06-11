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
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: statsData, error: statsErr } = await supabase.rpc('get_admin_dashboard_stats');
      if (statsErr) {
        setError(statsErr.message);
        return;
      }
      const parsed = statsData as DashboardStats & { error?: string };
      if (parsed.error) {
        setError(parsed.error);
        return;
      }
      setStats(parsed);

      const { data: exams } = await supabase.from('exam_types').select('slug, name').eq('is_active', true);
      const contentRows: ContentRow[] = [];
      for (const exam of exams ?? []) {
        const { data: counts } = await supabase.rpc('get_content_counts', { p_exam_slug: exam.slug });
        const c = counts as {
          questions: number;
          mock_exams: number;
          lessons: number;
          flashcards: number;
        } | null;
        contentRows.push({
          slug: exam.slug,
          name: exam.name,
          questions: c?.questions ?? 0,
          mockExams: c?.mock_exams ?? 0,
          lessons: c?.lessons ?? 0,
          flashcards: c?.flashcards ?? 0,
        });
      }
      setRows(contentRows);
    })();
  }, []);

  return (
    <AdminShell
      title="Content and Platform Stats"
      description="Monitor catalog readiness, user growth, draft backlog, and open content quality reports."
    >
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {stats ? (
          <div className="grid gap-4 md:grid-cols-5">
            <AdminMetric label="Users" value={stats.users} detail="Registered" />
            <AdminMetric label="Waitlist" value={stats.waitlist} detail="Marketing signups" tone="green" />
            <AdminMetric label="Published Q" value={stats.published_questions} detail="Live catalog" tone="blue" />
            <AdminMetric label="Draft Q" value={stats.draft_questions} detail="Needs review" tone="amber" />
            <AdminMetric label="Open Reports" value={stats.open_reports} detail="QA queue" tone="slate" />
          </div>
        ) : null}

        <AdminCard className="mt-8 overflow-hidden p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Mocks</th>
                <th className="px-4 py-3">Lessons</th>
                <th className="px-4 py-3">Flashcards</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.slug} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3">{row.questions}</td>
                  <td className="px-4 py-3">{row.mockExams}</td>
                  <td className="px-4 py-3">{row.lessons}</td>
                  <td className="px-4 py-3">{row.flashcards}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AdminCard>
    </AdminShell>
  );
}
