export type ShopUpvoteError = "rate_limited" | "no_storage" | "not_found";

export type ShopVoteAction = "upvote" | "unvote";

export type ShopUpvoteSnapshot = {
  counts: Record<string, number>;
  votedIds: string[];
  storage: "ready" | "missing";
};

export const SHOP_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,80}$/i;

export function emptyShopUpvoteSnapshot(
  storage: ShopUpvoteSnapshot["storage"] = "ready",
): ShopUpvoteSnapshot {
  return { counts: {}, votedIds: [], storage };
}

/** Shape only — catalog membership is checked on the server. */
export function parseShopIdShape(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim();
  if (!SHOP_ID_PATTERN.test(id)) return undefined;
  return id;
}

/** Missing action is upvote so older clients stay one-way. */
export function parseVoteAction(raw: unknown): ShopVoteAction | undefined {
  if (raw === undefined || raw === "upvote") return "upvote";
  if (raw === "unvote") return "unvote";
  return undefined;
}
