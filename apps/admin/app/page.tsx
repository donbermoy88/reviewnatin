import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-blue-700">ReviewNatin Admin</h1>
        <p className="mt-2 text-slate-600">admin.reviewnatinph.com — content operations</p>

        <div className="mt-8 space-y-4 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Week 1 setup</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Create Supabase project at supabase.com</li>
            <li>
              Run SQL: <code className="rounded bg-slate-100 px-1">supabase/migrations/001_mvp_schema.sql</code>
            </li>
            <li>
              Run seed: <code className="rounded bg-slate-100 px-1">supabase/seed/001_catalog.sql</code>
            </li>
            <li>Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to app env files</li>
          </ol>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">CSV question import</h2>
          <p className="mt-2 text-sm text-slate-600">
            Template: <code>templates/questions_import_v1.csv</code>
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Full import UI and review queue — Week 2.
          </p>
          <Link
            href="https://github.com"
            className="mt-4 inline-block text-sm font-medium text-blue-600"
          >
            See docs/06-content-pipeline.md in repo
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Marketing:{" "}
          <a href="https://reviewnatinph.com" className="underline">
            reviewnatinph.com
          </a>
        </p>
      </div>
    </div>
  );
}
