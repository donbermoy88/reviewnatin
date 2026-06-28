import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../hooks/use-app-theme';
import type { UserEntitlement } from '../lib/api/entitlements';
import {
  canOpenStoreSubscriptionManager,
  entitlementPeriodDescription,
  entitlementPeriodTitle,
  entitlementStatusLabel,
  getActivePlusEntitlement,
  openManageSubscription,
  plusPlanLabel,
} from '../lib/iap/manage-subscription';
import { PREMIUM_LOCK_CTA } from '../lib/subscription/paywall-copy';
import { PrimaryButton } from './primary-button';

type Props = {
  entitlements: UserEntitlement[];
  restoring?: boolean;
  onRestore?: () => void;
  onViewPlans?: () => void;
  compact?: boolean;
};

function sourceLabel(source?: string) {
  if (source === 'demo') return 'Demo access';
  if (source?.startsWith('web_')) return 'Prepaid Plus access';
  if (source === 'iap') return 'App Store / Google Play';
  return 'Store subscription';
}

export function ManagePlusCard({
  entitlements,
  restoring = false,
  onRestore,
  onViewPlans,
  compact = false,
}: Props) {
  const theme = useAppTheme();
  const { colors, fonts, spacing, radii } = theme;
  const plus = getActivePlusEntitlement(entitlements);
  const [opening, setOpening] = useState(false);
  const isDemo = plus?.source === 'demo';
  const isStoreSubscription = !plus || plus.source === 'iap' || !plus.source;
  const hasStoreManager = canOpenStoreSubscriptionManager();

  const manage = async () => {
    if (!hasStoreManager) {
      Alert.alert('Manage subscription', 'Open this on iOS or Android to manage your App Store or Google Play subscription.');
      return;
    }
    setOpening(true);
    try {
      await openManageSubscription(plus);
    } catch {
      Alert.alert('Could not open subscriptions', 'Please open your App Store or Google Play account subscriptions manually.');
    } finally {
      setOpening(false);
    }
  };

  return (
    <View
      style={{
        borderRadius: radii.xl,
        borderWidth: 1,
        borderColor: plus ? colors.primary : colors.border,
        backgroundColor: colors.surface,
        padding: compact ? spacing.md : spacing.lg,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: radii.lg,
            backgroundColor: plus ? colors.primaryMuted : colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="sparkles" size={20} color={plus ? colors.primary : colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: compact ? 17 : 19, color: colors.text }}>
            {plus ? 'Manage ReviewNatin Plus' : 'ReviewNatin Plus'}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 3 }}>
            {plus
              ? `${plusPlanLabel(plus.sku)} · ${sourceLabel(plus.source)}`
              : 'Subscribe through the App Store or Google Play. Billing renews through your store account.'}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 9,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: plus ? colors.successBg : colors.background,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: plus ? colors.success : colors.textMuted }}>
            {entitlementStatusLabel(plus)}
          </Text>
        </View>
      </View>

      {plus ? (
        <View
          style={{
            borderRadius: radii.lg,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.md,
          }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.text }}>
            {entitlementPeriodTitle(plus, isStoreSubscription)}
          </Text>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, lineHeight: 18, marginTop: 4 }}>
            {entitlementPeriodDescription(plus, isStoreSubscription)}
          </Text>
        </View>
      ) : null}

      <View style={{ flexDirection: compact ? 'column' : 'row', gap: spacing.sm }}>
        {plus && !isDemo && isStoreSubscription ? (
          <PrimaryButton
            label="Manage / cancel"
            loadingLabel="Opening…"
            loading={opening}
            icon="open-outline"
            variant="outline"
            onPress={() => void manage()}
            style={{ flex: compact ? undefined : 1 }}
          />
        ) : null}
        {!plus && onViewPlans ? (
          <PrimaryButton
            label={PREMIUM_LOCK_CTA}
            icon="flash-outline"
            onPress={onViewPlans}
            style={{ flex: compact ? undefined : 1 }}
          />
        ) : null}
        {onRestore ? (
          <PrimaryButton
            label="Restore purchases"
            loadingLabel="Restoring…"
            loading={restoring}
            icon="refresh-outline"
            variant={plus ? 'ghost' : 'outline'}
            onPress={onRestore}
            style={{ flex: compact ? undefined : 1 }}
          />
        ) : null}
      </View>

      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textLight, lineHeight: 16 }}>
        {isStoreSubscription
          ? 'ReviewNatin cannot silently cancel or charge subscriptions. Purchases, auto-renewal, cancellation, refunds, and billing issues are managed by Apple or Google Play.'
          : 'Prepaid Plus access does not auto-renew inside the app.'}
      </Text>

      {isDemo ? (
        <Pressable onPress={onViewPlans} accessibilityRole="button">
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary }}>
            Demo access is not a real subscription. View production plans.
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
