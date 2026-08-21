import { isAddShopIntent } from "@/lib/add-shop-intent";
import { copy } from "@/lib/copy";
import { isOffTopicAsk } from "@/lib/off-topic-intent";
import { recordLearnAsk } from "@/lib/learn";
import { extractMapsUrl, looksLikeHttpUrl } from "@/lib/maps-url";
import { pickCafes, toChatPicksWithPlaces } from "@/lib/picker";
import { recordSuggestion } from "@/lib/suggest";
import type { Language } from "@/lib/types";
import { speakForPicks } from "@/lib/voice";

export const runtime = "nodejs";

type ChatRequest = {
  text?: string;
  beenIds?: string[];
  suggesting?: boolean;
  landing?: Language;
  via?: "typed" | "chip";
  session?: string;
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

  if (body.via !== "chip" && isAddShopIntent(text)) {
    return Response.json({
      language: landing,
      reply: copy.askMaps[landing],
      thinCatalog: false,
      picks: [],
      awaitingMaps: true,
    });
  }

  if (body.via !== "chip" && isOffTopicAsk(text)) {
    return Response.json({
      language: landing,
      reply: copy.offTopic[landing],
      thinCatalog: false,
      picks: [],
    });
  }

  const result = pickCafes({ text, beenIds, language: landing });
  const [picks, reply] = await Promise.all([
    toChatPicksWithPlaces(result),
    speakForPicks({ userText: text, landing, result }),
  ]);

  recordLearnAsk({
    text,
    landing,
    via: body.via,
    session: body.session,
    shopIds: picks.map((pick) => pick.id),
  });

  return Response.json({
    language: result.language,
    reply,
    thinCatalog: result.thinCatalog,
    picks,
  });
}
