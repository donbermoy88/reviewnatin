import { fetchContentChangelog, fetchMarketingAnnouncements } from '@/lib/supabase-content';

export async function UpdatesSection() {
  const [announcements, changelog] = await Promise.all([
    fetchMarketingAnnouncements(3),
    fetchContentChangelog(6),
  ]);

  if (!announcements.length && !changelog.length) {
    return null;
  }

  return (
    <section className="border-t border-[var(--rn-muted)]/20 px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-extrabold text-[var(--rn-text)]">
          Updates
        </h2>
        <p className="mt-2 text-sm text-[var(--rn-muted)]">Latest from ReviewNatin content & product.</p>

        {announcements.length > 0 ? (
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--rn-blue)]">Announcements</h3>
            {announcements.map((a) => (
              <article key={a.id} className="rounded-2xl border border-[var(--rn-muted)]/20 bg-white p-5">
                <h4 className="font-semibold text-[var(--rn-text)]">{a.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rn-muted)]">{a.body}</p>
                <time className="mt-3 block text-xs text-[var(--rn-muted)]">
                  {new Date(a.published_at).toLocaleDateString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </article>
            ))}
          </div>
        ) : null}

        {changelog.length > 0 ? (
          <div className="mt-10">
            <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--rn-blue)]">Content changelog</h3>
            <ul className="mt-4 space-y-3">
              {changelog.map((entry) => {
                const exam = entry.exam_types as { name?: string; slug?: string } | null;
                return (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-1 rounded-xl bg-[var(--rn-bg)] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-[var(--rn-text)]">{entry.title}</span>
                    <p className="text-xs text-[var(--rn-muted)] sm:max-w-md">{entry.body}</p>
                    <span className="text-xs text-[var(--rn-muted)]">
                      {exam?.name ?? 'All exams'} ·{' '}
                      {new Date(entry.published_at).toLocaleDateString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
