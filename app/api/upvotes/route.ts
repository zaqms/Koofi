import { loadShopUpvoteSnapshot } from "@/lib/upvotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadShopUpvoteSnapshot();
  return Response.json({ ok: true, ...snapshot });
}
