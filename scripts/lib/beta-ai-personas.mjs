/**
 * 12 Cursor AI subagent QA personas — Guest G1–G4, Free F1–F4, Premium P1–P4.
 * Used by scripts/beta-ai-testers.mjs for automated cohort smokes.
 */
export const BETA_AI_PERSONAS = [
  {
    id: 'G1',
    name: 'Mara Santos',
    cohort: 'guest',
    examFocus: 'CSE Professional',
    flows: ['guest-onboarding-quiz.yaml'],
    manualChecks: [],
  },
  {
    id: 'G2',
    name: 'Diego Reyes',
    cohort: 'guest',
    examFocus: 'LET Elementary',
    flows: ['guest-onboarding-quiz.yaml'],
    manualChecks: ['P0 “libre, walang signup” copy'],
  },
  {
    id: 'G3',
    name: 'Anica Cruz',
    cohort: 'guest',
    examFocus: 'PNLE',
    flows: ['guest-onboarding-quiz.yaml'],
    manualChecks: ['20 Q Tagalog paywall panel'],
  },
  {
    id: 'G4',
    name: 'Paolo Mendoza',
    cohort: 'guest',
    examFocus: 'CSE Subprofessional',
    flows: ['guest-settings-feedback.yaml'],
    manualChecks: ['Profile settings hint scroll'],
  },
  {
    id: 'F1',
    name: 'Jasmine Lo',
    cohort: 'free',
    examFocus: 'CSE Professional',
    flows: ['free-signup-path.yaml'],
    deeplinkVerifyEmail: true,
    manualChecks: [],
  },
  {
    id: 'F2',
    name: 'Kyle Tan',
    cohort: 'free',
    examFocus: 'LET Secondary',
    flows: ['auth-keyboard-smoke.yaml'],
    manualChecks: ['OAuth path (skip OTP) — not in Maestro'],
  },
  {
    id: 'F3',
    name: 'Rica Villanueva',
    cohort: 'free',
    examFocus: 'PNLE',
    flows: ['free-signup-path.yaml'],
    manualChecks: ['P0 limit copy at 20 Q'],
  },
  {
    id: 'F4',
    name: 'Lea Fernandez',
    cohort: 'free',
    examFocus: 'LET Elementary',
    flows: ['free-signup-path.yaml'],
    manualChecks: ['Mock preview limit'],
  },
  {
    id: 'P1',
    name: 'Andrea Bautista',
    cohort: 'premium',
    examFocus: 'CSE Professional',
    flows: ['premium-subscribe-hint.yaml'],
    manualChecks: ['Plus headline + login gate'],
  },
  {
    id: 'P2',
    name: 'Marco Silva',
    cohort: 'premium',
    examFocus: 'CSE Subprofessional',
    flows: ['premium-subscribe-hint.yaml'],
    manualChecks: ['Web checkout banner'],
  },
  {
    id: 'P3',
    name: 'Nico Almario',
    cohort: 'premium',
    examFocus: 'Mixed exams',
    flows: ['premium-subscribe-hint.yaml'],
    manualChecks: ['Plus entitlement after web checkout'],
  },
  {
    id: 'P4',
    name: 'Patricia Gomez',
    cohort: 'premium',
    examFocus: 'LET Elementary',
    flows: ['premium-subscribe-hint.yaml'],
    manualChecks: ['Offline pack + AI tutor gates'],
  },
];

export function personaSlug(p) {
  return `${p.id}-${p.name.toLowerCase().replace(/\s+/g, '-')}`;
}
