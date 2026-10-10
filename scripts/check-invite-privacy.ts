/**
 * بيننا invite privacy: random opaque ids, legacy redirect + input
 * validation, clean-URL redirect / tracker gating (real proxy() + the
 * inline bootstrap in a VM), expired-row sweep, store-mode + webhook
 * env gates, no raw typed text in the dataLayer. Memory store only:
 * DATABASE_URL is cleared, fetch is stubbed, Places 0.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
delete process.env.HALFWAY_ALLOW_NONPROD_DB;
delete process.env.HALFWAY_RESULTS_WEBHOOK_KEY;

import { NextRequest, type NextFetchEvent } from "next/server";
import {
  ANALYTICS_REDACT_BOOTSTRAP,
  isInvitePathname,
  isTrackerFreePathname,
  redactAnalyticsParams,
  redactAnalyticsPath,
  redactAnalyticsReferrer,
  redactAnalyticsUrl,
  trackersAllowed,
  TRACKERS_HEADER,
} from "../lib/analytics-redact";
import { CONSENT_AUTOLOAD_SCRIPT, consentBootstrapScript, CONSENT_STORAGE_KEY, GTM_SRC } from "../lib/consent";
import {
  encodeHalfwayInviteId,
  HALFWAY_INVITE_ID_PATTERN,
  isRandomHalfwayInviteId,
  mintHalfwayInviteId,
  parseHalfwayInviteToken,
} from "../lib/halfway-invite";
import {
  isLegacyInviteToken,
  LEGACY_SEARCH_HEADER,
  legacyInviteRedirectTarget,
  matchLegacyInvitePath,
  sanitizeLegacySearch,
} from "../lib/halfway-invite-legacy";
import {
  canonicalHalfwayInviteId,
  createHalfwayInviteSession,
  freezeHalfwayInviteResults,
  halfwayStoreKind,
  migrateLegacyHalfwayInvite,
  readHalfwayInviteSession,
  resolveHalfwayInviteSession,
  sweepExpiredHalfwayInvites,
} from "../lib/halfway-invite-store";
import { proxy } from "../proxy";
import { listRealShops } from "../lib/catalog";
import { meetHalfwayChatPicks } from "../lib/meet-halfway";
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

  // ---- (b2) legacy route: reachable without the proxy, so validate input ----
  const badTokens = ["not-a-token", `${"a".repeat(700)}.${"b".repeat(10)}`, "a.b/c", "..", "%2e%2e"];
  for (const bad of badTokens) {
    const res404 = await legacyRoute.GET(
      new Request(`http://localhost/api/halfway/legacy/x`, { headers: { "x-forwarded-for": "203.0.113.9" } }),
      { params: Promise.resolve({ token: bad }) },
    );
    assert(res404.status === 404 && !res404.headers.get("location"), `legacy route rejects bad token ${bad.slice(0, 20)}`);
  }
  const dirtyLegacy = await legacyRoute.GET(
    new Request(`http://localhost/api/halfway/legacy/${legacyToken}`, {
      headers: {
        "x-forwarded-for": "203.0.113.8",
        "x-wain-legacy-lang": "fr",
        "x-wain-legacy-search": `?from=wa&lat=${HOST.lat}&next=https://evil.example&utm_source=x&legacy=1`,
      },
    }),
    { params: Promise.resolve({ token: legacyToken }) },
  );
  const dirtyLocation = dirtyLegacy.headers.get("location") ?? "";
  assert(
    dirtyLocation === `/h/${newId}?from=wa&utm_source=x`,
    `legacy search header is allowlisted (from + utm only), lang en|ar only: ${dirtyLocation}`,
  );
  assert(
    sanitizeLegacySearch(`?from=${"x".repeat(600)}`).toString() === "" &&
      sanitizeLegacySearch(`?from=${"y".repeat(65)}`).toString() === "",
    "oversized legacy search / values dropped",
  );
  assert(isLegacyInviteToken(legacyToken) && !isLegacyInviteToken(`${"a".repeat(601)}.b`), "token length cap");

  // Legacy mints are rate-limited per IP (chat passes the IP too).
  let limited = false;
  for (let i = 0; i < 40 && !limited; i += 1) {
    const fresh = encodeHalfwayInviteId({
      locale: "ar",
      locations: [{ lat: 24.6 + i / 1000, lng: 46.7 }],
    });
    assert(fresh, "fresh legacy fixture");
    const outcome = await canonicalHalfwayInviteId(fresh, { ip: "198.51.100.77" });
    if (!outcome.ok && outcome.reason === "rate_limited") limited = true;
  }
  assert(limited, "legacy migration via canonicalHalfwayInviteId is rate-limited per IP");
  const chatRouteSrc = read("app/api/chat/route.ts");
  assert(
    /canonicalHalfwayInviteId\([^)]*\{\s*ip:\s*clientIp\(request\)/.test(chatRouteSrc),
    "/api/chat passes the client IP when it canonicalizes a legacy id",
  );
  const legacyRouteSrc = read("app/api/halfway/legacy/[token]/route.ts");
  assert(legacyRouteSrc.includes("isLegacyInviteToken(token)"), "legacy route validates the token");

  // ---- (c) analytics redaction ----
  assert(redactAnalyticsPath("/h/xyz") === "/h/[invite]", "path redaction");
  assert(redactAnalyticsUrl("/h/xyz?foo=bar") === "/h/[invite]", "/h/xyz?foo=bar → /h/[invite]");
  assert(
    redactAnalyticsUrl("https://wain.lol/en/h/xyz?utm_source=a&foo=bar#x") === "https://wain.lol/en/h/[invite]",
    "absolute EN invite URL redacted, whole query + hash dropped (even utm)",
  );
  assert(
    redactAnalyticsUrl(`https://wain.lol/h/${legacyToken}?from=wa`) === "https://wain.lol/h/[invite]",
    "legacy token redacted",
  );
  assert(
    redactAnalyticsUrl("https://wain.lol/c/x?utm_source=a&gclid=G1&lat=24.7&q=hi&from=wa#h") ===
      "https://wain.lol/c/x?utm_source=a&gclid=G1&from=wa",
    "non-invite pages keep utm / gclid / from, drop everything else",
  );
  assert(
    redactAnalyticsUrl("https://wain.lol/owner/edit?shop=a&token=SECRET&utm_source=x") ===
      "https://wain.lol/owner/edit",
    "owner magic link loses its query",
  );
  assert(
    redactAnalyticsReferrer("https://wain.lol/c/x?utm_source=a&gclid=G1") === "https://wain.lol/c/x",
    "referrers never carry a query",
  );
  assert(redactAnalyticsUrl("https://wain.lol/hawaf") === "https://wain.lol/hawaf", "non-invite paths untouched");
  assert(isInvitePathname("/h/abc") && isInvitePathname("/en/h/abc") && !isInvitePathname("/hittin"), "invite page match");
  assert(
    redactVercelAnalyticsEvent({ type: "pageview", url: "https://wain.lol/h/xyz?foo=bar" })?.url ===
      "https://wain.lol/h/[invite]",
    "Vercel Analytics beforeSend redacts",
  );
  assert(
    redactVercelAnalyticsEvent({ type: "pageview", url: "https://wain.lol/en?utm_campaign=c&foo=1" })?.url ===
      "https://wain.lol/en?utm_campaign=c",
    "Vercel Analytics keeps utm on normal pages",
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

  // Clean-URL predicate.
  assert(trackersAllowed("/en", "?utm_source=x&gclid=1&from=wa") && trackersAllowed("/c/x", ""), "attribution-only query is clean");
  assert(!trackersAllowed("/en", "?foo=1") && !trackersAllowed("/en", "?lat=24.7"), "unknown keys are dirty");
  for (const path of ["/h/abc", "/en/h/abc", "/h", "/owner/edit", "/en/owner/edit", "/ops", "/ops/claims"]) {
    assert(!trackersAllowed(path, "") && isTrackerFreePathname(path), `${path} is tracker-free`);
  }
  assert(trackersAllowed("/owner", "?shop=x") && trackersAllowed("/hittin", ""), "owner landing + /hittin are trackable");

  // ---- (c2) proxy behaviour (real proxy(), NextRequest) ----
  const realFetch = globalThis.fetch;
  const beacons: string[] = [];
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    beacons.push(String(init?.body ?? ""));
    return new Response("ok");
  }) as typeof fetch;
  const pending: Promise<unknown>[] = [];
  const fakeEvent = { waitUntil: (p: Promise<unknown>) => void pending.push(p) } as unknown as NextFetchEvent;
  const doc = { accept: "text/html,application/xhtml+xml", "sec-fetch-dest": "document" };
  const run = (url: string, headers: Record<string, string> = doc, method = "GET") =>
    proxy(new NextRequest(`https://wain.lol${url}`, { headers, method }), fakeEvent);
  const trackersOf = (res: Response) => res.headers.get(`x-middleware-request-${TRACKERS_HEADER}`);
  try {
    type Case = { url: string; trackers?: "on" | "off"; redirect?: string; headers?: Record<string, string> };
    const cases: Case[] = [
      { url: "/", trackers: "on" },
      { url: "/en?utm_source=x&gclid=G", trackers: "on" },
      { url: "/c/olaya?from=wa", trackers: "on" },
      { url: "/owner?shop=abc", trackers: "on" },
      { url: "/en?foo=1&utm_source=x", redirect: "/en?utm_source=x" },
      { url: `/c/olaya?lat=${HOST.lat}&lng=${HOST.lng}`, redirect: "/c/olaya" },
      { url: "/hawaf?q=%D9%82%D9%87%D9%88%D8%A9&gclid=G&from=wa", redirect: "/hawaf?gclid=G&from=wa" },
      { url: "/h/abc?foo=1", trackers: "off" },
      { url: `/en/h/${first.id}?from=wa`, trackers: "off" },
      { url: "/owner/edit?shop=a&token=SECRET", trackers: "off" },
      { url: "/en/owner/edit?shop=a&token=SECRET", trackers: "off" },
      { url: "/ops/claims?err=x", trackers: "off" },
      // Never redirected: platform params, route handlers, non-document fetches.
      { url: "/en?_vercel_share=abc", trackers: "off" },
      { url: "/go/maps?lat=24.7&lng=46.6", trackers: "off" },
      { url: "/c/olaya/opengraph-image?x=1", trackers: "off" },
      { url: "/en?foo=1", trackers: "off", headers: { rsc: "1", accept: "*/*" } },
      { url: "/en?foo=1", trackers: "off", headers: { accept: "*/*", "sec-fetch-dest": "empty" } },
      { url: "/en?foo=1&_rsc=abc", trackers: "off", headers: { accept: "*/*" } },
    ];
    for (const c of cases) {
      const res = await run(c.url, c.headers);
      if (c.redirect) {
        assert(res.status === 307, `${c.url}: 307 (${res.status})`);
        assert(new URL(res.headers.get("location") ?? "").pathname + new URL(res.headers.get("location") ?? "").search === c.redirect, `${c.url} → ${c.redirect} (${res.headers.get("location")})`);
        assert(res.headers.get("cache-control") === "no-store" && res.headers.get("referrer-policy") === "no-referrer", `${c.url}: redirect is no-store + no-referrer`);
        assert(!trackersOf(res), `${c.url}: redirect carries no layout`);
        continue;
      }
      assert(res.status === 200 && !res.headers.get("location"), `${c.url}: not redirected (${res.status})`);
      assert(trackersOf(res) === c.trackers, `${c.url}: trackers ${c.trackers} (${trackersOf(res)})`);
      const policy = res.headers.get("referrer-policy");
      assert(c.trackers === "on" ? policy === null : policy === "strict-origin", `${c.url}: referrer policy ${policy}`);
    }
    // The client can't force trackers on.
    const forced = await run("/h/abc", { ...doc, [TRACKERS_HEADER]: "on" });
    assert(trackersOf(forced) === "off", "proxy overwrites a client-sent trackers header");
    // Legacy link is rewritten to the route handler, before anything else.
    const legacyRes = await run(`/en/h/${legacyToken}?from=wa&foo=1`);
    const rewrite = legacyRes.headers.get("x-middleware-rewrite") ?? "";
    assert(rewrite.includes(`/api/halfway/legacy/${legacyToken}`) && !rewrite.includes("?"), `legacy rewrite (${rewrite})`);
    assert(legacyRes.headers.get(`x-middleware-request-${LEGACY_SEARCH_HEADER}`) === "?from=wa&foo=1", "legacy search handed to the route");

    // DataFast server beacon: only on clean URLs, redacted.
    const bot = { ...doc, "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)", referer: "https://chatgpt.com/?q=secret" };
    beacons.length = 0;
    await run(`/h/${first.id}`, bot);
    await run("/owner/edit?shop=a&token=SECRET", bot);
    await run("/en?foo=1", { ...bot, accept: "*/*", "sec-fetch-dest": "empty" });
    await Promise.allSettled(pending.splice(0));
    assert(beacons.length === 0, `no crawler beacon on tracker-free / dirty URLs (${beacons.length})`);
    await run("/c/olaya?utm_source=x", bot);
    await Promise.allSettled(pending.splice(0));
    const beacon = beacons.join("\n");
    assert(!beacon.includes("secret") && !beacon.includes(first.id) && !beacon.includes("token=SECRET"), "crawler beacon carries no private URL / referrer query");
    console.log(`  proxy: ${cases.length + 2} cases, crawler beacons on clean URL: ${beacons.length}`);
  } finally {
    globalThis.fetch = realFetch;
  }

  // ---- (c3) inline bootstrap in a VM (runs before GTM, fail-closed) ----
  type Sandbox = {
    window: Record<string, unknown>;
    pushed: unknown[][];
    assigned: string[];
    replaced: string[];
    native: string[];
  };
  const boot = (href: string, referrer = ""): Sandbox => {
    const box: Sandbox = { window: {}, pushed: [], assigned: [], replaced: [], native: [] };
    const win = box.window;
    win.location = {
      href,
      assign: (u: string) => box.assigned.push(u),
      replace: (u: string) => box.replaced.push(u),
    };
    win.history = {
      pushState: (_s: unknown, _t: unknown, u: string) => box.native.push(`push:${u}`),
      replaceState: (_s: unknown, _t: unknown, u: string) => box.native.push(`replace:${u}`),
    };
    win.dataLayer = { push: (args: unknown[]) => box.pushed.push(Array.from(args)) };
    runInNewContext(ANALYTICS_REDACT_BOOTSTRAP, {
      window: win,
      document: { referrer },
      URL,
      URLSearchParams,
    });
    return box;
  };
  const cleanBox = boot(
    "https://wain.lol/c/olaya-cafe?utm_source=x&gclid=G1&from=wa",
    `https://wain.lol/h/${first.id}?from=wa`,
  );
  assert(cleanBox.window.__wainTrackers === true, "clean URL: bootstrap allows trackers");
  const firstSet = cleanBox.pushed[0] as [string, Record<string, string>];
  assert(firstSet?.[0] === "set", "bootstrap gtag('set') before GTM");
  assert(
    firstSet[1].page_location === "https://wain.lol/c/olaya-cafe?utm_source=x&gclid=G1&from=wa",
    `bootstrap page_location keeps utm / gclid / from (${firstSet[1].page_location})`,
  );
  assert(firstSet[1].page_path === "/c/olaya-cafe", "bootstrap page_path");
  assert(firstSet[1].page_referrer === "https://wain.lol/h/[invite]", "bootstrap page_referrer redacted, no query");
  const hist = cleanBox.window.history as Record<string, (s: unknown, t: unknown, u: string) => void>;
  hist.pushState({}, "", "/h/xyz?foo=bar");
  assert(cleanBox.assigned[0] === "/h/xyz?foo=bar" && cleanBox.native.length === 0, "pushState into /h/ → full load (assign)");
  hist.replaceState({}, "", "/en?lat=24.7");
  assert(cleanBox.replaced[0] === "/en?lat=24.7" && cleanBox.native.length === 0, "replaceState to a dirty URL → location.replace");
  hist.pushState({}, "", "/owner/edit?shop=a&token=T");
  assert(cleanBox.assigned[1] === "/owner/edit?shop=a&token=T", "pushState into owner/edit → full load");
  hist.pushState({}, "", "/en/hawaf?utm_source=y");
  const navSet = cleanBox.pushed[1] as [string, Record<string, string>];
  assert(
    navSet?.[1].page_location === "https://wain.lol/en/hawaf?utm_source=y" && cleanBox.native[0] === "push:/en/hawaf?utm_source=y",
    "clean SPA nav goes through and re-sets page_location",
  );
  assert(cleanBox.pushed.length === 2, "dirty navigations set nothing");
  for (const dirtyHref of [
    "https://wain.lol/en?foo=1",
    `https://wain.lol/h/${first.id}`,
    "https://wain.lol/owner/edit?shop=a&token=T",
    "https://wain.lol/ops",
  ]) {
    const dirtyBox = boot(dirtyHref);
    assert(dirtyBox.window.__wainTrackers === false && dirtyBox.pushed.length === 0, `dirty ${dirtyHref}: no trackers, no set`);
  }
  // Fail closed: a throwing environment leaves trackers off.
  const broken: Record<string, unknown> = { location: { get href() { throw new Error("x"); } } };
  runInNewContext(ANALYTICS_REDACT_BOOTSTRAP, { window: broken, document: {}, URL, URLSearchParams });
  assert(broken.__wainTrackers === false, "bootstrap fails closed");

  // GTM: #251's consent bootstrap is the only loader. It loads GTM only
  // after Accept (or a stored Accept, via CONSENT_AUTOLOAD_SCRIPT) AND when
  // this redaction bootstrap said the URL is clean (__wainTrackers === true).
  // After its Accept-time dataLayer reset it re-applies the redacted
  // page_location (window.__wainRedactSet) before gtm.js.
  type Combined = { win: Record<string, unknown>; appended: string[]; dataLayer: unknown[] };
  const combined = (href: string, stored: string | null, opts: { redact: boolean; autoload: boolean }, referrer = ""): Combined => {
    const appended: string[] = [];
    const head = { appendChild: (node: { src: string }) => appended.push(node.src) };
    const win: Record<string, unknown> = {
      location: { href, assign: () => undefined, replace: () => undefined },
      history: { pushState: () => undefined, replaceState: () => undefined },
      addEventListener: () => undefined,
      dispatchEvent: () => true,
      localStorage: { getItem: (k: string) => (k === CONSENT_STORAGE_KEY ? stored : null) },
    };
    const documentStub = { referrer, createElement: () => ({ async: false, src: "" }), head, documentElement: head };
    const ctx = { window: win, document: documentStub, URL, URLSearchParams, CustomEvent: class {} };
    runInNewContext(consentBootstrapScript(), ctx);
    if (opts.redact) runInNewContext(ANALYTICS_REDACT_BOOTSTRAP, ctx);
    if (opts.autoload) runInNewContext(CONSENT_AUTOLOAD_SCRIPT, ctx);
    return { win, appended, dataLayer: win.dataLayer as unknown[] };
  };
  const granted = JSON.stringify({ v: 1, c: "granted" });
  const asList = (entry: unknown) => (entry && typeof entry === "object" && "length" in (entry as object) ? Array.from(entry as ArrayLike<unknown>) : [entry]);
  {
    // Clean page, stored Accept: GTM once; order default → redaction → update → page_location → gtm.js.
    const c = combined("https://wain.lol/c/olaya-cafe?utm_source=x&gclid=G1", granted, { redact: true, autoload: true }, `https://wain.lol/h/${first.id}?from=wa`);
    assert(c.appended.length === 1 && c.appended[0] === GTM_SRC, "clean URL + stored Accept: GTM loads once");
    const kinds = c.dataLayer.map((e) => {
      const a = asList(e);
      return a[0] === "consent" ? `consent:${String(a[1])}` : a[0] === "set" ? (typeof a[1] === "string" ? `set:${a[1]}` : "set:page") : (e as { event?: string }).event ?? "?";
    });
    assert(kinds.join(",") === "consent:default,set:ads_data_redaction,consent:update,set:page,gtm.js", `Accept reset re-applies page_location before gtm.js (${kinds.join(",")})`);
    const page = asList(c.dataLayer[3])[1] as Record<string, string>;
    assert(page.page_location === "https://wain.lol/c/olaya-cafe?utm_source=x&gclid=G1" && page.page_referrer === "https://wain.lol/h/[invite]", "re-applied page_location keeps attribution; referrer is /h/[invite]");
  }
  {
    // Clean page, no choice: nothing loads; Accept (grantConsent → __wainLoadGtm) loads GTM.
    const c = combined("https://wain.lol/en", null, { redact: true, autoload: true });
    assert(c.appended.length === 0, "clean URL, no choice: GTM off");
    (c.win.__wainLoadGtm as () => void)();
    assert((c.appended.length as number) === 1, "clean URL, Accept: GTM loads");
  }
  for (const href of [`https://wain.lol/h/${first.id}`, `https://wain.lol/en/h/${first.id}`, "https://wain.lol/owner/edit?shop=a&token=T", "https://wain.lol/ops"]) {
    // Tracker-free page: the layout renders neither the redaction nor the autoload.
    const c = combined(href, granted, { redact: false, autoload: false });
    (c.win.__wainLoadGtm as () => void)();
    assert(c.appended.length === 0, `${href}: GTM never loads, even after Accept`);
  }
  {
    // A dirty URL that slipped past the 307: redaction says no, so Accept loads nothing.
    const c = combined("https://wain.lol/en?lat=24.7", granted, { redact: true, autoload: true });
    (c.win.__wainLoadGtm as () => void)();
    assert(c.win.__wainTrackers === false && c.appended.length === 0, "dirty URL: GTM off even with Accept");
  }

  // ---- (c4) source: every tracker is behind both gates ----
  const layoutSrc = read("app/layout.tsx");
  assert(layoutSrc.includes(`headerList.get(TRACKERS_HEADER) === "on"`), "layout fails closed (header must be \"on\")");
  const head = layoutSrc.slice(layoutSrc.indexOf("<head>"), layoutSrc.indexOf("</head>"));
  const at = (needle: string) => head.indexOf(needle);
  assert(at("consentBootstrapScript()") >= 0 && at("consentBootstrapScript()") < at("ANALYTICS_REDACT_BOOTSTRAP }}") && at("ANALYTICS_REDACT_BOOTSTRAP }}") < at("CONSENT_AUTOLOAD_SCRIPT }}"), "<head> order: consent bootstrap → redaction bootstrap → autoload");
  assert(!/googletagmanager\.com|gtm\.js|ns\.html|datafa\.st|<Analytics|<RedactedAnalytics|next\/script/.test(layoutSrc), "layout loads no tracker itself (consent bootstrap / ConsentManager only)");
  assert(layoutSrc.includes("<ConsentManager language={language} trackers={trackers} />"), "ConsentManager gets the trackers verdict");
  const managerSrc = read("components/consent-manager.tsx");
  assert(managerSrc.includes("<RedactedAnalytics />") && !managerSrc.includes("<Analytics />"), "Vercel Analytics goes through beforeSend");
  assert(/\{trackers \? \(\s*<Script\s+src=\{DATAFAST_SRC\}/.test(managerSrc), "DataFast needs trackers (and sits in the granted branch)");
  const TRACKER_RE = /googletagmanager\.com|datafa\.st\/js|ANALYTICS_REDACT_BOOTSTRAP \}|CONSENT_AUTOLOAD_SCRIPT \}/g;
  const allowed = new Set(["app/layout.tsx", "lib/analytics-redact.ts", "lib/consent.ts", "components/consent-manager.tsx"]);
  const walk = (dir: string): string[] =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return walk(rel);
      return /\.(tsx?|jsx?|mjs)$/.test(entry.name) ? [rel] : [];
    });
  const sources = [...walk("app"), ...walk("components"), ...walk("lib"), "proxy.ts", "next.config.ts"];
  for (const file of sources) {
    const text = read(file);
    if (!TRACKER_RE.test(text)) continue;
    TRACKER_RE.lastIndex = 0;
    assert(allowed.has(file), `tracker script referenced outside the gated files: ${file}`);
  }
  // Each layout tracker script sits inside a `{trackers ? (` branch.
  const layoutLines = layoutSrc.split("\n");
  let gatedCount = 0;
  for (const [index, line] of layoutLines.entries()) {
    if (!/ANALYTICS_REDACT_BOOTSTRAP \}|CONSENT_AUTOLOAD_SCRIPT \}/.test(line)) continue;
    const before = layoutLines.slice(0, index).join("\n");
    const open = before.lastIndexOf("{trackers ? (");
    assert(open >= 0 && open > before.lastIndexOf(") : null}"), `layout line ${index + 1} sits inside an open {trackers ? (…) : null} branch`);
    gatedCount += 1;
  }
  assert(gatedCount === 2, `2 gated tracker scripts in the layout (${gatedCount})`);
  const proxySrc2 = read("proxy.ts");
  assert(proxySrc2.includes('clean ? "on" : "off"') && proxySrc2.includes("cleanUrlRedirect(request)"), "proxy sets trackers from the clean-URL predicate");
  assert(
    proxySrc2.indexOf("NextResponse.rewrite") < proxySrc2.indexOf("cleanUrlRedirect(request)") &&
      proxySrc2.indexOf("cleanUrlRedirect(request)") < proxySrc2.indexOf("trackAICrawlerRequest(request"),
    "proxy order: legacy rewrite → clean redirect → DataFast",
  );

  // ---- (c5) store mode + expired-row sweep + prod-only webhook ----
  const envKeys = ["VERCEL", "VERCEL_ENV", "DATABASE_URL", "POSTGRES_URL", "HALFWAY_ALLOW_NONPROD_DB"] as const;
  const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  const setEnv = (values: Partial<Record<(typeof envKeys)[number], string>>) => {
    for (const key of envKeys) delete process.env[key];
    Object.assign(process.env, values);
  };
  const db = "postgres://user:pw@example.invalid/db";
  const matrix: Array<[Partial<Record<(typeof envKeys)[number], string>>, string]> = [
    [{}, "memory"],
    [{ DATABASE_URL: db }, "memory"],
    [{ DATABASE_URL: db, HALFWAY_ALLOW_NONPROD_DB: "1" }, "neon"],
    [{ VERCEL: "1", VERCEL_ENV: "preview", DATABASE_URL: db }, "missing"],
    [{ VERCEL: "1", VERCEL_ENV: "preview", DATABASE_URL: db, HALFWAY_ALLOW_NONPROD_DB: "1" }, "neon"],
    [{ VERCEL: "1", VERCEL_ENV: "preview" }, "missing"],
    [{ VERCEL: "1", VERCEL_ENV: "development", DATABASE_URL: db }, "missing"],
    [{ VERCEL: "1", VERCEL_ENV: "production", DATABASE_URL: db }, "neon"],
    [{ VERCEL: "1", VERCEL_ENV: "production" }, "missing"],
  ];
  try {
    for (const [values, expected] of matrix) {
      setEnv(values);
      assert(halfwayStoreKind() === expected, `store kind ${JSON.stringify(values)} → ${expected} (${halfwayStoreKind()})`);
    }
    // Preview with the prod DATABASE_URL: no invite is written anywhere.
    setEnv({ VERCEL: "1", VERCEL_ENV: "preview", DATABASE_URL: db });
    assert((await createHalfwayInviteSession({ locale: "ar", host: HOST })) === null, "preview without opt-in writes nothing");
  } finally {
    setEnv({});
    for (const key of envKeys) if (savedEnv[key] !== undefined) process.env[key] = savedEnv[key];
  }
  assert(halfwayStoreKind() === "memory", "env restored (memory)");

  const sweepNow = Date.now();
  const stale = await createHalfwayInviteSession({ locale: "ar", host: HOST, now: sweepNow - 26 * 60 * 60 * 1000 });
  const recent = await createHalfwayInviteSession({ locale: "ar", host: HOST, now: sweepNow - 2 * 60 * 60 * 1000 });
  const live = await createHalfwayInviteSession({ locale: "ar", host: HOST, now: sweepNow });
  const staleLegacy = encodeHalfwayInviteId({ locale: "en", locations: [GUEST], now: sweepNow - 30 * 60 * 1000 });
  assert(stale && recent && live && staleLegacy, "sweep fixtures");
  const staleLegacyMint = await migrateLegacyHalfwayInvite(staleLegacy, { now: sweepNow - 30 * 60 * 1000 });
  assert(staleLegacyMint.ok, "legacy fixture minted");
  const swept = await sweepExpiredHalfwayInvites({ now: sweepNow });
  assert(swept >= 1, `sweep deleted rows past expiry + 24 h (${swept})`);
  assert(!(await readHalfwayInviteSession(stale.id, 0)), "row expired > 24 h ago is gone");
  assert(await readHalfwayInviteSession(recent.id, 0), "row expired < 24 h ago is kept (expired screen still works)");
  assert(await readHalfwayInviteSession(live.id, 0), "live row kept");
  const sweptLater = await sweepExpiredHalfwayInvites({ now: sweepNow + 48 * 60 * 60 * 1000 });
  assert(sweptLater >= 2, `later sweep clears the rest (${sweptLater})`);
  const afterSweep = await migrateLegacyHalfwayInvite(staleLegacy, { now: sweepNow + 48 * 60 * 60 * 1000 });
  assert(!afterSweep.ok && afterSweep.reason === "expired", "swept legacy mapping is gone too (no resurrection)");
  const storeSrc = read("lib/halfway-invite-store.ts");
  assert(!/\b(ALTER|CREATE)\s+(TABLE|UNIQUE|INDEX)/i.test(storeSrc), "store runs no DDL at request time");
  assert(/DELETE FROM halfway_invites/.test(storeSrc), "store sweeps expired rows");
  const migrationSql = read("sql/halfway-invites-privacy.sql");
  for (const needle of ["ADD COLUMN IF NOT EXISTS locale", "ADD COLUMN IF NOT EXISTS host_locations", "ADD COLUMN IF NOT EXISTS legacy_key", "halfway_invites_legacy_key_idx", "halfway_invites_expires_at_idx"]) {
    assert(migrationSql.includes(needle), `migration has ${needle}`);
  }

  const { notifyHalfwayResults } = await import("../lib/halfway-results-webhook");
  const hookFetch = globalThis.fetch;
  const savedHook = { key: process.env.HALFWAY_RESULTS_WEBHOOK_KEY, env: process.env.VERCEL_ENV };
  let hookPosts = 0;
  globalThis.fetch = (async () => {
    hookPosts += 1;
    return new Response("ok");
  }) as typeof fetch;
  try {
    process.env.HALFWAY_RESULTS_WEBHOOK_KEY = "test-key";
    const pinPair = [{ pin: HOST }, { pin: GUEST }];
    const picks = meetHalfwayChatPicks({ locations: pinPair, language: "en" });
    assert(picks.length > 0, "webhook fixture picks");
    for (const env of ["preview", "development", undefined]) {
      if (env) process.env.VERCEL_ENV = env;
      else delete process.env.VERCEL_ENV;
      const outcome = await notifyHalfwayResults({ locale: "en", picks, midpoint: HOST, locations: pinPair, source: "invite" });
      assert(outcome === "skipped", `webhook stubs on ${env ?? "local"} even with the key (${outcome})`);
    }
    assert(hookPosts === 0, "no webhook POST outside production");
  } finally {
    globalThis.fetch = hookFetch;
    if (savedHook.key === undefined) delete process.env.HALFWAY_RESULTS_WEBHOOK_KEY;
    else process.env.HALFWAY_RESULTS_WEBHOOK_KEY = savedHook.key;
    if (savedHook.env === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = savedHook.env;
  }

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
