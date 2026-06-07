'use client';

import { AdminCard, AdminShell } from '@/components/admin-shell';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChangelogAdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [examSlug, setExamSlug] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/content/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, examSlug: examSlug || null }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? 'Failed to publish');
        return;
      }
      setTitle('');
      setBody('');
      setExamSlug('');
      setStatus('Published — visible in app Content updates + marketing site.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Publish Content Update"
      description="Send release and content notes to the mobile Settings content updates screen and the marketing site."
      maxWidth="max-w-3xl"
    >
      <AdminCard>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Body
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Exam slug (optional — leave blank for all exams)
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              placeholder="cse-professional"
              value={examSlug}
              onChange={(e) => setExamSlug(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {busy ? 'Publishing…' : 'Publish update'}
          </button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>
      </AdminCard>
    </AdminShell>
  );
}
