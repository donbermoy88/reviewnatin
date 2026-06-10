'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Props = {
  reportId: string;
  targetId: string;
  reportKind?: 'legacy_question' | 'content';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string | null;
  labels?: string[];
  staff?: Array<{ id: string; email: string | null; display_name: string | null; role: string }>;
};

export function ReportTriageActions({
  reportId,
  targetId,
  reportKind = 'legacy_question',
  severity = 'medium',
  assignedTo = null,
  labels = [],
  staff = [],
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState(severity);
  const [selectedAssignee, setSelectedAssignee] = useState(assignedTo ?? '');
  const [labelText, setLabelText] = useState(labels.join(', '));

  const runRpc = async (rpcName: string, params: Record<string, unknown>, loadingKey: string) => {
    setLoading(loadingKey);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { data, error: rpcErr } = await supabase.rpc(rpcName, params);

    if (rpcErr) {
      setError(rpcErr.message);
      setLoading(null);
      return;
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (!result?.success) {
      setError(result?.error ?? 'Update failed');
      setLoading(null);
      return;
    }

    router.refresh();
    setLoading(null);
  };

  const resolve = async (status: 'triaged' | 'fixed' | 'rejected') => {
    const rpcName = reportKind === 'content' ? 'resolve_content_report' : 'resolve_reported_question';
    const params =
      reportKind === 'content'
        ? { p_report_id: reportId, p_status: status, p_admin_notes: notes || null }
        : { p_report_id: reportId, p_status: status, p_notes: notes || null };
    await runRpc(rpcName, params, status);
  };

  const updateWorkflow = async (assignToSelf = false) => {
    if (reportKind !== 'content') return;
    const parsedLabels = labelText
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 8);
    await runRpc(
      'update_content_report_workflow',
      {
        p_report_id: reportId,
        p_severity: selectedSeverity,
        p_assigned_to: selectedAssignee || null,
        p_assign_to_self: assignToSelf,
        p_labels: parsedLabels,
        p_note: notes || null,
      },
      assignToSelf ? 'assign-self' : 'workflow'
    );
  };

  const busy = !!loading;

  return (
    <div className="mt-3 space-y-3">
      {reportKind === 'content' ? (
        <div className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-[var(--text-muted)]">
            Severity
            <select
              value={selectedSeverity}
              onChange={(event) => setSelectedSeverity(event.target.value as typeof selectedSeverity)}
              className="field-input mt-1 px-2 py-1.5 text-xs"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)]">
            Assignee
            <select
              value={selectedAssignee}
              onChange={(event) => setSelectedAssignee(event.target.value)}
              className="field-input mt-1 px-2 py-1.5 text-xs"
            >
              <option value="">Unassigned</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.display_name || person.email || person.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-[var(--text-muted)]">
            Labels
            <input
              type="text"
              value={labelText}
              onChange={(event) => setLabelText(event.target.value)}
              placeholder="grammar, answer-key"
              className="field-input mt-1 px-2 py-1.5 text-xs"
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--text-subtle)]">Target: {targetId.slice(0, 8)}…</span>
        {reportKind === 'content' ? (
          <>
            <button type="button" disabled={busy} onClick={() => updateWorkflow(false)} className="btn btn-secondary btn-sm">
              {loading === 'workflow' ? 'Saving…' : 'Save QA'}
            </button>
            <button type="button" disabled={busy} onClick={() => updateWorkflow(true)} className="btn btn-secondary btn-sm">
              {loading === 'assign-self' ? '…' : 'Assign me'}
            </button>
          </>
        ) : null}
        <button type="button" disabled={busy} onClick={() => resolve('triaged')} className="btn btn-sm bg-amber-100 text-amber-800 hover:bg-amber-200">
          {loading === 'triaged' ? '…' : 'Triage'}
        </button>
        <button type="button" disabled={busy} onClick={() => resolve('fixed')} className="btn btn-success btn-sm">
          {loading === 'fixed' ? '…' : 'Fixed'}
        </button>
        <button type="button" disabled={busy} onClick={() => resolve('rejected')} className="btn btn-ghost btn-sm border border-[var(--border)]">
          {loading === 'rejected' ? '…' : 'Reject'}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>

      <input
        type="text"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Internal note (optional)"
        className="field-input text-xs"
      />
    </div>
  );
}
