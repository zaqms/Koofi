import {
  canReadLearn,
  listLearnEvents,
  recordLearnMaps,
} from "@/lib/learn";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!canReadLearn(request)) {
    return new Response("not found", { status: 404 });
  }
  return Response.json(listLearnEvents());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      kind?: string;
      shopId?: string;
      pickIndex?: number;
      session?: string;
    };
    if (body.kind !== "maps") {
      return Response.json({ ok: true });
    }
    recordLearnMaps({
      shopId: body.shopId,
      pickIndex: body.pickIndex,
      session: body.session,
    });
  } catch {
    // Best-effort. Never fail the Maps click.
  }
  return Response.json({ ok: true });
}
