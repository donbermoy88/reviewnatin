'use client';

import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MaterialsAdminPage() {
  const router = useRouter();
  const [examSlug, setExamSlug] = useState('cse-professional');
  const [subjectSlug, setSubjectSlug] = useState('verbal');
  const [topicSlug, setTopicSlug] = useState('verbal-comprehension');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [materialType, setMaterialType] = useState<'lesson' | 'cheat_sheet'>('lesson');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/content/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examSlug,
          subjectSlug,
          topicSlug,
          title,
          materialBody: body,
          materialType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setTitle('');
      setBody('');
      setStatus(`Published material ${data.id}`);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed');
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
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Publish lesson / cheat sheet</h1>
        <p className="mt-2 text-sm text-slate-600">Adds to Study → Notes tab and offline pack on next download.</p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Exam slug
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={examSlug} onChange={(e) => setExamSlug(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Subject slug
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={subjectSlug} onChange={(e) => setSubjectSlug(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Topic slug
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={topicSlug} onChange={(e) => setTopicSlug(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Type
            <select className="mt-1 w-full rounded-lg border px-3 py-2" value={materialType} onChange={(e) => setMaterialType(e.target.value as 'lesson' | 'cheat_sheet')}>
              <option value="lesson">Lesson</option>
              <option value="cheat_sheet">Cheat sheet</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Title
            <input className="mt-1 w-full rounded-lg border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Body
            <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={8} value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Publishing…' : 'Publish'}
          </button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>
      </div>
    </div>
  );
}
