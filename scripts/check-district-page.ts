/**
 * Shared district-page lock. Al Hamra and Sulimaniyah (and every other
 * live حي) must use one template. Soft Places stays parked. Dating
 * scrub (#162) stays with-friends.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listDirectoryShopsForDistrict } from "../lib/catalog";
import { copy } from "../lib/copy";
import {
  districtDescription,
  districtMetadata,
  districtTitle,
  resolveDistrictSlug,
} from "../lib/district";
import { neighborhoodLabel } from "../lib/neighborhoods";
import {
  DATE_CHIP_ID,
  DATE_CHIP_PUBLIC_SLUG,
  districtPath,
  PRODUCT_NAME,
} from "../lib/product";
import { NEIGHBORHOOD_IDS, type NeighborhoodId } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const districtPage = read("components/district-page.tsx");
const homeLanding = read("components/home-landing.tsx");
const shopDirectory = read("components/shop-directory.tsx");
const directoryCard = read("components/directory-card.tsx");
const sortPills = read("components/directory-result-sort.tsx");
const arRoute = read("app/[category]/[slug]/page.tsx");
const enRoute = read("app/en/[category]/[slug]/page.tsx");
const product = read("lib/product.ts");
const registry = read("lib/discovery-categories.ts");

assert(existsSync("components/district-page.tsx"), "shared DistrictPage exists");
assert(
  districtPage.includes("listDirectoryShopsForDistrict") &&
    districtPage.includes("DistrictEnBody") &&
    districtPage.includes("ShopDirectory") &&
    districtPage.includes("selectedChipId={null}"),
  "DistrictPage uses catalog shops + shared directory + Sulimaniyah-style opener (no vibe chips)",
);
assert(
  districtPage.includes('data-district-template="shared"') &&
    districtPage.includes("data-district-id={district}"),
  "template marker is data-driven, not a named-district branch",
);
assert(
  !/al-hamra|sulimaniyah/.test(districtPage),
  "DistrictPage has no district-specific UI branches",
);

assert(
  arRoute.includes("DistrictPage") &&
    !arRoute.includes("<HomeLanding language=\"ar\" district="),
  "AR district route left HomeLanding",
);
assert(
  enRoute.includes("DistrictPage") &&
    !enRoute.includes("<HomeLanding language=\"en\" district="),
  "EN district route left HomeLanding",
);
assert(
  !homeLanding.includes("district?:") &&
    !homeLanding.includes("DistrictEnBody") &&
    !homeLanding.includes("listDirectoryShopsForDistrict"),
  "legacy HomeLanding district path is removed",
);

assert(
  shopDirectory.includes("DirectoryCard") &&
    shopDirectory.includes("DirectoryResultSortPills"),
  "one cafe card + one filter component for listings",
);
assert(
  directoryCard.includes("export function DirectoryCard"),
  "DirectoryCard is the shared cafe row",
);
assert(
  sortPills.includes("DIRECTORY_SORT_COPY"),
  "shared sort pills stay the only filter chrome",
);
assert(
  !shopDirectory.includes("al-hamra") &&
    !shopDirectory.includes("sulimaniyah") &&
    !directoryCard.includes("al-hamra") &&
    !directoryCard.includes("sulimaniyah"),
  "card and directory are district-agnostic",
);

const REFERENCE_DISTRICTS = ["al-hamra", "sulimaniyah"] as const;
for (const id of REFERENCE_DISTRICTS) {
  assert(resolveDistrictSlug(id) === id, `${id} slug still resolves`);
  assert(
    districtPath(id, "ar") === `/coffee-shops/${id}`,
    `AR ${id} URL stays /coffee-shops/${id}`,
  );
  assert(
    districtPath(id, "en") === `/en/coffee-shops/${id}`,
    `EN ${id} URL stays /en/coffee-shops/${id}`,
  );
  const shops = listDirectoryShopsForDistrict(id);
  assert(shops.length > 0, `${id} uses real catalog rows`);
  assert(
    shops.every((shop) => shop.neighborhood === id),
    `${id} results stay in-district`,
  );
  assert(
    districtTitle(id, "en").includes(neighborhoodLabel(id, "en")),
    `${id} EN title is data-driven`,
  );
  assert(
    districtTitle(id, "ar").includes(neighborhoodLabel(id, "ar")),
    `${id} AR title is data-driven`,
  );
  assert(
    districtMetadata(id, "en").alternates !== undefined,
    `${id} EN metadata keeps locale alternates`,
  );
  assert(
    districtDescription(id, "en").length > 0 &&
      districtDescription(id, "ar").length > 0,
    `${id} meta comes from locked copy / count`,
  );
}

const hamra = listDirectoryShopsForDistrict("al-hamra");
const sulimaniyah = listDirectoryShopsForDistrict("sulimaniyah");
assert(hamra.length === 12, `Al Hamra catalog count stays 12, got ${hamra.length}`);
assert(
  sulimaniyah.length === 10,
  `Sulimaniyah catalog count stays 10, got ${sulimaniyah.length}`,
);

for (const id of NEIGHBORHOOD_IDS) {
  const shops = listDirectoryShopsForDistrict(id as NeighborhoodId);
  assert(
    shops.every((shop) => shop.neighborhood === id),
    `${id} page cannot invent out-of-district rows`,
  );
}

assert(shopDirectory.includes('dir={language === "ar" ? "rtl" : "ltr"}'), "directory is true RTL");
assert(copy.browseNeighborhoods.ar === "تصفح حسب الحي", "Browse by Neighborhood AR");
assert(copy.neighborhoodsSortNearby.ar === "الأقرب إليك", "Nearby AR");
assert(
  copy.neighborhoodsSortPopular.ar === "الأكثر شيوعاً" ||
    copy.neighborhoodsSortPopular.ar === "الأكثر شيوعًا",
  "Popular AR stays the approved neighborhood label",
);
assert(
  copy.neighborhoodsSortAz.ar === "أ–ي" || copy.neighborhoodsSortAz.ar === "أ - ي",
  "A–Z AR stays the approved neighborhood label",
);

assert(DATE_CHIP_ID === "with-friends", "dating scrub stays with-friends");
assert(DATE_CHIP_PUBLIC_SLUG === "with-friends", "public slug stays with-friends");
assert(!product.includes("Good for a date"), "do not revive Good for a date");
assert(!registry.includes("Good for a date"), "registry does not revive Good for a date");
assert(districtPage.includes("Soft Places stays parked"), "Soft Places stays parked");
assert(!districtPage.includes("ثلاث الليلة"), "no Soft Places badge on district page");
assert(!homeLanding.includes("Good for a date"), "home landing keeps the dating scrub");

assert(PRODUCT_NAME === "wain.lol", "brand stays wain.lol");

console.log(
  `check-district-page: ok (al-hamra ${hamra.length}, sulimaniyah ${sulimaniyah.length})`,
);
