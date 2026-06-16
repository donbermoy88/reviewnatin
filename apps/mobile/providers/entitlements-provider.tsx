import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchSubscriptionProducts,
  fetchUserEntitlements,
  hasPremiumAccess,
  grantDemoEntitlement,
  type SubscriptionProduct,
  type UserEntitlement,
} from '../lib/api/entitlements';
import type { RestorePurchasesResult } from '../lib/iap/product-skus';
import type { StorePrice } from '../lib/iap/store';
import { canUseStorePurchases } from '../lib/iap/availability';
import { useAuth } from './auth-provider';

type EntitlementsContextValue = {
  products: SubscriptionProduct[];
  entitlements: UserEntitlement[];
  /** Live store-reported localized prices, keyed by canonical SKU. Empty off-store. */
  storePrices: Record<string, StorePrice>;
  loading: boolean;
  isPremium: (examTypeId?: string | null) => boolean;
  refresh: () => Promise<void>;
  activateDemoPass: (productId: string, examTypeId?: string) => Promise<void>;
  restoreStorePurchases: () => Promise<RestorePurchasesResult>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [storePrices, setStorePrices] = useState<Record<string, StorePrice>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const prods = await fetchSubscriptionProducts();
      setProducts(prods);
      if (userId) {
        const ents = await fetchUserEntitlements(userId);
        setEntitlements(ents);
      } else {
        setEntitlements([]);
      }
    } catch {
      /* entitlements refresh failed */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Resolve live store-reported localized prices once on store-capable builds.
  // The display layer must show what the store actually charges; this never
  // runs in dev/simulator/guest builds, where the DB price stays the fallback.
  useEffect(() => {
    if (!canUseStorePurchases()) return;
    let active = true;
    void (async () => {
      const { fetchStoreProductPricing } = await import('../lib/iap/store');
      const prices = await fetchStoreProductPricing();
      if (active && Object.keys(prices).length > 0) setStorePrices(prices);
    })();
    return () => {
      active = false;
    };
  }, []);

  const isPremium = useCallback(
    (examTypeId?: string | null) => hasPremiumAccess(entitlements, examTypeId),
    [entitlements]
  );

  const activateDemoPass = useCallback(
    async (productId: string, examTypeId?: string) => {
      if (!__DEV__) return;
      if (!user) return;
      await grantDemoEntitlement(user.id, productId, examTypeId);
      await refresh();
    },
    [user, refresh]
  );

  const restoreStorePurchases = useCallback(async () => {
    const { restorePurchases } = await import('../lib/iap/store');
    return restorePurchases(refresh);
  }, [refresh]);

  const value = useMemo(
    () => ({
      products,
      entitlements,
      storePrices,
      loading,
      isPremium,
      refresh,
      activateDemoPass,
      restoreStorePurchases,
    }),
    [products, entitlements, storePrices, loading, isPremium, refresh, activateDemoPass, restoreStorePurchases]
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementsProvider');
  return ctx;
}
