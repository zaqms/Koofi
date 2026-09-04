import { allowVote, clientIp } from "@/lib/feedback";
import { loadShopUpvoteSnapshot, voteShop } from "@/lib/upvotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowVote(clientIp(request))) {
    const snapshot = await loadShopUpvoteSnapshot();
    return Response.json(
      { ok: false, error: "rate_limited", ...snapshot },
      { status: 429 },
    );
  }

  let body: { id?: unknown };
  try {
    body = (await request.json()) as { id?: unknown };
  } catch {
    return Response.json({ ok: false, error: "not_found" }, { status: 400 });
  }

  const result = await voteShop(body.id);
  if (!result.ok) {
    const status =
      result.error === "no_storage"
        ? 503
        : result.error === "not_found"
          ? 404
          : 400;
    return Response.json(
      { ok: false, error: result.error, ...result.snapshot },
      { status },
    );
  }

  return Response.json({
    ok: true,
    already: result.already,
    shopId: result.shopId,
    votes: result.votes,
    ...result.snapshot,
  });
}
