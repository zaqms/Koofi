import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listRealShops } from "../lib/catalog";
import { rankByPopularity, rankInDistrict } from "../lib/district-rank";
import {
  isMeetHalfwayChipAsk,
  locationsCentroid,
  meetHalfwayAskLabel,
  parseHalfwayInputs,
  pickHalfwayShops,
} from "../lib/meet-halfway";
import { neighborhoodCentroid } from "../lib/neighborhood-tight";
import { officialShopCoords } from "../lib/place-coords";
import { MEET_HALFWAY_CHIP, VIBE_CHIPS } from "../lib/product";
import { pickCafes } from "../lib/picker";
import { dedupeSameBrand } from "../lib/shop-brand";
import type { HalfwayLocation } from "../lib/meet-halfway";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const catalog = listRealShops();
const catalogIds = new Set(catalog.map((shop) => shop.id));

assert(MEET_HALFWAY_CHIP.ar === "بيننا", "AR chip label locked");
assert(MEET_HALFWAY_CHIP.en === "Halfway", "EN chip label");
const vibeIds: string[] = VIBE_CHIPS.map((chip) => chip.id);
assert(
  !vibeIds.includes(MEET_HALFWAY_CHIP.id),
  "بيننا is not a vibe / Soft Places chip",
);
assert(VIBE_CHIPS.length === 11, "locked vibe row stays 11 chips");

assert(isMeetHalfwayChipAsk("بيننا"), "بيننا chip ask");
assert(isMeetHalfwayChipAsk("Halfway"), "Halfway chip ask");
assert(!isMeetHalfwayChipAsk("حطين"), "district ask is not بيننا");

const typed = pickCafes({ text: "بيننا", language: "ar" });
assert(typed.picks.length === 0, "typed بيننا must not invent a vibe pack");

const two: HalfwayLocation[] = [
  { district: "hittin" },
  { district: "olaya" },
];
assert(
  meetHalfwayAskLabel(two, "ar") === "بيننا · حطين × العليا",
  "AR ask names the two districts",
);

const hittinCenter = neighborhoodCentroid("hittin", catalog);
const olayaCenter = neighborhoodCentroid("olaya", catalog);
const hamraCenter = neighborhoodCentroid("al-hamra", catalog);
assert(hittinCenter && olayaCenter && hamraCenter, "live district centroids");

const three: HalfwayLocation[] = [
  { district: "hittin" },
  { district: "olaya" },
  { district: "al-hamra" },
];
const mid2 = locationsCentroid(two, catalog);
const mid3 = locationsCentroid(three, catalog);
assert(mid2 && mid3, "N-location centroids");
assert(
  Math.abs(mid2.lat - (hittinCenter.lat + olayaCenter.lat) / 2) < 1e-9,
  "pair centroid is the mean of two district centroids",
);
assert(
  Math.abs(
    mid3.lat - (hittinCenter.lat + olayaCenter.lat + hamraCenter.lat) / 3,
  ) < 1e-9,
  "N=3 centroid is the mean of three district centroids — not pair-hardcoded",
);
assert(
  Math.abs(mid2.lat - mid3.lat) > 1e-6,
  "N=3 centroid differs from the first-two-only midpoint",
);

const picked = pickHalfwayShops({ locations: two });
assert(picked.length === 3, `two districts should return 3, got ${picked.length}`);
assert(
  picked.every((shop) => catalogIds.has(shop.id)),
  `invented a shop: ${picked.map((shop) => shop.id).join(",")}`,
);
assert(
  picked.every((shop) => officialShopCoords(shop)),
  "halfway picks need official catalog pins",
);
const again = pickHalfwayShops({ locations: two });
assert(
  again.map((shop) => shop.id).join(",") ===
    picked.map((shop) => shop.id).join(","),
  "halfway must not shuffle",
);

const popularOrder = rankByPopularity(picked).map((shop) => shop.id);
assert(
  popularOrder.join(",") === picked.map((shop) => shop.id).join(","),
  "candidates are ranked with locked Most Popular",
);

const nThree = pickHalfwayShops({ locations: three });
assert(nThree.length <= 3, "N=3 still returns at most 3");
assert(
  nThree.every((shop) => catalogIds.has(shop.id)),
  "N=3 must not invent shops",
);

const sameDistrict: HalfwayLocation[] = [
  { district: "hittin" },
  { district: "hittin" },
];
const same = pickHalfwayShops({ locations: sameDistrict });
const expectedSame = dedupeSameBrand(rankInDistrict(catalog, "hittin"))
  .slice(0, 3)
  .map((shop) => shop.id);
assert(
  same.map((shop) => shop.id).join(",") === expectedSame.join(","),
  "same district twice is in-district Most Popular top 3",
);

const parsedBody = parseHalfwayInputs({
  locations: [{ district: "hittin" }, { district: "olaya" }],
});
assert(parsedBody?.length === 2, "JSON locations[] parses N rows");
assert(parsedBody[0]?.district === "hittin", "first district");

const chips = readFileSync(
  join(process.cwd(), "components/vibe-chips.tsx"),
  "utf8",
);
assert(chips.includes("MEET_HALFWAY_CHIP"), "chip is on the row");
assert(!chips.includes("ثلاث الليلة"), "Soft Places stays parked");

const picker = readFileSync(
  join(process.cwd(), "components/meet-halfway-picker.tsx"),
  "utf8",
);
assert(picker.includes("meetHalfwayMe"), "أنا في field");
assert(picker.includes("meetHalfwayOther"), "الثاني field");
assert(picker.includes("<select"), "v1 is district pickers");
assert(picker.includes("directoryNeighborhoods"), "live catalog districts only");
assert(!picker.includes("requestVisitorLocation"), "no geo share in v1");
assert(!picker.includes("shared-pin"), "no pin paste in v1");
assert(
  picker.includes("N≥2") || picker.includes("3–4"),
  "extension comment for 3–4 friends",
);

const copySource = readFileSync(join(process.cwd(), "lib/copy.ts"), "utf8");
assert(copySource.includes("أنا في"), "AR me-district copy");
assert(copySource.includes("الثاني"), "AR other-district copy");
assert(copySource.includes("ثلاث قهاوي بينكم"), "results header");
assert(!copySource.includes("أنت وين؟"), "pin-first copy removed");
assert(!copySource.includes("موقعي"), "no my-pin copy");
assert(!/koofi/i.test(copySource.match(/meetHalfway[\s\S]*?meetHalfwayEmpty/)?.[0] ?? ""), "بيننا copy is not Koofi");

const chatApi = readFileSync(
  join(process.cwd(), "app/api/chat/route.ts"),
  "utf8",
);
assert(
  chatApi.indexOf("halfwayRows") < chatApi.indexOf("extractMapsUrl(text)"),
  "halfway must not be treated as add-shop Maps paste",
);

console.log("check-meet-halfway: ok");
console.log(
  picked
    .map(
      (shop, index) =>
        `${index + 1}) ${shop.nameEn} [${shop.neighborhood}] ${shop.popularityIndex}`,
    )
    .join("\n"),
);
