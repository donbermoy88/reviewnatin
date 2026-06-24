import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { canUseStorePurchases } from '../lib/iap/availability';
import { processPurchaseOnServer, prefetchStoreProducts, requestStorePurchase } from '../lib/iap/store';
import { useIapFeedbackOptional } from './iap-feedback-provider';
import { useAuth } from './auth-provider';
import { useEntitlements } from './entitlements-provider';
import { addAppBreadcrumb, captureAppException, captureAppMessage } from '../lib/monitoring/events';
import { trackEvent } from '../lib/analytics/events';
import { PREMIUM_PURCHASE } from '../lib/subscription/paywall-copy';

type IapContextValue = {
  purchasingSku: string | null;
  purchaseProduct: (sku: string) => Promise<{ ok: boolean; error?: string }>;
};

const IapContext = createContext<IapContextValue | null>(null);

const noopPurchase = async (): Promise<{ ok: boolean; error?: string }> => ({
  ok: false,
  error: 'In-app purchases require a production store build.',
});

export function IapProvider({ children }: { children: React.ReactNode }) {
  const storeEnabled = canUseStorePurchases();
  const { user } = useAuth();
  const { refresh } = useEntitlements();
  const feedback = useIapFeedbackOptional();
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);
  const listenersAttached = useRef(false);

  const notify = useCallback(
    (title: string, subtitle?: string) => {
      feedback?.showFeedback({ title, subtitle });
    },
    [feedback]
  );

  useEffect(() => {
    if (!storeEnabled) return;
    void prefetchStoreProducts();
  }, [storeEnabled]);

  useEffect(() => {
    if (!storeEnabled || !user || listenersAttached.current) return;

    let purchaseSub: { remove: () => void } | undefined;
    let errorSub: { remove: () => void } | undefined;
    let mounted = true;

    (async () => {
      try {
        const { connectStore } = await import('../lib/iap/store');
        const iap = await connectStore();
        if (!iap || !mounted) return;

        listenersAttached.current = true;

        purchaseSub = iap.purchaseUpdatedListener(async (purchase) => {
          setPurchasingSku(purchase.productId);
          addAppBreadcrumb('iap', 'store purchase update received', { sku: purchase.productId });
          try {
            const result = await processPurchaseOnServer(purchase, async (p) => {
              await iap.finishTransaction({ purchase: p, isConsumable: false });
            });
            if (result.ok) {
              await refresh();
              trackEvent('subscription_active', { method: 'store', sku: purchase.productId });
              captureAppMessage('store purchase verified', { area: 'iap', action: 'purchase_verified' }, { sku: purchase.productId });
              notify(PREMIUM_PURCHASE.successTitle, PREMIUM_PURCHASE.successSubtitle);
            } else {
              captureAppMessage(
                'store purchase verification failed',
                { area: 'iap', action: 'purchase_verification_failed' },
                { sku: purchase.productId, error: result.error },
                'warning'
              );
              notify('Purchase not verified', PREMIUM_PURCHASE.verifyFailedSubtitle);
            }
          } catch (error) {
            captureAppException(error, { area: 'iap', action: 'purchase_listener' }, { sku: purchase.productId });
            notify('Purchase error', 'Please try again or restore your purchases.');
          } finally {
            setPurchasingSku(null);
          }
        });

        errorSub = iap.purchaseErrorListener((error) => {
          setPurchasingSku(null);
          if (String(error.code).toLowerCase().includes('cancel')) return;
          captureAppException(error, { area: 'iap', action: 'purchase_error_listener' }, { code: String(error.code) });
          notify('Purchase error', error.message);
        });
      } catch (error) {
        captureAppException(error, { area: 'iap', action: 'listener_setup' });
        // Native IAP module not linked on this build
      }
    })();

    return () => {
      mounted = false;
      purchaseSub?.remove();
      errorSub?.remove();
      listenersAttached.current = false;
    };
  }, [storeEnabled, user, refresh, notify]);

  const purchaseProduct = useCallback(
    async (sku: string) => {
      if (!storeEnabled) {
        addAppBreadcrumb('iap', 'purchase blocked because store billing is unavailable', { sku }, 'warning');
        return {
          ok: false,
          error: __DEV__
            ? 'Use demo entitlements in dev builds.'
            : 'In-app purchases require a production store build.',
        };
      }
      setPurchasingSku(sku);
      addAppBreadcrumb('iap', 'store purchase requested', { sku });
      return requestStorePurchase(sku);
    },
    [storeEnabled]
  );

  const value = useMemo(
    () => ({
      purchasingSku: storeEnabled ? purchasingSku : null,
      purchaseProduct: storeEnabled ? purchaseProduct : noopPurchase,
    }),
    [storeEnabled, purchasingSku, purchaseProduct]
  );

  return <IapContext.Provider value={value}>{children}</IapContext.Provider>;
}

export function useIap() {
  const ctx = useContext(IapContext);
  if (!ctx) throw new Error('useIap must be used within IapProvider');
  return ctx;
}
