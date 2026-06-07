import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppSheet } from '../../components/app-sheet';
import { ManagePlusCard } from '../../components/manage-plus-card';
import { Pill } from '../../components/pill';
import { PrimaryButton } from '../../components/primary-button';
import { useAppTheme, type AppTheme } from '../../hooks/use-app-theme';
import { fetchExamBySlug } from '../../lib/api/catalog';
import { resolveOnboardingGoal } from '../../lib/api/goals';
import { DEFAULT_EXAM_SLUG, DISCLAIMERS } from '@reviewnatin/shared';
import { useAuth } from '../../providers/auth-provider';
import { useEntitlements } from '../../providers/entitlements-provider';
import { useIap } from '../../providers/iap-provider';
import { createWebCheckoutSession, fetchWebCheckoutStatus, checkoutAttributionOptions } from '../../lib/api/web-checkout';
import { captureAttributionFromQuery, loadCheckoutAttribution } from '../../lib/checkout-attribution';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../../lib/monitoring/events';
import {
  clearPendingCheckoutRef,
  getPendingCheckoutRef,
  savePendingCheckoutRef,
} from '../../lib/web-checkout-pending';

const isDevBuild = __DEV__;
const MONTHLY_BASE_PRICE_PHP = 159;

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

function formatSkuLabel(sku: string): string {
  const normalized = sku.toLowerCase();
  if (normalized.includes('six_months')) return 'Plus 6 Months';
  if (normalized.includes('yearly')) return 'Plus Yearly';
  if (normalized.includes('monthly')) return 'Plus Monthly';
  if (normalized.includes('cse_pro')) return 'CSE Professional';
  if (normalized.includes('cse_sub')) return 'CSE Subprofessional';
  if (normalized.includes('let_elem')) return 'LET Elementary';
  if (normalized.includes('let_sec')) return 'LET Secondary';
  if (normalized.includes('pnle')) return 'PNLE';
  return sku
    .replace(/com\.reviewnatin\.(exampass\.|plus\.|)/g, '')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function priceSuffix(sku: string): string {
  if (sku.includes('six_months')) return '/6 months';
  if (sku.includes('yearly')) return '/year';
  if (sku.includes('monthly')) return '/month';
  return ' one-time';
}

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

function planSavingsLabel(product: ProductRow): string | null {
  const durationMonths = isSixMonthPlus(product.sku) ? 6 : isYearlyPlus(product.sku) ? 12 : null;
  if (!durationMonths) return null;

  const monthlyEquivalent = MONTHLY_BASE_PRICE_PHP * durationMonths;
  if (monthlyEquivalent <= product.pricePhp) return null;
  const savingsPct = Math.round(((monthlyEquivalent - product.pricePhp) / monthlyEquivalent) * 100);
  return `Save around ${savingsPct}%`;
}

function FeatureList({ items, styles }: { items: string[]; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.featureList}>
      {items.map((item) => (
        <View key={item} style={styles.featureRow}>
          <Ionicons name="checkmark-circle" size={16} color="#0B5FFF" />
          <Text style={styles.featureText}>{item}</Text>
        </View>
      ))}
    </View>
  );
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
  const [sheet, setSheet] = useState<
    | null
    | { kind: 'purchase_error'; message: string }
    | { kind: 'restore'; ok: boolean; message: string }
    | { kind: 'ewallet'; provider: 'gcash' | 'maya'; reference: string; amount: number }
    | { kind: 'checkout_error'; message: string }
  >(null);

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
    const result = await purchaseProduct(sku);
    if (!result.ok && result.error && !result.error.includes('cancel')) {
      captureAppMessage('store purchase request failed', { area: 'paywall', action: 'store_purchase_request' }, { sku, error: result.error }, 'warning');
      setSheet({ kind: 'purchase_error', message: result.error });
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
      setSheet({ kind: 'checkout_error', message: (e as Error).message });
    }
  };

  const renderPlanCard = (product: ProductRow) => {
    const meta = getPlusPlanMeta(product.sku);
    const highlighted = meta.kind === 'six_months';
    const label = formatSkuLabel(product.sku);
    const suffix = priceSuffix(product.sku);
    const isBusy = busy === product.id || purchasingSku === product.sku;
    const plusActive = hasAccess;
    const savingsLabel = planSavingsLabel(product);

    const primaryLabel = isDevBuild
      ? isBusy
        ? 'Activating…'
        : plusActive
          ? 'Active'
          : 'Activate (demo)'
        : isBusy
          ? 'Processing…'
          : plusActive
            ? 'Active'
            : 'Subscribe';

    const onPrimary = () => {
      if (isDevBuild) void buyDemo(product.id, product.tier);
      else void buyStore(product.sku);
    };

    return (
      <View
        key={product.id}
        style={[styles.planCard, highlighted && styles.planCardHighlighted]}
      >
        <View style={styles.planCardTop}>
          <View style={{ flex: 1 }}>
            {meta.badge ? (
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>{meta.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.planName}>{label}</Text>
            <Text style={styles.planPositioning}>{meta.positioning}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>{formatPeso(product.pricePhp)}</Text>
              <Text style={styles.planSuffix}>{suffix}</Text>
            </View>
            {savingsLabel ? (
              <Text style={styles.savingsCallout}>{savingsLabel}</Text>
            ) : null}
          </View>
          {plusActive ? (
            <Pill color={colors.accentDark} bg={colors.accent}>
              ACTIVE
            </Pill>
          ) : null}
        </View>

        <Text style={styles.featureIntro}>{meta.featureIntro}</Text>
        <FeatureList items={meta.features} styles={styles} />

        <PrimaryButton
          label={primaryLabel}
          variant={highlighted ? 'primary' : 'outline'}
          disabled={!!busy || !!purchasingSku || plusActive}
          onPress={onPrimary}
          accessibilityLabel={`${primaryLabel} — ${label}`}
        />

        {!isDevBuild && !plusActive ? (
          <View style={styles.ewalletRow}>
            <PrimaryButton
              label="GCash"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => void payWithEwallet(product.sku, 'gcash')}
            />
            <PrimaryButton
              label="Maya"
              variant="outline"
              style={{ flex: 1 }}
              onPress={() => void payWithEwallet(product.sku, 'maya')}
            />
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[...gradients.hero]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.headerNav}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </Pressable>
            {hasAccess ? <Pill color={colors.accentDark} bg={colors.accent}>ACTIVE</Pill> : null}
          </View>

          <Text style={styles.headerTitle}>ReviewNatin Plus</Text>
          <Text style={styles.headerSub}>
            Study without limits — mocks, Mistake Bank, offline packs, and no ads.
          </Text>

          <View style={styles.headerPills}>
            {['Unlimited', 'PasaPath', 'Offline', 'No ads'].map((item) => (
              <View key={item} style={styles.headerPill}>
                <Text style={styles.headerPillText}>{item}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {paymentConfirmed ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.successBannerText}>Payment confirmed — your subscription is now active!</Text>
            </View>
          ) : null}

          {pendingRef && !hasAccess ? (
            <Pressable
              style={styles.pendingCard}
              onPress={() => void pollCheckoutStatus()}
              accessibilityRole="button"
              accessibilityLabel="Refresh checkout status"
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>Payment pending</Text>
                <Text style={styles.pendingSub}>
                  {checkingPayment ? 'Checking…' : `Ref ${pendingRef} · Tap to refresh`}
                </Text>
              </View>
              <Ionicons name="refresh" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}

          {isDevBuild ? (
            <View style={styles.devBanner}>
              <Ionicons name="code-slash" size={16} color={colors.accentDark} />
              <Text style={styles.devBannerText}>
                Dev build — purchases are simulated. On TestFlight/App Store, real StoreKit billing applies.
              </Text>
            </View>
          ) : null}

          <ManagePlusCard
            entitlements={entitlements}
            restoring={restoring}
            onRestore={() => void handleRestore()}
            compact
          />

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Choose your plan</Text>
              <Text style={styles.sectionSub}>
                Choose a Plus duration. Access remains ReviewNatin Plus; duration controls how long it stays active.
              </Text>

              {sortedPlus.length > 0 ? (
                <View style={styles.planGroup}>
                  <Text style={styles.planGroupLabel}>ReviewNatin Plus</Text>
                  <Text style={styles.planGroupSub}>Monthly, 6 Months, and Yearly all activate Plus entitlement.</Text>
                  {sortedPlus.map((p) => renderPlanCard(p))}
                </View>
              ) : null}
            </>
          )}

          <View style={styles.footerBlock}>
            <Text style={styles.disclaimer}>{DISCLAIMERS.subscription}</Text>
            <Text style={styles.disclaimer}>{DISCLAIMERS.short}</Text>
          </View>
        </View>
      </ScrollView>

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
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const { colors, fonts, spacing, radii } = theme;
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
    },
    planCardHighlighted: {
      borderColor: colors.primary,
      borderWidth: 2,
      backgroundColor: colors.primaryMuted,
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
      borderRadius: radii.full,
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
  });
}
