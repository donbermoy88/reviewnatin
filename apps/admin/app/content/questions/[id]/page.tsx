'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminCard, AdminShell, Badge } from '@/components/admin-shell';

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
  topicSlug?: string;
  topicName?: string;
  subjectSlug?: string;
  subjectName?: string;
  examSlug?: string;
  examName?: string;
};

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
    queueMicrotask(() => {
      void load();
    });
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
      setMessage(status === 'published' ? 'Published.' : status ? `Status set to ${status}.` : 'Saved.');
      await load();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const backLink = (
    <Link href="/content/review" className="btn btn-secondary">
      ← Back to review queue
    </Link>
  );

  if (loading) {
    return (
      <AdminShell title="Edit Question" description="Loading the selected QA item." maxWidth="max-w-3xl">
        <AdminCard padding="lg">
          <p className="text-[var(--text-muted)]">Loading question…</p>
        </AdminCard>
      </AdminShell>
    );
  }

  if (!question) {
    return (
      <AdminShell title="Edit Question" description="The selected question could not be loaded." maxWidth="max-w-3xl">
        <AdminCard padding="lg">
          <p className="text-red-600">{error || 'Question not found.'}</p>
          <div className="mt-4">{backLink}</div>
        </AdminCard>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Edit Question"
      description={`${question.examSlug ?? '—'} · ${question.subjectName ?? '—'}/${question.topicName ?? '—'}`}
      maxWidth="max-w-3xl"
      actions={backLink}
    >
      <AdminCard padding="lg" className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={question.status === 'published' ? 'green' : question.status === 'in_review' ? 'amber' : 'neutral'}>
            {question.status}
          </Badge>
          {question.isVerified ? <Badge tone="blue">verified</Badge> : null}
          <Badge tone="neutral">difficulty {question.difficulty}</Badge>
        </div>

        <label className="block">
          <span className="field-label">Stem</span>
          <textarea className="field-input" rows={4} value={stem} onChange={(e) => setStem(e.target.value)} />
        </label>

        <div>
          <p className="field-label">Choices</p>
          <ul className="space-y-2 text-sm">
            {question.choices.map((c) => {
              const correct = c.id === question.correctChoiceId;
              return (
                <li
                  key={c.id}
                  className={`flex items-start gap-2 rounded-lg border px-4 py-3 ${
                    correct ? 'border-emerald-300 bg-[var(--success-soft)]' : 'border-[var(--border)] bg-[var(--surface-muted)]'
                  }`}
                >
                  <span className="font-semibold uppercase text-[var(--text-muted)]">{c.id}.</span>
                  <span className="flex-1 text-[var(--text)]">{c.text}</span>
                  {correct ? <Badge tone="green">correct</Badge> : null}
                </li>
              );
            })}
          </ul>
        </div>

        <label className="block">
          <span className="field-label">Explanation (EN)</span>
          <textarea
            className="field-input"
            rows={4}
            value={explanationEn}
            onChange={(e) => setExplanationEn(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="field-label">Explanation (TL)</span>
          <textarea
            className="field-input"
            rows={4}
            value={explanationFil}
            onChange={(e) => setExplanationFil(e.target.value)}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-5">
          <button type="button" disabled={saving} onClick={() => save()} className="btn btn-primary">
            Save draft
          </button>
          <button type="button" disabled={saving} onClick={() => save('in_review')} className="btn btn-secondary">
            Mark in review
          </button>
          <button type="button" disabled={saving} onClick={() => save('published')} className="btn btn-success">
            Publish
          </button>
        </div>
      </AdminCard>
    </AdminShell>
  );
}
