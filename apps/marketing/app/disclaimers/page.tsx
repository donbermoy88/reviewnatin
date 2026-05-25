import Link from 'next/link';
import { DISCLAIMERS, LEGAL } from '@reviewnatin/shared';

export const metadata = {
  title: 'Exam Disclaimers — ReviewNatin',
  description: 'ReviewNatin is not affiliated with CSC, PRC, or any government agency.',
};

export default function DisclaimersPage() {
  return (
    <div className="min-h-screen bg-[var(--rn-bg)]">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-[family-name:var(--font-syne)] text-lg font-extrabold text-[var(--rn-blue)]">
          ReviewNatin
        </Link>
        <Link href="/" className="text-sm text-[var(--rn-muted)] hover:text-[var(--rn-blue)]">
          Home
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-[var(--rn-text)]">
          {DISCLAIMERS.title}
        </h1>
        <p className="mt-6 leading-relaxed text-[var(--rn-muted)]">{DISCLAIMERS.body}</p>
        <p className="mt-4 font-semibold text-[var(--rn-text)]">{DISCLAIMERS.short}</p>
        <h2 className="mt-10 text-lg font-bold text-[var(--rn-text)]">Official links</h2>
        <ul className="mt-4 space-y-2">
          {DISCLAIMERS.officialLinks.map((link) => (
            <li key={link.url}>
              <a href={link.url} className="text-[var(--rn-blue)] underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-[var(--rn-muted)]">
          <Link href={LEGAL.privacyUrl}>Privacy Policy</Link> · <Link href={LEGAL.termsUrl}>Terms of Service</Link>
        </p>
      </main>
    </div>
  );
}
