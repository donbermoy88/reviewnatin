import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
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
import { createWebCheckoutSession, fetchWebCheckoutStatus, checkoutAttributionOptions } from '../../lib/api/web-checkout';
import { captureAttributionFromQuery, loadCheckoutAttribution } from '../../lib/checkout-attribution';
import { toUserFacingError } from '../../lib/errors/user-facing';
import { trackEvent } from '../../lib/analytics/events';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../../lib/monitoring/events';
import { preferWebCheckout } from '../../lib/iap/availability';
import {
  clearPendingCheckoutRef,
  getPendingCheckoutRef,
  savePendingCheckoutRef,
} from '../../lib/web-checkout-pending';

const isDevBuild = __DEV__;
const webCheckoutPrimary = preferWebCheckout();

const PLUS_FEATURES = [
  'All exams unlocked (CSE, LET, PNLE)',
  'Unlimited practice & full mock exams',
  'Offline review packs',
  'AI tutor & explanations',
  'No ads',
];

const MONTHLY_FEATURES = [
  'Access to all Phase 1 exams',
  'Practice quizzes',
  'Mock exams',
  'Flashcards',
  'Diagnostic exams',
  'Progress tracking',
  'No ads',
  'Basic PasaPath access',
];

const SIX_MONTH_FEATURES = [
  'Longer review access for one exam season',
  'Full PasaPath access',
  'Offline review packs',
  'Weakness-based recommendations',
  'Priority access to newly added questions',
  'Save compared with monthly billing',
];

const YEARLY_FEATURES = [
  'Full 12-month access',
  'Full PasaPath access',
  'Offline review packs',
  'Weakness-based recommendations',
  'Priority access to newly added questions',
  'Access to future Phase 1 question updates',
  'Best for users reviewing for multiple exams',
];

type PlusPlanKind = 'monthly' | 'six_months' | 'yearly';

type PlusPlanMeta = {
  kind: PlusPlanKind;
  positioning: string;
  featureIntro: string;
  features: string[];
  badge?: string;
};

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

function getPlusPlanMeta(sku: string): PlusPlanMeta {
  if (isSixMonthPlus(sku)) {
    return {
      kind: 'six_months',
      badge: 'BEST VALUE',
      positioning: 'Best for one exam preparation season',
      featureIntro: 'All features in Plus Monthly, plus:',
      features: SIX_MONTH_FEATURES,
    };
  }

  if (isYearlyPlus(sku)) {
    return {
      kind: 'yearly',
      positioning: 'Best for long-term review and multiple exam preparation',
      featureIntro: 'All features in Plus Monthly, plus:',
      features: YEARLY_FEATURES,
    };
  }

  return {
    kind: 'monthly',
    positioning: 'Starter access',
    featureIntro: 'Includes:',
    features: MONTHLY_FEATURES,
  };
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH')}`;
}

export default function SubscribeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const { colors, gradients, spacing } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { ref: checkoutRefParam, utm_source, utm_medium, utm_campaign, source: sourceParam } = useLocalSearchParams<{
    ref?: string;
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
    loading,
    activateDemoPass,
    isPremium,
    restoreStorePurchases,
    refresh: refreshEntitlements,
  } = useEntitlements();
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const { purchaseProduct, purchasingSku } = useIap();
  const [busy, setBusy] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [examTypeId, setExamTypeId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [comparePlansOpen, setComparePlansOpen] = useState(false);
  const [ewalletPickerOpen, setEwalletPickerOpen] = useState(false);
  const [sheet, setSheet] = useState<
    | null
    | { kind: 'purchase_error'; message: string }
    | { kind: 'restore'; ok: boolean; message: string }
    | { kind: 'ewallet'; provider: 'gcash' | 'maya'; reference: string; amount: number }
    | { kind: 'checkout_error'; message: string }
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

  useEffect(() => {
    void (async () => {
      const stored = await getPendingCheckoutRef();
      const ref = checkoutRefParam ?? stored;
      if (ref) {
        setPendingRef(ref);
        if (checkoutRefParam) await savePendingCheckoutRef(checkoutRefParam);
      }
    })();
  }, [checkoutRefParam]);

  const pollCheckoutStatus = useCallback(async () => {
    const ref = pendingRef ?? (await getPendingCheckoutRef());
    if (!ref) return;
    setCheckingPayment(true);
    try {
      const status = await fetchWebCheckoutStatus(ref);
      if (status.status === 'paid') {
        await clearPendingCheckoutRef();
        setPendingRef(null);
        await refreshEntitlements();
        setPaymentConfirmed(true);
      }
    } finally {
      setCheckingPayment(false);
    }
  }, [pendingRef, refreshEntitlements]);

  useEffect(() => {
    void pollCheckoutStatus();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void pollCheckoutStatus();
    });
    return () => sub.remove();
  }, [pollCheckoutStatus]);

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

  // Source of truth for what the user is charged is the store's localized price.
  // Fall back to the DB price only when the store is unavailable (dev/guest).
  const resolvePrice = (product: ProductRow): { display: string; amount: number } => {
    const store = storePrices[product.sku];
    const amount = typeof store?.amount === 'number' && store.amount > 0 ? store.amount : product.pricePhp;
    return { display: store?.displayPrice ?? formatPeso(product.pricePhp), amount };
  };

  // Per-month savings are benchmarked against the actual monthly plan's resolved
  // price, not a hardcoded constant, so the "save X%" label stays truthful.
  const monthlyPlan = sortedPlus.find((p) => p.sku.toLowerCase().includes('monthly'));
  const monthlyBaseAmount = monthlyPlan ? resolvePrice(monthlyPlan).amount : 0;

  function planMonthlyEquiv(product: ProductRow): number {
    const { amount } = resolvePrice(product);
    if (isSixMonthPlus(product.sku)) return Math.round(amount / 6);
    if (isYearlyPlus(product.sku)) return Math.round(amount / 12);
    return amount;
  }

  function planSubLabel(product: ProductRow): string {
    if (isSixMonthPlus(product.sku) || isYearlyPlus(product.sku)) {
      const monthly = planMonthlyEquiv(product);
      const total = resolvePrice(product).amount;
      const baselineMonths = isSixMonthPlus(product.sku) ? 6 : 12;
      const baseline = monthlyBaseAmount * baselineMonths;
      const savePct = baseline > total ? Math.round(((baseline - total) / baseline) * 100) : 0;
      return savePct > 0
        ? `₱${monthly}/mo · save ${savePct}%`
        : `₱${monthly}/mo`;
    }
    return 'Starter access';
  }

  function planShortName(product: ProductRow): string {
    if (isSixMonthPlus(product.sku)) return '6-Month Pass';
    if (isYearlyPlus(product.sku)) return 'Yearly';
    return 'Monthly';
  }

  function planSuffix(product: ProductRow): string {
    if (isSixMonthPlus(product.sku)) return '/6 mo';
    if (isYearlyPlus(product.sku)) return '/year';
    return '/month';
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
    addAppBreadcrumb('paywall', 'demo entitlement activation requested', { productId, tier });
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
      captureAppMessage('store purchase request failed', { area: 'paywall', action: 'store_purchase_request' }, { sku, error: result.error }, 'warning');
      setSheet({ kind: 'purchase_error', message: toUserFacingError(result.error, 'checkout') });
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    addAppBreadcrumb('iap', 'restore purchases requested');
    try {
      const result = await restoreStorePurchases();
      captureAppMessage(
        result.ok ? 'restore purchases completed' : 'restore purchases failed',
        { area: 'iap', action: 'restore_purchases' },
        { ok: result.ok, restoredCount: result.restoredCount },
        result.ok ? 'info' : 'warning'
      );
      setSheet({ kind: 'restore', ok: result.ok, message: result.message });
    } catch (error) {
      captureAppException(error, { area: 'iap', action: 'restore_purchases' });
      throw error;
    } finally {
      setRestoring(false);
    }
  };

  const payWithEwallet = async (sku: string, provider: 'gcash' | 'maya') => {
    if (!user) {
      requireLogin();
      return;
    }
    try {
      addAppBreadcrumb('checkout', 'e-wallet checkout requested', { sku, provider });
      trackEvent('checkout_started', { method: provider, sku });
      const attribution = await loadCheckoutAttribution();
      const attrOpts = checkoutAttributionOptions(attribution);
      const session = await createWebCheckoutSession(sku, provider, attrOpts);
      await savePendingCheckoutRef(session.referenceCode);
      setPendingRef(session.referenceCode);
      await WebBrowser.openBrowserAsync(session.checkoutUrl);
      setSheet({
        kind: 'ewallet',
        provider,
        reference: session.referenceCode,
        amount: session.amountPhp,
      });
    } catch (e) {
      captureAppException(e, { area: 'checkout', action: 'create_ewallet_checkout' }, { sku, provider });
      setSheet({ kind: 'checkout_error', message: toUserFacingError(e, 'checkout') });
    }
  };

  const ctaLabel = hasAccess
    ? 'Plus active'
    : !user
      ? 'Mag-log in para mag-subscribe'
      : busy || purchasingSku
        ? 'Processing…'
        : selectedProduct
          ? webCheckoutPrimary && !isDevBuild
            ? `Magbayad via GCash/Maya · ${resolvePrice(selectedProduct).display}`
            : `Start ${planShortName(selectedProduct)} · ${resolvePrice(selectedProduct).display}`
          : 'Choose a plan';

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
    if (webCheckoutPrimary) {
      setEwalletPickerOpen(true);
      return;
    }
    void buyStore(selectedProduct.sku);
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
            <Text style={styles.plusBadgeText}>PLUS</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        <Text style={styles.headlineDark}>
          Everything you need{'\n'}to pass, in one plan
        </Text>

        <View style={styles.featuresList}>
          {PLUS_FEATURES.map((f) => (
            <View key={f} style={styles.featureRowDark}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={13} color="#fff" />
              </View>
              <Text style={styles.featureTextDark}>{f}</Text>
            </View>
          ))}
        </View>

        {paymentConfirmed ? (
          <View style={styles.successBannerDark}>
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
            <Text style={styles.successBannerDarkText}>Payment confirmed — your subscription is now active!</Text>
          </View>
        ) : null}

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
              <Text style={styles.guestBannerTitleDark}>Mag-log in muna</Text>
              <Text style={styles.guestBannerSubDark}>
                Kailangan ng account para mag-subscribe sa Plus. Libre ang sign-up — i-save ang progress mo sa cloud.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [styles.guestBannerBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Mag-sign up"
            >
              <Text style={styles.guestBannerBtnText}>Sign up</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        ) : (
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            {sortedPlus.map((p) => {
              const selected = selectedPlanId === p.id;
              const isBest = isSixMonthPlus(p.sku);
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
                  accessibilityLabel={`${planShortName(p)} ${resolvePrice(p).display}${planSuffix(p)}`}
                >
                  <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
                    {selected ? <Ionicons name="checkmark" size={14} color={colors.primaryDark} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planRowName}>{planShortName(p)}</Text>
                    <Text style={styles.planRowSub}>{planSubLabel(p)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.planRowPrice}>
                      {resolvePrice(p).display}
                      <Text style={styles.planRowPriceSuffix}>{planSuffix(p)}</Text>
                    </Text>
                  </View>
                  {isBest ? (
                    <View style={styles.bestValuePillDark}>
                      <Text style={styles.bestValuePillDarkText}>BEST VALUE</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {pendingRef && !hasAccess ? (
          <Pressable
            style={styles.pendingCardDark}
            onPress={() => void pollCheckoutStatus()}
            accessibilityRole="button"
            accessibilityLabel="Refresh checkout status"
          >
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitleDark}>Payment pending</Text>
              <Text style={styles.pendingSubDark}>
                {checkingPayment ? 'Checking…' : `Ref ${pendingRef} · Tap to refresh`}
              </Text>
            </View>
            <Ionicons name="refresh" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>
        ) : null}

        {webCheckoutPrimary && !hasAccess && user ? (
          <View style={styles.betaBannerDark}>
            <Ionicons name="phone-portrait-outline" size={14} color={colors.accent} />
            <Text style={styles.betaBannerDarkText}>
              Beta APK — magbayad via GCash o Maya web checkout. Google Play billing darating kapag live na sa Play Store.
            </Text>
          </View>
        ) : null}

        {isDevBuild ? (
          <View style={styles.devBannerDark}>
            <Ionicons name="code-slash" size={14} color={colors.accent} />
            <Text style={styles.devBannerDarkText}>
              Dev build — purchases are simulated.{' '}
              {Platform.OS === 'android'
                ? 'APK beta uses GCash/Maya web checkout; Play Billing on store release.'
                : 'StoreKit applies on production.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {!hasAccess ? (
        <View style={[styles.stickyCta, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            onPress={onCtaPress}
            disabled={!selectedProduct || !!busy || !!purchasingSku}
            style={({ pressed }) => [
              styles.bigCta,
              (!selectedProduct || busy || purchasingSku) && { opacity: 0.6 },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text style={styles.bigCtaText}>{ctaLabel}</Text>
          </Pressable>
          <View style={styles.ctaLinksRow}>
            {!webCheckoutPrimary ? (
              <Pressable
                onPress={() => (user ? void handleRestore() : requireLogin())}
                hitSlop={8}
                disabled={restoring}
                accessibilityRole="button"
                accessibilityLabel="Restore purchase"
              >
                <Text style={styles.ctaLinkText}>
                  {restoring ? 'Restoring…' : 'Restore purchase'}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setComparePlansOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Compare subscription plans"
            >
              <Text style={styles.ctaLinkText}>Compare plans</Text>
            </Pressable>
            {webCheckoutPrimary && user && !isDevBuild ? (
              <Pressable
                onPress={() => setEwalletPickerOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pay with GCash or Maya"
              >
                <Text style={styles.ctaLinkText}>GCash/Maya</Text>
              </Pressable>
            ) : !webCheckoutPrimary && !isDevBuild ? (
              <Pressable
                onPress={() => setEwalletPickerOpen(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Pay with GCash or Maya"
              >
                <Text style={styles.ctaLinkText}>GCash/Maya</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.footnoteDark}>
            {DISCLAIMERS.subscription} {DISCLAIMERS.short}
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
        visible={sheet?.kind === 'ewallet'}
        title="Complete your payment"
        subtitle={
          sheet?.kind === 'ewallet'
            ? `Send ₱${sheet.amount} via ${sheet.provider === 'gcash' ? 'GCash' : 'Maya'} using reference ${sheet.reference}, then confirm on the checkout page.`
            : undefined
        }
        onClose={() => setSheet(null)}
        actions={[
          {
            label: 'Open checkout',
            onPress: () => {
              if (sheet?.kind === 'ewallet') {
                void WebBrowser.openBrowserAsync(
                  `https://reviewnatinph.com/checkout?ref=${encodeURIComponent(sheet.reference)}`
                );
              }
              setSheet(null);
            },
          },
          { label: 'OK', onPress: () => setSheet(null), variant: 'outline' },
        ]}
      />
      <AppSheet
        visible={sheet?.kind === 'checkout_error'}
        title="Checkout failed"
        subtitle={sheet?.kind === 'checkout_error' ? sheet.message : undefined}
        onClose={() => setSheet(null)}
        actions={[{ label: 'OK', onPress: () => setSheet(null), variant: 'outline' }]}
      />
      <AppSheet
        visible={comparePlansOpen}
        title="Compare plans"
        subtitle="Every Plus tier unlocks the same features. Longer durations save money per month."
        onClose={() => setComparePlansOpen(false)}
        actions={[{ label: 'Close', onPress: () => setComparePlansOpen(false), variant: 'outline' }]}
      >
        {sortedPlus.map((p) => {
          const meta = getPlusPlanMeta(p.sku);
          return (
            <View key={p.id} style={{ marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text style={{ fontFamily: theme.fonts.bodyBold, fontSize: 15, color: colors.text }}>
                  {planShortName(p)}
                </Text>
                <Text style={{ fontFamily: theme.fonts.display, fontSize: 16, color: colors.primary }}>
                  {resolvePrice(p).display}
                  <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, color: colors.textMuted }}>
                    {planSuffix(p)}
                  </Text>
                </Text>
              </View>
              <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {meta.positioning}
              </Text>
              <View style={{ marginTop: spacing.sm, gap: 4 }}>
                {meta.features.slice(0, 4).map((f) => (
                  <View key={f} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                    <Text style={{ fontFamily: theme.fonts.bodyMedium, fontSize: 12, color: colors.textMuted, flex: 1 }}>
                      {f}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </AppSheet>
      <AppSheet
        visible={ewalletPickerOpen}
        title="Pay with e-wallet"
        subtitle={selectedProduct ? `${planShortName(selectedProduct)} · ${resolvePrice(selectedProduct).display}` : 'Select a plan first'}
        onClose={() => setEwalletPickerOpen(false)}
        actions={
          selectedProduct
            ? [
                {
                  label: 'GCash',
                  onPress: () => {
                    setEwalletPickerOpen(false);
                    void payWithEwallet(selectedProduct.sku, 'gcash');
                  },
                },
                {
                  label: 'Maya',
                  onPress: () => {
                    setEwalletPickerOpen(false);
                    void payWithEwallet(selectedProduct.sku, 'maya');
                  },
                  variant: 'outline',
                },
                { label: 'Cancel', onPress: () => setEwalletPickerOpen(false), variant: 'ghost' },
              ]
            : [{ label: 'OK', onPress: () => setEwalletPickerOpen(false), variant: 'outline' }]
        }
      />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii, shadows } = theme;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      borderBottomLeftRadius: radii.xxl,
      borderBottomRightRadius: radii.xxl,
      overflow: 'hidden',
    },
    headerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radii.lg,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    headerTitle: {
      fontFamily: fonts.display,
      fontSize: 26,
      color: '#fff',
      letterSpacing: -0.6,
      lineHeight: 32,
    },
    headerSub: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: 'rgba(255,255,255,0.78)',
      lineHeight: 20,
      marginTop: spacing.xs,
      maxWidth: 320,
    },
    headerPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    headerPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.full,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    headerPillText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
    },
    body: { padding: spacing.lg, marginTop: -spacing.sm },
    sectionTitle: {
      fontFamily: fonts.bodyBold,
      fontSize: 18,
      color: colors.text,
      letterSpacing: -0.2,
      marginBottom: spacing.xs,
    },
    sectionSub: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 19,
      marginBottom: spacing.lg,
    },
    planGroup: { marginBottom: spacing.lg, gap: spacing.sm },
    planGroupLabel: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: colors.primary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
    planGroupSub: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      marginTop: -2,
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      padding: spacing.lg,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    planCardHighlighted: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: theme.isDark ? colors.surface : colors.primaryMuted,
    },
    planCardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    bestValueBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      marginBottom: spacing.xs,
    },
    bestValueText: {
      fontFamily: fonts.bodyBold,
      fontSize: 10,
      color: colors.accentDark,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    planName: {
      fontFamily: fonts.bodyBold,
      fontSize: 17,
      color: colors.text,
      letterSpacing: -0.2,
    },
    planPositioning: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
      marginTop: 3,
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
    planPrice: { fontFamily: fonts.display, fontSize: 28, color: colors.primary, letterSpacing: -0.8 },
    planSuffix: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
    savingsCallout: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: colors.success,
      marginTop: 4,
      letterSpacing: 0.2,
    },
    featureIntro: {
      fontFamily: fonts.bodyBold,
      fontSize: 12,
      color: colors.text,
      marginBottom: -spacing.xs,
    },
    featureList: { gap: spacing.xs },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    featureText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    ewalletRow: { flexDirection: 'row', gap: spacing.sm },
    devBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.accentLight,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(245,166,35,0.25)',
    },
    devBannerText: {
      flex: 1,
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.textMuted,
      lineHeight: 17,
    },
    pendingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.card,
    },
    pendingTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.text },
    pendingSub: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    footerBlock: { marginTop: spacing.md, gap: spacing.sm },
    disclaimer: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
    activeText: { fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.success },
    successBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.successBg,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.success,
    },
    successBannerText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, flex: 1, lineHeight: 20 },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.lg,
    },
    plusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radii.full,
    },
    plusBadgeText: {
      fontFamily: fonts.bodyBold,
      fontSize: 11,
      color: colors.primaryDark,
      letterSpacing: 0.5,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: 'rgba(255,255,255,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headlineDark: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: '#fff',
      letterSpacing: -0.6,
      lineHeight: 34,
      marginBottom: spacing.lg,
    },
    featuresList: { gap: spacing.sm },
    featureRowDark: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureTextDark: {
      flex: 1,
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: '#fff',
      letterSpacing: -0.1,
    },
    manageBlock: { marginTop: spacing.lg },
    planRow: {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.18)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    planRowSelected: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(255,201,40,0.10)',
    },
    planRadio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    planRadioSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    planRowName: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      color: '#fff',
      letterSpacing: -0.2,
    },
    planRowSub: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.66)',
      marginTop: 2,
    },
    planRowPrice: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: '#fff',
      letterSpacing: -0.4,
    },
    planRowPriceSuffix: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
    },
    bestValuePillDark: {
      position: 'absolute',
      top: -10,
      right: spacing.md,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radii.sm,
    },
    bestValuePillDarkText: {
      fontFamily: fonts.bodyBold,
      fontSize: 10,
      color: colors.primaryDark,
      letterSpacing: 0.5,
    },
    pendingCardDark: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    pendingTitleDark: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#fff' },
    pendingSubDark: { fontFamily: fonts.bodyMedium, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
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
    betaBannerDark: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: 'rgba(11,95,255,0.18)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.14)',
    },
    betaBannerDarkText: {
      flex: 1,
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 17,
    },
    guestBannerDark: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    guestBannerTitleDark: {
      fontFamily: fonts.bodyBold,
      fontSize: 14,
      color: '#fff',
    },
    guestBannerSubDark: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: 'rgba(255,255,255,0.65)',
      marginTop: 2,
      lineHeight: 17,
    },
    guestBannerBtn: {
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    guestBannerBtnText: {
      fontFamily: fonts.bodyBold,
      fontSize: 13,
      color: colors.primaryDark,
    },
    successBannerDark: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: 'rgba(34,197,94,0.16)',
      borderRadius: radii.lg,
      padding: spacing.md,
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.3)',
    },
    successBannerDarkText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      color: '#fff',
      flex: 1,
      lineHeight: 19,
    },
    stickyCta: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: 'rgba(8,36,92,0.92)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.08)',
    },
    bigCta: {
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bigCtaText: {
      fontFamily: fonts.bodyBold,
      fontSize: 16,
      color: colors.primaryDark,
      letterSpacing: -0.2,
    },
    ctaLinksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.lg,
      marginTop: spacing.md,
      flexWrap: 'wrap',
    },
    ctaLinkText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      color: '#fff',
    },
    footnoteDark: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      color: 'rgba(255,255,255,0.52)',
      textAlign: 'center',
      lineHeight: 16,
      marginTop: spacing.sm,
    },
  });
}
