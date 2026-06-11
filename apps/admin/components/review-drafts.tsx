'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ABtn, ACell, ARow, ATable, Avatar, EmptyState, ExamTag, FilterChip, StatusBadge, T } from '@/components/admin-ui';

export type DraftRow = {
  id: string;
  stem: string;
  examSlug: string;
  subject: string;
  topic: string;
  status: string;
  age: string;
};

export function DraftsReview({ drafts }: { drafts: DraftRow[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string[]>([]);
  const [exam, setExam] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const exams = useMemo(() => Array.from(new Set(drafts.map((d) => d.examSlug).filter(Boolean))), [drafts]);
  const rows = useMemo(() => (exam === 'all' ? drafts : drafts.filter((d) => d.examSlug === exam)), [drafts, exam]);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const setStatus = async (ids: string[], status: 'published' | 'archived') => {
    setBusy(true);
    setError('');
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/content/questions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed) setError(`${failed} update(s) failed.`);
      setSel([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <FilterChip label="All exams" active={exam === 'all'} onClick={() => setExam('all')} />
        {exams.map((e) => (
          <FilterChip key={e} label={e} active={exam === e} onClick={() => setExam(e)} />
        ))}
      </div>

      {sel.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.navy, color: '#fff', borderRadius: 10, padding: '10px 16px', marginBottom: 12, fontSize: 13 }}>
          <span style={{ fontWeight: 700 }}>{sel.length} selected</span>
          <span style={{ flex: 1 }} />
          <ABtn size="sm" variant="success" icon="check" disabled={busy} onClick={() => setStatus(sel, 'published')}>Approve &amp; publish</ABtn>
          <ABtn size="sm" variant="dangerSoft" icon="x" disabled={busy} onClick={() => setStatus(sel, 'archived')}>Reject</ABtn>
          <ABtn size="sm" variant="ghost" style={{ color: 'rgba(255,255,255,0.8)' }} onClick={() => setSel([])}>Clear</ABtn>
        </div>
      )}

      {error ? <p style={{ color: T.danger, fontSize: 12.5, marginBottom: 10 }}>{error}</p> : null}

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow }}>
        {rows.length === 0 ? (
          <EmptyState icon="check" title="Queue is clear" body="No drafts awaiting review for this filter." />
        ) : (
          <>
            <ATable columns={[{ label: '', width: 36 }, { label: 'Question' }, { label: 'Exam' }, { label: 'Subject · Topic' }, { label: 'Status' }, { label: 'Age', align: 'right' }, { label: '', width: 96 }]}>
              {rows.map((q) => (
                <ARow key={q.id} selected={sel.includes(q.id)} onClick={() => router.push(`/content/questions/${q.id}`)}>
                  <ACell>
                    <input type="checkbox" checked={sel.includes(q.id)} onChange={() => toggle(q.id)} onClick={(e) => e.stopPropagation()} style={{ width: 15, height: 15, accentColor: T.primary, cursor: 'pointer' }} />
                  </ACell>
                  <ACell>
                    <div style={{ fontWeight: 600, maxWidth: 420, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.stem}</div>
                    <div style={{ fontSize: 11.5, color: T.textLight, marginTop: 3 }}>{q.id.slice(0, 8)}…</div>
                  </ACell>
                  <ACell>{q.examSlug ? <ExamTag slug={q.examSlug} /> : <span style={{ color: T.textLight }}>—</span>}</ACell>
                  <ACell><span style={{ color: T.textMuted, fontSize: 12.5 }}>{q.subject}{q.topic ? ` · ${q.topic}` : ''}</span></ACell>
                  <ACell><StatusBadge status={q.status} /></ACell>
                  <ACell align="right"><span style={{ color: T.textMuted, fontSize: 12.5 }}>{q.age}</span></ACell>
                  <ACell align="right">
                    <span style={{ display: 'inline-flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <ABtn size="sm" variant="success" icon="check" title="Approve & publish" disabled={busy} onClick={() => setStatus([q.id], 'published')} />
                      <ABtn size="sm" variant="dangerSoft" icon="x" title="Reject" disabled={busy} onClick={() => setStatus([q.id], 'archived')} />
                    </span>
                  </ACell>
                </ARow>
              ))}
            </ATable>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', fontSize: 12.5, color: T.textMuted }}>
              <span>Showing {rows.length} draft{rows.length === 1 ? '' : 's'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Avatar name="QA" size={20} color={T.gold} /> Click a row to open the editor
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
