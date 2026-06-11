'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { ABtn, ACard, AIcon, ATextarea, ExamTag, StatusBadge, T } from '@/components/admin-ui';

type QuestionDetail = {
  id: string;
  stem: string;
  choices: { id: string; text: string }[];
  correctChoiceId: string;
  explanationEn: string | null;
  explanationFil: string | null;
  difficulty: number;
  status: string;
  isVerified: boolean;
  topicName?: string;
  subjectName?: string;
  examSlug?: string;
};

const DIFFICULTY_LABELS = ['—', 'Very easy', 'Easy', 'Medium', 'Hard', 'Very hard'];

export default function QuestionEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [stem, setStem] = useState('');
  const [explanationEn, setExplanationEn] = useState('');
  const [explanationFil, setExplanationFil] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/content/questions/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      const q = data.question as QuestionDetail;
      setQuestion(q);
      setStem(q.stem);
      setExplanationEn(q.explanationEn ?? '');
      setExplanationFil(q.explanationFil ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const save = async (status?: QuestionDetail['status']) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/content/questions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stem, explanationEn, explanationFil, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setMessage(status === 'published' ? 'Approved & published.' : status === 'archived' ? 'Rejected.' : status ? `Status set to ${status}.` : 'Saved.');
      await load();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell title="Question editor" description="Loading the selected QA item." maxWidth="max-w-[980px]">
        <ACard><p style={{ color: T.textMuted }}>Loading question…</p></ACard>
      </AdminShell>
    );
  }

  if (!question) {
    return (
      <AdminShell title="Question editor" description="The selected question could not be loaded." maxWidth="max-w-[980px]">
        <ACard>
          <p style={{ color: T.danger }}>{error || 'Question not found.'}</p>
          <div style={{ marginTop: 14 }}><Link href="/content/review" style={{ color: T.primary, fontWeight: 600, textDecoration: 'none' }}>← Back to review queue</Link></div>
        </ACard>
      </AdminShell>
    );
  }

  const explainLen = explanationEn.trim().length;
  const correctCount = question.choices.filter((c) => c.id === question.correctChoiceId).length;
  const checks = [
    { ok: correctCount === 1, label: 'Exactly one correct choice' },
    { ok: explainLen >= 80, label: 'Rationale present (≥ 80 chars)' },
    { ok: stem.trim().length > 0, label: 'Question stem is not empty' },
    { ok: question.choices.length >= 2, label: `Has answer choices (${question.choices.length})` },
  ];

  return (
    <AdminShell
      title={`Question ${question.id.slice(0, 8)}…`}
      description={`${question.examSlug ?? '—'} · ${question.subjectName ?? '—'} / ${question.topicName ?? '—'}`}
      maxWidth="max-w-[1100px]"
      actions={
        <>
          <ABtn variant="dangerSoft" icon="x" disabled={saving} onClick={() => save('archived')}>Reject</ABtn>
          <ABtn variant="secondary" disabled={saving} onClick={() => save('in_review')}>Mark in review</ABtn>
          <ABtn variant="success" icon="check" disabled={saving} onClick={() => save('published')}>Approve &amp; publish</ABtn>
        </>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12.5, color: T.textMuted }}>
        <Link href="/content/review" style={{ color: T.primary, fontWeight: 600, textDecoration: 'none' }}>Review queue</Link>
        <AIcon name="chevronRight" size={12} />
        <span>{question.id.slice(0, 8)}…</span>
      </div>

      <div className="rn-two-col" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <ACard title="Question stem">
            <ATextarea value={stem} onChange={setStem} rows={3} />
          </ACard>

          <ACard title="Answer choices" subtitle="The highlighted choice is the answer key">
            <div style={{ display: 'grid', gap: 10 }}>
              {question.choices.map((c) => {
                const correct = c.id === question.correctChoiceId;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${correct ? T.success : T.border}`, background: correct ? T.successBg : '#fff', borderRadius: 10, padding: '10px 14px' }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${correct ? T.success : T.borderStrong}`, background: correct ? T.success : '#fff', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {correct ? <AIcon name="check" size={10} color="#fff" strokeWidth={3} /> : null}
                    </span>
                    <span className="font-head" style={{ fontWeight: 800, fontSize: 13, color: correct ? T.success : T.textMuted, width: 16, textTransform: 'uppercase' }}>{c.id}</span>
                    <span style={{ flex: 1, fontSize: 13.5, color: T.text }}>{c.text}</span>
                    {correct ? <span style={{ fontSize: 11, fontWeight: 700, color: T.success, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Correct</span> : null}
                  </div>
                );
              })}
            </div>
          </ACard>

          <ACard title="Rationale (English)" subtitle="Shown to learners after answering">
            <ATextarea value={explanationEn} onChange={setExplanationEn} rows={4} />
          </ACard>
          <ACard title="Rationale (Tagalog)" subtitle="Optional translation">
            <ATextarea value={explanationFil} onChange={setExplanationFil} rows={4} />
          </ACard>

          {error ? <p style={{ color: T.danger, fontSize: 13 }}>{error}</p> : null}
          {message ? <p style={{ color: T.success, fontSize: 13, fontWeight: 600 }}>{message}</p> : null}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ABtn variant="primary" disabled={saving} onClick={() => save()}>{saving ? 'Saving…' : 'Save changes'}</ABtn>
            <ABtn variant="secondary" disabled={saving} onClick={() => save('in_review')}>Save &amp; mark in review</ABtn>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <ACard title="Status" padding={18}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <StatusBadge status={question.status} />
              {question.isVerified ? <StatusBadge status="verified" /> : null}
              {question.examSlug ? <ExamTag slug={question.examSlug} /> : null}
              <span style={{ background: '#eef1f7', color: T.textMuted, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{DIFFICULTY_LABELS[question.difficulty] ?? `Difficulty ${question.difficulty}`}</span>
            </div>
          </ACard>

          <ACard title="Quality checks" padding={18}>
            <div style={{ display: 'grid', gap: 10, fontSize: 12.5 }}>
              {checks.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, color: c.ok ? T.text : T.textMuted }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.ok ? T.successBg : T.warnBg, color: c.ok ? T.success : T.warn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AIcon name={c.ok ? 'check' : 'clock'} size={11} />
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          </ACard>

          <ACard title="Classification" padding={18}>
            <div style={{ display: 'grid', gap: 10, fontSize: 12.5 }}>
              <Row label="Exam" value={question.examSlug ?? '—'} />
              <Row label="Subject" value={question.subjectName ?? '—'} />
              <Row label="Topic" value={question.topicName ?? '—'} />
              <Row label="Choices" value={String(question.choices.length)} />
            </div>
          </ACard>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: T.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600, color: T.text, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
