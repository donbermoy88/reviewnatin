'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { ACell, AIcon, ARow, ATable, EmptyState, ExamTag, FilterChip, ProgressBar, StatusBadge, T } from '@/components/admin-ui';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type ExamRow = { slug: string; name: string; active: boolean; questions: number; lessons: number; flashcards: number; mocks: number };

const TARGET = 3000;

export default function QuestionBankPage() {
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: exams, error: err } = await supabase.from('exam_types').select('slug, name, is_active').order('name');
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const out = await Promise.all(
        (exams ?? []).map(async (e: { slug: string; name: string; is_active: boolean }) => {
          const { data: counts } = await supabase.rpc('get_content_counts', { p_exam_slug: e.slug });
          const c = counts as { questions?: number; mock_exams?: number; lessons?: number; flashcards?: number } | null;
          return { slug: e.slug, name: e.name, active: e.is_active, questions: c?.questions ?? 0, lessons: c?.lessons ?? 0, flashcards: c?.flashcards ?? 0, mocks: c?.mock_exams ?? 0 };
        })
      );
      setRows(out);
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => {
    return rows.filter((r) => (exam === 'all' || r.slug === exam) && (query === '' || r.name.toLowerCase().includes(query.toLowerCase()) || r.slug.includes(query.toLowerCase())));
  }, [rows, exam, query]);

  const totalQuestions = rows.reduce((s, r) => s + r.questions, 0);

  return (
    <AdminShell
      title="Question bank"
      description="Catalog coverage across every exam track. Import or review questions to grow each track toward the 3,000-question target."
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterChip label="All exams" active={exam === 'all'} onClick={() => setExam('all')} />
        {rows.map((e) => <FilterChip key={e.slug} label={e.slug.toUpperCase()} active={exam === e.slug} onClick={() => setExam(e.slug)} />)}
        <span style={{ flex: 1 }} />
        <div style={{ position: 'relative', width: 240 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textLight, display: 'flex' }}><AIcon name="search" size={14} /></span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exams…" className="field-input" style={{ paddingLeft: 33, borderRadius: 999, fontSize: 12.5, padding: '8px 12px 8px 33px' }} />
        </div>
      </div>

      {error ? <p style={{ color: T.danger, fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow }}>
        {loading ? (
          <p style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>Loading catalog…</p>
        ) : visible.length === 0 ? (
          <EmptyState icon="question" title="No exams match" body="Try a different filter or search term." />
        ) : (
          <ATable columns={[{ label: 'Exam' }, { label: 'Questions', align: 'right' }, { label: 'Lessons', align: 'right' }, { label: 'Flashcards', align: 'right' }, { label: 'Mocks', align: 'right' }, { label: 'Coverage' }, { label: 'Status' }]}>
            {visible.map((e) => (
              <ARow key={e.slug}>
                <ACell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ExamTag slug={e.slug} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</span>
                  </div>
                </ACell>
                <ACell align="right"><span style={{ fontWeight: 700 }}>{e.questions.toLocaleString()}</span></ACell>
                <ACell align="right"><span style={{ color: T.textMuted }}>{e.lessons}</span></ACell>
                <ACell align="right"><span style={{ color: T.textMuted }}>{e.flashcards}</span></ACell>
                <ACell align="right"><span style={{ color: T.textMuted }}>{e.mocks}</span></ACell>
                <ACell><ProgressBar value={e.questions} target={TARGET} /></ACell>
                <ACell><StatusBadge status={e.active ? 'active' : 'draft'} label={e.active ? 'Live' : 'Coming soon'} /></ACell>
              </ARow>
            ))}
          </ATable>
        )}
      </div>
      <p style={{ fontSize: 12, color: T.textLight, marginTop: 12 }}>
        {loading ? 'Loading…' : `${totalQuestions.toLocaleString()} questions across ${rows.length} exam tracks · coverage target ${TARGET.toLocaleString()} per track.`}
      </p>
    </AdminShell>
  );
}
