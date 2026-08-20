import { formatReply, pickCafes } from "@/lib/picker";
import { cardPath } from "@/lib/public-url";
import { neighborhoodLabel } from "@/lib/neighborhoods";

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
    picks: result.picks.map((pick) => ({
      id: pick.shop.id,
      nameAr: pick.shop.nameAr,
      nameEn: pick.shop.nameEn,
      neighborhood: pick.shop.neighborhood,
      neighborhoodLabel: neighborhoodLabel(
        pick.shop.neighborhood,
        result.language,
      ),
      neighborhoodAr: pick.shop.neighborhoodAr,
      vibeTags: pick.shop.vibeTags,
      momentTags: pick.shop.momentTags,
      example: pick.shop.example,
      why: pick.why,
      cardPath: cardPath(pick.shop.id),
      hasPin: Boolean(pick.shop.pin),
    })),
  });
}
