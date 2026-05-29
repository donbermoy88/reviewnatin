# ReviewNatin Mobile — Accessibility Audit
**Date:** 2026-05-29

## Baseline coverage

- `(tabs)` screens contain 10 explicit `accessibilityLabel`/`accessibilityHint`/`accessibilityRole` props.
- `components/` directory contains 27 explicit a11y props.
- Coverage of interactive elements is uneven; tabs are mostly auto-labeled by Expo Router. Custom Pressable wrappers (`PrimaryButton`, `ChoiceOption`, `Pill`, `Card`) inherit RN defaults plus a `accessibilityLabel` where set by the caller.

## Fixes applied in this pass

- `components/score-ring.tsx` — added `accessibilityRole="image"` with a label of the form `"75% score — 30 out of 40 correct"` so VoiceOver users hear the result instead of a silent SVG.
- `components/readiness-ring.tsx` — same treatment: `"82% Exam-ready. <hint>"`.
- Already labeled: subscribe screen back button, restore-purchases button, mock review back button, study/[subjectSlug] back & topic buttons, quiz back-button. These were left unchanged.

## Recommendations (follow-up work — not done in this pass)

- Add `accessibilityLabel` to the gear icon button in `(tabs)/index.tsx` header and the bookmark icon button in the quiz screen. Each Pressable wrapping a single Ionicons should set a label.
- Audit `<TextInput>` fields — most currently rely on placeholder text. Add `accessibilityLabel` prop matching the visible label, or set `accessibilityLabelledBy`.
- Verify color contrast on warn/error banners — orange-on-light-yellow may not meet WCAG AA contrast.
- Add `accessibilityState` to toggle buttons (settings switches already inherit it via `Switch`; check custom toggle Pressables for the reminder card).
- Consider adding `accessibilityRole="header"` to the `Text` elements used as section titles so screen readers can navigate by landmark.
