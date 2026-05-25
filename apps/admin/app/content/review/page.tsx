import Link from 'next/link';
import { getAdminSupabase, isAdminConfigured } from '@/lib/supabase/admin';
import { ReportTriageActions } from '@/components/report-triage-actions';

export default async function ReviewQueuePage() {
  if (!isAdminConfigured()) {
    return (
      <div className="p-8">
        <p className="text-red-600">Admin Supabase not configured.</p>
      </div>
    );
  }

  const supabase = getAdminSupabase();

  const [{ data: drafts }, { data: reports }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, stem, status, difficulty, topics ( name, subject_areas ( name, exam_types ( slug ) ) )')
      .in('status', ['draft', 'in_review'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('reported_questions')
      .select('id, question_id, reason, status, created_at, questions ( stem )')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-blue-600">
          ← Admin home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Review queue</h1>
        <p className="mt-2 text-sm text-slate-600">Draft questions and open user reports.</p>

        <section className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Draft / in review ({drafts?.length ?? 0})</h2>
          <ul className="mt-4 divide-y text-sm">
            {(drafts ?? []).map((q) => {
              const topic = q.topics as { name?: string; subject_areas?: { name?: string; exam_types?: { slug?: string } } } | null;
              const examSlug = topic?.subject_areas?.exam_types?.slug ?? '—';
              return (
                <li key={q.id} className="py-3">
                  <Link href={`/content/questions/${q.id}`} className="font-medium text-blue-700 hover:underline">
                    {q.stem}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {examSlug} · {topic?.subject_areas?.name}/{topic?.name} · {q.status} · {q.id.slice(0, 8)}…
                  </p>
                </li>
              );
            })}
            {!drafts?.length ? <li className="py-3 text-slate-500">No pending questions.</li> : null}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Open reports ({reports?.length ?? 0})</h2>
          <ul className="mt-4 divide-y text-sm">
            {(reports ?? []).map((r) => {
              const q = r.questions as { stem?: string } | null;
              return (
                <li key={r.id} className="py-3">
                  <Link href={`/content/questions/${r.question_id}`} className="font-medium text-blue-700 hover:underline">
                    {q?.stem ?? 'Question'}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {r.reason} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <ReportTriageActions reportId={r.id} questionId={r.question_id} />
                </li>
              );
            })}
            {!reports?.length ? <li className="py-3 text-slate-500">No open reports.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
