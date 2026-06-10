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
        <code className="rounded-md bg-[var(--surface-sunken)] px-3 py-2 text-xs text-[var(--text-muted)]">
          templates/questions_import_v1.csv
        </code>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetric label="Step 1" value="Upload" detail="CSV template" />
        <AdminMetric label="Step 2" value="Validate" detail="Schema + metadata" tone="amber" />
        <AdminMetric label="Step 3" value="Preview" detail="Errors blocked" tone="slate" />
        <AdminMetric label="Step 4" value="Import" detail={publish ? 'Publish mode' : 'Draft mode'} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <AdminCard className="space-y-5" padding="lg">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">Batch controls</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--text)]">Upload and validate</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              Rows import as <strong className="font-semibold text-[var(--text)]">draft</strong> unless publish is enabled for a controlled admin release.
            </p>
          </div>
          <div>
            <span className="field-label">Upload CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="block w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 py-2.5 text-sm text-[var(--text-muted)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--primary-hover)]"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setPreview(null);
                setMessage(null);
                setError(null);
              }}
            />
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-[var(--warning-soft)] p-4 text-sm text-amber-900">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="mt-0.5 size-4 accent-[var(--primary)]" />
            <span>
              <span className="block font-semibold">Publish immediately</span>
              <span className="text-amber-700">Skips the review queue. Use only for verified dev/admin batches.</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={!file || busy !== null} onClick={() => runAction('preview')} className="btn btn-secondary">
              {busy === 'preview' ? 'Validating…' : 'Preview & validate'}
            </button>
            <button type="button" disabled={!canImport} onClick={() => runAction('import')} className="btn btn-primary">
              {busy === 'import' ? 'Importing…' : 'Confirm import'}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Preview validation must pass before importing. This keeps malformed CSV rows out of the review queue.
          </p>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        </AdminCard>

        <AdminCard variant="dark" padding="lg">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-300">Mobile app safety</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Import checks before users see content</h2>
          <div className="mt-4 grid gap-2.5 text-sm leading-6 text-slate-300 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">Exam, subject, and topic slugs must map to the Supabase catalog.</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">Malformed answer keys are blocked before practice or mock exam use.</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">Error CSV export gives reviewers exact rows to correct.</div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3.5">Draft mode keeps fresh batches out of production until reviewed.</div>
          </div>
        </AdminCard>
      </div>

        {preview ? (
          <div className="mt-8 space-y-6">
            <AdminCard>
              <h2 className="text-base font-semibold text-[var(--text)]">Validation summary</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Rows</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text)]">{preview.rows.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-[var(--success-soft)] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Valid</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-800">{preview.valid.length}</p>
                </div>
                <div className="rounded-lg border border-red-100 bg-[var(--danger-soft)] p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-red-700">Errors</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-red-800">{preview.errors.length}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-[var(--primary-soft)] p-3">
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
                    className="btn btn-sm border border-red-300 bg-white text-red-700 hover:bg-red-50"
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
                <h2 className="text-base font-semibold text-[var(--text)]">Preview (first {preview.preview.length} valid rows)</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        <th className="py-2 pr-4">Exam</th>
                        <th className="py-2 pr-4">Topic</th>
                        <th className="py-2 pr-4">Stem</th>
                        <th className="py-2">Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.map((row, i) => (
                        <tr key={i} className="border-b border-[var(--border)] align-top last:border-0">
                          <td className="py-2 pr-4 whitespace-nowrap text-[var(--text-muted)]">{row.exam_type_slug}</td>
                          <td className="py-2 pr-4 whitespace-nowrap text-[var(--text-muted)]">
                            {row.subject_slug}/{row.topic_slug}
                          </td>
                          <td className="py-2 pr-4 max-w-md truncate text-[var(--text)]">{row.stem}</td>
                          <td className="py-2 font-medium text-[var(--text)]">{row.correct_choice.toUpperCase()}</td>
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
