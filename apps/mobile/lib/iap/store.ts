import { Platform } from 'react-native';
import { verifyPurchaseWithServer } from '../api/iap';
import { isSubscriptionSku } from './sku-types';
import { canUseStorePurchases } from './availability';
import { ANDROID_PRODUCT_SKUS, IOS_PRODUCT_SKUS, type RestorePurchasesResult } from './product-skus';

type IapModule = typeof import('react-native-iap');
type Purchase = import('react-native-iap').Purchase;

async function loadIapModule(): Promise<IapModule | null> {
  if (!canUseStorePurchases()) return null;

  try {
    const iap = await import('react-native-iap');
    if (typeof iap.initConnection !== 'function') return null;
    return iap;
  } catch {
    return null;
  }
}

/** Connect to App Store / Play Billing; returns null when native IAP is unavailable. */
export async function connectStore(): Promise<IapModule | null> {
  const iap = await loadIapModule();
  if (!iap) return null;

  try {
    await iap.initConnection();
    return iap;
  } catch {
    return null;
  }
}

function storeSkus(): string[] {
  return Platform.OS === 'ios' ? [...IOS_PRODUCT_SKUS] : [...ANDROID_PRODUCT_SKUS];
}

function purchaseTransactionId(purchase: Purchase): string {
  return purchase.transactionId ?? purchase.id ?? purchase.productId;
}

function purchaseReceipt(purchase: Purchase): string | undefined {
  const legacy = (purchase as Purchase & { transactionReceipt?: string }).transactionReceipt;
  return legacy ?? purchase.purchaseToken ?? undefined;
}

/** Verify a store purchase with the server and finish the transaction. */
export async function processPurchaseOnServer(
  purchase: Purchase,
  finishTransaction: (p: Purchase) => Promise<void>
): Promise<{ ok: boolean; error?: string }> {
  const platform = Platform.OS === 'ios' ? 'apple' : 'google';
  const receipt = purchaseReceipt(purchase);

  const result = await verifyPurchaseWithServer({
    platform,
    product_id: purchase.productId,
    transaction_id: purchaseTransactionId(purchase),
    receipt_data: platform === 'apple' ? receipt : undefined,
    purchase_token: platform === 'google' ? purchase.purchaseToken ?? receipt : undefined,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  await finishTransaction(purchase);
  return { ok: true };
}

/** Restore App Store / Play Store purchases via server verification. */
export async function restorePurchases(refreshEntitlements: () => Promise<void>): Promise<RestorePurchasesResult> {
  if (!canUseStorePurchases()) {
    return {
      ok: false,
      restoredCount: 0,
      message: __DEV__
        ? 'Restore purchases is disabled in dev builds. Use demo entitlements or a TestFlight build.'
        : 'Restore purchases requires a store-signed build (TestFlight or App Store).',
    };
  }

  const iap = await connectStore();
  if (!iap) {
    return {
      ok: false,
      restoredCount: 0,
      message: 'In-app purchases are not available on this build. Rebuild with EAS for store billing.',
    };
  }

  try {
    const purchases = await iap.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });

    let verified = 0;
    let lastError: string | undefined;

    for (const purchase of purchases) {
      const result = await processPurchaseOnServer(purchase, async (p) => {
        await iap.finishTransaction({ purchase: p, isConsumable: false });
      });
      if (result.ok) verified += 1;
      else lastError = result.error;
    }

    await refreshEntitlements();
    await iap.endConnection().catch(() => undefined);

    if (purchases.length === 0) {
      return {
        ok: true,
        restoredCount: 0,
        message: 'No previous purchases found on this account.',
      };
    }

    if (verified === 0) {
      return {
        ok: false,
        restoredCount: 0,
        message: lastError ?? 'Could not verify purchases with the server.',
      };
    }

    return {
      ok: true,
      restoredCount: verified,
      message: `Na-restore ang ${verified} purchase(s). Premium access dapat active na.`,
    };
  } catch (err) {
    await iap.endConnection().catch(() => undefined);
    const msg = err instanceof Error ? err.message : 'Could not restore purchases.';
    return { ok: false, restoredCount: 0, message: msg };
  }
}

/** Start a store purchase flow (result arrives via purchaseUpdatedListener in IapProvider). */
export async function requestStorePurchase(productId: string): Promise<{ ok: boolean; error?: string }> {
  if (!canUseStorePurchases()) {
    return { ok: false, error: 'In-app purchases require a production store build.' };
  }

  const iap = await connectStore();
  if (!iap) {
    return { ok: false, error: 'In-app purchases are not available on this build.' };
  }

  try {
    const isSub = isSubscriptionSku(productId);
    await iap.requestPurchase({
      type: isSub ? 'subs' : 'in-app',
      request: {
        apple: { sku: productId },
        google: { skus: [productId] },
      },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Purchase failed';
    if (message.toLowerCase().includes('cancel')) {
      return { ok: false, error: 'Kinansela ang purchase.' };
    }
    return { ok: false, error: message };
  }
}

export async function prefetchStoreProducts(): Promise<void> {
  const iap = await connectStore();
  if (!iap) return;

  try {
    const skus = storeSkus();
    await iap.fetchProducts({ skus, type: 'all' });
    await iap.endConnection().catch(() => undefined);
  } catch {
    await iap.endConnection().catch(() => undefined);
  }
}

export { storeSkus };
