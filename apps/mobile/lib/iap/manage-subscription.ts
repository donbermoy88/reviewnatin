import { Linking, Platform } from 'react-native';
import type { UserEntitlement } from '../api/entitlements';

const IOS_MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';
const ANDROID_PACKAGE_NAME = 'ph.reviewnatin.app';
const ANDROID_MANAGE_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

const CANONICAL_TO_ANDROID_SKU: Record<string, string> = {
  'com.reviewnatin.plus.monthly': 'plus_monthly',
  'com.reviewnatin.plus.six_months': 'plus_six_months',
  'com.reviewnatin.plus.yearly': 'plus_yearly',
};

export function getActivePlusEntitlement(entitlements: UserEntitlement[]): UserEntitlement | null {
  return entitlements.find((e) => e.tier === 'plus') ?? null;
}

export function plusPlanLabel(sku?: string | null): string {
  const normalized = (sku ?? '').toLowerCase();
  if (normalized.includes('six_months')) return 'Plus 6 Months';
  if (normalized.includes('yearly')) return 'Plus Yearly';
  if (normalized.includes('monthly')) return 'Plus Monthly';
  return 'ReviewNatin Plus';
}

export function formatRenewalDate(expiresAt?: string | null): string {
  if (!expiresAt) return 'Active subscription';
  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) return 'Active subscription';
  return date.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function entitlementAccessDate(entitlement?: UserEntitlement | null): string {
  return formatRenewalDate(
    entitlement?.gracePeriodExpiresAt ??
      entitlement?.currentPeriodEnd ??
      entitlement?.expiresAt
  );
}

export function entitlementStatusLabel(entitlement?: UserEntitlement | null): string {
  if (!entitlement) return 'FREE';
  if (entitlement.status === 'cancelled') return 'CANCELLED';
  if (entitlement.status === 'billing_retry') return 'BILLING ISSUE';
  if (entitlement.status === 'grace_period') return 'GRACE PERIOD';
  if (entitlement.status === 'expired') return 'EXPIRED';
  if (entitlement.status === 'refunded') return 'REFUNDED';
  if (entitlement.status === 'revoked') return 'REVOKED';
  return 'ACTIVE';
}

export function entitlementPeriodTitle(entitlement: UserEntitlement, isStoreSubscription: boolean): string {
  const date = entitlementAccessDate(entitlement);
  if (entitlement.status === 'cancelled' || entitlement.autoRenewStatus === false) {
    return `Access until ${date}`;
  }
  if (entitlement.status === 'billing_retry') return `Billing retry until ${date}`;
  if (entitlement.status === 'grace_period') return `Grace period until ${date}`;
  if (!isStoreSubscription) return `Access through ${date}`;
  return `Renews or remains active through ${date}`;
}

export function entitlementPeriodDescription(entitlement: UserEntitlement, isStoreSubscription: boolean): string {
  if (!isStoreSubscription) return 'This access is prepaid. It stays active until the current period ends.';
  if (entitlement.status === 'cancelled' || entitlement.autoRenewStatus === false) {
    return 'Renewal is cancelled in your store account. Plus stays active until the current paid period ends.';
  }
  if (entitlement.status === 'billing_retry') {
    return 'Your store is retrying billing. Manage payment in your App Store or Google Play account.';
  }
  if (entitlement.status === 'grace_period') {
    return 'Your store is allowing temporary access while payment is resolved.';
  }
  return 'If you cancel renewal in your store account, Plus stays active until the current paid period ends.';
}

function androidManageUrl(sku?: string | null): string {
  const androidSku = sku ? CANONICAL_TO_ANDROID_SKU[sku] ?? sku : null;
  if (!androidSku) return ANDROID_MANAGE_SUBSCRIPTIONS_URL;
  const params = new URLSearchParams({
    sku: androidSku,
    package: ANDROID_PACKAGE_NAME,
  });
  return `${ANDROID_MANAGE_SUBSCRIPTIONS_URL}?${params.toString()}`;
}

export function manageSubscriptionUrl(entitlement?: UserEntitlement | null): string {
  if (Platform.OS === 'ios') return IOS_MANAGE_SUBSCRIPTIONS_URL;
  if (Platform.OS === 'android') return androidManageUrl(entitlement?.sku);
  return IOS_MANAGE_SUBSCRIPTIONS_URL;
}

export async function openManageSubscription(entitlement?: UserEntitlement | null): Promise<void> {
  await Linking.openURL(manageSubscriptionUrl(entitlement));
}

export function canOpenStoreSubscriptionManager(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
