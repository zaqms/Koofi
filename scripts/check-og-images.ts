/**
 * Café share cards (/c/{id}/opengraph-image, /en/c/{id}/opengraph-image) and
 * the Tonight card embed the café logo/photo into Satori, which only decodes
 * PNG / JPEG / GIF. A webp logo used to 500 the card (qamaria-hittin and both
 * house-of-matcha cafés, Oct 2026). This check keeps every catalog image
 * Satori-safe by its bytes and renders the cards that used to break.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import catalogFile from "../data/catalog.json";
import { cafeOpenGraphImage } from "../lib/cafe-og-image";
import { publicOgImageDataUri, sniffOgImageMime } from "../lib/og-image-data";
import { loadTonightHeroDataUri } from "../lib/tonight-hero";
import type { Shop } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

// Known not-Satori-safe catalog images, waiting on a real asset. The card
// renders without the tile (no 500). Remove an entry once its file is fixed;
// the check fails if a listed file becomes safe, so this list only shrinks.
const PENDING_OG_SAFE_IMAGE = new Set<string>([
  // 16x16 favicon saved as .png (bytes are ICO); 18 Drive Coffee branches.
  "/logos/drive-coffee-site.png",
]);

// Sniffer: the formats Satori can and can't draw.
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);
const ICO = Uint8Array.from([0, 0, 1, 0, 1, 0, 16, 16]);
assert(sniffOgImageMime(PNG) === "image/png", "PNG bytes sniff as image/png");
assert(sniffOgImageMime(JPEG) === "image/jpeg", "JPEG bytes sniff as image/jpeg");
assert(sniffOgImageMime(WEBP) === null, "webp is not Satori-safe");
assert(sniffOgImageMime(ICO) === null, "ico is not Satori-safe");

const shops = (catalogFile as unknown as { shops: Shop[] }).shops;
const bad: string[] = [];
const pendingSeen = new Set<string>();
for (const shop of shops) {
  for (const field of ["logoUrl", "photoUrl"] as const) {
    const path = shop[field]?.trim();
    if (!path || !path.startsWith("/") || path.startsWith("//")) continue;
    const file = join(process.cwd(), "public", path);
    if (!existsSync(file)) {
      bad.push(`${shop.id} ${field} ${path}: file missing`);
      continue;
    }
    const safe = sniffOgImageMime(readFileSync(file)) !== null;
    if (PENDING_OG_SAFE_IMAGE.has(path)) {
      pendingSeen.add(path);
      assert(!safe, `${path} is OG-safe now: drop it from PENDING_OG_SAFE_IMAGE`);
      continue;
    }
    if (!safe) bad.push(`${shop.id} ${field} ${path}: not PNG/JPEG/GIF bytes (Satori can't draw it)`);
  }
}
assert(bad.length === 0, `catalog images Satori can't embed:\n  ${bad.join("\n  ")}`);
for (const path of PENDING_OG_SAFE_IMAGE) {
  assert(pendingSeen.has(path), `${path} is no longer in the catalog: drop it from PENDING_OG_SAFE_IMAGE`);
}

// The three cafés whose cards 500'd embed a logo again.
const REGRESSION = ["qamaria-hittin", "house-of-matcha-al-mohammadiyah", "house-of-matcha-sulimaniyah"];
for (const id of REGRESSION) {
  const shop = shops.find((s) => s.id === id);
  assert(shop, `${id} in catalog`);
  assert(publicOgImageDataUri(shop.logoUrl), `${id} logo embeds in the share card`);
}
// Mislabelled bytes get the real mime (JPEG saved as .png used to draw blank).
const mislabelled = shops.find((s) => s.id === "coffee-address-al-hamra");
if (mislabelled?.logoUrl?.endsWith(".png")) {
  assert(
    publicOgImageDataUri(mislabelled.logoUrl)?.startsWith("data:image/jpeg;base64,"),
    "JPEG bytes in a .png logo embed as image/jpeg",
  );
}

async function renders(id: string, lang: "ar" | "en") {
  const res = await cafeOpenGraphImage({ params: Promise.resolve({ id }) }, lang);
  const buf = new Uint8Array(await res.arrayBuffer());
  assert(sniffOgImageMime(buf) === "image/png" && buf.length > 5_000, `${id} ${lang} card renders a PNG`);
}

(async () => {
  for (const id of [...REGRESSION, "drive-al-rabi", "coffee-address-al-hamra", "woods-olaya"]) {
    await renders(id, "ar");
    await renders(id, "en");
  }
  const hero = await loadTonightHeroDataUri("/logos/qamaria-hittin.webp");
  assert(hero === null, "a webp Tonight hero is dropped, not embedded as image/webp");
  console.log("check-og-images: ok");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
