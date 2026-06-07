'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AdminCard, AdminShell } from '@/components/admin-shell';

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
    // Defer to avoid synchronous setState chain inside the effect commit phase
    // (react-hooks/set-state-in-effect).
    queueMicrotask(() => { void load(); });
  }, [load]);

  const save = async (status?: QuestionDetail['status']) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/content/questions/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stem,
          explanationEn,
          explanationFil,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setMessage(status === 'published' ? 'Published.' : status ? `Status: ${status}` : 'Saved.');
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
      <AdminShell title="Edit Question" description="Loading the selected QA item." maxWidth="max-w-4xl">
        <AdminCard>
          <p className="text-slate-600">Loading question…</p>
        </AdminCard>
      </AdminShell>
    );
  }

  if (!question) {
    return (
      <AdminShell title="Edit Question" description="The selected question could not be loaded." maxWidth="max-w-4xl">
        <AdminCard>
          <p className="text-red-600">{error || 'Question not found.'}</p>
          <Link href="/content/review" className="mt-4 inline-block text-sm text-blue-600">
            ← Back to review queue
          </Link>
        </AdminCard>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Edit Question"
      description={`${question.examSlug} · ${question.subjectName}/${question.topicName} · ${question.status}`}
      maxWidth="max-w-4xl"
      actions={
        <Link href="/content/review" className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-sm">
          Back to QA queue
        </Link>
      }
    >
        <AdminCard className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">Stem</label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
              rows={4}
              value={stem}
              onChange={(e) => setStem(e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">Choices</p>
            <ul className="mt-2 space-y-2 text-sm">
              {question.choices.map((c) => (
                <li
                  key={c.id}
                  className={`rounded-2xl border px-4 py-3 ${c.id === question.correctChoiceId ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50'}`}
                >
                  <span className="font-medium uppercase">{c.id}.</span> {c.text}
                  {c.id === question.correctChoiceId ? (
                    <span className="ml-2 text-xs text-green-700">correct</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Explanation (EN)</label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
              rows={4}
              value={explanationEn}
              onChange={(e) => setExplanationEn(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Explanation (TL)</label>
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm"
              rows={4}
              value={explanationFil}
              onChange={(e) => setExplanationFil(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => save()}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save('in_review')}
              className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-black text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Mark in review
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => save('published')}
              className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-black text-white hover:bg-green-700 disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </AdminCard>
    </AdminShell>
  );
}
