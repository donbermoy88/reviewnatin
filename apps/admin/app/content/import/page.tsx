'use client';

import { useCallback, useState } from 'react';
import { AdminCard, AdminMetric, AdminShell } from '@/components/admin-shell';

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

type ImportErrorSummary = {
  field: string;
  count: number;
};

type PreviewResponse = {
  rows: { rowNumber: number }[];
  valid: PreviewRow[];
  errors: ImportError[];
  errorCsv: string;
  errorSummary: ImportErrorSummary[];
  preview: PreviewRow[];
};

export default function ContentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canImport = Boolean(file && preview && preview.errors.length === 0 && preview.valid.length > 0 && busy === null);
  const previewHasErrors = Boolean(preview?.errors.length);
  const visibleErrors = preview?.errors.slice(0, 100) ?? [];

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

  function downloadErrorCsv() {
    if (!preview?.errorCsv) return;

    const baseName = file?.name.replace(/\.csv$/i, '') || 'question-import';
    const blob = new Blob([preview.errorCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.errors.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminShell
      title="CSV Question Import"
      description="Validate and stage new question batches for ReviewNatin mobile exams without letting malformed rows reach the review queue."
      actions={
        <code className="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700 shadow-sm">
          templates/questions_import_v1.csv
        </code>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <AdminMetric label="Step 1" value="Upload" detail="CSV template" />
        <AdminMetric label="Step 2" value="Validate" detail="Schema + metadata" tone="amber" />
        <AdminMetric label="Step 3" value="Preview" detail="Errors blocked" tone="slate" />
        <AdminMetric label="Step 4" value="Import" detail={publish ? 'Publish mode' : 'Draft mode'} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <AdminCard className="space-y-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Batch Controls</p>
            <h2 className="mt-2 text-2xl font-black text-[#08183f]">Upload and validate</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Rows import as <strong>draft</strong> unless publish is enabled for a controlled admin release.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Upload CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-2 block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-black file:text-white"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
                setMessage(null);
                setError(null);
              }}
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="size-4" />
            <span>
              <span className="block font-black">Publish immediately</span>
              <span className="text-amber-800">Skip review queue. Use only for verified dev/admin batches.</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!file || busy !== null}
              onClick={() => runAction('preview')}
              className="rounded-2xl bg-[#08183f] px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/10 disabled:opacity-50"
            >
              {busy === 'preview' ? 'Validating…' : 'Preview & validate'}
            </button>
            <button
              type="button"
              disabled={!canImport}
              onClick={() => runAction('import')}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {busy === 'import' ? 'Importing…' : 'Confirm import'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Preview validation must pass before importing. This keeps malformed CSV rows out of the review queue.
          </p>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-green-700">{message}</p> : null}
        </AdminCard>

        <AdminCard className="bg-[#08183f] text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200">Mobile App Safety</p>
          <h2 className="mt-2 text-2xl font-black">Import checks before users see content</h2>
          <div className="mt-5 grid gap-3 text-sm leading-6 text-blue-50 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">Exam, subject, and topic slugs must map to the Supabase catalog.</div>
            <div className="rounded-2xl bg-white/10 p-4">Malformed answer keys are blocked before practice or mock exam use.</div>
            <div className="rounded-2xl bg-white/10 p-4">Error CSV export gives reviewers exact rows to correct.</div>
            <div className="rounded-2xl bg-white/10 p-4">Draft mode keeps fresh batches out of production until reviewed.</div>
          </div>
        </AdminCard>
      </div>

        {preview ? (
          <div className="mt-8 space-y-6">
            <AdminCard>
              <h2 className="text-xl font-black text-[#08183f]">Validation summary</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rows</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{preview.rows.length}</p>
                </div>
                <div className="rounded-lg border bg-green-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-green-700">Valid</p>
                  <p className="mt-1 text-2xl font-bold text-green-800">{preview.valid.length}</p>
                </div>
                <div className="rounded-lg border bg-red-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-red-700">Errors</p>
                  <p className="mt-1 text-2xl font-bold text-red-800">{preview.errors.length}</p>
                </div>
                <div className="rounded-lg border bg-blue-50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Import status</p>
                  <p className="mt-2 text-sm font-semibold text-blue-900">
                    {previewHasErrors ? 'Blocked' : publish ? 'Ready to publish' : 'Ready as draft'}
                  </p>
                </div>
              </div>
            </AdminCard>

            {preview.errors.length > 0 ? (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 shadow-lg shadow-red-950/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-red-800">Errors</h2>
                    <p className="mt-1 text-sm text-red-700">
                      Import is blocked until these rows are corrected and preview validation passes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadErrorCsv}
                    className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Download .errors.csv
                  </button>
                </div>

                {preview.errorSummary.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {preview.errorSummary.map((item) => (
                      <span
                        key={item.field}
                        className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-700"
                      >
                        {item.field}: {item.count}
                      </span>
                    ))}
                  </div>
                ) : null}

                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm text-red-700">
                  {visibleErrors.map((err, i) => (
                    <li key={`${err.rowNumber}-${err.field}-${i}`}>
                      Row {err.rowNumber}
                      {err.field ? ` (${err.field})` : ''}: {err.message}
                    </li>
                  ))}
                </ul>
                {preview.errors.length > visibleErrors.length ? (
                  <p className="mt-3 text-xs text-red-700">
                    Showing first {visibleErrors.length} errors. Download the CSV for all {preview.errors.length}.
                  </p>
                ) : null}
              </div>
            ) : null}

            {preview.preview.length > 0 ? (
              <AdminCard>
                <h2 className="text-xl font-black text-[#08183f]">Preview (first {preview.preview.length} valid rows)</h2>
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
              </AdminCard>
            ) : null}
          </div>
        ) : null}
    </AdminShell>
  );
}
