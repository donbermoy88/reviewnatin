'use client';

import { AdminCard, AdminShell, Field } from '@/components/admin-shell';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SchedulesAdminPage() {
  const router = useRouter();
  const [examSlug, setExamSlug] = useState('cse-professional');
  const [eventType, setEventType] = useState('examination');
  const [eventDate, setEventDate] = useState('');
  const [sourceUrl, setSourceUrl] = useState('https://www.csc.gov.ph');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setStatus('Schedule saved — visible in app Exam Calendar.');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Exam Schedule"
      description="Add or update official-style dates for the mobile Exam Calendar."
      maxWidth="max-w-2xl"
    >
      <AdminCard padding="lg">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Exam slug">
            <input className="field-input" value={examSlug} onChange={(e) => setExamSlug(e.target.value)} required />
          </Field>
          <Field label="Event type">
            <select className="field-input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="application_opens">Application opens</option>
              <option value="examination">Examination</option>
              <option value="results_release">Results release</option>
            </select>
          </Field>
          <Field label="Event date">
            <input
              type="date"
              className="field-input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Source URL">
            <input className="field-input" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className="field-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? 'Saving…' : 'Save schedule'}
            </button>
            {status ? <p className={`text-sm ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{status}</p> : null}
          </div>
        </form>
      </AdminCard>
    </AdminShell>
  );
}
