"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ShopClaimContextValue = {
  isVerified: (shopId: string) => boolean;
};

type ApiPayload = {
  ok?: boolean;
  verifiedIds?: string[];
};

const ShopClaimContext = createContext<ShopClaimContextValue | null>(null);

export function ShopClaimProvider({ children }: { children: ReactNode }) {
  const [verifiedIds, setVerifiedIds] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/claims")
      .then((response) => response.json() as Promise<ApiPayload>)
      .then((payload) => {
        if (cancelled || !payload.ok || !Array.isArray(payload.verifiedIds)) {
          return;
        }
        setVerifiedIds(payload.verifiedIds.filter((id) => typeof id === "string"));
      })
      .catch(() => {
        /* List stays without badges. Honest empty, not invented. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ShopClaimContextValue>(
    () => ({
      isVerified: (shopId) => verifiedIds.includes(shopId),
    }),
    [verifiedIds],
  );

  return (
    <ShopClaimContext.Provider value={value}>
      {children}
    </ShopClaimContext.Provider>
  );
}

export function useShopClaim(): ShopClaimContextValue {
  return useContext(ShopClaimContext) ?? { isVerified: () => false };
}
