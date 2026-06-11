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

  return (
    <div className="mt-3 space-y-2">
      {reportKind === 'content' ? (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
          <label className="text-xs font-medium text-slate-600">
            Severity
            <select
              value={selectedSeverity}
              onChange={(event) => setSelectedSeverity(event.target.value as typeof selectedSeverity)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Assignee
            <select
              value={selectedAssignee}
              onChange={(event) => setSelectedAssignee(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
            >
              <option value="">Unassigned</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.display_name || person.email || person.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Labels
            <input
              type="text"
              value={labelText}
              onChange={(event) => setLabelText(event.target.value)}
              placeholder="grammar, answer-key"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
            />
          </label>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Target: {targetId.slice(0, 8)}…</span>
        {reportKind === 'content' ? (
          <>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => updateWorkflow(false)}
              className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900 hover:bg-blue-200 disabled:opacity-50"
            >
              {loading === 'workflow' ? '…' : 'Save QA'}
            </button>
            <button
              type="button"
              disabled={!!loading}
              onClick={() => updateWorkflow(true)}
              className="rounded-md bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-900 hover:bg-indigo-200 disabled:opacity-50"
            >
              {loading === 'assign-self' ? '…' : 'Assign me'}
            </button>
          </>
        ) : null}
        <button
          type="button"
          disabled={!!loading}
          onClick={() => resolve('triaged')}
          className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:opacity-50"
        >
          {loading === 'triaged' ? '…' : 'Triage'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => resolve('fixed')}
          className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-900 hover:bg-green-200 disabled:opacity-50"
        >
          {loading === 'fixed' ? '…' : 'Fixed'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => resolve('rejected')}
          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          {loading === 'rejected' ? '…' : 'Reject'}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>
      <input
        type="text"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Internal note, optional"
        className="w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400"
      />
    </div>
  );
}
