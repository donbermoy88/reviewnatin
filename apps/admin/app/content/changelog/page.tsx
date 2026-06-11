'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin-shell';
import { ABtn, ACard, AInput, ATextarea, T } from '@/components/admin-ui';

export default function ChangelogAdminPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [examSlug, setExamSlug] = useState('');
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
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
      setStatus('Published — visible in the app content updates screen.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Content updates"
      description="Send release and content notes to the mobile Settings → Content updates screen and the marketing site."
      maxWidth="max-w-[680px]"
    >
      <ACard title="Publish a content update">
        <form onSubmit={(e) => { e.preventDefault(); void submit(); }} style={{ display: 'grid', gap: 14 }}>
          <AInput label="Title" value={title} onChange={setTitle} required />
          <ATextarea label="Body" value={body} onChange={setBody} rows={4} />
          <AInput label="Exam slug" value={examSlug} onChange={setExamSlug} placeholder="cse-professional" hint="Optional — leave blank for all exams." />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ABtn type="submit" icon="send" disabled={busy}>{busy ? 'Publishing…' : 'Publish update'}</ABtn>
            {status ? <p style={{ fontSize: 13, fontWeight: 600, color: ok ? T.success : T.danger }}>{status}</p> : null}
          </div>
        </form>
      </ACard>
    </AdminShell>
  );
}
