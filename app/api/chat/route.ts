import { copy } from "@/lib/copy";
import { extractMapsUrl, looksLikeHttpUrl } from "@/lib/maps-url";
import { formatReply, pickCafes, toChatPicks } from "@/lib/picker";
import { recordSuggestion } from "@/lib/suggest";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";

type ChatRequest = {
  text?: string;
  beenIds?: string[];
  suggesting?: boolean;
  landing?: Language;
};

function landingLanguage(value: unknown): Language {
  return value === "en" ? "en" : "ar";
}

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

  const landing = landingLanguage(body.landing);

  const beenIds = Array.isArray(body.beenIds)
    ? body.beenIds.filter((id): id is string => typeof id === "string")
    : [];

  if (extractMapsUrl(text)) {
    const suggestion = await recordSuggestion(text, landing);
    return Response.json({
      language: landing,
      reply: suggestion.reply,
      thinCatalog: false,
      picks: [],
      suggestion: suggestion.ok,
    });
  }

  if (body.suggesting || looksLikeHttpUrl(text)) {
    return Response.json({
      language: landing,
      reply: copy.suggestBad[landing],
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
