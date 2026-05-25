import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { canUseStorePurchases } from '../lib/iap/availability';
import { processPurchaseOnServer, prefetchStoreProducts, requestStorePurchase } from '../lib/iap/store';
import { useIapFeedbackOptional } from './iap-feedback-provider';
import { useAuth } from './auth-provider';
import { useEntitlements } from './entitlements-provider';

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
          try {
            const result = await processPurchaseOnServer(purchase, async (p) => {
              await iap.finishTransaction({ purchase: p, isConsumable: false });
            });
            if (result.ok) {
              await refresh();
              notify('Purchase complete', 'Salamat! Na-unlock na ang premium access mo.');
            } else {
              notify(
                'Hindi na-verify ang purchase',
                result.error ?? 'Subukan ulit o i-restore ang purchases.'
              );
            }
          } finally {
            setPurchasingSku(null);
          }
        });

        errorSub = iap.purchaseErrorListener((error) => {
          setPurchasingSku(null);
          if (String(error.code).toLowerCase().includes('cancel')) return;
          notify('Purchase error', error.message);
        });
      } catch {
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
        return {
          ok: false,
          error: __DEV__
            ? 'Use demo entitlements in dev builds.'
            : 'In-app purchases require a production store build.',
        };
      }
      setPurchasingSku(sku);
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
