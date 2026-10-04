import { copy } from "@/lib/copy";
import { allowRate, clientIp } from "@/lib/feedback";
import {
  halfwayFrozenMore,
  halfwayPinFailCopy,
  restoreHalfwayPicks,
} from "@/lib/meet-halfway";
import { roundHalfwayPin } from "@/lib/halfway-invite";
import {
  canonicalHalfwayInviteId,
  createHalfwayInviteSession,
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
  const rawId = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  // Legacy coordinate tokens resolve through their migrated random id.
  const canonical = await canonicalHalfwayInviteId(rawId, { ip: clientIp(request) });
  if (!canonical.ok && canonical.reason !== "missing") {
    return Response.json(
      { error: canonical.reason === "expired" ? "expired" : "bad", locations: [] },
      { status: canonical.reason === "expired" ? 410 : 400 },
    );
  }
  const id = canonical.ok ? canonical.id : rawId;
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

  const locale = body.locale === "en" ? "en" : "ar";
  let id = inviteIdFrom(body.id);
  if (id) {
    const canonical = await canonicalHalfwayInviteId(id, { ip: clientIp(request) });
    if (!canonical.ok && canonical.reason !== "missing") {
      return Response.json(
        {
          error: canonical.reason === "expired" ? "expired" : "bad",
          reply: copy.meetHalfwayInviteExpired[locale],
          locations: [],
        },
        { status: canonical.reason === "expired" ? 410 : 400 },
      );
    }
    // No store (local without DB): legacy tokens keep the stateless read.
    if (canonical.ok) id = canonical.id;
  } else {
    // New invite: random opaque id, host pin stays server-side.
    const mintedPin = await resolveBodyPin(body);
    if (!mintedPin) {
      return Response.json(
        {
          error: "bad_pin",
          reply: halfwayPinFailCopy(locale, [
            { text: typeof body.text === "string" ? body.text : undefined },
          ]),
          locations: [],
        },
        { status: 400 },
      );
    }
    if (!allowRate(`halfway:${clientIp(request)}`, WRITE_LIMIT, WRITE_WINDOW_MS)) {
      return Response.json({ error: "rate_limited", locations: [] }, { status: 429 });
    }
    let created: Awaited<ReturnType<typeof createHalfwayInviteSession>> = null;
    try {
      created = await createHalfwayInviteSession({ locale, host: mintedPin });
    } catch {
      created = null;
    }
    if (!created) {
      return Response.json(
        {
          error: "no_storage",
          reply: copy.meetHalfwayInvitesPaused[locale],
          locations: [],
        },
        { status: 503 },
      );
    }
    return Response.json({
      id: created.id,
      language: locale,
      exp: created.session.expiresAt,
      locations: pinsToRows(created.session.locations),
      joined: false,
      shop_ids: [],
      picks: [],
    });
  }

  const resolved = await resolveHalfwayInviteSession(id);
  if (!resolved.ok) {
    return Response.json(
      {
        error: resolved.reason,
        reply: copy.meetHalfwayInviteExpired[locale],
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
