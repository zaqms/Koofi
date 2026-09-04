"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { trackEvent } from "@/lib/track";
import type { Language } from "@/lib/types";
import {
  emptyShopUpvoteSnapshot,
  type ShopUpvoteError,
  type ShopUpvoteSnapshot,
} from "@/lib/upvotes-types";

type VoteOutcome = "ok" | "already" | ShopUpvoteError | "error";

type ShopUpvoteContextValue = {
  countFor: (shopId: string) => number;
  hasVoted: (shopId: string) => boolean;
  votingId: string | null;
  errorFor: (shopId: string) => ShopUpvoteError | "error" | null;
  vote: (shopId: string, language: Language) => Promise<VoteOutcome>;
};

type ApiPayload = {
  ok?: boolean;
  already?: boolean;
  error?: ShopUpvoteError;
  counts?: Record<string, number>;
  votedIds?: string[];
  storage?: ShopUpvoteSnapshot["storage"];
  shopId?: string;
  votes?: number;
};

const ShopUpvoteContext = createContext<ShopUpvoteContextValue | null>(null);

function applySnapshot(
  current: ShopUpvoteSnapshot,
  payload: ApiPayload,
): ShopUpvoteSnapshot {
  const next: ShopUpvoteSnapshot = {
    counts: payload.counts ?? current.counts,
    votedIds: payload.votedIds ?? current.votedIds,
    storage: payload.storage ?? current.storage,
  };
  if (payload.shopId && typeof payload.votes === "number") {
    next.counts = { ...next.counts, [payload.shopId]: payload.votes };
  }
  return next;
}

export function ShopUpvoteProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ShopUpvoteSnapshot>(
    emptyShopUpvoteSnapshot(),
  );
  const [votingId, setVotingId] = useState<string | null>(null);
  const [errorShop, setErrorShop] = useState<{
    shopId: string;
    error: ShopUpvoteError | "error";
  } | null>(null);
  const inflight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/upvotes")
      .then((response) => response.json())
      .then((payload: ApiPayload) => {
        if (cancelled) return;
        setSnapshot((current) => applySnapshot(current, payload));
      })
      .catch(() => {
        /* Counts stay 0 until a later vote or refresh. Honest empty, not invented. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const vote = useCallback(async (shopId: string, language: Language) => {
    if (inflight.current) return "error";
    inflight.current = true;
    setVotingId(shopId);
    setErrorShop(null);
    try {
      const response = await fetch("/api/upvotes/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: shopId }),
      });
      const payload = (await response.json()) as ApiPayload;
      if (!payload.ok) {
        const error = payload.error ?? "error";
        setErrorShop({ shopId, error });
        if (payload.counts) {
          setSnapshot((current) => applySnapshot(current, payload));
        }
        return error;
      }
      setSnapshot((current) => applySnapshot(current, payload));
      if (!payload.already) {
        trackEvent(
          "cafe_upvote",
          { shop_id: shopId, locale: language },
          { dedupeKey: `cafe_upvote:${shopId}` },
        );
      }
      return payload.already ? "already" : "ok";
    } catch {
      setErrorShop({ shopId, error: "error" });
      return "error";
    } finally {
      inflight.current = false;
      setVotingId(null);
    }
  }, []);

  const value = useMemo<ShopUpvoteContextValue>(
    () => ({
      countFor: (shopId) => snapshot.counts[shopId] ?? 0,
      hasVoted: (shopId) => snapshot.votedIds.includes(shopId),
      votingId,
      errorFor: (shopId) =>
        errorShop && errorShop.shopId === shopId ? errorShop.error : null,
      vote,
    }),
    [errorShop, snapshot, vote, votingId],
  );

  return (
    <ShopUpvoteContext.Provider value={value}>
      {children}
    </ShopUpvoteContext.Provider>
  );
}

export function useShopUpvote(): ShopUpvoteContextValue {
  const ctx = useContext(ShopUpvoteContext);
  if (!ctx) {
    throw new Error("useShopUpvote must be used under ShopUpvoteProvider");
  }
  return ctx;
}
