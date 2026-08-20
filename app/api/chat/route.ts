import { extractMapsUrl, looksLikeHttpUrl } from "@/lib/maps-url";
import { formatReply, pickCafes, toChatPicks } from "@/lib/picker";
import { bilingual, recordSuggestion } from "@/lib/suggest";
import { copy } from "@/lib/copy";

export const runtime = "nodejs";

type ChatRequest = {
  text?: string;
  beenIds?: string[];
  suggesting?: boolean;
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

  if (extractMapsUrl(text)) {
    const suggestion = await recordSuggestion(text);
    return Response.json({
      language: "ar",
      reply: suggestion.reply,
      thinCatalog: false,
      picks: [],
      suggestion: suggestion.ok,
    });
  }

  if (body.suggesting || looksLikeHttpUrl(text)) {
    return Response.json({
      language: "ar",
      reply: bilingual(copy.suggestBad),
      thinCatalog: false,
      picks: [],
      suggestion: false,
    });
  }

  const result = pickCafes({ text, beenIds });

  return Response.json({
    language: result.language,
    reply: formatReply(result),
    thinCatalog: result.thinCatalog,
    picks: toChatPicks(result),
  });
}
