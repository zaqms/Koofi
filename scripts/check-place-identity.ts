/**
 * Place identity guard (2026-10-02 placeId audit follow-up).
 *
 * Offline, no API calls:
 *  1. No placeId is shared by two catalog rows.
 *  2. Each row's placeId decodes to the same Maps feature id as its share
 *     link (`!1s0x…:0x…`, or a cid-only link via data/place-identity-cid-map.json).
 *
 * A ChIJ place id is base64url of `0a 12 09 <hi u64 LE> 11 <lo u64 LE>`;
 * the feature id is `0x<hi>:0x<lo>` and the Maps cid is <lo> in decimal.
 */
import cidMap from "../data/place-identity-cid-map.json";
import { listRealShops } from "../lib/catalog";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

/**
 * Rows whose share link is an older feature id that Google now resolves to
 * the stored placeId (Place Details on the hex-derived id returns the stored
 * id). Same place, so it is allowed. Keep this list tiny and explain each.
 */
const IDENTITY_ALLOWLIST: Record<string, { placeId: string; shareFeatureId: string; why: string }> = {
  "y97-specialty-coffee-as-sahafah": {
    placeId: "ChIJc4imk-blLj4R7dr8sHHpDYU",
    shareFeatureId: "0x3e2ee500353c8e81:0xb2f5e1092e400825",
    why: "Stale Maps hex: ChIJgY48NQDlLj4RJQhALgnh9bI resolves to the stored id (audit 2026-10-02).",
  },
};

type FeatureId = { hi: bigint; lo: bigint };

export function featureIdFromPlaceId(placeId: string): FeatureId | null {
  if (!/^ChIJ[A-Za-z0-9_-]{23}$/.test(placeId)) return null;
  const bytes = Buffer.from(placeId, "base64url");
  if (bytes.length !== 20 || bytes[0] !== 0x0a || bytes[1] !== 0x12 || bytes[2] !== 0x09 || bytes[11] !== 0x11) {
    return null;
  }
  return { hi: bytes.readBigUInt64LE(3), lo: bytes.readBigUInt64LE(12) };
}

export function featureIdFromShareUrl(url: string | undefined): FeatureId | null {
  if (!url) return null;
  const hex = url.match(/1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/);
  if (hex?.[1] && hex[2]) return { hi: BigInt(hex[1]), lo: BigInt(hex[2]) };
  const cid = url.match(/[?&]cid=(\d+)/)?.[1];
  const mapped = cid ? (cidMap.cids as Record<string, string>)[cid] : undefined;
  if (mapped) {
    const [hi, lo] = mapped.split(":");
    if (hi && lo && BigInt(lo).toString() === cid) return { hi: BigInt(hi), lo: BigInt(lo) };
  }
  return null;
}

const fmt = (f: FeatureId) => `0x${f.hi.toString(16)}:0x${f.lo.toString(16)}`;
const same = (a: FeatureId, b: FeatureId) => a.hi === b.hi && a.lo === b.lo;

const shops = listRealShops();
const byPlaceId = new Map<string, string[]>();
const problems: string[] = [];

for (const shop of shops) {
  const placeId = shop.placeId;
  if (!placeId) continue;
  byPlaceId.set(placeId, [...(byPlaceId.get(placeId) ?? []), shop.id]);

  const fromId = featureIdFromPlaceId(placeId);
  const fromUrl = featureIdFromShareUrl(shop.mapsShareUrl);
  if (!fromId) {
    problems.push(`${shop.id}: placeId ${placeId} is not a decodable ChIJ id`);
    continue;
  }
  if (!fromUrl) {
    problems.push(`${shop.id}: mapsShareUrl has no 1s0x…:0x… feature id and no cid-map entry`);
    continue;
  }
  if (same(fromId, fromUrl)) continue;
  const allow = IDENTITY_ALLOWLIST[shop.id];
  if (allow && allow.placeId === placeId && allow.shareFeatureId === fmt(fromUrl)) continue;
  problems.push(`${shop.id}: placeId ${placeId} is ${fmt(fromId)} but the share link is ${fmt(fromUrl)}`);
}

for (const [placeId, ids] of byPlaceId) {
  if (ids.length > 1) problems.push(`placeId ${placeId} is shared by ${ids.join(", ")}`);
}

for (const id of Object.keys(IDENTITY_ALLOWLIST)) {
  assert(shops.some((shop) => shop.id === id), `allow-listed ${id} is still in the catalog`);
}

assert(problems.length === 0, `place identity:\n  ${problems.join("\n  ")}`);
assert(
  shops.filter((shop) => shop.placeId).length === shops.length,
  "every catalog row carries a placeId",
);

console.log(`check-place-identity: ${shops.length} rows, unique placeIds, placeId = share-link feature id (1 allow-listed).`);
