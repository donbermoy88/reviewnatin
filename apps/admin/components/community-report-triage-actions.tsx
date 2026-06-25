'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Props = {
  reportId: string;
  targetType: 'post' | 'comment' | 'image' | 'user';
  targetId: string;
  reportedUserId: string | null;
  currentModerationStatus: string | null;
  currentUserStatus: string | null;
};

export function CommunityReportTriageActions({
  reportId,
  targetType,
  targetId,
  reportedUserId,
  currentModerationStatus,
  currentUserStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');

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

  const resolveReport = (status: 'triaged' | 'fixed' | 'rejected') =>
    runRpc('resolve_community_report', { p_report_id: reportId, p_status: status, p_admin_notes: notes || null }, status);

  const setModeration = (status: 'visible' | 'under_review' | 'hidden' | 'removed') =>
    runRpc(
      'set_community_content_moderation',
      { p_target_type: targetType, p_target_id: targetId, p_moderation_status: status },
      `mod-${status}`
    );

  const setUserStatus = (status: 'active' | 'muted' | 'suspended' | 'banned') =>
    runRpc('set_community_user_status', { p_user_id: reportedUserId, p_status: status }, `user-${status}`);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400">Target: {targetId.slice(0, 8)}…</span>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => resolveReport('triaged')}
          className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:opacity-50"
        >
          {loading === 'triaged' ? '…' : 'Triage'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => resolveReport('fixed')}
          className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-900 hover:bg-green-200 disabled:opacity-50"
        >
          {loading === 'fixed' ? '…' : 'Resolve'}
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => resolveReport('rejected')}
          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          {loading === 'rejected' ? '…' : 'Reject report'}
        </button>
        {error ? <span className="text-xs text-red-600">{error}</span> : null}
      </div>

      {targetType !== 'user' ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Content ({currentModerationStatus ?? 'unknown'}):</span>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setModeration('visible')}
            className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900 hover:bg-blue-200 disabled:opacity-50"
          >
            {loading === 'mod-visible' ? '…' : 'Restore'}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setModeration('hidden')}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
          >
            {loading === 'mod-hidden' ? '…' : 'Hide'}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setModeration('removed')}
            className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-200 disabled:opacity-50"
          >
            {loading === 'mod-removed' ? '…' : 'Remove'}
          </button>
        </div>
      ) : null}

      {reportedUserId ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">User ({currentUserStatus ?? 'unknown'}):</span>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setUserStatus('active')}
            className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-900 hover:bg-blue-200 disabled:opacity-50"
          >
            {loading === 'user-active' ? '…' : 'Set active'}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setUserStatus('muted')}
            className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200 disabled:opacity-50"
          >
            {loading === 'user-muted' ? '…' : 'Mute'}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setUserStatus('suspended')}
            className="rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-900 hover:bg-orange-200 disabled:opacity-50"
          >
            {loading === 'user-suspended' ? '…' : 'Suspend'}
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={() => setUserStatus('banned')}
            className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-200 disabled:opacity-50"
          >
            {loading === 'user-banned' ? '…' : 'Ban'}
          </button>
        </div>
      ) : null}

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
