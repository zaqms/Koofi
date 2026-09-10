import { copy } from "@/lib/copy";
import { allowRate, clientIp } from "@/lib/feedback";
import {
  encodeHalfwayInviteId,
  halfwayInviteHasGuest,
  inspectHalfwayInviteId,
  roundHalfwayPin,
} from "@/lib/halfway-invite";
import {
  readHalfwayInviteLocations,
  writeHalfwayInviteLocations,
} from "@/lib/halfway-invite-store";
import { resolveSharedPin } from "@/lib/shared-pin";
import type { Pin } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITE_WINDOW_MS = 10 * 60 * 1000;
const WRITE_LIMIT = 12;

function inviteIdFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pinsToRows(pins: Pin[]) {
  return pins.map((pin) => ({ lat: pin.lat, lng: pin.lng }));
}

async function resolveBodyPin(body: {
  lat?: unknown;
  lng?: unknown;
  text?: unknown;
}): Promise<Pin | null> {
  const fromCoords = roundHalfwayPin(
    typeof body.lat === "number" ? body.lat : Number.NaN,
    typeof body.lng === "number" ? body.lng : Number.NaN,
  );
  if (fromCoords) return fromCoords;
  if (typeof body.text === "string" && body.text.trim()) {
    const pin = await resolveSharedPin(body.text);
    if (pin) return roundHalfwayPin(pin.lat, pin.lng);
  }
  return null;
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  const inspected = inspectHalfwayInviteId(id);
  if (!inspected.ok) {
    return Response.json(
      { error: inspected.reason, locations: [] },
      { status: inspected.reason === "expired" ? 410 : 400 },
    );
  }

  let stored: Pin[] | null = null;
  try {
    stored = await readHalfwayInviteLocations(id);
  } catch {
    stored = null;
  }
  const locations = stored && stored.length > inspected.seed.locations.length
    ? stored
    : inspected.seed.locations;

  return Response.json(
    {
      language: inspected.seed.locale,
      exp: inspected.seed.exp,
      locations: pinsToRows(locations),
      joined: halfwayInviteHasGuest(inspected.seed.locations, locations),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  let body: {
    id?: unknown;
    lat?: unknown;
    lng?: unknown;
    text?: unknown;
    seed?: unknown;
    locale?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  let id = inviteIdFrom(body.id);
  let inspected = id ? inspectHalfwayInviteId(id) : null;
  if (!inspected?.ok) {
    const mintedPin = await resolveBodyPin(body);
    const locale = body.locale === "en" ? "en" : "ar";
    const mintedId = mintedPin
      ? encodeHalfwayInviteId({ locale, locations: [mintedPin] })
      : null;
    if (!mintedId) {
      return Response.json(
        {
          error: inspected && !inspected.ok ? inspected.reason : "bad_pin",
          reply: copy.meetHalfwayInviteExpired.ar,
          locations: [],
        },
        { status: inspected && !inspected.ok && inspected.reason === "expired" ? 410 : 400 },
      );
    }
    id = mintedId;
    inspected = inspectHalfwayInviteId(id);
  }
  if (!inspected.ok) {
    return Response.json(
      {
        error: inspected.reason,
        reply: copy.meetHalfwayInviteExpired.ar,
        locations: [],
      },
      { status: inspected.reason === "expired" ? 410 : 400 },
    );
  }

  if (!allowRate(`halfway:${clientIp(request)}`, WRITE_LIMIT, WRITE_WINDOW_MS)) {
    return Response.json({ error: "rate_limited", locations: [] }, { status: 429 });
  }

  const incoming: Pin[] = [...inspected.seed.locations];
  if (body.seed !== true) {
    const joined = await resolveBodyPin(body);
    if (!joined) {
      return Response.json(
        { error: "bad_pin", locations: pinsToRows(incoming) },
        { status: 400 },
      );
    }
    incoming.push(joined);
  }

  let stored: Pin[] | null = null;
  try {
    stored = await writeHalfwayInviteLocations({
      id,
      locations: incoming,
      expiresAt: inspected.seed.exp,
    });
  } catch {
    stored = null;
  }

  return Response.json({
    id,
    language: inspected.seed.locale,
    exp: inspected.seed.exp,
    locations: pinsToRows(stored ?? incoming),
  });
}
