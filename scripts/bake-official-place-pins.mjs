/**
 * Bake official Google Maps place pins for shops officialShopCoords rejects.
 * Soft Places stays parked — no neighborhood centers, no name search, no ranking.
 *
 * Resolution:
 * - Official `/maps/place/` URL: geometry for that URL's `1s0x…:0x…` feature.
 * - Otherwise: the shop's catalog `placeId` (Maps place page → same feature).
 * Pin is `[null,null,lat,lng]` from Google's `/maps/preview/place` payload,
 * which matches `!3d!4d` on official place URLs.
 *
 * Non-official Maps URLs are upgraded to `/maps/place/` with `!3d!4d` so the
 * pin counts. Official place URLs are left as-is; only `pin` is added.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "data/catalog.json");
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

/** Google place pins are published to 1e-7 degrees. Drop binary float noise. */
function roundCoord(value) {
  return Math.round(value * 1e7) / 1e7;
}

function asPin(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: roundCoord(lat), lng: roundCoord(lng) };
}

function isRiyadhPlacePin(pin) {
  if (!pin) return false;
  return (
    pin.lat >= 23.2 &&
    pin.lat <= 26.8 &&
    pin.lng >= 45.3 &&
    pin.lng <= 48.5
  );
}

function isOfficialMapsPlaceUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname);
    if (path.includes("/maps/search")) return false;
    return path.includes("/maps/place/");
  } catch {
    return false;
  }
}

function coordsFromMapsShareUrl(url) {
  if (!isOfficialMapsPlaceUrl(url) || !url) return null;
  const place = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place?.[1] && place[2]) return asPin(Number(place[1]), Number(place[2]));
  return null;
}

function officialShopCoords(shop) {
  const fromPlaceUrl = coordsFromMapsShareUrl(shop.mapsShareUrl);
  const raw =
    fromPlaceUrl ??
    (isOfficialMapsPlaceUrl(shop.mapsShareUrl) && shop.pin
      ? asPin(shop.pin.lat, shop.pin.lng)
      : null);
  return isRiyadhPlacePin(raw) ? raw : null;
}

function hexFromUrl(url) {
  const match = url?.match(/1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/i);
  if (!match?.[1] || !match[2]) return null;
  return `${match[1].toLowerCase()}:${match[2].toLowerCase()}`;
}

function officialPlaceUrl(hex, pin) {
  return `https://www.google.com/maps/place/data=!4m2!3m1!1s${hex}!8m2!3d${pin.lat}!4d${pin.lng}`;
}

function withOfficialPin(shop, pin, mapsShareUrl) {
  const next = {};
  let wrotePin = false;
  for (const [key, value] of Object.entries(shop)) {
    if (key === "pin") continue;
    next[key] = key === "mapsShareUrl" ? mapsShareUrl : value;
    if (key === "mapsShareUrl") {
      next.pin = pin;
      wrotePin = true;
    }
  }
  if (!("mapsShareUrl" in next)) next.mapsShareUrl = mapsShareUrl;
  if (!wrotePin) next.pin = pin;
  return next;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      "Accept-Language": "en",
      "User-Agent": UA,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.text();
}

async function withRetry(label, fn) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw new Error(`${label}: ${last instanceof Error ? last.message : last}`);
}

function previewHref(html, base) {
  const match = html.match(
    /(?:href|src)="((?:https?:\/\/(?:www\.)?google\.com)?\/maps\/preview\/place[^"]+)"/i,
  );
  if (!match?.[1]) return null;
  return new URL(match[1].replace(/&amp;/g, "&"), base).toString();
}

function parsePreview(text) {
  const raw = text.replace(/^\)\]\}'\s*/, "");
  const data = JSON.parse(raw);
  const place = data?.[6];
  if (!Array.isArray(place)) return null;
  const pinField = place[9];
  const lat = pinField?.[2];
  const lng = pinField?.[3];
  const hex =
    typeof place[10] === "string" ? place[10].toLowerCase() : null;
  const placeId = typeof place[78] === "string" ? place[78] : null;
  const name = typeof place[11] === "string" ? place[11] : null;
  const types = Array.isArray(place[13])
    ? place[13].filter((row) => typeof row === "string")
    : [];
  const permanentlyClosed = /permanently closed/i.test(text);
  return {
    pin: asPin(Number(lat), Number(lng)),
    hex,
    placeId,
    name,
    types,
    permanentlyClosed,
  };
}

const GENERIC_NAME = new Set([
  "coffee",
  "cafe",
  "the",
  "and",
  "specialty",
  "speciality",
  "roastery",
  "roasters",
  "shop",
  "al",
  "el",
]);

function looksLikeCafe(types) {
  return types.some((type) =>
    /coffee|cafe|café|roaster|tea|bakery|dessert|juice|matcha|قهوة|مقهى|محمصة|كوفي/i.test(
      type,
    ),
  );
}

/** Distinctive catalog name token appears in the Google place name. */
function nameAgrees(shop, previewName) {
  const tokens = `${shop.nameEn} ${shop.nameAr}`
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06ff]+/)
    .filter((token) => token.length >= 4 && !GENERIC_NAME.has(token));
  const name = (previewName ?? "").toLowerCase();
  return tokens.some((token) => name.includes(token));
}

async function resolveShop(shop) {
  const urlHex = hexFromUrl(shop.mapsShareUrl);
  const officialUrl = isOfficialMapsPlaceUrl(shop.mapsShareUrl);
  let pageUrl;
  if (officialUrl && shop.mapsShareUrl) {
    pageUrl = shop.mapsShareUrl;
  } else if (shop.placeId) {
    const query = encodeURIComponent(shop.nameEn || shop.id);
    pageUrl = `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${encodeURIComponent(shop.placeId)}`;
  } else {
    return { id: shop.id, reason: "no-place" };
  }

  const html = await withRetry(shop.id, () => fetchText(pageUrl));
  const href = previewHref(html, pageUrl);
  if (!href) return { id: shop.id, reason: "no-place" };

  const body = await withRetry(`${shop.id}:preview`, () => fetchText(href));
  let parsed;
  try {
    parsed = parsePreview(body);
  } catch {
    return { id: shop.id, reason: "no-place" };
  }
  if (!parsed?.pin || !parsed.hex) return { id: shop.id, reason: "no-place" };

  if (urlHex && parsed.hex !== urlHex) {
    return {
      id: shop.id,
      reason: "no-place",
      detail: `hex mismatch url=${urlHex} preview=${parsed.hex}`,
    };
  }
  let placeIdNote = null;
  if (shop.placeId && parsed.placeId && parsed.placeId !== shop.placeId) {
    // Official `/maps/place/` hex is the card's place. A stale catalog
    // placeId (other branch) must not block that place's pin.
    if (urlHex && parsed.hex === urlHex) {
      placeIdNote = `catalog placeId ${shop.placeId} differs from maps URL place ${parsed.placeId}`;
    } else {
      return {
        id: shop.id,
        reason: "no-place",
        detail: `placeId mismatch catalog=${shop.placeId} preview=${parsed.placeId}`,
      };
    }
  }
  if (!officialUrl && !looksLikeCafe(parsed.types) && !nameAgrees(shop, parsed.name)) {
    return {
      id: shop.id,
      reason: "no-place",
      detail: `placeId ${shop.placeId ?? ""} resolved to ${parsed.name ?? "unknown"} (${parsed.types.join(", ") || "no type"}), not this cafe`,
      name: parsed.name,
    };
  }
  if (parsed.permanentlyClosed && !isRiyadhPlacePin(parsed.pin)) {
    return { id: shop.id, reason: "closed", name: parsed.name };
  }
  if (!isRiyadhPlacePin(parsed.pin)) {
    return {
      id: shop.id,
      reason: "outside-riyadh",
      pin: parsed.pin,
      name: parsed.name,
      permanentlyClosed: parsed.permanentlyClosed,
    };
  }

  const mapsShareUrl = officialUrl
    ? shop.mapsShareUrl
    : officialPlaceUrl(parsed.hex, parsed.pin);

  return {
    id: shop.id,
    ok: true,
    pin: parsed.pin,
    hex: parsed.hex,
    name: parsed.name,
    placeId: parsed.placeId,
    mapsShareUrl,
    upgradedUrl: !officialUrl,
    permanentlyClosed: parsed.permanentlyClosed,
    previousPin: shop.pin ?? null,
    placeIdNote,
  };
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const before = catalog.shops.reduce(
  (counts, shop) => {
    if (officialShopCoords(shop)) counts.yes += 1;
    else counts.no += 1;
    return counts;
  },
  { total: catalog.shops.length, yes: 0, no: 0 },
);

const missing = catalog.shops.filter((shop) => !officialShopCoords(shop));
console.log(
  `before officialShopCoords yes=${before.yes} no=${before.no} total=${before.total}`,
);
console.log(`resolving ${missing.length}`);

const resolved = await mapPool(missing, 5, async (shop) => {
  try {
    const row = await resolveShop(shop);
    console.log(
      row.ok
        ? `ok ${shop.id} ${row.pin.lat},${row.pin.lng}${row.upgradedUrl ? " url" : ""}${row.permanentlyClosed ? " CLOSED" : ""}`
        : `fail ${shop.id} ${row.reason}${row.detail ? ` ${row.detail}` : ""}`,
    );
    return row;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`fail ${shop.id} no-place ${message}`);
    return { id: shop.id, reason: "no-place", detail: message };
  }
});

const byId = new Map(resolved.filter((row) => row.ok).map((row) => [row.id, row]));
catalog.shops = catalog.shops.map((shop) => {
  const row = byId.get(shop.id);
  if (!row) return shop;
  return withOfficialPin(shop, row.pin, row.mapsShareUrl);
});

const afterShops = catalog.shops;
const after = afterShops.reduce(
  (counts, shop) => {
    if (officialShopCoords(shop)) counts.yes += 1;
    else counts.no += 1;
    return counts;
  },
  { total: afterShops.length, yes: 0, no: 0 },
);

const still = afterShops
  .filter((shop) => !officialShopCoords(shop))
  .map((shop) => {
    const row = resolved.find((item) => item.id === shop.id);
    return {
      id: shop.id,
      reason: row?.reason ?? "no-place",
      detail: row?.detail ?? null,
      pin: row?.pin ?? null,
    };
  });

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const report = {
  before,
  after,
  applied: resolved.filter((row) => row.ok).length,
  upgradedUrls: resolved.filter((row) => row.ok && row.upgradedUrl).map((row) => row.id),
  still,
  rows: resolved,
};
writeFileSync(
  "/tmp/official-pin-bake-report.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `after officialShopCoords yes=${after.yes} no=${after.no} applied=${report.applied} still=${still.length}`,
);
