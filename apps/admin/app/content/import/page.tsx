'use client';

import { useCallback, useRef, useState } from 'react';
import { AdminShell } from '@/components/admin-shell';
import { ABtn, ACard, ACell, AIcon, ARow, ATable, T } from '@/components/admin-ui';

type PreviewRow = { exam_type_slug: string; subject_slug: string; topic_slug: string; stem: string; correct_choice: string; difficultyNum: number };
type ImportError = { rowNumber: number; field?: string; message: string };
type ImportErrorSummary = { field: string; count: number };
type PreviewResponse = { rows: { rowNumber: number }[]; valid: PreviewRow[]; errors: ImportError[]; errorCsv: string; errorSummary: ImportErrorSummary[]; preview: PreviewRow[] };

function Stepper({ stage }: { stage: 'upload' | 'preview' }) {
  const steps = ['Upload CSV', 'Validate & preview', 'Import as drafts'];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20 }}>
      {steps.map((s, i) => {
        const active = (stage === 'upload' && i === 0) || (stage === 'preview' && i === 1);
        const done = stage === 'preview' && i === 0;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 9, paddingRight: 18 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: done ? T.success : active ? T.primary : '#e6eaf4', color: done || active ? '#fff' : T.textMuted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700 }}>
              {done ? <AIcon name="check" size={12} /> : i + 1}
            </span>
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.text : T.textMuted }}>{s}</span>
            {i < steps.length - 1 ? <span style={{ width: 36, height: 1.5, background: T.border, marginLeft: 16 }} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export default function ContentImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const canImport = Boolean(file && preview && preview.errors.length === 0 && preview.valid.length > 0 && busy === null);
  const visibleErrors = preview?.errors.slice(0, 100) ?? [];

  const pick = (f: File | null) => {
    setFile(f);
    setPreview(null);
    setMessage(null);
    setError(null);
  };

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
        if (action === 'preview') setPreview(data as PreviewResponse);
        else setMessage(`Imported ${data.imported} question(s) as ${data.status}. Batch: ${data.batchId}`);
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

  const stage: 'upload' | 'preview' = preview ? 'preview' : 'upload';

  const summary = preview
    ? [
        { n: preview.rows.length, label: 'rows parsed', color: T.text, bg: '#eef1f7' },
        { n: preview.valid.length, label: 'valid rows', color: T.success, bg: T.successBg },
        { n: preview.errors.length, label: 'validation errors', color: T.danger, bg: T.dangerBg },
        { n: publish ? 'Publish' : 'Draft', label: 'import mode', color: T.primary, bg: T.infoBg },
      ]
    : [];

  return (
    <AdminShell
      title="Import questions"
      description="Bulk-load draft questions from the CSV template. Rows are validated against the exam catalog and answer-key rules before anything reaches the review queue."
      maxWidth="max-w-[980px]"
      actions={<code style={{ background: '#eef1f7', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: T.textMuted }}>questions_import_v1.csv</code>}
    >
      <Stepper stage={stage} />

      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />

      {stage === 'upload' ? (
        <ACard>
          <button type="button" onClick={() => inputRef.current?.click()}
            style={{ width: '100%', border: `2px dashed ${T.borderStrong}`, borderRadius: 12, background: '#fafbfe', padding: '48px 20px', cursor: 'pointer', textAlign: 'center' }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: T.infoBg, color: T.primary, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <AIcon name="upload" size={24} />
            </span>
            <div className="font-head" style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{file ? file.name : 'Choose your CSV, or click to browse'}</div>
            <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 6 }}>
              Uses template <code style={{ background: '#eef1f7', borderRadius: 4, padding: '1px 6px', fontSize: 11.5 }}>questions_import_v1.csv</code> · max 2,000 rows per batch
            </div>
          </button>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 16, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', background: publish ? T.warnBg : '#fff', cursor: 'pointer' }}>
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: T.primary }} />
            <span style={{ fontSize: 12.5 }}>
              <span style={{ display: 'block', fontWeight: 700, color: T.text }}>Publish immediately</span>
              <span style={{ color: T.textMuted }}>Skips the review queue. Use only for verified dev/admin batches.</span>
            </span>
          </label>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <ABtn variant="primary" icon="check" disabled={!file || busy !== null} onClick={() => runAction('preview')}>{busy === 'preview' ? 'Validating…' : 'Validate & preview'}</ABtn>
            {file ? <ABtn variant="ghost" onClick={() => pick(null)}>Clear</ABtn> : null}
          </div>
          {error ? <p style={{ color: T.danger, fontSize: 13, marginTop: 12 }}>{error}</p> : null}
          {message ? <p style={{ color: T.success, fontSize: 13, marginTop: 12, fontWeight: 600 }}>{message}</p> : null}
        </ACard>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {summary.map((s, i) => (
              <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: T.shadow, padding: '16px 18px' }}>
                <span className="font-head" style={{ display: 'inline-block', background: s.bg, color: s.color, borderRadius: 7, padding: '3px 9px', fontSize: 18, fontWeight: 800 }}>{s.n}</span>
                <div style={{ fontSize: 12.5, color: T.textMuted, marginTop: 8, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {preview && preview.errors.length > 0 ? (
            <ACard title="Validation errors" subtitle="Fix these rows in your CSV and re-upload, or import the valid rows only" padding={0}
              action={<ABtn variant="secondary" size="sm" icon="download" onClick={downloadErrorCsv}>Errors CSV</ABtn>}>
              <ATable columns={[{ label: 'Row', width: 70 }, { label: 'Column' }, { label: 'Problem' }]} dense>
                {visibleErrors.map((e, i) => (
                  <ARow key={`${e.rowNumber}-${i}`}>
                    <ACell dense><span style={{ fontWeight: 700, color: T.danger }}>{e.rowNumber}</span></ACell>
                    <ACell dense>{e.field ? <code style={{ background: '#eef1f7', borderRadius: 4, padding: '1px 6px', fontSize: 11.5 }}>{e.field}</code> : <span style={{ color: T.textLight }}>—</span>}</ACell>
                    <ACell dense>{e.message}</ACell>
                  </ARow>
                ))}
              </ATable>
              {preview.errors.length > visibleErrors.length ? <p style={{ padding: '10px 14px', fontSize: 12, color: T.textMuted }}>Showing first {visibleErrors.length} of {preview.errors.length}. Download the CSV for all.</p> : null}
            </ACard>
          ) : null}

          {preview && preview.preview.length > 0 ? (
            <ACard title={`Preview · first ${preview.preview.length} valid rows`} padding={0}>
              <ATable columns={[{ label: 'Exam' }, { label: 'Topic' }, { label: 'Stem' }, { label: 'Key', align: 'right' }]} dense>
                {preview.preview.map((row, i) => (
                  <ARow key={i}>
                    <ACell dense><span style={{ color: T.textMuted }}>{row.exam_type_slug}</span></ACell>
                    <ACell dense><span style={{ color: T.textMuted }}>{row.subject_slug}/{row.topic_slug}</span></ACell>
                    <ACell dense><span style={{ display: 'block', maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.stem}</span></ACell>
                    <ACell dense align="right"><span style={{ fontWeight: 700 }}>{row.correct_choice.toUpperCase()}</span></ACell>
                  </ARow>
                ))}
              </ATable>
            </ACard>
          ) : null}

          {error ? <p style={{ color: T.danger, fontSize: 13 }}>{error}</p> : null}
          {message ? <p style={{ color: T.success, fontSize: 13, fontWeight: 600 }}>{message}</p> : null}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <ABtn variant="secondary" onClick={() => pick(null)}>Re-upload CSV</ABtn>
            <ABtn variant="primary" icon="check" disabled={!canImport} onClick={() => runAction('import')}>
              {busy === 'import' ? 'Importing…' : preview ? `Import ${preview.valid.length} valid rows as ${publish ? 'published' : 'drafts'}` : 'Import'}
            </ABtn>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
