import Link from 'next/link';
import { LEGAL, SITE_URL, SUPPORT_EMAIL, DISCLAIMERS } from '@reviewnatin/shared';

export const metadata = {
  title: 'Terms of Service — ReviewNatin',
  description: 'Terms governing use of the ReviewNatin app and website.',
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--rn-muted)]">Last updated: May 23, 2026</p>
        <article className="mt-8 space-y-4 text-[var(--rn-muted)] [&_h2]:mt-8 [&_h2]:font-bold [&_h2]:text-[var(--rn-text)] [&_a]:text-[var(--rn-blue)] [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          <p>
            By using ReviewNatin (the app or <a href={SITE_URL}>reviewnatinph.com</a>), you agree to these Terms. If you
            do not agree, do not use the service.
          </p>

          <h2>Service description</h2>
          <p>
            ReviewNatin provides independent exam review content and study tools for Filipino licensure and board exams.
            {DISCLAIMERS.body}
          </p>

          <h2>Accounts</h2>
          <ul>
            <li>You are responsible for keeping your login credentials secure.</li>
            <li>You must provide accurate account information.</li>
            <li>You may delete your account at any time in app Settings.</li>
          </ul>

          <h2>Subscriptions & purchases</h2>
          <p>{DISCLAIMERS.subscription}</p>
          <p>
            Refunds follow Apple App Store or Google Play policies. We do not process card refunds directly for
            in-app purchases.
          </p>

          <h2>Acceptable use</h2>
          <ul>
            <li>Do not scrape, redistribute, or resell question content.</li>
            <li>Do not attempt to bypass paywalls or exploit the service.</li>
            <li>Report inaccurate questions through the in-app report flow.</li>
          </ul>

          <h2>Content accuracy</h2>
          <p>
            We strive for accurate, reviewed content but do not guarantee completeness or that use of the app will
            result in passing any exam. Official requirements and schedules change — verify with CSC, PRC, and other
            official sources.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, ReviewNatin is provided &quot;as is&quot; without warranties. We are
            not liable for indirect or consequential damages arising from use of the app.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be
            posted on this page.
          </p>

          <h2>Contact</h2>
          <p>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>

          <p className="text-sm">
            <Link href={LEGAL.privacyUrl}>Privacy Policy</Link> · <Link href="/disclaimers">Disclaimers</Link>
          </p>
        </article>
      </main>
    </div>
  );
}
