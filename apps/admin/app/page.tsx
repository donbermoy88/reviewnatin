import { AdminNav } from '@/components/admin-nav';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <AdminNav />

        <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Content pipeline</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <Link href="/content/import" className="font-medium text-blue-600 hover:underline">
                CSV question import →
              </Link>
              <span className="text-slate-500"> — bulk load drafts from template</span>
            </li>
            <li>
              <Link href="/content/review" className="font-medium text-blue-600 hover:underline">
                Review queue →
              </Link>
              <span className="text-slate-500"> — drafts + reported questions</span>
            </li>
            <li>
              <Link href="/content/announcements" className="font-medium text-blue-600 hover:underline">
                Announcements →
              </Link>
              <span className="text-slate-500"> — in-app + marketing updates</span>
            </li>
            <li>
              <Link href="/content/schedules" className="font-medium text-blue-600 hover:underline">
                Exam schedules →
              </Link>
              <span className="text-slate-500"> — mobile exam calendar</span>
            </li>
            <li>
              <Link href="/content/materials" className="font-medium text-blue-600 hover:underline">
                Lessons & cheat sheets →
              </Link>
              <span className="text-slate-500"> — Study Notes tab + offline pack</span>
            </li>
            <li>
              <Link href="/content/checkouts" className="font-medium text-blue-600 hover:underline">
                Web checkouts →
              </Link>
              <span className="text-slate-500"> — GCash / Maya manual fulfillment</span>
            </li>
            <li>
              <Link href="/content/changelog" className="font-medium text-blue-600 hover:underline">
                Changelog →
              </Link>
            </li>
            <li>
              <Link href="/content/stats" className="font-medium text-blue-600 hover:underline">
                Stats →
              </Link>
              <span className="text-slate-500"> — content counts + platform metrics</span>
            </li>
            <li>
              <Link href="/content/waitlist" className="font-medium text-blue-600 hover:underline">
                Waitlist →
              </Link>
              <span className="text-slate-500"> — marketing beta signups</span>
            </li>
            <li>
              Template: <code className="rounded bg-slate-100 px-1">templates/questions_import_v1.csv</code>
            </li>
          </ul>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Staff roles: admin, content_reviewer, content_author. Set role in Supabase <code>users</code> table.
        </p>
      </div>
    </div>
  );
}
