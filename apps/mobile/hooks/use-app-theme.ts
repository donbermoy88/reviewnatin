import { useMemo } from 'react';
import { colors as lightColors, spacing, radii, touchTarget, typography, shadows } from '@reviewnatin/shared';
import { darkColors } from '../constants/dark-theme';
import { usePreferences } from '../providers/preferences-provider';

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

export type ThemePalette = {
  [K in keyof typeof lightColors]: string;
} & {
  iconBg: string;
  disclaimerText: string;
  footerFade: string;
};

export type AppTheme = {
  colors: ThemePalette;
  isDark: boolean;
  fonts: typeof fonts;
  spacing: typeof spacing;
  radii: typeof radii;
  touchTarget: typeof touchTarget;
  shadows: typeof shadows;
  type: Record<string, TypeStyle>;
  gradients: {
    hero: readonly [string, string];
    gold: readonly [string, string];
    challenge: readonly [string, string];
    screen: readonly [string, string];
  };
};

function buildPalette(isDark: boolean): ThemePalette {
  const base = isDark ? darkColors : lightColors;
  return {
    ...base,
    iconBg: isDark ? '#1E293B' : '#F2F5FB',
    disclaimerText: isDark ? '#FCD34D' : '#78350f',
    footerFade: isDark ? 'rgba(11,18,32,0)' : 'rgba(248,249,251,0)',
  };
}

function buildType(colors: ThemePalette, isDark: boolean): Record<string, TypeStyle> {
  return {
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
      lineHeight: typography.sizes.headline * typography.lineHeights.tight,
      color: colors.text,
      letterSpacing: -0.4,
    },
    brand: {
      fontFamily: fonts.display,
      fontSize: typography.sizes.display,
      lineHeight: typography.sizes.display * typography.lineHeights.tight,
      color: isDark ? colors.text : colors.primaryDark,
      letterSpacing: -0.5,
    },
    title: {
      fontFamily: fonts.bodyBold,
      fontSize: typography.sizes.title,
      lineHeight: typography.sizes.title * typography.lineHeights.normal,
      color: colors.text,
      letterSpacing: -0.2,
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
  };
}

function buildGradients(colors: ThemePalette, isDark: boolean) {
  return {
    hero: [colors.primary, colors.primaryDark] as const,
    gold: isDark ? (['#2D2410', '#3D3520'] as const) : (['#FFF4DC', '#FFE8AA'] as const),
    challenge: [colors.primaryDark, colors.primary] as const,
    screen: isDark
      ? ([colors.background, colors.surface] as const)
      : (['#E8F0FF', '#F8FAFF'] as const),
  };
}

export function useAppTheme(): AppTheme {
  const { isDark } = usePreferences();

  return useMemo(() => {
    const colors = buildPalette(isDark);
    return {
      colors,
      isDark,
      fonts,
      spacing,
      radii,
      touchTarget,
      shadows,
      type: buildType(colors, isDark),
      gradients: buildGradients(colors, isDark),
    };
  }, [isDark]);
}

/** Memoized StyleSheet factory tied to the active theme */
export function useThemedStyles<T>(factory: (theme: AppTheme) => T): T {
  const theme = useAppTheme();
  return useMemo(() => factory(theme), [theme, factory]);
}
