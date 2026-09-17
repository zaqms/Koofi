/**
 * Nearby km math lock. Soft Places parked.
 * A Riyadh visitor to a Riyadh pin must stay city-scale — never ~11,800 km.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getShop,
  listDirectoryShops,
  listDriveThroughDirectoryShops,
} from "../lib/catalog";
import { filterDirectoryShopsByMoment } from "../lib/directory";
import { shopDistanceKm } from "../lib/directory-sort";
import {
  EARTH_RADIUS_KM,
  formatDistanceKm,
  haversineKm,
} from "../lib/distance";
import { foldOfficialPlacePins } from "../lib/fold-official-place-pins";
import {
  isRiyadhPlacePin,
  isUsableVisitorOrigin,
  officialShopCoords,
} from "../lib/place-coords";
import {
  MAX_NEARBY_DISPLAY_KM,
  shopDistanceDisplay,
} from "../lib/shop-distance-label";
import type { Pin, Shop } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const RIYADH: Pin = { lat: 24.7136, lng: 46.6753 };
const CAMEL_STEP: Pin = { lat: 24.753476, lng: 46.6906575 };
const GOOD_NEIGHBOR: Pin = { lat: 24.6919511, lng: 46.68446609999999 };
const SWAPPED: Pin = { lat: 46.6844661, lng: 24.6919511 };
const RADIANS_AS_DEG: Pin = {
  lat: (24.7136 * Math.PI) / 180,
  lng: (46.6753 * Math.PI) / 180,
};

assert(EARTH_RADIUS_KM === 6371, "Earth radius is kilometers, not meters");

const src = readFileSync(join(process.cwd(), "lib/distance.ts"), "utf8");
assert(src.includes("6371"), "haversine source keeps 6371 km");
assert(
  !/\b6371(?:000|e3)\b/.test(src),
  "haversine must not use Earth radius in meters",
);
assert(src.includes("toRad"), "haversine converts degrees to radians");

const camelKm = haversineKm(RIYADH, CAMEL_STEP);
const neighborKm = haversineKm(RIYADH, GOOD_NEIGHBOR);
assert(camelKm > 1 && camelKm < 15, `Riyadh↔camel-step is city-scale, got ${camelKm}`);
assert(
  neighborKm > 1 && neighborKm < 10,
  `Riyadh↔good-neighbor is city-scale, got ${neighborKm}`,
);
assert(camelKm < 100 && neighborKm < 100, "Riyadh↔Riyadh is never 100+ km");
assert(
  camelKm < 10_000 && neighborKm < 10_000,
  "Riyadh↔Riyadh must not regress to ~11,800 km",
);

const acrossTown = haversineKm(GOOD_NEIGHBOR, { lat: 24.776146, lng: 46.7756026 });
assert(
  acrossTown > 5 && acrossTown < 25,
  `two Riyadh matcha pins stay in-city, got ${acrossTown}`,
);

assert(
  formatDistanceKm(neighborKm, "en").endsWith(" km") &&
    !formatDistanceKm(neighborKm, "en").includes("118"),
  "EN format is short km, not 11,8xx",
);
assert(
  formatDistanceKm(11.821, "en") === "12 km",
  "11.8 km rounds to 12 km — never 11821 km",
);
assert(
  formatDistanceKm(2.58, "ar") === "2.6 كم",
  "AR sub-10 km keeps one decimal",
);

assert(isRiyadhPlacePin(RIYADH), "Riyadh center is in bounds");
assert(isRiyadhPlacePin(CAMEL_STEP), "catalog DT pin is in bounds");
assert(isRiyadhPlacePin(GOOD_NEIGHBOR), "catalog Matcha pin is in bounds");
assert(!isRiyadhPlacePin(SWAPPED), "lat/lng swap (46.7N, 24.7E) is rejected");
assert(!isRiyadhPlacePin(RADIANS_AS_DEG), "radian-as-degree leftovers are rejected");
assert(
  !isRiyadhPlacePin({ lat: 33.749, lng: -84.388 }),
  "Atlanta garbage is rejected",
);

const swappedKm = haversineKm(RIYADH, SWAPPED);
assert(
  swappedKm > 2500 && swappedKm < 4000,
  "a swapped pin would look like ~3,100 km — we reject it before display",
);

const riyadhReady = shopDistanceDisplay({
  origin: RIYADH,
  coords: GOOD_NEIGHBOR,
  language: "ar",
});
assert(riyadhReady.kind === "km" && riyadhReady.km < 20, "ready geo + Riyadh pin → real km");
assert(
  riyadhReady.label.includes("كم") && !riyadhReady.label.includes("118"),
  "AR label is كم, not 11k",
);

const swappedDisplay = shopDistanceDisplay({
  origin: RIYADH,
  coords: SWAPPED,
  language: "ar",
});
assert(
  swappedDisplay.kind === "missing" && swappedDisplay.label === "موقع غير متاح",
  "swapped shop pin is a visible fallback, not 3,100 km",
);

const missingDisplay = shopDistanceDisplay({
  origin: RIYADH,
  coords: null,
  language: "en",
});
assert(
  missingDisplay.kind === "missing" &&
    missingDisplay.label === "Location unavailable",
  "CID-only / no pin is a visible fallback, not a silent omit",
);

assert(
  shopDistanceDisplay({
    origin: { lat: Number.NaN, lng: 46.6753 },
    coords: GOOD_NEIGHBOR,
    language: "en",
  }).kind === "missing",
  "NaN visitor lat → fallback, not km",
);

const nullIsland = shopDistanceDisplay({
  origin: { lat: 0, lng: 0 },
  coords: GOOD_NEIGHBOR,
  language: "en",
});
assert(
  !isUsableVisitorOrigin({ lat: 0, lng: 0 }),
  "Null Island is not a usable visitor origin",
);
assert(
  nullIsland.kind === "missing" &&
    nullIsland.label === "Location unavailable",
  "user 0,0 + Riyadh shop → fallback, not ~12k km",
);
assert(
  !("km" in nullIsland) ||
    (nullIsland.kind === "missing" && !nullIsland.label.includes("118")),
  "Null Island must not paint 11,8xx km",
);

const atlanta = shopDistanceDisplay({
  origin: { lat: 33.749, lng: -84.388 },
  coords: GOOD_NEIGHBOR,
  language: "ar",
});
assert(
  atlanta.kind === "missing" && atlanta.label === "موقع غير متاح",
  "non-KSA visitor geo → AR fallback, not 11,800 km",
);

const swappedUser = shopDistanceDisplay({
  origin: SWAPPED,
  coords: GOOD_NEIGHBOR,
  language: "en",
});
assert(
  swappedUser.kind === "missing",
  "swapped visitor origin is fallback, not Romania-scale km",
);

assert(
  MAX_NEARBY_DISPLAY_KM === 200,
  "Nearby display cap stays city-scale (200 km)",
);
const jeddah = shopDistanceDisplay({
  origin: { lat: 21.4858, lng: 39.1925 },
  coords: GOOD_NEIGHBOR,
  language: "en",
});
assert(
  jeddah.kind === "missing" && jeddah.label === "Location unavailable",
  "absurd computed km (Jeddah→Riyadh) → fallback",
);

assert(
  shopDistanceDisplay({ origin: null, coords: GOOD_NEIGHBOR, language: "en" })
    .kind === "hidden",
  "no visitor geo still hides the slot (list hint covers it)",
);

const matcha = filterDirectoryShopsByMoment(listDirectoryShops(), "matcha");
const dt = listDriveThroughDirectoryShops();
for (const shop of [...matcha, ...dt]) {
  if (shop.lat == null || shop.lng == null) {
    assert(
      shopDistanceDisplay({ origin: RIYADH, coords: null, language: "ar" })
        .kind === "missing",
      `${shop.id} without coords uses fallback`,
    );
    continue;
  }
  const km = shopDistanceKm(shop, RIYADH);
  assert(km != null && km < 80, `${shop.id} from Riyadh is city-scale, got ${km}`);
  assert(km < 10_000, `${shop.id} must not show ~11,800 km from Riyadh`);
  assert(
    officialShopCoords({
      pin: { lat: shop.lat, lng: shop.lng },
      mapsShareUrl: "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f:0x1",
    }) != null,
    `${shop.id} directory coords stay official Riyadh pins`,
  );
}

const metersAsKm = neighborKm * 1000;
assert(
  metersAsKm > 2000 && metersAsKm < 4000,
  "document: labeling meters as km would turn ~2.6 km into ~2,600",
);
assert(
  riyadhReady.kind === "km" && riyadhReady.km * 1000 !== riyadhReady.km,
  "display km is not the meter figure",
);

const cidOnly: Shop = {
  id: "kultura-hittin-fold-fixture",
  nameAr: "كولتورا",
  nameEn: "Kultúra",
  city: "riyadh",
  neighborhood: "hittin",
  neighborhoodAr: "حطين",
  vibeTags: ["قهوة"],
  momentTags: ["matcha"],
  mapsShareUrl:
    "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee32fcfefa59f:0x231ad463648767e7",
  example: false,
};
assert(!officialShopCoords(cidOnly), "CID-only fixture has no usable pin yet");
const folded = foldOfficialPlacePins(
  [cidOnly],
  [{ id: "kultura-hittin-fold-fixture", pin: GOOD_NEIGHBOR }],
);
assert(folded.applied.length === 1, "Scout pack can add pin.lat/lng only");
assert(
  officialShopCoords(folded.shops[0]!) != null,
  "folded official pin unlocks Nearby km",
);
assert(
  foldOfficialPlacePins([cidOnly], [{ id: "kultura-hittin-fold-fixture", pin: SWAPPED }])
    .applied.length === 0,
  "fold rejects swapped / non-Riyadh garbage",
);
assert(
  foldOfficialPlacePins([cidOnly], [{ id: "kultura-hittin-fold-fixture", pin: SWAPPED }])
    .rejected.some((row) => row.id === "kultura-hittin-fold-fixture" && row.reason === "non-riyadh"),
  "fold lists swapped pins as rejected, not written",
);
assert(
  foldOfficialPlacePins([cidOnly], [{ id: "kultura-hittin-fold-fixture" }]).applied.length ===
    0,
  "fold never invents lat/lng when the pack has none",
);
const alreadyPinned = foldOfficialPlacePins(
  [{ ...cidOnly, pin: GOOD_NEIGHBOR }],
  [{ id: "kultura-hittin-fold-fixture", pin: CAMEL_STEP }],
);
assert(
  alreadyPinned.applied.length === 0 &&
    alreadyPinned.shops[0]?.pin?.lat === GOOD_NEIGHBOR.lat,
  "fold is addition-only — does not overwrite an existing official pin",
);

const dupDriveA: Shop = {
  ...cidOnly,
  id: "drive-al-rabi",
  mapsShareUrl:
    "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd00295eb7b9:0x36afe2294fa030d9",
};
const dupDriveB: Shop = {
  ...cidOnly,
  id: "drive-al-rabi-2",
  mapsShareUrl:
    "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f1300167fbf8d:0x6ed04938a9e8579b",
};
const dupFold = foldOfficialPlacePins(
  [dupDriveA, dupDriveB],
  [
    {
      id: "ar-rabi",
      lat: 24.7979995,
      lng: 46.7158477,
      mapsShareUrl:
        "https://www.google.com/maps/place/x/@24.7979995,46.7158477,17z/data=!4m6!3m5!1s0x3e2efd00295eb7b9:0x36afe2294fa030d9",
    },
    {
      id: "ar-rabi",
      lat: 24.4858894,
      lng: 46.6231185,
      mapsShareUrl:
        "https://www.google.com/maps/place/x/@24.4858894,46.6231185,17z/data=!4m6!3m5!1s0x3e2f1300167fbf8d:0x6ed04938a9e8579b",
    },
  ],
);
assert(
  dupFold.applied.map((row) => row.id).sort().join(",") ===
    "drive-al-rabi,drive-al-rabi-2",
  "duplicate pack ids resolve via official placeHex, not the sloppy Scout id",
);

const malazViewport = foldOfficialPlacePins(
  [cidOnly],
  [
    {
      id: "kultura-hittin-fold-fixture",
      lat: 24.126613,
      lng: 45.081137,
    },
  ],
);
assert(
  malazViewport.applied.length === 0 &&
    malazViewport.rejected.some((row) => row.reason === "non-riyadh"),
  "24.13N, 45.08E viewport garbage is rejected — prefer fallback over a bad pin",
);

for (const id of [
  "coffee-address-al-malaz",
  "java-cafe-al-malaz",
  "mezaj-al-malaz",
  "mezaj-maghrebi-al-wadi",
]) {
  const pin = getShop(id)?.pin;
  assert(pin && isRiyadhPlacePin(pin), `${id} folded pin stays in Riyadh`);
  assert(
    pin.lat > 24.4 && pin.lng > 46.4,
    `${id} did not take the 24.13N/45.08E viewport`,
  );
}

const foldScript = readFileSync(
  join(process.cwd(), "scripts/fold-official-place-pins.ts"),
  "utf8",
);
assert(
  foldScript.includes("waiting for a Scout pack") &&
    foldScript.includes("Never invents lat/lng") &&
    foldScript.includes("Soft Places parked"),
  "CLI hook stays no-op until a Scout pack path is passed",
);

console.log("check-distance: ok", {
  camelKm: Number(camelKm.toFixed(2)),
  neighborKm: Number(neighborKm.toFixed(2)),
});
