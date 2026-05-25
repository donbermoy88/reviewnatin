import Link from 'next/link';
import { LEGAL, SITE_URL, SUPPORT_EMAIL } from '@reviewnatin/shared';

export const metadata = {
  title: 'Privacy Policy — ReviewNatin',
  description: 'How ReviewNatin collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="May 23, 2026">
      <p>
        ReviewNatin (&quot;we&quot;, &quot;us&quot;) operates the ReviewNatin mobile app and{" "}
        <a href={SITE_URL}>reviewnatinph.com</a>. This policy explains what we collect, why we collect it, and your
        choices. It applies to users in the Philippines and complies with the Data Privacy Act of 2012 (RA 10173).
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, display name, authentication identifiers (including Google or
          Apple Sign-In tokens processed by Supabase Auth).
        </li>
        <li>
          <strong>Study data:</strong> exam goals, quiz answers, diagnostic results, bookmarks, mistake logs, and
          progress metrics needed to run PasaPath and analytics.
        </li>
        <li>
          <strong>Device data:</strong> push notification tokens (if you enable reminders), app version, and coarse
          device type for troubleshooting.
        </li>
        <li>
          <strong>Payment data:</strong> we do not store full card numbers. Purchases are processed by Apple App Store
          or Google Play; we store entitlement records (SKU, expiry) after store receipt validation.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>Provide and sync your study progress across devices</li>
        <li>Send optional study reminders and product updates</li>
        <li>Validate subscriptions and restore purchases</li>
        <li>Improve content quality (e.g., aggregated performance, reported questions)</li>
        <li>Prevent abuse and secure accounts</li>
      </ul>

      <h2>Third-party services</h2>
      <p>We use trusted processors including:</p>
      <ul>
        <li>Supabase (database, authentication, hosting)</li>
        <li>Google Sign-In / Apple Sign-In (authentication)</li>
        <li>Apple App Store / Google Play (in-app purchases)</li>
        <li>Expo / EAS (build and push notification delivery)</li>
      </ul>
      <p>Each provider has its own privacy policy governing data they process on our behalf.</p>

      <h2>Retention & deletion</h2>
      <p>
        We retain account and study data while your account is active. You may delete your account in the app (Settings
        → Delete account), which removes associated profile and study data from our systems.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access, correction, or deletion of personal data by emailing{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We will respond within a reasonable time as required by
        law.
      </p>

      <h2>Children</h2>
      <p>
        ReviewNatin is intended for exam takers generally aged 17+. We do not knowingly collect data from children under
        13 without parental consent.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>

      <p className="text-sm text-[var(--rn-muted)]">
        See also our <Link href={LEGAL.termsUrl}>Terms of Service</Link> and{" "}
        <Link href="/disclaimers">exam disclaimers</Link>.
      </p>
    </LegalShell>
  );
}

function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
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
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-[var(--rn-text)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--rn-muted)]">Last updated: {updated}</p>
        <article className="prose-rn mt-8 space-y-4 text-[var(--rn-muted)] [&_h2]:mt-8 [&_h2]:font-bold [&_h2]:text-[var(--rn-text)] [&_a]:text-[var(--rn-blue)] [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
          {children}
        </article>
      </main>
    </div>
  );
}
