/**
 * Chain branches that share a name and a neighborhood must carry a
 * distinguishing branch (mall, street, or landmark) in that language.
 * Display names append it: "Starbucks · Panorama Mall".
 */
import { listRealShops } from "../lib/catalog";
import { shopDisplayName } from "../lib/product";
import type { Shop } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function norm(value: string): string {
  return value.trim().toLowerCase();
}

function collisions(
  shops: Shop[],
  name: (shop: Shop) => string,
  branch: (shop: Shop) => string | undefined,
): string[] {
  const groups = new Map<string, Shop[]>();
  for (const shop of shops) {
    const key = `${norm(name(shop))}|${shop.neighborhood}`;
    const rows = groups.get(key);
    if (rows) rows.push(shop);
    else groups.set(key, [shop]);
  }
  const problems: string[] = [];
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    const seen = new Map<string, string>();
    for (const shop of rows) {
      const label = branch(shop)?.trim() ?? "";
      if (!label) {
        problems.push(`${shop.id} shares ${key} with no branch`);
        continue;
      }
      const prior = seen.get(norm(label));
      if (prior) problems.push(`${shop.id} and ${prior} share ${key} and branch "${label}"`);
      else seen.set(norm(label), shop.id);
    }
  }
  return problems;
}

const shops = listRealShops();
const problems = [
  ...collisions(shops, (shop) => shop.nameEn, (shop) => shop.branchEn),
  ...collisions(shops, (shop) => shop.nameAr, (shop) => shop.branchAr),
];
assert(problems.length === 0, `branch names:\n  ${problems.join("\n  ")}`);

const panorama = shops.find((shop) => shop.id === "starbucks-panorama-al-mathar");
const tafaseel = shops.find((shop) => shop.id === "starbucks-tafaseel-al-mathar");
const takhassusi = shops.find((shop) => shop.id === "starbucks-takhassusi-al-mathar");
assert(panorama && tafaseel && takhassusi, "Al Mathar Starbucks rows are present");
assert(
  shopDisplayName(panorama, "en") === "Starbucks · Panorama Mall" &&
    shopDisplayName(panorama, "ar") === "ستاربكس · بانوراما مول",
  `Panorama display name, got ${shopDisplayName(panorama, "en")} / ${shopDisplayName(panorama, "ar")}`,
);
assert(
  shopDisplayName(tafaseel, "en") === "Starbucks · Tafaseel" &&
    shopDisplayName(tafaseel, "ar") === "ستاربكس · تفاصيل",
  "Tafaseel display name",
);
assert(
  shopDisplayName(takhassusi, "en") === "Starbucks · Takhassusi St" &&
    shopDisplayName(takhassusi, "ar") === "ستاربكس · شارع التخصصي",
  "Takhassusi St display name",
);

const jazirah = shops.filter((shop) => shop.neighborhood === "al-jazirah" && shop.nameEn === "dr.CAFE");
const sul = shops.filter((shop) => shop.neighborhood === "sulimaniyah" && shop.nameEn === "dr.CAFE");
assert(jazirah.length === 2 && sul.length === 2, "dr.CAFE still has two branches in Al Jazirah and Sulimaniyah");
assert(
  new Set(jazirah.map((shop) => shopDisplayName(shop, "en"))).size === 2 &&
    new Set(sul.map((shop) => shopDisplayName(shop, "ar"))).size === 2,
  "dr.CAFE twins get different display names",
);

console.log(`check-branch-names: ${shops.length} rows, no shared name + neighborhood without a branch.`);
