'use client';

import { AdminCard, AdminShell } from '@/components/admin-shell';
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
        setStatus(data.error ?? 'Failed to save');
        return;
      }
      setEventDate('');
      setNotes('');
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
      maxWidth="max-w-3xl"
    >
      <AdminCard>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">
            Exam slug
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              value={examSlug}
              onChange={(e) => setExamSlug(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Event type
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="application_opens">Application opens</option>
              <option value="examination">Examination</option>
              <option value="results_release">Results release</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Event date
            <input
              type="date"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Source URL
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save schedule'}
          </button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>
      </AdminCard>
    </AdminShell>
  );
}
