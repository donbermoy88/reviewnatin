import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { ManagePlusCard } from '../../components/manage-plus-card';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG, DISCLAIMERS } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { useIap } from '../../providers/iap-provider';
import { captureAttributionFromQuery } from '../../lib/checkout-attribution';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { PREMIUM_PROSPECT } from '../../lib/product-copy';
import { trackEvent } from '../../lib/analytics/events';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../../lib/monitoring/events';
import { canUseStorePurchases } from '../../lib/iap/availability';
import {
  planMonthlyEquivalent,
  resolveProductPrice,
  savingsPercent,
} from '../../lib/subscription/pricing-display';
import {
  HOW_TO_PAY_STEPS,
  HOW_TO_PAY_TITLE,
  PAYWALL_BENEFITS,
  PAYWALL_CTA_PRIMARY,
  PAYWALL_CTA_SECONDARY,
  PAYWALL_GUEST_BODY,
  PAYWALL_GUEST_TITLE,
  PAYWALL_HEADLINE,
  PAYWALL_PAYMENT_EXPLANATION,
  PAYWALL_POLICY_FOOTER,
  PAYWALL_SUBHEADING,
  PLAN_DISPLAY,
  PREMIUM_PURCHASE,
  STORE_LOAD_ERROR,
  STORE_LOAD_TRY_AGAIN,
} from '../../lib/subscription/paywall-copy';

const isDevBuild = __DEV__;
const storeEnabled = canUseStorePurchases();

type ProductRow = {
  id: string;
  sku: string;
  tier: string;
  pricePhp: number;
  durationDays?: number | null;
  examTypeId?: string | null;
};

function isYearlyPlus(sku: string): boolean {
  return sku.toLowerCase().includes('yearly');
}

function isSixMonthPlus(sku: string): boolean {
  return sku.toLowerCase().includes('six_months');
}

function planDisplayMeta(sku: string) {
  if (isSixMonthPlus(sku)) return PLAN_DISPLAY.six_months;
  if (isYearlyPlus(sku)) return PLAN_DISPLAY.yearly;
  return PLAN_DISPLAY.monthly;
}

function planSuffix(sku: string): string {
  if (isSixMonthPlus(sku)) return '/6 mo';
  if (isYearlyPlus(sku)) return '/year';
  return '/month';
}

export default function SubscribeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { utm_source, utm_medium, utm_campaign, source: sourceParam } = useLocalSearchParams<{
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    source?: string;
  }>();
  const { user } = useAuth();
  const {
    products,
    entitlements,
    storePrices,
    storePricesReady,
    storePricesError,
    reloadStorePrices,
    loading,
    activateDemoPass,
    isPremium,
    restoreStorePurchases,
    refresh: refreshEntitlements,
  } = useEntitlements();
  const { purchaseProduct, purchasingSku } = useIap();
  const [busy, setBusy] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [howToPayOpen, setHowToPayOpen] = useState(false);
  const [sheet, setSheet] = useState<
    | null
    | { kind: 'purchase_error'; message: string }
    | { kind: 'restore'; ok: boolean; message: string }
  >(null);

  useEffect(() => {
    trackEvent('subscription_viewed', {
      source: sourceParam ?? utm_source ?? 'direct',
      signedIn: Boolean(user),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);

  useEffect(() => {
    void refreshEntitlements();
  }, [refreshEntitlements]);

  useEffect(() => {
    resolveOnboardingGoal(user?.id).then(async (goal) => {
      const exam = await fetchExamBySlug(goal?.examSlug ?? DEFAULT_EXAM_SLUG);
      setExamTypeId(exam?.id ?? null);
    });
  }, [user?.id]);

  useEffect(() => {
    void captureAttributionFromQuery({
      utm_source,
      utm_medium,
      utm_campaign,
      source: sourceParam,
    });
  }, [utm_source, utm_medium, utm_campaign, sourceParam]);

  const plusProducts = products.filter((p) => p.tier === 'plus');
  const sortedPlus = [...plusProducts].sort((a, b) => {
    const order = (sku: string) => {
      if (sku.toLowerCase().includes('monthly')) return 1;
      if (isSixMonthPlus(sku)) return 2;
      if (isYearlyPlus(sku)) return 3;
      return 99;
    };
    return order(a.sku) - order(b.sku);
  });
  const hasAccess = isPremium(examTypeId);

  useEffect(() => {
    if (selectedPlanId) return;
    const best = sortedPlus.find((p) => isSixMonthPlus(p.sku)) ?? sortedPlus[0];
    if (best) setSelectedPlanId(best.id);
  }, [sortedPlus, selectedPlanId]);

  const selectedProduct = sortedPlus.find((p) => p.id === selectedPlanId) ?? null;

  const resolvePrice = (product: ProductRow) => resolveProductPrice(product, storePrices);

  const monthlyPlan = sortedPlus.find((p) => p.sku.toLowerCase().includes('monthly'));
  const monthlyBaseAmount = monthlyPlan ? resolvePrice(monthlyPlan).amount : 0;

  function planSubLabel(product: ProductRow): string {
    const meta = planDisplayMeta(product.sku);
    if (isSixMonthPlus(product.sku) || isYearlyPlus(product.sku)) {
      const monthly = planMonthlyEquivalent(resolvePrice(product).amount, product.sku);
      const total = resolvePrice(product).amount;
      const baselineMonths = isSixMonthPlus(product.sku) ? 6 : 12;
      const baseline = monthlyBaseAmount * baselineMonths;
      const savePct = savingsPercent(total, baseline);
      return savePct > 0 ? `₱${monthly}/mo · save ${savePct}%` : meta.subcopy;
    }
    return meta.subcopy;
  }

  const requireLogin = () => {
    addAppBreadcrumb('paywall', 'login required from subscribe screen');
    router.push('/(auth)/login');
  };

  const buyDemo = async (productId: string, tier: string) => {
    if (!user) {
      requireLogin();
      return;
    }
    setBusy(productId);
    try {
      const product = products.find((p) => p.id === productId);
      await activateDemoPass(
        productId,
        tier === 'exam_pass' ? product?.examTypeId ?? examTypeId ?? undefined : undefined
      );
      captureAppMessage('demo entitlement activated', { area: 'paywall', action: 'demo_activate' }, { tier });
    } catch (error) {
      captureAppException(error, { area: 'paywall', action: 'demo_activate' }, { tier });
      throw error;
    } finally {
      setBusy(null);
    }
  };

  const buyStore = async (sku: string) => {
    if (!user) {
      requireLogin();
      return;
    }
    addAppBreadcrumb('paywall', 'store purchase button pressed', { sku });
    trackEvent('checkout_started', { method: 'store', sku });
    const result = await purchaseProduct(sku);
    if (!result.ok && result.error && !result.error.includes('cancel')) {
      captureAppMessage(
        'store purchase request failed',
        { area: 'paywall', action: 'store_purchase_request' },
        { sku, error: result.error },
        'warning'
      );
      setSheet({ kind: 'purchase_error', message: toUserFacingError(result.error, 'checkout') });
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    addAppBreadcrumb('iap', 'restore purchases requested');
    try {
      const result = await restoreStorePurchases();
      setSheet({ kind: 'restore', ok: result.ok, message: result.message });
    } catch (error) {
      captureAppException(error, { area: 'iap', action: 'restore_purchases' });
      throw error;
    } finally {
      setRestoring(false);
    }
  };

  const storeLoadFailed =
    storeEnabled && storePricesReady && storePricesError && sortedPlus.length > 0;

  const ctaDisabled =
    !selectedProduct ||
    !!busy ||
    !!purchasingSku ||
    storeLoadFailed ||
    (storeEnabled && !storePricesReady);

  const ctaLabel = hasAccess
    ? 'Premium active'
    : !user
      ? 'Sign in to subscribe'
      : busy
        ? 'Processing…'
        : purchasingSku
          ? PREMIUM_PURCHASE.purchasingLabel
          : isDevBuild
          ? `Demo: ${planDisplayMeta(selectedProduct?.sku ?? '').name}`
          : PAYWALL_CTA_PRIMARY;

  const onCtaPress = () => {
    if (hasAccess || !selectedProduct) return;
    if (!user) {
      requireLogin();
      return;
    }
    if (isDevBuild) {
      void buyDemo(selectedProduct.id, selectedProduct.tier);
      return;
    }
    if (storeEnabled) {
      void buyStore(selectedProduct.sku);
      return;
    }
    setSheet({
      kind: 'purchase_error',
      message: 'In-app purchases require a production build installed from Google Play or the App Store.',
    });
  };

  const dismissPaywall = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.hero]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + 240,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.plusBadge}>
            <Ionicons name="star" size={12} color={colors.primaryDark} />
            <Text style={styles.plusBadgeText}>PREMIUM</Text>
          </View>
          <Pressable
            onPress={dismissPaywall}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.headlineDark}>{PAYWALL_HEADLINE}</Text>
        <Text style={[styles.headlineSubDark, { marginTop: spacing.sm }]}>{PAYWALL_SUBHEADING}</Text>

        <View style={styles.featuresList}>
          {PAYWALL_BENEFITS.map((f) => (
            <View key={f} style={styles.featureRowDark}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={13} color="#fff" />
              </View>
              <Text style={styles.featureTextDark}>{f}</Text>
            </View>
          ))}
        </View>

        {hasAccess ? (
          <View style={styles.manageBlock}>
            <ManagePlusCard
              entitlements={entitlements}
              restoring={restoring}
              onRestore={user ? () => void handleRestore() : undefined}
              compact
            />
          </View>
        ) : !user ? (
          <View style={styles.guestBannerDark}>
            <Ionicons name="person-circle-outline" size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.guestBannerTitleDark}>{PAYWALL_GUEST_TITLE}</Text>
              <Text style={styles.guestBannerSubDark}>{PAYWALL_GUEST_BODY}</Text>
            </View>
            <View style={styles.guestBannerActions}>
              <Pressable
                onPress={() => router.push('/(auth)/signup')}
                style={({ pressed }) => [styles.guestBannerBtn, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
                accessibilityLabel="Create a free account"
              >
                <Text style={styles.guestBannerBtnText}>Create free account</Text>
              </Pressable>
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={({ pressed }) => [styles.guestBannerLink, pressed && { opacity: 0.75 }]}
                accessibilityRole="button"
                accessibilityLabel="Keep practicing as guest"
              >
                <Text style={styles.guestBannerLinkText}>Keep guest mode</Text>
              </Pressable>
            </View>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        ) : (
          <>
            <View style={styles.prospectBanner}>
              <Ionicons name="sparkles-outline" size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.prospectBannerTitle}>{PREMIUM_PROSPECT.title}</Text>
                <Text style={styles.prospectBannerSub}>{PREMIUM_PROSPECT.subtitle}</Text>
                <Text style={styles.prospectBannerTrust}>{PREMIUM_PROSPECT.trustLine}</Text>
              </View>
            </View>
            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            {sortedPlus.map((p) => {
              const selected = selectedPlanId === p.id;
              const meta = planDisplayMeta(p.sku);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelectedPlanId(p.id)}
                  style={({ pressed }) => [
                    styles.planRow,
                    selected && styles.planRowSelected,
                    pressed && { opacity: 0.92 },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${meta.name} ${resolvePrice(p).display}${planSuffix(p.sku)}`}
                >
                  <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
                    {selected ? <Ionicons name="checkmark" size={14} color={colors.primaryDark} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planRowName}>{meta.name}</Text>
                    <Text style={styles.planRowSub}>{planSubLabel(p)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planRowPrice}>
                      {resolvePrice(p).display}
                      <Text style={styles.planRowPriceSuffix}>{planSuffix(p.sku)}</Text>
                    </Text>
                  </View>
                  {'badge' in meta && meta.badge ? (
                    <View style={styles.bestValuePillDark}>
                      <Text style={styles.bestValuePillDarkText}>{meta.badge}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
            </View>
          </>
        )}

        {!hasAccess && user ? (
          <View style={[styles.infoBannerDark, { marginTop: spacing.md }]}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
            <Text style={styles.infoBannerDarkText}>{PAYWALL_PAYMENT_EXPLANATION}</Text>
          </View>
        ) : null}

        {storeLoadFailed ? (
          <View style={[styles.errorBanner, { marginTop: spacing.md }]}>
            <Ionicons name="cloud-offline-outline" size={18} color={colors.accent} />
            <Text style={styles.errorBannerText}>{STORE_LOAD_ERROR}</Text>
            <Pressable
              onPress={() => void reloadStorePrices()}
              style={styles.tryAgainBtn}
              accessibilityRole="button"
              accessibilityLabel={STORE_LOAD_TRY_AGAIN}
            >
              <Text style={styles.tryAgainBtnText}>{STORE_LOAD_TRY_AGAIN}</Text>
            </Pressable>
          </View>
        ) : null}

        {!hasAccess && user ? (
          <Pressable
            onPress={() => setHowToPayOpen(true)}
            style={({ pressed }) => [styles.howToPayLink, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={HOW_TO_PAY_TITLE}
          >
            <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
            <Text style={styles.howToPayLinkText}>{HOW_TO_PAY_TITLE}</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
          </Pressable>
        ) : null}

        {isDevBuild ? (
          <View style={styles.devBannerDark}>
            <Ionicons name="code-slash" size={14} color={colors.accent} />
            <Text style={styles.devBannerDarkText}>
              Dev build — purchases are simulated. Production uses Google Play Billing on Android and App Store on iOS.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {!hasAccess ? (
        <View style={[styles.stickyCta, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            onPress={onCtaPress}
            disabled={ctaDisabled}
            style={({ pressed }) => [
              styles.bigCta,
              ctaDisabled && { opacity: 0.6 },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text style={styles.bigCtaText}>{ctaLabel}</Text>
          </Pressable>
          <Pressable
            onPress={dismissPaywall}
            hitSlop={8}
            style={{ alignItems: 'center', marginTop: spacing.sm }}
            accessibilityRole="button"
            accessibilityLabel={PAYWALL_CTA_SECONDARY}
          >
            <Text style={styles.ctaLinkText}>{PAYWALL_CTA_SECONDARY}</Text>
          </Pressable>
          {storeEnabled ? (
            <>
              <Text style={styles.restoreHint}>{PREMIUM_PURCHASE.restoreHint}</Text>
              <Pressable
                onPress={() => (user ? void handleRestore() : requireLogin())}
                hitSlop={8}
                disabled={restoring}
                style={{ alignItems: 'center', marginTop: spacing.xs }}
                accessibilityRole="button"
                accessibilityLabel="Restore purchases"
              >
                <Text style={styles.ctaLinkText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
              </Pressable>
            </>
          ) : null}
          <Text style={styles.footnoteDark}>
            {PAYWALL_POLICY_FOOTER} {DISCLAIMERS.short}
          </Text>
        </View>
      ) : null}

      <AppSheet
        visible={sheet?.kind === 'purchase_error'}
        title="Purchase"
        subtitle={sheet?.kind === 'purchase_error' ? sheet.message : undefined}
        onClose={() => setSheet(null)}
        actions={[{ label: 'OK', onPress: () => setSheet(null), variant: 'outline' }]}
      />
      <AppSheet
        visible={sheet?.kind === 'restore'}
        title={sheet?.kind === 'restore' && sheet.ok ? 'Purchases restored' : 'Could not restore'}
        subtitle={sheet?.kind === 'restore' ? sheet.message : undefined}
        onClose={() => setSheet(null)}
        actions={[{ label: 'OK', onPress: () => setSheet(null), variant: 'outline' }]}
      />
      <AppSheet
        visible={howToPayOpen}
        title={HOW_TO_PAY_TITLE}
        onClose={() => setHowToPayOpen(false)}
        actions={[{ label: 'Close', onPress: () => setHowToPayOpen(false), variant: 'outline' }]}
      >
        {HOW_TO_PAY_STEPS.map((step, i) => (
          <Text key={step} style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 14, color: colors.text, marginBottom: spacing.sm }}>
            {i + 1}. {step}
          </Text>
        ))}
      </AppSheet>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    plusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.sm,
    },
    plusBadgeText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.primaryDark, letterSpacing: 0.6 },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.lg,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headlineDark: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: '#fff',
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    headlineSubDark: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: 'rgba(255,255,255,0.82)',
      lineHeight: 22,
    },
    featuresList: { marginTop: spacing.lg, gap: spacing.sm },
    featureRowDark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTextDark: { fontFamily: fonts.bodyMedium, fontSize: 14, color: 'rgba(255,255,255,0.92)', flex: 1 },
    manageBlock: { marginTop: spacing.lg },
    guestBannerDark: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    guestBannerTitleDark: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },
    guestBannerSubDark: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: 'rgba(255,255,255,0.72)',
      lineHeight: 19,
      marginTop: 4,
    },
    guestBannerBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.lg,
      alignSelf: 'center',
    },
    guestBannerActions: { alignItems: 'center', gap: spacing.xs },
    guestBannerBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryDark },
    guestBannerLink: {
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      alignSelf: 'center',
    },
    guestBannerLinkText: { fontFamily: fonts.bodyBold, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
    prospectBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    prospectBannerTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },
    prospectBannerSub: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: 'rgba(255,255,255,0.78)',
      lineHeight: 19,
      marginTop: 4,
    },
    prospectBannerTrust: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      color: 'rgba(255,255,255,0.55)',
      lineHeight: 16,
      marginTop: spacing.xs,
    },
    planRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    planRowSelected: { borderColor: colors.accent, backgroundColor: 'rgba(255,201,40,0.12)' },
    planRadio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    planRadioSelected: { borderColor: colors.accent, backgroundColor: colors.accent },
    planRowName: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },
    planRowSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    planRowPrice: { fontFamily: fonts.display, fontSize: 17, color: '#fff' },
    planRowPriceSuffix: { fontFamily: fonts.bodyMedium, fontSize: 11, color: 'rgba(255,255,255,0.55)' },
    bestValuePillDark: {
      position: 'absolute',
      top: -8,
      right: spacing.sm,
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radii.sm,
    },
    bestValuePillDarkText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.primaryDark, letterSpacing: 0.3 },
    infoBannerDark: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    infoBannerDarkText: {
      flex: 1,
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: 'rgba(255,255,255,0.78)',
      lineHeight: 18,
    },
    errorBanner: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,201,40,0.25)',
      gap: spacing.sm,
    },
    errorBannerText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
    tryAgainBtn: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.lg,
    },
    tryAgainBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primaryDark },
    howToPayLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    howToPayLinkText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.accent },
    devBannerDark: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,201,40,0.10)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,201,40,0.18)',
    },
    devBannerDarkText: {
      flex: 1,
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: 'rgba(255,255,255,0.78)',
      lineHeight: 17,
    },
    stickyCta: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: 'rgba(8,36,92,0.96)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
    bigCta: {
      backgroundColor: colors.accent,
      borderRadius: radii.xl,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    bigCtaText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.primaryDark },
    ctaLinkText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
    restoreHint: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      color: 'rgba(255,255,255,0.55)',
      lineHeight: 16,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    footnoteDark: {
      fontFamily: fonts.bodyMedium,
      fontSize: 10,
      color: 'rgba(255,255,255,0.45)',
      lineHeight: 14,
      marginTop: spacing.md,
      textAlign: 'center',
    },
  });
}
