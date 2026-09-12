import { copy } from "@/lib/copy";
import { allowRate, clientIp } from "@/lib/feedback";
import {
  halfwayFrozenMore,
  halfwayPinFailCopy,
  restoreHalfwayPicks,
} from "@/lib/meet-halfway";
import {
  encodeHalfwayInviteId,
  parseHalfwayInviteToken,
  roundHalfwayPin,
} from "@/lib/halfway-invite";
import {
  resolveHalfwayInviteSession,
  upsertHalfwayInviteSession,
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
  const resolved = await resolveHalfwayInviteSession(id);
  if (!resolved.ok) {
    return Response.json(
      { error: resolved.reason, locations: [] },
      { status: resolved.reason === "expired" ? 410 : 400 },
    );
  }

  const shopIds = resolved.session.shopIds;
  const picks =
    shopIds.length > 0
      ? restoreHalfwayPicks({
          shopIds,
          language: resolved.seed.locale,
        })
      : [];
  const halfwayMore =
    picks.length > 0
      ? halfwayFrozenMore({
          locations: resolved.session.locations.map((pin) => ({ pin })),
          shopIds,
        })
      : false;

  return Response.json(
    {
      language: resolved.seed.locale,
      exp: resolved.session.expiresAt,
      locations: pinsToRows(resolved.session.locations),
      joined: resolved.joined,
      shop_ids: shopIds,
      picks,
      halfwayMore,
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
  let parsed = id ? parseHalfwayInviteToken(id) : null;
  if (!parsed?.ok) {
    const mintedPin = await resolveBodyPin(body);
    const locale = body.locale === "en" ? "en" : "ar";
    const mintedId = mintedPin
      ? encodeHalfwayInviteId({ locale, locations: [mintedPin] })
      : null;
    if (!mintedId) {
      const pinFail = !(parsed && !parsed.ok);
      return Response.json(
        {
          error: parsed && !parsed.ok ? "bad" : "bad_pin",
          reply: pinFail
            ? halfwayPinFailCopy(locale, [
                { text: typeof body.text === "string" ? body.text : undefined },
              ])
            : copy.meetHalfwayInviteExpired[locale],
          locations: [],
        },
        { status: 400 },
      );
    }
    id = mintedId;
    parsed = parseHalfwayInviteToken(id);
  }
  if (!parsed.ok) {
    return Response.json(
      {
        error: parsed.reason,
        reply: copy.meetHalfwayInviteExpired.ar,
        locations: [],
      },
      { status: 400 },
    );
  }

  const resolved = await resolveHalfwayInviteSession(id);
  if (!resolved.ok) {
    return Response.json(
      {
        error: resolved.reason,
        reply: copy.meetHalfwayInviteExpired[parsed.seed.locale],
        locations: [],
      },
      { status: resolved.reason === "expired" ? 410 : 400 },
    );
  }

  if (!allowRate(`halfway:${clientIp(request)}`, WRITE_LIMIT, WRITE_WINDOW_MS)) {
    return Response.json({ error: "rate_limited", locations: [] }, { status: 429 });
  }

  const incoming: Pin[] = [...resolved.session.locations];
  if (body.seed !== true) {
    const joined = await resolveBodyPin(body);
    if (!joined) {
      const locale = resolved.seed.locale === "en" ? "en" : "ar";
      return Response.json(
        {
          error: "bad_pin",
          reply: halfwayPinFailCopy(locale, [
            { text: typeof body.text === "string" ? body.text : undefined },
          ]),
          locations: pinsToRows(incoming),
        },
        { status: 400 },
      );
    }
    incoming.push(joined);
  }

  let stored = resolved.session;
  try {
    const next = await upsertHalfwayInviteSession({
      id,
      locations: incoming,
      expiresAt: resolved.session.expiresAt,
    });
    if (next) stored = next;
  } catch {
    stored = {
      ...resolved.session,
      locations: incoming,
    };
  }

  const shopIds = stored.shopIds;
  const picks =
    shopIds.length > 0
      ? restoreHalfwayPicks({
          shopIds,
          language: resolved.seed.locale,
        })
      : [];

  return Response.json({
    id,
    language: resolved.seed.locale,
    exp: stored.expiresAt,
    locations: pinsToRows(stored.locations),
    joined: stored.locations.length >= 2,
    shop_ids: shopIds,
    picks,
  });
}
