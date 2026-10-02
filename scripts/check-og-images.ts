/**
 * Café share cards (/c/{id}/opengraph-image, /en/c/{id}/opengraph-image) and
 * the Tonight card embed the café logo/photo into Satori, which only decodes
 * PNG / JPEG / GIF. A webp logo used to 500 the card (qamaria-hittin and both
 * house-of-matcha cafés, Oct 2026). This check keeps every catalog image
 * Satori-safe by its bytes and renders the cards that used to break.
 *
 * It also covers the Arabic word order on those cards: Satori has no bidi,
 * so «دا نونا» used to paint as «نونا دا» and «هاوس اوف» lost its space.
 * lib/og-bidi.ts splits an RTL line into units and lib/og-rtl-text.tsx lays
 * them out right-to-left with shaped widths and explicit gaps.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import catalogFile from "../data/catalog.json";
import { cafeOpenGraphImage } from "../lib/cafe-og-image";
import { hasRtlText, ogBidiUnits, ogBidiVisual } from "../lib/og-bidi";
import { OG_RTL_EXTRA_GAP_EM, ogFontMeasurer, ogRtlGap, ogRtlUnits } from "../lib/og-rtl-text";
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

// --- Arabic word order (bidi) on the cards -------------------------------
// ogBidiVisual is the left-to-right paint order of the units, with a space
// wherever a gap is drawn: what a reader of the card should see.
const VISUAL: [string, string][] = [
  ["دا نونا", "نونا دا"],
  ["هاوس اوف ماتشا", "ماتشا اوف هاوس"],
  ["قمرية", "قمرية"],
  ["MA قهوه مختصه", "مختصه قهوه MA"],
  ["O2 كوفي", "كوفي O2"],
  ["45 درجة", "درجة 45"],
  ["برو92", "92برو"],
  ["عنوان القهوة (البشور)", "(البشور) القهوة عنوان"],
  ["باركا (قهوة مختصه)", "(مختصه قهوة) باركا"],
  ["محمصة قهوة شفل | العارض", "العارض | شفل قهوة محمصة"],
  ["소모 | سومو", "سومو | 소모"],
  ["د.كيف كافيه", "كافيه كيف.د"],
  ["Coffee & Co قهوة", "قهوة Coffee & Co"],
  ["The Gate Specialty Coffee", "The Gate Specialty Coffee"],
  ["  دا \u202b  نونا\u202c ", "نونا دا"],
];
for (const [logical, visual] of VISUAL) {
  assert(ogBidiVisual(logical) === visual, `bidi «${logical}» paints as «${visual}», got «${ogBidiVisual(logical)}»`);
}
const daNonna = ogBidiUnits("دا نونا");
assert(
  daNonna.length === 2 && daNonna[0]!.text === "دا" && daNonna[0]!.spaceAfter && !daNonna[1]!.spaceAfter,
  "«دا نونا» is two RTL units, first (rightmost) دا, one gap",
);
const matcha = ogBidiUnits("هاوس اوف ماتشا");
assert(
  matcha.map((u) => u.text).join("|") === "هاوس|اوف|ماتشا" && matcha.filter((u) => u.spaceAfter).length === 2,
  "«هاوس اوف ماتشا» keeps both spaces (no «اوفهاوس»)",
);
const ma = ogBidiUnits("MA قهوه مختصه");
assert(ma[0]!.text === "MA" && ma[0]!.dir === "ltr", "a Latin run is one LTR unit");
assert(ogBidiUnits("The Gate Specialty Coffee").length === 1, "a Latin-only AR name stays one unit, in order");
assert(hasRtlText("وودز") && !hasRtlText("Woods 92"), "hasRtlText");
// Every catalog AR name / district: the units keep every character (brackets
// mirrored), and a gap is drawn exactly where the name has whitespace.
const unmirror = (t: string) => t.replace(/[()[\]{}<>«»]/g, (c) => ({ "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<", "«": "»", "»": "«" })[c]!);
for (const shop of shops) {
  for (const text of [shop.nameAr, shop.neighborhoodAr]) {
    if (!text?.trim()) continue;
    const units = ogBidiUnits(text);
    const kept = units.map((u) => (u.dir === "rtl" ? unmirror(u.text) : u.text)).join("").replace(/\s/g, "");
    assert(kept === text.replace(/\s/g, ""), `${shop.id}: bidi units keep «${text}»`);
    const gaps = units.filter((u, i) => u.spaceAfter && i + 1 < units.length).length;
    const ltrSpaces = units.filter((u) => u.dir === "ltr").reduce((n, u) => n + (u.text.match(/ /g)?.length ?? 0), 0);
    assert(gaps + ltrSpaces === (text.trim().match(/\s+/g)?.length ?? 0), `${shop.id}: one gap per space in «${text}»`);
  }
}
// Layout: units get gaps on the side of the *next* unit (row-reverse).
const plain = ogRtlUnits("هاوس اوف ماتشا", 54, null);
assert(plain.length === 3, "one box per unit");
const style = (el: (typeof plain)[number]) => (el.props as { style: Record<string, unknown> }).style;
assert(style(plain[0]!).marginLeft === ogRtlGap(54) && style(plain[1]!).marginLeft === ogRtlGap(54), "gap after each word");
assert(style(plain[2]!).marginLeft === 0, "no gap after the last word");
assert(style(plain[0]!).width === undefined, "no font: Satori sizes the boxes");

async function checkShapedWidths() {
  // Satori sizes text by isolated glyphs but paints joined ones; the boxes
  // must use the shaped advance. Needs the card font (CDN); skip if offline.
  let font: ArrayBuffer | null = null;
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/ibm-plex-sans-arabic@latest/arabic-400-normal.ttf",
    );
    if (res.ok) font = await res.arrayBuffer();
  } catch {
    font = null;
  }
  if (!font) {
    console.warn("check-og-images: Plex Arabic font offline, shaped-width check skipped");
    return;
  }
  const measure = ogFontMeasurer(font);
  assert(measure, "card font parses");
  const joined = measure("نونا", 54)!;
  const isolated = Array.from("نونا").reduce((sum, ch) => sum + measure(ch, 54)!, 0);
  assert(joined > 20 && joined < isolated - 10, `«نونا» box uses the joined width (${joined} < ${isolated})`);
  assert(measure("MA", 54) === null, "Latin (not in the Arabic font) keeps Satori's own width");
  const units = ogRtlUnits("دا نونا", 54, measure);
  assert(style(units[1]!).width === joined, "the unit box is the shaped width");
  assert(
    Math.abs(ogRtlGap(54, measure) - (measure(" ", 54)! + 54 * OG_RTL_EXTRA_GAP_EM)) < 0.01,
    "gap is the font's space plus the overhang allowance",
  );
}

async function renders(id: string, lang: "ar" | "en") {
  const res = await cafeOpenGraphImage({ params: Promise.resolve({ id }) }, lang);
  const buf = new Uint8Array(await res.arrayBuffer());
  assert(sniffOgImageMime(buf) === "image/png" && buf.length > 5_000, `${id} ${lang} card renders a PNG`);
}

(async () => {
  await checkShapedWidths();
  const tonightRoute = readFileSync(join(process.cwd(), "app/c/[id]/tonight/image/route.tsx"), "utf8");
  assert(/ogRtlUnits\(/.test(tonightRoute) && !/satoriArabicLine\(/.test(tonightRoute), "Tonight card lays Arabic out with ogRtlUnits");
  const cafeCard = readFileSync(join(process.cwd(), "lib/cafe-og-image.tsx"), "utf8");
  assert(/ogRtlUnits\(name,/.test(cafeCard) && /ogRtlUnits\(area,/.test(cafeCard), "café card lays AR name + area out with ogRtlUnits");
  for (const id of [...REGRESSION, "drive-al-rabi", "coffee-address-al-hamra", "woods-olaya", "da-nonna-al-rayyan", "ma-specialty-al-naseem-sharqi"]) {
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
