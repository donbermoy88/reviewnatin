'use client';

import { AdminCard, AdminShell, Field } from '@/components/admin-shell';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChangelogAdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [examSlug, setExamSlug] = useState('');
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState(false);
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
        setOk(false);
        setStatus(data.error ?? 'Failed to publish');
        return;
      }
      setTitle('');
      setBody('');
      setExamSlug('');
      setOk(true);
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
      maxWidth="max-w-2xl"
    >
      <AdminCard padding="lg">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Title">
            <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Body">
            <textarea className="field-input" rows={4} value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          <Field label="Exam slug" hint="Optional — leave blank for all exams.">
            <input
              className="field-input"
              placeholder="cse-professional"
              value={examSlug}
              onChange={(e) => setExamSlug(e.target.value)}
            />
          </Field>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? 'Publishing…' : 'Publish update'}
            </button>
            {status ? <p className={`text-sm ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{status}</p> : null}
          </div>
        </form>
      </AdminCard>
    </AdminShell>
  );
}
