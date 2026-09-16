import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  listDirectoryShops,
  listDriveThroughDirectoryShops,
} from "../lib/catalog";
import { copy } from "../lib/copy";
import { filterDirectoryShopsByMoment } from "../lib/directory";
import {
  DIRECTORY_RESULT_SORTS,
  DIRECTORY_SORT_COPY,
  sortDirectoryShops,
} from "../lib/directory-sort";
import { shopDisplayName } from "../lib/product";
import type { Pin } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const repo = process.cwd();
const read = (rel: string) => readFileSync(join(repo, rel), "utf8");

assert(
  DIRECTORY_RESULT_SORTS.join(",") === "nearby,new,az",
  "sort order is Nearby / New / A–Z",
);
assert(copy.neighborhoodsSortNearby.en === "Nearby", "EN Nearby");
assert(copy.neighborhoodsSortNearby.ar === "الأقرب إليك", "AR Nearby");
assert(copy.directorySortNew.en === "New", "EN New");
assert(copy.directorySortNew.ar === "الأحدث", "AR New uses existing الأحدث");
assert(copy.neighborhoodsSortAz.en === "A–Z", "EN A–Z");
assert(copy.neighborhoodsSortAz.ar === "أ–ي", "AR A–Z reuses أ–ي");
assert(DIRECTORY_SORT_COPY.nearby === copy.neighborhoodsSortNearby, "Nearby reuses copy");
assert(DIRECTORY_SORT_COPY.az === copy.neighborhoodsSortAz, "A–Z reuses copy");
assert(DIRECTORY_SORT_COPY.new === copy.directorySortNew, "New copy is directorySortNew");

const dt = listDriveThroughDirectoryShops();
assert(dt.length === 78, `DT directory stays 78 shops, got ${dt.length}`);
assert(
  dt.every((shop) => shop.momentTags.includes("drive-through")),
  "sort does not change the DT filter",
);

const newestDt = [...dt].sort((a, b) => b.catalogIndex - a.catalogIndex)[0];
assert(newestDt, "DT has a newest row");
const ulica = dt.find((shop) => shop.id === "ulica-al-ghadeer");
const lastLane = dt.find((shop) => shop.id === "drcafe-as-suwaidi");
assert(ulica && lastLane, "ULICA TAG and latest DT-lane row are in the directory");
assert(
  lastLane.catalogIndex > ulica.catalogIndex,
  "New uses Wain catalog-added order, not store opening date",
);

const newSorted = sortDirectoryShops(dt, "new", null, "en");
assert(newSorted[0]?.id === newestDt.id, "New puts latest catalog add first");
assert(
  newSorted.findIndex((shop) => shop.id === lastLane.id) <
    newSorted.findIndex((shop) => shop.id === ulica.id),
  "recently cataloged DT-lane rows beat older TAG shops on New",
);
assert(
  newSorted.every((shop, index, rows) => {
    if (index === 0) return true;
    return rows[index - 1]!.catalogIndex >= shop.catalogIndex;
  }),
  "New is catalogIndex DESC",
);

const azEn = sortDirectoryShops(dt, "az", null, "en");
const azEnNames = azEn.map((shop) => shopDisplayName(shop, "en"));
const azEnCopy = [...azEnNames].sort((a, b) =>
  a.localeCompare(b, "en", { sensitivity: "base" }),
);
assert(
  azEnNames.join("\0") === azEnCopy.join("\0"),
  "EN A–Z is cafe name alphabetical",
);

const azAr = sortDirectoryShops(dt, "az", null, "ar");
const azArNames = azAr.map((shop) => shopDisplayName(shop, "ar"));
const azArCopy = [...azArNames].sort((a, b) =>
  a.localeCompare(b, "ar", { sensitivity: "base" }),
);
assert(
  azArNames.join("\0") === azArCopy.join("\0"),
  "AR A–Z uses Arabic name + EN fallback",
);

const origin: Pin = { lat: 24.753476, lng: 46.6906575 };
const nearby = sortDirectoryShops(dt, "nearby", origin, "en");
assert(nearby[0]?.id === "camel-step-al-mursalat", "Nearby ASC from a DT pin");
const nearbyNoOrigin = sortDirectoryShops(dt, "nearby", null, "en");
assert(
  nearbyNoOrigin[0]?.id === azEn[0]?.id,
  "Nearby without location falls back to A–Z",
);

const matcha = filterDirectoryShopsByMoment(listDirectoryShops(), "matcha");
assert(matcha.length === 25, "Matcha list content stays 25 tagged shops");
const matchaDefault = matcha.map((shop) => shop.id);
assert(
  matchaDefault.join(",") ===
    filterDirectoryShopsByMoment(listDirectoryShops(), "matcha")
      .map((shop) => shop.id)
      .join(","),
  "Matcha directory order is untouched",
);

const directory = read("components/shop-directory.tsx");
assert(
  directory.includes('chipId === "drive-through"') &&
    directory.includes("DirectoryResultSortPills") &&
    directory.includes("sortDirectoryShops"),
  "Drive-through results mount the Matcha sort pills",
);
assert(
  !directory.includes('chipId === "matcha"'),
  "Matcha results do not enable this sort",
);
assert(
  directory.includes("filterDirectoryShopsByMoment") &&
    directory.includes("filterDirectoryShops"),
  "directory filter helpers stay",
);
assert(
  directory.includes("{district || popular || vibe ? ("),
  "directory heading wrap stays",
);

const pills = read("components/directory-result-sort.tsx");
assert(pills.includes("bg-bean") && pills.includes("text-foam"), "selected terracotta");
assert(pills.includes("bg-paper") && pills.includes("border-line"), "inactive Paper");
assert(pills.includes("h-8 rounded-full") && pills.includes("text-[13px]"), "pill type");
assert(pills.includes("flex flex-wrap gap-2"), "pill spacing");
assert(pills.includes("DIRECTORY_SORT_COPY"), "pills reuse Matcha copy");

const landing = read("components/home-landing.tsx");
assert(
  landing.includes('pageChipId === "drive-through"') &&
    landing.includes("listDriveThroughDirectoryShops()"),
  "DT landing still uses the branch-level DT directory",
);
assert(
  landing.includes("chipDirectoryMoment") && landing.includes("moment={chipMoment}"),
  "moment filter wiring is unchanged",
);

const chips = read("components/vibe-chips.tsx");
assert(
  chips.includes('case "drive-through"') &&
    chips.includes("{/* car + pickup cup */}") &&
    chips.includes('viewBox="0 0 512 512"'),
  "DT home icon is unchanged",
);
assert(
  !/Soft Places/i.test(directory) && !/Soft Places/i.test(pills),
  "Soft Places stay parked",
);

console.log("check-directory-sort: ok");
