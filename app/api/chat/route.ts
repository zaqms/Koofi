import { formatReply, pickCafes, toChatPicks } from "@/lib/picker";

export const runtime = "nodejs";

type ChatRequest = {
  text?: string;
  beenIds?: string[];
};

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "empty_text" }, { status: 400 });
  }

  const beenIds = Array.isArray(body.beenIds)
    ? body.beenIds.filter((id): id is string => typeof id === "string")
    : [];

  const result = pickCafes({ text, beenIds });

  return Response.json({
    language: result.language,
    reply: formatReply(result),
    thinCatalog: result.thinCatalog,
    picks: toChatPicks(result),
  });
}
