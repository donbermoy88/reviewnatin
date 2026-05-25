'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function AdminNav() {
  const router = useRouter();

  const signOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-blue-700">ReviewNatin Admin</h1>
        <p className="mt-1 text-sm text-slate-600">Content operations</p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/content/import" className="font-medium text-blue-600 hover:underline">
          Import
        </Link>
        <Link href="/content/review" className="font-medium text-blue-600 hover:underline">
          Review
        </Link>
        <Link href="/content/announcements" className="font-medium text-blue-600 hover:underline">
          Announcements
        </Link>
        <Link href="/content/schedules" className="font-medium text-blue-600 hover:underline">
          Schedules
        </Link>
        <Link href="/content/changelog" className="font-medium text-blue-600 hover:underline">
          Changelog
        </Link>
        <Link href="/content/materials" className="font-medium text-blue-600 hover:underline">
          Materials
        </Link>
        <Link href="/content/checkouts" className="font-medium text-blue-600 hover:underline">
          Checkouts
        </Link>
        <Link href="/content/stats" className="font-medium text-blue-600 hover:underline">
          Stats
        </Link>
        <Link href="/content/waitlist" className="font-medium text-blue-600 hover:underline">
          Waitlist
        </Link>
        <button type="button" onClick={signOut} className="text-slate-500 hover:text-slate-800">
          Sign out
        </button>
      </div>
    </header>
  );
}
