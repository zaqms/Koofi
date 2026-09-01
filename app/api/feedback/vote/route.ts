import {
  allowVote,
  clientIp,
  loadFeedbackSnapshot,
  voteIdea,
} from "@/lib/feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowVote(clientIp(request))) {
    const snapshot = await loadFeedbackSnapshot();
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

  const result = await voteIdea(body.id);
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

  return Response.json({ ok: true, already: result.already, ...result.snapshot });
}
