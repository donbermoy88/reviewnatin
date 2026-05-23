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
};

export const type: Record<string, TypeStyle> = {
  display: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.display,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
    color: colors.primary,
  },
  headline: {
    fontFamily: fonts.bodyBold,
    fontSize: typography.sizes.headline,
    lineHeight: typography.sizes.headline * typography.lineHeights.tight,
    color: colors.text,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: typography.sizes.display,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: typography.sizes.title,
    lineHeight: typography.sizes.title * typography.lineHeights.normal,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typography.sizes.body,
    lineHeight: typography.sizes.body * typography.lineHeights.relaxed,
    color: colors.text,
  },
  bodyMuted: {
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyMedium,
    fontSize: typography.sizes.caption,
    lineHeight: typography.sizes.caption * typography.lineHeights.normal,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: typography.sizes.bodyLg,
    lineHeight: typography.sizes.bodyLg * typography.lineHeights.normal,
    color: colors.text,
  },
};
