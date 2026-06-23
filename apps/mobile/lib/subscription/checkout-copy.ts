/** Taglish paywall copy — Phase 5 subscription funnel clarity. */

export const WEB_CHECKOUT_BETA_BANNER =
  'Beta APK — bayad via GCash o Maya sa browser. Walang auto-charge; i-confirm lang pagkatapos magbayad. Google Play billing darating sa Play release.';

export const WEB_CHECKOUT_TRIAL_NOTE =
  'Walang free trial sa web checkout — buong access agad pag na-activate ang Plus. Pwede mag-cancel anytime sa Settings.';

/** Shown on Subscribe for guests on Android APK beta (web checkout primary). */
export const GUEST_WEB_CHECKOUT_HINT =
  'Pagkatapos mag-sign up: bayad via GCash o Maya sa browser — ito ang primary path sa APK beta (walang Play Billing).';

export const WEB_CHECKOUT_STICKY_HINT = (price: string) =>
  `Isang tap → GCash/Maya · ${price} · instant Plus access pag paid`;

export const EXAM_COUNTDOWN_PLUS_CTA = {
  title: (days: number) => ` ${days} araw na lang — i-unlock ang full mocks`,
  subtitle: 'Plus: unlimited practice, offline packs, AI tutor, walang ads.',
  button: 'Tingnan ang Plus',
} as const;
