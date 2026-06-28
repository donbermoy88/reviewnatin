import { colors, spacing, radii, touchTarget, typography, shadows, motion } from '@reviewnatin/shared';

export { colors, spacing, radii, touchTarget, typography, shadows, motion };

export const fonts = {
  display: typography.fontDisplay,
  displayBold: typography.fontDisplayBold,
  body: typography.fontBody,
  bodyMedium: typography.fontBodyMedium,
  bodySemiBold: typography.fontBodySemiBold,
  bodyBold: typography.fontBodyBold,
};

type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  color?: string;
  letterSpacing?: number;
};

export const type: Record<string, TypeStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.display,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
    color: colors.text,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.headline,
    lineHeight: typography.sizes.headline * typography.lineHeights.snug,
    color: colors.text,
    letterSpacing: -0.4,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.display,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
    color: colors.primaryDark,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title * typography.lineHeights.compact,
    color: colors.text,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: typography.sizes.cardTitle,
    lineHeight: typography.sizes.cardTitle * typography.lineHeights.compact,
    color: colors.text,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title * typography.lineHeights.compact,
    color: colors.text,
    letterSpacing: -0.3,
  },
  questionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.bodyLg,
    lineHeight: typography.sizes.bodyLg * typography.lineHeights.normal,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    color: colors.text,
  },
  bodyMuted: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    color: colors.textMuted,
  },
  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.subtitle,
    lineHeight: typography.sizes.subtitle * typography.lineHeights.normal,
    color: colors.textMuted,
  },
  small: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.small,
    lineHeight: typography.sizes.small * typography.lineHeights.normal,
    color: colors.textMuted,
  },
  caption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  badge: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.caption,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
    color: colors.textLight,
    letterSpacing: 0.8,
  },
  button: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.normal,
    color: '#fff',
    letterSpacing: 0,
  },
  buttonLg: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.bodyLg,
    lineHeight: typography.sizes.bodyLg * typography.lineHeights.normal,
    color: '#fff',
    letterSpacing: 0,
  },
  label: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.bodyLg,
    lineHeight: typography.sizes.bodyLg * typography.lineHeights.normal,
    color: colors.text,
    letterSpacing: -0.1,
  },
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    color: colors.text,
  },
  bodySemiBold: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.subtitle,
    lineHeight: typography.sizes.subtitle * typography.lineHeights.normal,
    color: colors.text,
  },
  tabLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    letterSpacing: 0.1,
  },
};

/** Gradient stops used across headers */
export const gradients = {
  hero: [colors.primary, colors.primaryDark] as const,
  gold: ['#FFF4DC', '#FFE8AA'] as const,
  challenge: [colors.primaryDark, colors.primary] as const,
};
