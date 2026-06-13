import { colors, spacing, radii, touchTarget, typography, shadows } from '@reviewnatin/shared';

export { colors, spacing, radii, touchTarget, typography, shadows };

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
    letterSpacing: 0,
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.headline,
    lineHeight: typography.sizes.headline * typography.lineHeights.tight,
    color: colors.text,
    letterSpacing: 0,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.display,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
    color: colors.primaryDark,
    letterSpacing: 0,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title * typography.lineHeights.normal,
    color: colors.text,
    letterSpacing: 0,
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
  caption: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.caption,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
    color: colors.textLight,
    letterSpacing: 0.4,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: typography.sizes.bodyLg,
    lineHeight: typography.sizes.bodyLg * typography.lineHeights.normal,
    color: colors.text,
    letterSpacing: 0,
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
};

/** Gradient stops used across headers */
export const gradients = {
  hero: [colors.primary, colors.primaryDark] as const,
  gold: ['#FFF4DC', '#FFE8AA'] as const,
  challenge: [colors.primaryDark, colors.primary] as const,
};
