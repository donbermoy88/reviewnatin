'use client';

import { AdminCard, AdminShell, Field } from '@/components/admin-shell';
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
  const [ok, setOk] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/content/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSlug, subjectSlug, topicSlug, title, materialBody: body, materialType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setTitle('');
      setBody('');
      setOk(true);
      setStatus(`Published material ${data.id}`);
      router.refresh();
    } catch (err) {
      setOk(false);
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
      <AdminCard padding="lg">
        <form onSubmit={submit} className="grid gap-5 md:grid-cols-3">
          <Field label="Exam slug">
            <input className="field-input" value={examSlug} onChange={(e) => setExamSlug(e.target.value)} required />
          </Field>
          <Field label="Subject slug">
            <input className="field-input" value={subjectSlug} onChange={(e) => setSubjectSlug(e.target.value)} required />
          </Field>
          <Field label="Topic slug">
            <input className="field-input" value={topicSlug} onChange={(e) => setTopicSlug(e.target.value)} required />
          </Field>
          <Field label="Type">
            <select
              className="field-input"
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value as 'lesson' | 'cheat_sheet')}
            >
              <option value="lesson">Lesson</option>
              <option value="cheat_sheet">Cheat sheet</option>
            </select>
          </Field>
          <Field label="Title" className="md:col-span-2">
            <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Body" className="md:col-span-3">
            <textarea className="field-input" rows={10} value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          <div className="flex items-center gap-4 md:col-span-3">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? 'Publishing…' : 'Publish material'}
            </button>
            {status ? (
              <p className={`text-sm ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{status}</p>
            ) : null}
          </div>
        </form>
      </AdminCard>
    </AdminShell>
  );
}
