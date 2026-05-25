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
import { useAuth } from './auth-provider';

type EntitlementsContextValue = {
  products: SubscriptionProduct[];
  entitlements: UserEntitlement[];
  loading: boolean;
  isPremium: (examTypeId?: string | null) => boolean;
  refresh: () => Promise<void>;
  activateDemoPass: (productId: string, examTypeId?: string) => Promise<void>;
  restoreStorePurchases: () => Promise<RestorePurchasesResult>;
};

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<SubscriptionProduct[]>([]);
  const [entitlements, setEntitlements] = useState<UserEntitlement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const prods = await fetchSubscriptionProducts();
      setProducts(prods);
      if (user) {
        const ents = await fetchUserEntitlements(user.id);
        setEntitlements(ents);
      } else {
        setEntitlements([]);
      }
    } catch {
      /* entitlements refresh failed */
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
      loading,
      isPremium,
      refresh,
      activateDemoPass,
      restoreStorePurchases,
    }),
    [products, entitlements, loading, isPremium, refresh, activateDemoPass, restoreStorePurchases]
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  const ctx = useContext(EntitlementsContext);
  if (!ctx) throw new Error('useEntitlements must be used within EntitlementsProvider');
  return ctx;
}
