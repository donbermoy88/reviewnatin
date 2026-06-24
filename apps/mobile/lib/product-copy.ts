/** PH-first product copy — conversion, retention, and clarity. */

export const FREE_DAILY_QUESTIONS_COPY = 20;

export const BRAND_LINE = 'Mag-review tayo. Pasa tayo.';

export const GUEST_NEXT_STEPS = {
  title: 'Simulan dito — libre, walang signup',
  subtitle: 'Subukan muna ang ReviewNatin. Local stats are saved on this device; account is optional until you want cloud sync.',
  ctaPractice: 'Mag-practice ngayon',
  ctaReview: 'Tingnan ang subjects',
  ctaSignup: 'Save progress when ready',
  trustPill: 'Guest mode: no email needed',
} as const;

export const GUEST_SAVE_PROGRESS = {
  title: 'I-save ang progress mo sa cloud',
  subtitle: 'PasaPath, streak, Mistake Bank, at readiness — naka-sync sa lahat ng device mo.',
  ctaLogin: 'Mag-log in',
  ctaSignup: 'Mag-sign up — libre',
} as const;

export const GUEST_PROGRESS_NUDGE = {
  title: 'Nice work — saved locally muna',
  subtitle:
    'Naka-save ang guest score sa device na ito. Gumawa ng free account kapag ready ka para hindi mawala kapag nagpalit ng phone.',
  ctaSignup: 'Save to free account',
  ctaContinue: 'Continue as guest',
} as const;

export const FREE_VERIFY_EMAIL = {
  title: 'Free account setup',
  subtitle:
    'I-verify ang email para ma-sync ang CSE plan, streak, at Mistake Bank sa cloud. Walang bayad ito.',
  emailPrefix: 'Code sent to',
  checklist: ['Check inbox or spam', 'Enter the 6-digit code', 'Continue to onboarding'],
} as const;

export const FREE_OAUTH_SIGNUP = {
  title: 'Fast sign-up option',
  subtitle:
    'Google sign-in skips the email code. LET Secondary reviewers can still choose their major during onboarding.',
} as const;

export const FREE_DAILY_STATUS = {
  title: (remaining: number) =>
    remaining > 0
      ? `${remaining}/${FREE_DAILY_QUESTIONS_COPY} libreng tanong natitira ngayon`
      : 'Naubos na ang libreng tanong ngayon',
  subtitle: (remaining: number) =>
    remaining > 0
      ? 'Quick set muna. Free review is ad-supported; Plus removes ads and limits.'
      : 'Balik bukas for another free set, or go Plus for unlimited practice without ads.',
  accessibilityLabel: (remaining: number) =>
    remaining > 0
      ? `${remaining} libreng tanong natitira ngayon. Free review includes ads. Tingnan ang Plus.`
      : 'Naubos na ang libreng tanong ngayon. Tingnan ang Plus.',
} as const;

export const DAILY_LIMIT = {
  title: 'Abot na ang libreng tanong ngayon',
  body: (used = FREE_DAILY_QUESTIONS_COPY) =>
    `Nagamit mo na ang ${used}/${FREE_DAILY_QUESTIONS_COPY} libreng tanong ngayong araw. Balik bukas o i-unlock ang unlimited practice sa Plus.`,
  ctaUpgrade: 'View Premium Plans',
  ctaTomorrow: 'Balik bukas',
  valueBullets: [
    'Unlimited practice at full mock exams',
    'AI tutor at malalim na paliwanag',
    'Offline packs — review kahit walang data',
    'Walang ads habang nagre-review',
  ],
} as const;

export const PREMIUM_HEADLINE = {
  title: 'Lahat ng kailangan mo\npara makapasa — isang plan',
  subtitle: 'Unlimited practice, mock exams, AI tutor, at offline review para sa CSE, LET, at PNLE.',
  trust: 'Hindi affiliated sa CSC, PRC, o anumang government agency.',
} as const;

export const EXAM_COUNTDOWN = {
  title: (days: number) => (days <= 30 ? `${days} araw na lang — i-level up ang review mo` : `${days} araw bago ang exam`),
  subtitle: 'Plus users get full mocks, weakness drills, at offline packs para sa final stretch.',
} as const;

export const SETTINGS_HINT = 'Nalito ka ba? Settings has reminders, exam track, at beta feedback.';

export const SETTINGS_SUPPORT = {
  title: 'Need help or found a bug?',
  subtitle: 'Send beta feedback anytime. We include your device, version, and guest/free/premium cohort automatically.',
  ctaReport: 'Report a problem',
  ctaSettings: 'Open settings',
} as const;

export const STREAK_RETURN = {
  welcomeBack: (name: string) => `Balik ka na, ${name}!`,
  keepStreak: (days: number) => `${days}-day streak — huwag putulin ngayon!`,
  atRisk: 'Isang quiz lang para mapanatili ang streak mo.',
} as const;
