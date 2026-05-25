'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { AdminNav } from '@/components/admin-nav';

type PreviewRow = {
  exam_type_slug: string;
  subject_slug: string;
  topic_slug: string;
  stem: string;
  correct_choice: string;
  difficultyNum: number;
};

type ImportError = {
  rowNumber: number;
  field?: string;
  message: string;
};

type PreviewResponse = {
  rows: { rowNumber: number }[];
  valid: PreviewRow[];
  errors: ImportError[];
  preview: PreviewRow[];
};

export default function ContentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = useCallback(
    async (action: 'preview' | 'import') => {
      if (!file) return;
      setBusy(action);
      setError(null);
      setMessage(null);

      const form = new FormData();
      form.append('file', file);
      form.append('action', action);
      form.append('publish', publish ? 'true' : 'false');

      try {
        const res = await fetch('/api/content/import', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Request failed');

        if (action === 'preview') {
          setPreview(data as PreviewResponse);
        } else {
          setMessage(`Imported ${data.imported} question(s) as ${data.status}. Batch: ${data.batchId}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
      } finally {
        setBusy(null);
      }
    },
    [file, publish]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-4xl">
        <AdminNav />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">CSV question import</h1>
        <p className="mt-2 text-sm text-slate-600">
          Template: <code className="rounded bg-white px-1">templates/questions_import_v1.csv</code> — rows import as{' '}
          <strong>draft</strong> unless you check publish.
        </p>

        <div className="mt-8 space-y-6 rounded-xl border bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-slate-700">Upload CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-2 block w-full text-sm"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
                setMessage(null);
                setError(null);
              }}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
            Publish immediately (skip review queue — dev only)
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!file || busy !== null}
              onClick={() => runAction('preview')}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy === 'preview' ? 'Validating…' : 'Preview & validate'}
            </button>
            <button
              type="button"
              disabled={!file || busy !== null}
              onClick={() => runAction('import')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy === 'import' ? 'Importing…' : 'Confirm import'}
            </button>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
        </div>

        {preview ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">Validation summary</h2>
              <p className="mt-2 text-sm text-slate-600">
                {preview.rows.length} row(s) · {preview.valid.length} valid · {preview.errors.length} error(s)
              </p>
            </div>

            {preview.errors.length > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <h2 className="font-semibold text-red-800">Errors</h2>
                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm text-red-700">
                  {preview.errors.map((err, i) => (
                    <li key={`${err.rowNumber}-${err.field}-${i}`}>
                      Row {err.rowNumber}
                      {err.field ? ` (${err.field})` : ''}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {preview.preview.length > 0 ? (
              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="font-semibold text-slate-900">Preview (first {preview.preview.length} valid rows)</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="py-2 pr-4">Exam</th>
                        <th className="py-2 pr-4">Topic</th>
                        <th className="py-2 pr-4">Stem</th>
                        <th className="py-2">Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((row, i) => (
                        <tr key={i} className="border-b align-top">
                          <td className="py-2 pr-4 whitespace-nowrap">{row.exam_type_slug}</td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            {row.subject_slug}/{row.topic_slug}
                          </td>
                          <td className="py-2 pr-4 max-w-md truncate">{row.stem}</td>
                          <td className="py-2">{row.correct_choice.toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
