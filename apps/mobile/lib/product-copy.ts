/** PH-first product copy — conversion, retention, and clarity. */

export const FREE_DAILY_QUESTIONS_COPY = 20;

export const BRAND_LINE = 'Mag-review tayo. Pasa tayo.';

export const GUEST_NEXT_STEPS = {
  title: 'Simulan dito — libre, walang signup',
  subtitle: '20 tanong bawat araw sa guest mode. I-save ang progress kapag handa ka nang mag-sign up.',
  ctaPractice: 'Mag-practice ngayon',
  ctaReview: 'Tingnan ang subjects',
  ctaSignup: 'Gumawa ng account (optional)',
} as const;

export const GUEST_SAVE_PROGRESS = {
  title: 'I-save ang progress mo sa cloud',
  subtitle: 'PasaPath, streak, Mistake Bank, at readiness — naka-sync sa lahat ng device mo.',
  ctaLogin: 'Mag-log in',
  ctaSignup: 'Mag-sign up — libre',
} as const;

export const DAILY_LIMIT = {
  title: 'Abot na ang libreng tanong ngayon',
  body: (used = FREE_DAILY_QUESTIONS_COPY) =>
    `Nagamit mo na ang ${used}/${FREE_DAILY_QUESTIONS_COPY} libreng tanong ngayong araw. Balik bukas o i-unlock ang unlimited practice sa Plus.`,
  ctaUpgrade: 'Tingnan ang Plus plans',
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

export const SETTINGS_HINT = 'Tip: Buksan ang Settings dito para sa reminders, exam track, at beta feedback.';

export const STREAK_RETURN = {
  welcomeBack: (name: string) => `Balik ka na, ${name}!`,
  keepStreak: (days: number) => `${days}-day streak — huwag putulin ngayon!`,
  atRisk: 'Isang quiz lang para mapanatili ang streak mo.',
} as const;
