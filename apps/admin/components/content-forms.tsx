'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ABtn, AInput, ASelect, ATextarea, T } from '@/components/admin-ui';

function Status({ ok, text }: { ok: boolean; text: string }) {
  if (!text) return null;
  return <p style={{ fontSize: 13, fontWeight: 600, color: ok ? T.success : T.danger }}>{text}</p>;
}

export function MaterialForm() {
  const router = useRouter();
  const [examSlug, setExamSlug] = useState('cse-professional');
  const [subjectSlug, setSubjectSlug] = useState('verbal');
  const [topicSlug, setTopicSlug] = useState('verbal-comprehension');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [materialType, setMaterialType] = useState('lesson');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async () => {
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
      setStatus(`Published material ${data.id ?? ''}`.trim());
      router.refresh();
    } catch (err) {
      setOk(false);
      setStatus(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <AInput label="Exam slug" value={examSlug} onChange={setExamSlug} required />
        <AInput label="Subject slug" value={subjectSlug} onChange={setSubjectSlug} required />
        <AInput label="Topic slug" value={topicSlug} onChange={setTopicSlug} required />
        <ASelect label="Type" value={materialType} onChange={setMaterialType} options={[{ value: 'lesson', label: 'Lesson' }, { value: 'cheat_sheet', label: 'Cheat sheet' }]} />
      </div>
      <AInput label="Title" value={title} onChange={setTitle} required />
      <ATextarea label="Body (Markdown)" value={body} onChange={setBody} rows={8} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ABtn type="submit" icon="upload" disabled={busy}>{busy ? 'Publishing…' : 'Publish material'}</ABtn>
        <Status ok={ok} text={status} />
      </div>
    </form>
  );
}

export function ScheduleForm() {
  const router = useRouter();
  const [examSlug, setExamSlug] = useState('cse-professional');
  const [eventType, setEventType] = useState('exam_date');
  const [eventDate, setEventDate] = useState('');
  const [sourceUrl, setSourceUrl] = useState('https://www.csc.gov.ph');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async () => {
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/content/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examSlug, eventType, eventDate, sourceUrl, notes }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setOk(false);
        setStatus(data.error ?? 'Failed to save');
        return;
      }
      setEventDate('');
      setNotes('');
      setOk(true);
      setStatus('Schedule saved — visible in the app exam calendar.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <AInput label="Exam slug" value={examSlug} onChange={setExamSlug} required />
        <ASelect label="Event type" value={eventType} onChange={setEventType} options={[
          { value: 'application_open', label: 'Application opens' },
          { value: 'application_close', label: 'Registration closes' },
          { value: 'exam_date', label: 'Exam day' },
          { value: 'results_release', label: 'Results release' },
        ]} />
        <AInput label="Event date" type="date" value={eventDate} onChange={setEventDate} required />
      </div>
      <AInput label="Source URL" value={sourceUrl} onChange={setSourceUrl} />
      <ATextarea label="Notes" value={notes} onChange={setNotes} rows={2} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ABtn type="submit" icon="plus" disabled={busy}>{busy ? 'Saving…' : 'Save schedule'}</ABtn>
        <Status ok={ok} text={status} />
      </div>
    </form>
  );
}

export function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [examSlug, setExamSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async () => {
    setBusy(true);
    setStatus('');
    try {
      const res = await fetch('/api/content/announcements', {
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
      setStatus('Published — visible in app Home + marketing site.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); void submit(); }} style={{ display: 'grid', gap: 14 }}>
      <AInput label="Title" value={title} onChange={setTitle} required />
      <ATextarea label="Body" value={body} onChange={setBody} rows={4} />
      <AInput label="Exam slug" value={examSlug} onChange={setExamSlug} placeholder="cse-professional" hint="Optional — leave blank to target all exams." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <ABtn type="submit" icon="send" disabled={busy}>{busy ? 'Publishing…' : 'Publish announcement'}</ABtn>
        <Status ok={ok} text={status} />
      </div>
    </form>
  );
}
