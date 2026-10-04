/**
 * بيننا invite privacy: random opaque ids, legacy redirect, analytics
 * redaction, no raw typed text in the dataLayer. Memory store only —
 * DATABASE_URL is cleared, no network, Places 0.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.VERCEL;

import {
  ANALYTICS_REDACT_BOOTSTRAP,
  isInvitePathname,
  redactAnalyticsParams,
  redactAnalyticsPath,
  redactAnalyticsUrl,
} from "../lib/analytics-redact";
import {
  encodeHalfwayInviteId,
  HALFWAY_INVITE_ID_PATTERN,
  isRandomHalfwayInviteId,
  mintHalfwayInviteId,
  parseHalfwayInviteToken,
} from "../lib/halfway-invite";
import {
  legacyInviteRedirectTarget,
  matchLegacyInvitePath,
} from "../lib/halfway-invite-legacy";
import {
  createHalfwayInviteSession,
  freezeHalfwayInviteResults,
  migrateLegacyHalfwayInvite,
  resolveHalfwayInviteSession,
} from "../lib/halfway-invite-store";
import { listRealShops } from "../lib/catalog";
import { halfwayInvitePath, halfwayInviteSharePath } from "../lib/product";
import {
  chatQueryParams,
  neighborhoodsSearchParams,
  resultsFeedbackParams,
  trackChatQuery,
  trackEvent,
  trackNeighborhoodsSearch,
} from "../lib/track";
import { redactVercelAnalyticsEvent } from "../components/redacted-analytics";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

// Made-up Riyadh pins (Olaya-ish host, Malqa-ish guest).
const HOST = { lat: 24.71355, lng: 46.67529 };
const GUEST = { lat: 24.81234, lng: 46.61987 };

/** Every textual / binary encoding of a coordinate we can think of. */
function coordinateNeedles(pin: { lat: number; lng: number }): string[] {
  const out = new Set<string>();
  for (const value of [pin.lat, pin.lng]) {
    for (const digits of [2, 3, 4, 5, 6]) {
      const fixed = value.toFixed(digits);
      out.add(fixed);
      out.add(fixed.replace(".", ""));
      out.add(fixed.replace(".", "%2E"));
      out.add(fixed.replace(".", ","));
    }
    out.add(String(value));
    out.add(String(Math.round(value * 1e5)));
    out.add(String(Math.round(value * 1e6)));
    out.add(String(Math.round(value * 1e7)));
    out.add(Math.round(value * 1e5).toString(16));
    out.add(Math.round(value * 1e5).toString(36));
  }
  return [...out];
}

function binaryNeedles(pin: { lat: number; lng: number }): Buffer[] {
  const out: Buffer[] = [];
  for (const value of [pin.lat, pin.lng]) {
    for (const size of [4, 8] as const) {
      for (const le of [true, false]) {
        const buf = Buffer.alloc(size);
        if (size === 4) {
          if (le) buf.writeFloatLE(value);
          else buf.writeFloatBE(value);
        } else if (le) buf.writeDoubleLE(value);
        else buf.writeDoubleBE(value);
        out.push(buf);
      }
    }
    const fixed = Buffer.alloc(4);
    fixed.writeInt32BE(Math.round(value * 1e5));
    out.push(fixed);
  }
  return out;
}

function decodings(segment: string): Buffer[] {
  const out: Buffer[] = [Buffer.from(segment, "utf8")];
  for (const piece of segment.split(/[._~-]/).concat(segment)) {
    try {
      out.push(Buffer.from(piece, "base64url"));
    } catch {}
    try {
      out.push(Buffer.from(piece, "base64"));
    } catch {}
    if (/^[0-9a-f]+$/i.test(piece) && piece.length % 2 === 0) out.push(Buffer.from(piece, "hex"));
  }
  try {
    out.push(Buffer.from(decodeURIComponent(segment), "utf8"));
  } catch {}
  return out;
}

function assertNoCoordinates(url: string, pin: { lat: number; lng: number }, label: string) {
  const segment = url.split("/h/")[1]?.split(/[?#]/)[0] ?? "";
  assert(segment, `${label}: has an /h/ segment`);
  const text = [url, ...decodings(segment).map((buf) => buf.toString("latin1"))].join("\n");
  for (const needle of coordinateNeedles(pin)) {
    assert(!text.includes(needle), `${label}: leaks coordinate text ${needle}`);
  }
  for (const buf of decodings(segment)) {
    for (const needle of binaryNeedles(pin)) {
      assert(!buf.includes(needle), `${label}: leaks binary coordinate`);
    }
  }
  assert(!parseHalfwayInviteToken(segment).ok, `${label}: id is not a decodable legacy token`);
}

async function main() {
  // ---- (a) new invites: random opaque id, no coordinates in any encoding ----
  const ids = new Set<string>();
  for (let i = 0; i < 200; i += 1) {
    const id = mintHalfwayInviteId();
    assert(HALFWAY_INVITE_ID_PATTERN.test(id), `minted id shape: ${id}`);
    assert(Buffer.from(id, "base64url").length === 16, "minted id is 128 random bits");
    ids.add(id);
  }
  assert(ids.size === 200, "minted ids never repeat");

  const first = await createHalfwayInviteSession({ locale: "ar", host: HOST });
  const second = await createHalfwayInviteSession({ locale: "ar", host: HOST });
  assert(first && second, "memory store creates invite sessions");
  assert(first.id !== second.id, "same pin → different ids (id is not derived from the pin)");
  assert(isRandomHalfwayInviteId(first.id), "new invite id is the random shape");
  for (const url of [
    halfwayInvitePath(first.id),
    halfwayInvitePath(first.id, "en"),
    halfwayInviteSharePath(first.id),
  ]) {
    assertNoCoordinates(url, HOST, `new invite ${url.startsWith("/en") ? "EN" : "AR"}`);
  }
  assert(
    first.session.expiresAt - Date.now() <= 45 * 60 * 1000 &&
      first.session.expiresAt - Date.now() > 44 * 60 * 1000,
    "new invite keeps the 45 min waiting expiry",
  );
  const lookup = await resolveHalfwayInviteSession(first.id);
  assert(lookup.ok, "guest page resolves the random id server-side");
  assert(
    lookup.session.locations[0]?.lat === HOST.lat && lookup.seed.locale === "ar",
    "host pin + locale come from the server lookup",
  );
  const frozen = await freezeHalfwayInviteResults({
    id: second.id,
    shopIds: listRealShops().slice(0, 3).map((shop) => shop.id),
    locations: [HOST, GUEST],
  });
  const frozenTtl = (frozen?.expiresAt ?? 0) - Date.now();
  assert(
    frozenTtl > 47 * 60 * 60 * 1000 && frozenTtl <= 48 * 60 * 60 * 1000,
    `results keep the 48 h expiry (${Math.round(frozenTtl / 60000)} min)`,
  );
  const unknown = await resolveHalfwayInviteSession(mintHalfwayInviteId());
  assert(!unknown.ok && unknown.reason === "bad", "unknown random id is bad, not a guessable hit");

  // The invite API mints through the store (route handler, memory mode).
  const route = await import("../app/api/halfway/invite/route");
  const res = await route.POST(
    new Request("http://localhost/api/halfway/invite", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7" },
      body: JSON.stringify({ lat: HOST.lat, lng: HOST.lng, locale: "en" }),
    }),
  );
  const minted = (await res.json()) as { id?: string; exp?: number };
  assert(res.status === 200 && minted.id, `POST /api/halfway/invite mints (${res.status})`);
  assert(isRandomHalfwayInviteId(minted.id), "API id is random");
  assertNoCoordinates(halfwayInvitePath(minted.id, "en"), HOST, "API invite");
  const chatSrc = read("components/chat.tsx");
  assert(!chatSrc.includes("encodeHalfwayInviteId"), "client never encodes coordinates into an id");

  // ---- (b) legacy /h/{base64-coords} → 307 to /h/{randomId} ----
  const legacyToken = encodeHalfwayInviteId({ locale: "ar", locations: [HOST] });
  assert(legacyToken && parseHalfwayInviteToken(legacyToken).ok, "legacy token fixture");
  const match = matchLegacyInvitePath(`/h/${legacyToken}`);
  assert(match?.token === legacyToken && !match.en, "proxy recognises AR legacy path");
  assert(matchLegacyInvitePath(`/en/h/${legacyToken}`)?.en, "proxy recognises EN legacy path");
  assert(!matchLegacyInvitePath(`/h/${first.id}`), "random ids are not treated as legacy");
  assert(!matchLegacyInvitePath("/h/expired"), "expired marker is not legacy");

  const legacyRoute = await import("../app/api/halfway/legacy/[token]/route");
  const redirect = await legacyRoute.GET(
    new Request(`http://localhost/api/halfway/legacy/${legacyToken}`, {
      headers: {
        "x-forwarded-for": "203.0.113.8",
        "x-wain-legacy-lang": "en",
        "x-wain-legacy-search": "?from=wa",
      },
    }),
    { params: Promise.resolve({ token: legacyToken }) },
  );
  const location = redirect.headers.get("location") ?? "";
  assert(redirect.status === 307, `legacy link answers 307 (${redirect.status})`);
  const newId = location.match(/^\/en\/h\/([^/?]+)\?from=wa$/)?.[1];
  assert(newId && isRandomHalfwayInviteId(newId), `legacy redirects to a random id: ${location}`);
  assertNoCoordinates(location, HOST, "legacy redirect target");
  assert(!location.includes(legacyToken), "redirect target drops the old token");
  const again = await migrateLegacyHalfwayInvite(legacyToken);
  assert(again.ok && again.id === newId, "legacy migration is idempotent (host + guest share one id)");
  const migrated = await resolveHalfwayInviteSession(newId);
  assert(migrated.ok && migrated.session.locations[0]?.lng === HOST.lng, "migrated session keeps the host pin");

  const expiredToken = encodeHalfwayInviteId({
    locale: "ar",
    locations: [GUEST],
    now: Date.now() - 2 * 60 * 60 * 1000,
  });
  assert(expiredToken, "expired fixture");
  const expiredOutcome = await migrateLegacyHalfwayInvite(expiredToken);
  assert(!expiredOutcome.ok && expiredOutcome.reason === "expired", "expired legacy mints nothing");
  assert(
    legacyInviteRedirectTarget({ token: expiredToken, en: false, search: "", outcome: expiredOutcome }) ===
      "/h/expired",
    "expired legacy → /h/expired (no coordinates)",
  );
  const fallback = legacyInviteRedirectTarget({
    token: legacyToken,
    en: false,
    search: "?from=wa",
    outcome: { ok: false, reason: "missing" },
  });
  assert(fallback.endsWith("legacy=1") && fallback.includes("from=wa"), "no store → old page, flagged so the proxy does not loop");

  const proxySrc = read("proxy.ts");
  assert(
    proxySrc.indexOf("NextResponse.rewrite") < proxySrc.indexOf("trackAICrawlerRequest(request"),
    "proxy redirects legacy links before DataFast crawler tracking",
  );

  // ---- (c) analytics redaction ----
  assert(redactAnalyticsPath("/h/xyz") === "/h/[invite]", "path redaction");
  assert(redactAnalyticsUrl("/h/xyz?foo=bar") === "/h/[invite]", "/h/xyz?foo=bar → /h/[invite]");
  assert(
    redactAnalyticsUrl("https://wain.lol/en/h/xyz?foo=bar#x") === "https://wain.lol/en/h/[invite]",
    "absolute EN invite URL redacted, query + hash dropped",
  );
  assert(
    redactAnalyticsUrl(`https://wain.lol/h/${legacyToken}?from=wa`) === "https://wain.lol/h/[invite]",
    "legacy token redacted",
  );
  assert(redactAnalyticsUrl("https://wain.lol/c/x?utm_source=a") === "https://wain.lol/c/x", "all queries dropped");
  assert(redactAnalyticsUrl("https://wain.lol/hawaf") === "https://wain.lol/hawaf", "non-invite paths untouched");
  assert(isInvitePathname("/h/abc") && isInvitePathname("/en/h/abc") && !isInvitePathname("/hittin"), "invite page match");
  assert(
    redactVercelAnalyticsEvent({ type: "pageview", url: "https://wain.lol/h/xyz?foo=bar" })?.url ===
      "https://wain.lol/h/[invite]",
    "Vercel Analytics beforeSend redacts",
  );
  const params = redactAnalyticsParams("meet_halfway_results", {
    pack_id: first.id,
    session_id: first.id,
    invite_id: first.id,
    page: `/h/${first.id}?from=wa`,
    count: 3,
  });
  assert(
    params?.pack_id === "[invite]" && params.session_id === "[invite]" && params.invite_id === "[invite]",
    "invite ids on بيننا events become [invite]",
  );
  assert(params?.page === "/h/[invite]" && params.count === 3, "URL params redacted, others kept");
  assert(
    redactAnalyticsParams("share_pack", { kind: "halfway", pack_id: "abc" })?.pack_id === "[invite]",
    "halfway share pack id redacted",
  );

  // Inline gtag bootstrap (runs before GTM) — same mapping.
  const pushed: unknown[][] = [];
  const noop = (() => {}) as (...args: unknown[]) => void;
  const history = { pushState: noop, replaceState: noop };
  const assigned: string[] = [];
  const href = `https://wain.lol/c/olaya-cafe?utm_source=x&lat=${HOST.lat}`;
  const sandbox = {
    window: {} as Record<string, unknown>,
    document: { referrer: `https://wain.lol/h/${first.id}?from=wa` },
    URL,
  };
  const win = sandbox.window;
  win.location = { href, assign: (u: string) => assigned.push(u) };
  win.history = history;
  win.dataLayer = { push: (args: unknown[]) => pushed.push(Array.from(args)) };
  runInNewContext(ANALYTICS_REDACT_BOOTSTRAP, sandbox);
  const firstSet = pushed[0] as [string, Record<string, string>];
  assert(firstSet?.[0] === "set", "bootstrap gtag('set') before GTM");
  assert(firstSet[1].page_location === "https://wain.lol/c/olaya-cafe", "bootstrap page_location: no query");
  assert(firstSet[1].page_path === "/c/olaya-cafe", "bootstrap page_path");
  assert(firstSet[1].page_referrer === "https://wain.lol/h/[invite]", "bootstrap page_referrer redacted");
  (win.history as typeof history).pushState({}, "", "/h/xyz?foo=bar");
  assert(assigned[0] === "/h/xyz?foo=bar" && pushed.length === 1, "in-app nav into /h/ becomes a full load (no GTM there)");
  (win.history as typeof history).pushState({}, "", "/en/hawaf?x=1");
  const navSet = pushed[1] as [string, Record<string, string>];
  assert(navSet?.[1].page_location === "https://wain.lol/en/hawaf", "SPA nav re-sets a clean page_location");

  const layoutSrc = read("app/layout.tsx");
  assert(layoutSrc.includes("TRACKERS_HEADER") && layoutSrc.includes("trackers ?"), "layout gates GTM + DataFast");
  assert(
    layoutSrc.indexOf("ANALYTICS_REDACT_BOOTSTRAP") < layoutSrc.indexOf("googletagmanager.com/gtm.js"),
    "redaction bootstrap runs before the GTM snippet",
  );
  assert(layoutSrc.includes("<RedactedAnalytics />") && !layoutSrc.includes("<Analytics />"), "Vercel Analytics goes through beforeSend");
  assert(proxySrc.includes('invitePage ? "off" : "on"'), "proxy turns trackers off on /h/*");

  // ---- (d) no raw typed text reaches the dataLayer ----
  const ask = "قهوة هادية قريب من الملقا";
  const search = "olaya north";
  const note = "my friend lives at 24.71355";
  const chat = chatQueryParams({ text: ask, locale: "ar" });
  const nb = neighborhoodsSearchParams({ query: search, locale: "en", city: "riyadh" });
  const fb = resultsFeedbackParams({
    locale: "en",
    feedback: "no",
    feedback_reason: "other",
    feedback_text: note,
    feedback_note: true,
    source: "halfway_results",
    feature: "halfway",
    packId: first.id,
    queryText: ask,
  });
  type WindowStub = { dataLayer: Array<Record<string, unknown>> };
  const stub: WindowStub = { dataLayer: [] };
  (globalThis as { window?: unknown }).window = stub;
  trackChatQuery({ text: ask, locale: "ar" });
  trackNeighborhoodsSearch({ query: search, locale: "en", city: "riyadh" });
  trackEvent("meet_halfway_feedback", fb);
  delete (globalThis as { window?: unknown }).window;
  const sent = JSON.stringify([chat, nb, fb, stub.dataLayer]);
  for (const needle of [ask, "الملقا", search, note, "24.71355"]) {
    assert(!sent.includes(needle), `raw text not sent: ${needle}`);
  }
  assert(!JSON.stringify(stub.dataLayer).includes(first.id), "raw invite id never reaches the dataLayer");
  assert(chat?.text_length === ask.length && chat.text_length_bucket === "11-25", "chat sends length + bucket");
  assert(nb?.text_length_bucket === "11-25", "district search sends a bucket");
  assert(stub.dataLayer.length === 3, `3 pushes (${stub.dataLayer.length})`);

  console.log("check-invite-privacy: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
