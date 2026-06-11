'use client';

import { AdminCard, AdminShell } from '@/components/admin-shell';
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
    <AdminShell
      title="Publish Lesson or Cheat Sheet"
      description="Add rich review materials to the mobile Study Notes tab and the next offline pack download."
      maxWidth="max-w-4xl"
    >
      <AdminCard>
        <form onSubmit={submit} className="grid gap-5 md:grid-cols-3">
          <label className="block text-sm font-medium text-slate-700">
            Exam slug
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={examSlug} onChange={(e) => setExamSlug(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Subject slug
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={subjectSlug} onChange={(e) => setSubjectSlug(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Topic slug
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={topicSlug} onChange={(e) => setTopicSlug(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Type
            <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={materialType} onChange={(e) => setMaterialType(e.target.value as 'lesson' | 'cheat_sheet')}>
              <option value="lesson">Lesson</option>
              <option value="cheat_sheet">Cheat sheet</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Title
            <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-3">
            Body
            <textarea className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" rows={10} value={body} onChange={(e) => setBody(e.target.value)} required />
          </label>
          <button type="submit" disabled={busy} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50 md:col-span-3">
            {busy ? 'Publishing…' : 'Publish'}
          </button>
          {status ? <p className="text-sm text-slate-600 md:col-span-3">{status}</p> : null}
        </form>
      </AdminCard>
    </AdminShell>
  );
}
