import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listRealShops } from "../lib/catalog";
import { rankByPopularity } from "../lib/district-rank";
import {
  isMeetHalfwayChipAsk,
  locationsCentroid,
  meetHalfwayAskLabel,
  parseHalfwayPinInputs,
  pickHalfwayShops,
} from "../lib/meet-halfway";
import { neighborhoodCentroid } from "../lib/neighborhood-tight";
import { officialShopCoords } from "../lib/place-coords";
import { MEET_HALFWAY_CHIP, VIBE_CHIPS } from "../lib/product";
import { parseSharedPin } from "../lib/shared-pin";
import { pickCafes } from "../lib/picker";
import type { HalfwayLocation } from "../lib/meet-halfway";
import type { Pin } from "../lib/types";

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

assert(
  meetHalfwayAskLabel("ar") === "بيننا · دبوسين",
  "AR ask label",
);

const hittinPin = parseSharedPin("24.7610, 46.6040");
const olayaPin = parseSharedPin("24.6870, 46.6850");
const hamraPin = parseSharedPin("24.7790, 46.7600");
assert(hittinPin && olayaPin && hamraPin, "lat,lng parse");

assert(
  parseSharedPin(
    "https://www.google.com/maps/place/Test/@24.7136,46.6753,17z",
  )?.lat.toFixed(4) === "24.7136",
  "@lat,lng viewport parse",
);
assert(
  parseSharedPin(
    "https://www.google.com/maps/place/Test/data=!3d24.7136!4d46.6753",
  )?.lng.toFixed(4) === "46.6753",
  "!3d!4d place parse",
);
assert(
  parseSharedPin("https://www.google.com/maps?q=24.7136,46.6753")?.lat.toFixed(
    4,
  ) === "24.7136",
  "q=lat,lng parse",
);

const two: HalfwayLocation[] = [{ pin: hittinPin }, { pin: olayaPin }];
const three: HalfwayLocation[] = [
  { pin: hittinPin },
  { pin: olayaPin },
  { pin: hamraPin },
];
const mid2 = locationsCentroid(two, catalog);
const mid3 = locationsCentroid(three, catalog);
assert(mid2 && mid3, "N-location centroids");
assert(
  Math.abs(mid2.lat - (hittinPin.lat + olayaPin.lat) / 2) < 1e-9,
  "pair centroid is the mean of two pins, not a special-case midpoint",
);
assert(
  Math.abs(mid3.lat - (hittinPin.lat + olayaPin.lat + hamraPin.lat) / 3) <
    1e-9,
  "N=3 centroid is the mean of three pins — not pair-hardcoded",
);
assert(
  Math.abs(mid2.lat - mid3.lat) > 1e-6,
  "N=3 centroid differs from the first-two-only midpoint",
);

const picked = pickHalfwayShops({ locations: two });
assert(picked.length === 3, `two pins should return 3, got ${picked.length}`);
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

const samePin: HalfwayLocation[] = [{ pin: hittinPin }, { pin: hittinPin }];
const same = pickHalfwayShops({ locations: samePin });
assert(same.length <= 3, "same pin twice still returns ≤3");
assert(
  same.every((shop) => catalogIds.has(shop.id)),
  "same pin must not invent shops",
);

const parsedBody = parseHalfwayPinInputs({
  locations: [
    { lat: hittinPin.lat, lng: hittinPin.lng },
    { text: "24.6870, 46.6850" },
  ],
});
assert(parsedBody?.length === 2, "JSON locations[] parses N rows");

const hittinCenter = neighborhoodCentroid("hittin", catalog);
assert(hittinCenter, "hittin has a real district centroid from shop pins");

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
assert(picker.includes("أنت وين؟") === false, "copy lives in copy.ts");
assert(picker.includes("meetHalfwayMe"), "أنت وين؟ field");
assert(picker.includes("meetHalfwayOther"), "صاحبك وين؟ field");
assert(picker.includes("looksLikeSharedPin"), "Maps / lat-lng primary");
assert(!picker.includes("<select"), "no district dropdown in v1");
assert(
  picker.includes("locations: Location[]") ||
    picker.includes("locations: Location[]") ||
    picker.includes("N≥2") ||
    picker.includes("N>=2") ||
    picker.includes("3–4"),
  "extension comment for 3–4 friends",
);

const copySource = readFileSync(join(process.cwd(), "lib/copy.ts"), "utf8");
assert(copySource.includes("أنت وين؟"), "AR you-pin copy");
assert(copySource.includes("صاحبك وين؟"), "AR friend-pin copy");
assert(copySource.includes("ثلاث قهاوي بينكم"), "results header");
assert(!copySource.includes("أنا في"), "district-first copy removed");

const chatApi = readFileSync(
  join(process.cwd(), "app/api/chat/route.ts"),
  "utf8",
);
assert(
  chatApi.indexOf("halfwayRows") < chatApi.indexOf("extractMapsUrl(text)"),
  "halfway pins must not be treated as add-shop Maps paste",
);

function pinKmCheck(pin: Pin) {
  return Number.isFinite(pin.lat);
}
assert(pinKmCheck(hittinPin), "pin finite");

console.log("check-meet-halfway: ok");
console.log(
  picked
    .map(
      (shop, index) =>
        `${index + 1}) ${shop.nameEn} [${shop.neighborhood}] ${shop.popularityIndex}`,
    )
    .join("\n"),
);
