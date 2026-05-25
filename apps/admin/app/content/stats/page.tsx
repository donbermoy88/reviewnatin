'use client';

import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl">
        <AdminNav />
        <Link href="/" className="text-sm font-medium text-blue-600">
          ← Admin home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Content & platform stats</h1>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {stats ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Users', value: stats.users },
              { label: 'Waitlist', value: stats.waitlist },
              { label: 'Published Q', value: stats.published_questions },
              { label: 'Draft Q', value: stats.draft_questions },
              { label: 'Open reports', value: stats.open_reports },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-xl border bg-white shadow-sm">
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
        </div>
      </div>
    </div>
  );
}
