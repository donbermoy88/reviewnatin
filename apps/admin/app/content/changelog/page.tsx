'use client';

import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-xl">
        <AdminNav />
        <Link href="/" className="text-sm font-medium text-blue-600">
          ← Admin home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Publish content update</h1>
        <p className="mt-2 text-sm text-slate-600">Shows in mobile Settings → Content updates and reviewnatinph.com.</p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Body
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Exam slug (optional — leave blank for all exams)
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="cse-professional"
              value={examSlug}
              onChange={(e) => setExamSlug(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Publishing…' : 'Publish update'}
          </button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>
      </div>
    </div>
  );
}
