import {
  addIdea,
  allowAdd,
  clientIp,
  loadFeedbackSnapshot,
} from "@/lib/feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await loadFeedbackSnapshot();
  return Response.json({ ok: true, ...snapshot });
}

export async function POST(request: Request) {
  if (!allowAdd(clientIp(request))) {
    const snapshot = await loadFeedbackSnapshot();
    return Response.json(
      { ok: false, error: "rate_limited", ...snapshot },
      { status: 429 },
    );
  }

  let body: { body?: unknown };
  try {
    body = (await request.json()) as { body?: unknown };
  } catch {
    return Response.json({ ok: false, error: "empty" }, { status: 400 });
  }

  const result = await addIdea(body.body);
  if (!result.ok) {
    const status =
      result.error === "no_storage"
        ? 503
        : result.error === "too_long" || result.error === "empty"
          ? 400
          : 400;
    return Response.json(
      { ok: false, error: result.error, ...result.snapshot },
      { status },
    );
  }

  return Response.json({ ok: true, ...result.snapshot });
}
