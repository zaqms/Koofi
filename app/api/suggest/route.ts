import { extractMapsUrl } from "@/lib/maps-url";
import { listSuggestions, recordSuggestion } from "@/lib/suggest";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(listSuggestions());
}

export async function POST(request: Request) {
  let body: { mapsUrl?: string; text?: string };

  try {
    body = (await request.json()) as { mapsUrl?: string; text?: string };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const raw =
    typeof body.mapsUrl === "string"
      ? body.mapsUrl
      : typeof body.text === "string"
        ? body.text
        : "";

  if (!extractMapsUrl(raw) && !raw.trim()) {
    const result = await recordSuggestion("");
    return Response.json(result, { status: 400 });
  }

  const result = await recordSuggestion(raw);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
