import { evaluateContentGate, type ExamSlug } from '@reviewnatin/shared';
import { fetchContentCounts } from '@/lib/supabase-content';

const FEATURED_SLUGS: ExamSlug[] = ['cse-professional', 'let-elementary', 'pnle'];

export async function ContentCountsStrip() {
  const rows = await Promise.all(
    FEATURED_SLUGS.map(async (slug) => {
      const counts = await fetchContentCounts(slug);
      const gate = counts
        ? evaluateContentGate(slug, {
            questions: counts.questions,
            mockExams: counts.mockExams,
          })
        : null;
      return { slug, counts, gate };
    })
  );

  const hasData = rows.some((r) => r.counts && r.counts.questions > 0);
  if (!hasData) return null;

  const totalQuestions = rows.reduce((sum, r) => sum + (r.counts?.questions ?? 0), 0);
  const totalMocks = rows.reduce((sum, r) => sum + (r.counts?.mockExams ?? 0), 0);

  return (
    <section className="border-y border-[var(--rn-blue)]/10 bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-[var(--rn-muted)]">
          Live content library
        </p>
        <p className="mt-2 text-center font-[family-name:var(--font-syne)] text-2xl font-extrabold text-[var(--rn-text)]">
          {totalQuestions.toLocaleString()}+ verified questions · {totalMocks} mock exams
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {rows.map(({ slug, counts, gate }) => {
            if (!counts) return null;
            const label =
              slug === 'cse-professional'
                ? 'CSE Professional'
                : slug === 'let-elementary'
                  ? 'LET Elementary'
                  : 'PNLE';
            return (
              <div
                key={slug}
                className="rounded-xl border border-[var(--rn-bg)] bg-[var(--rn-bg)] px-4 py-3 text-center"
              >
                <p className="text-sm font-bold text-[var(--rn-blue)]">{label}</p>
                <p className="mt-1 text-xs text-[var(--rn-muted)]">
                  {counts.questions.toLocaleString()} Q · {counts.mockExams} mocks
                  {gate ? ` · ${gate.questionPct}% to launch min` : ''}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
