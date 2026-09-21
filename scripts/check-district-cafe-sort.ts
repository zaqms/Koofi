/**
 * Neighborhood results sort. Sorting only — Rabwah and Hittin keep the
 * same cafés. Soft Places stays parked. New reads catalog addedAt.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listDirectoryShopsForDistrict, listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import type { DirectoryShop } from "../lib/directory";
import {
  DISTRICT_CAFE_SORT_COPY,
  DISTRICT_CAFE_SORT_STORAGE_KEY,
  DISTRICT_CAFE_SORTS,
  resolveDistrictCafeSort,
  sortDistrictCafes,
} from "../lib/district-cafe-sort";
import { shopDistanceKm } from "../lib/directory-sort";
import type { NeighborhoodId, Pin } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function ids(rows: readonly { id: string }[]): string {
  return rows.map((row) => row.id).join(",");
}

function sameSet(a: readonly { id: string }[], b: readonly { id: string }[]): boolean {
  return [...a].map((row) => row.id).sort().join(",") === [...b].map((row) => row.id).sort().join(",");
}

assert(DISTRICT_CAFE_SORTS.join(",") === "nearby,az,new", "EN control order Nearby | A–Z | New");
assert(DISTRICT_CAFE_SORT_COPY.nearby.en === "Nearby", "EN Nearby");
assert(DISTRICT_CAFE_SORT_COPY.az.en === "A–Z", "EN A–Z");
assert(DISTRICT_CAFE_SORT_COPY.new.en === "New", "EN New");
assert(DISTRICT_CAFE_SORT_COPY.nearby.ar === "الأقرب إليك", "AR Nearby");
assert(DISTRICT_CAFE_SORT_COPY.az.ar === "أ - ي", "AR A–Z is أ - ي");
assert(DISTRICT_CAFE_SORT_COPY.new.ar === "الأحدث", "AR New");
assert(DISTRICT_CAFE_SORT_COPY.nearby === copy.neighborhoodsSortNearby, "Nearby reuses the Wain label");
assert(DISTRICT_CAFE_SORT_COPY.new === copy.directorySortNew, "New reuses الأحدث");
assert(copy.neighborhoodsSortAz.ar === "أ–ي", "neighborhood index A–Z label stays أ–ي");
assert(
  DISTRICT_CAFE_SORT_STORAGE_KEY === "wain.districtCafeSort.v1",
  "sort persists in session storage",
);
assert(resolveDistrictCafeSort(null, true) === "nearby", "default with GPS is Nearby");
assert(resolveDistrictCafeSort(null, false) === "az", "default without GPS is A–Z");
assert(resolveDistrictCafeSort("nearby", false) === "az", "Nearby without GPS falls back to A–Z");
assert(resolveDistrictCafeSort("nearby", true) === "nearby", "Nearby with GPS stays Nearby");
assert(resolveDistrictCafeSort("new", true) === "new", "explicit New is not replaced by Nearby");
assert(resolveDistrictCafeSort("az", true) === "az", "explicit A–Z is not replaced by Nearby");

const addedFile = JSON.parse(read("data/catalog-added-at.json")) as {
  note: string;
  addedAt: Record<string, string>;
};
assert(
  /not a café opening date/i.test(addedFile.note),
  "addedAt note says it is not an opening date",
);
const catalog = JSON.parse(read("data/catalog.json")) as {
  shops: { id: string }[];
};
assert(
  Object.keys(addedFile.addedAt).length === catalog.shops.length,
  "every catalog shop has one addedAt",
);
for (const shop of catalog.shops) {
  const value = addedFile.addedAt[shop.id];
  assert(typeof value === "string" && Number.isFinite(Date.parse(value)), `${shop.id} addedAt`);
}

const real = listRealShops();
assert(
  real.every((shop) => addedFile.addedAt[shop.id]),
  "live shops are covered by addedAt",
);

function expectNameOrder(
  rows: readonly DirectoryShop[],
  language: "ar" | "en",
): string[] {
  return [...rows]
    .sort((a, b) => {
      const left = (language === "ar" ? a.nameAr : a.nameEn).trim();
      const right = (language === "ar" ? b.nameAr : b.nameEn).trim();
      const byName = left.localeCompare(right, language === "ar" ? "ar" : "en", {
        sensitivity: "base",
      });
      if (byName !== 0) return byName;
      return a.id.localeCompare(b.id);
    })
    .map((row) => row.id);
}

function expectNewOrder(rows: readonly DirectoryShop[]): string[] {
  return [...rows]
    .sort((a, b) => {
      const delta = Date.parse(b.addedAt ?? "") - Date.parse(a.addedAt ?? "");
      if (delta !== 0) return delta;
      if (b.catalogIndex !== a.catalogIndex) return b.catalogIndex - a.catalogIndex;
      return a.id.localeCompare(b.id);
    })
    .map((row) => row.id);
}

const districts: NeighborhoodId[] = ["al-rabwah", "hittin"];
for (const district of districts) {
  const shops = listDirectoryShopsForDistrict(district);
  assert(shops.length > 1, `${district} has cafés to sort`);
  assert(
    shops.every((shop) => shop.neighborhood === district),
    `${district} list stays inside the neighborhood`,
  );
  assert(
    shops.every((shop) => shop.addedAt && Number.isFinite(Date.parse(shop.addedAt))),
    `${district} rows carry addedAt`,
  );

  const azEn = sortDistrictCafes(shops, "az", null, "en");
  const azAr = sortDistrictCafes(shops, "az", null, "ar");
  const newest = sortDistrictCafes(shops, "new", null, "en");
  const nearbyMissing = sortDistrictCafes(shops, "nearby", null, "ar");
  assert(sameSet(azEn, shops), `${district} A–Z keeps every café`);
  assert(sameSet(azAr, shops), `${district} Arabic A–Z keeps every café`);
  assert(sameSet(newest, shops), `${district} New keeps every café`);
  assert(ids(azEn) === expectNameOrder(shops, "en").join(","), `${district} EN A–Z is nameEn`);
  assert(ids(azAr) === expectNameOrder(shops, "ar").join(","), `${district} AR A–Z is nameAr only`);
  assert(ids(newest) === expectNewOrder(shops).join(","), `${district} New is addedAt newest first`);
  assert(
    ids(nearbyMissing) === ids(azAr),
    `${district} Nearby without GPS is Arabic A–Z, not a fake distance order`,
  );

  const origin = shops.find((shop) => shop.lat != null && shop.lng != null);
  assert(origin?.lat != null && origin.lng != null, `${district} has a pin for Nearby`);
  const pin: Pin = { lat: origin.lat, lng: origin.lng };
  const nearby = sortDistrictCafes(shops, "nearby", pin, "en");
  assert(sameSet(nearby, shops), `${district} Nearby does not add or drop cafés`);
  assert(
    nearby.every((shop) => shop.neighborhood === district),
    `${district} Nearby stays inside the neighborhood`,
  );
  const firstKm = shopDistanceKm(nearby[0]!, pin);
  const secondKm = shopDistanceKm(nearby[1]!, pin);
  assert(firstKm != null && secondKm != null && firstKm <= secondKm, `${district} Nearby is closest first`);
  assert(nearby[0]?.id === origin.id, `${district} Nearby from a café pin puts that café first`);
}

const fixture: DirectoryShop[] = [
  {
    id: "zebra",
    nameEn: "Zebra",
    nameAr: "ألف",
    neighborhood: "hittin",
    neighborhoodAr: "حطين",
    vibeTags: [],
    momentTags: [],
    mapsHref: "https://example.com/zebra",
    lat: 24.75,
    lng: 46.65,
    catalogIndex: 1,
    addedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "alpha",
    nameEn: "Alpha",
    nameAr: "ياء",
    neighborhood: "hittin",
    neighborhoodAr: "حطين",
    vibeTags: [],
    momentTags: [],
    mapsHref: "https://example.com/alpha",
    lat: 24.81,
    lng: 46.72,
    catalogIndex: 9,
    addedAt: "2026-09-01T00:00:00.000Z",
  },
];
assert(
  ids(sortDistrictCafes(fixture, "az", null, "en")) === "alpha,zebra",
  "EN A–Z uses nameEn",
);
assert(
  ids(sortDistrictCafes(fixture, "az", null, "ar")) === "zebra,alpha",
  "AR A–Z uses nameAr and does not follow English",
);
assert(
  ids(sortDistrictCafes(fixture, "new", null, "ar")) === "alpha,zebra",
  "New is newest addedAt first",
);
assert(
  ids(sortDistrictCafes(fixture, "nearby", null, "en")) === "alpha,zebra",
  "Nearby without a pin matches EN A–Z",
);
assert(
  sortDistrictCafes(fixture, "nearby", { lat: 24.75, lng: 46.65 }, "ar")[0]?.id ===
    "zebra",
  "Nearby uses GPS inside the given rows",
);

const tied: DirectoryShop[] = [
  { ...fixture[0]!, id: "earlier", addedAt: "2026-08-23T18:39:47+00:00", catalogIndex: 2 },
  { ...fixture[1]!, id: "later", addedAt: "2026-08-23T18:39:47+00:00", catalogIndex: 8 },
];
assert(
  sortDistrictCafes(tied, "new", null, "en")[0]?.id === "later",
  "same addedAt breaks the tie by later catalog index",
);

const directory = read("components/shop-directory.tsx");
const pills = read("components/directory-result-sort.tsx");
const page = read("components/district-page.tsx");
assert(directory.includes('marker="district"'), "district page uses the shared sort pills");
assert(directory.includes("sortDistrictCafes"), "district order goes through sortDistrictCafes");
assert(
  directory.includes("filterDirectoryShops"),
  "district membership filter is unchanged",
);
assert(pills.includes("h-8 rounded-full") && pills.includes("border-line") && pills.includes("bg-bean"), "compact Wain chip chrome");
assert(pills.includes("data-district-cafe-sorts"), "district sort marker");
assert(pills.includes("data-directory-sorts"), "Matcha / DT marker stays");
assert(page.includes("Soft Places stays parked"), "Soft Places stays parked");
assert(!/Soft Places/i.test(directory), "directory sort does not revive Soft Places");
assert(!directory.includes("district chips"), "no new district-chip control");

const rabwah = listDirectoryShopsForDistrict("al-rabwah");
const hittin = listDirectoryShopsForDistrict("hittin");
const rabwahNew = sortDistrictCafes(rabwah, "new", null, "en")[0];
const hittinNew = sortDistrictCafes(hittin, "new", null, "en")[0];
const rabwahAzEn = sortDistrictCafes(rabwah, "az", null, "en").map((shop) => shop.nameEn);
const rabwahAzAr = sortDistrictCafes(rabwah, "az", null, "ar").map((shop) => shop.nameAr);
console.log("check-district-cafe-sort: ok");
console.log(`rabwah ${rabwah.length} newest ${rabwahNew?.id} ${rabwahNew?.addedAt}`);
console.log(`hittin ${hittin.length} newest ${hittinNew?.id} ${hittinNew?.addedAt}`);
console.log("rabwah EN A–Z:", rabwahAzEn.join(" | "));
console.log("rabwah AR A–Z:", rabwahAzAr.join(" | "));
