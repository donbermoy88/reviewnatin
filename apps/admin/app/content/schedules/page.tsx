'use client';

import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-xl">
        <AdminNav />
        <Link href="/" className="text-sm font-medium text-blue-600">
          ← Admin home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Exam schedule</h1>
        <p className="mt-2 text-sm text-slate-600">Add or update official-style dates for the mobile Exam Calendar.</p>

        <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">
            Exam slug
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={examSlug}
              onChange={(e) => setExamSlug(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Event type
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2"
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
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Source URL
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save schedule'}
          </button>
          {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        </form>
      </div>
    </div>
  );
}
