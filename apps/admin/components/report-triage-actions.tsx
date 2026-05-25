'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Props = {
  reportId: string;
  questionId: string;
};

export function ReportTriageActions({ reportId, questionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const resolve = async (status: 'triaged' | 'fixed' | 'rejected') => {
    setLoading(status);
    setError('');
    const supabase = createSupabaseBrowserClient();
    const { data, error: rpcErr } = await supabase.rpc('resolve_reported_question', {
      p_report_id: reportId,
      p_status: status,
    });

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

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-400">Q: {questionId.slice(0, 8)}…</span>
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
  );
}
