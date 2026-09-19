import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  listBrowseDirectoryShops,
  listDirectoryShopsForDistrict,
  listRealShops,
  listShops,
} from "../lib/catalog";
import {
  CITY_REGISTRY,
  cityFromRegistryLabel,
  cityLabel,
  DEFAULT_LIVE_CITY,
  isComingSoonCity,
  isLiveCity,
  listCityRegistry,
  mostPopularHeadingForCity,
} from "../lib/cities";
import { copy } from "../lib/copy";
import {
  DISTRICT_CITY,
  districtCity,
  districtsInCity,
  shopMatchesDistrictCity,
} from "../lib/district-city";
import { extractPrimaryDistrict, isExactDistrictAsk } from "../lib/district-dictionary";
import { aboutFaqs } from "../lib/faq";
import { NEIGHBORHOODS } from "../lib/neighborhoods";
import { parseIntent } from "../lib/parse-intent";
import { pickCafes } from "../lib/picker";
import { MOST_POPULAR_HEADING } from "../lib/product";
import { NEIGHBORHOOD_IDS, type City, type Shop } from "../lib/types";
import { listNeighborhoodRows } from "../lib/browse-neighborhoods";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const registry = listCityRegistry();
assert(registry[0]?.id === "riyadh", "Riyadh sorts first");
assert(isLiveCity("riyadh"), "Riyadh is live");
assert(DEFAULT_LIVE_CITY === "riyadh", "default live city is Riyadh");
assert(isComingSoonCity("jeddah") && isComingSoonCity("dammam"), "Jeddah + Dammam coming soon");
assert(
  CITY_REGISTRY.every((row) => {
    const id = String(row.id);
    const name = String(row.nameEn);
    return id !== "ween" && name !== "Ween";
  }),
  "brand stays wain — never ween",
);
assert(cityLabel("riyadh", "ar") === "الرياض", "approved AR Riyadh");
assert(cityLabel("jeddah", "ar") === "جدة", "approved AR Jeddah");
assert(cityLabel("dammam", "ar") === "الدمام", "approved AR Dammam");
assert(cityLabel("jeddah", "en") === "Jeddah", "EN Jeddah");
assert(cityLabel("dammam", "en") === "Dammam", "EN Dammam");

assert(districtsInCity("riyadh").length === NEIGHBORHOOD_IDS.length, "all districts are Riyadh");
assert(
  NEIGHBORHOOD_IDS.every((id) => DISTRICT_CITY[id] === "riyadh"),
  "structured district city is Riyadh for every live حي",
);
assert(
  NEIGHBORHOOD_IDS.every((id) => districtCity(id) === DISTRICT_CITY[id]),
  "districtCity reads the structured field, not a name",
);

assert(cityFromRegistryLabel("Riyadh") === "riyadh", "registry label Riyadh");
assert(cityFromRegistryLabel("جدة") === "jeddah", "registry label جدة");
assert(cityFromRegistryLabel("الدمام") === "dammam", "registry label الدمام");
assert(
  cityFromRegistryLabel("Hittin") === null &&
    cityFromRegistryLabel("حطين") === null &&
    cityFromRegistryLabel("Al Hamra") === null &&
    cityFromRegistryLabel("الحمراء") === null,
  "never infer a city from a district name string",
);

const shops = listRealShops();
assert(shops.length > 0, "Riyadh catalog has shops");
assert(
  shops.every((shop) => shop.city === "riyadh"),
  "every catalog shop has structured city riyadh",
);
assert(
  shops.every((shop) => shopMatchesDistrictCity(shop)),
  "shop.city matches the district's structured city",
);
assert(listShops("riyadh").length === listShops().length, "default listShops is Riyadh");

const jeddahAsCity = "jeddah" as City;
assert(listShops(jeddahAsCity).length === 0, "coming-soon city has zero catalog shops");
assert(
  listDirectoryShopsForDistrict("hittin").every((shop) => {
    const row = shops.find((item) => item.id === shop.id);
    return row?.city === "riyadh" && row.neighborhood === "hittin";
  }),
  "Hittin directory is Riyadh-only",
);

const leaked: Shop = {
  ...shops[0]!,
  id: "fake-jeddah-leak",
  city: "jeddah" as City,
  neighborhood: "hittin",
};
assert(
  listShops("riyadh").every((shop) => shop.id !== leaked.id),
  "a Jeddah-tagged shop cannot enter the Riyadh catalog list",
);
assert(
  leaked.city !== districtCity(leaked.neighborhood),
  "mismatched shop.city vs district city is detectable — do not infer city from حي",
);

const riyadhRows = listNeighborhoodRows("en", listBrowseDirectoryShops(), "riyadh");
assert(
  riyadhRows.every((row) => districtCity(row.id) === "riyadh"),
  "neighborhood index rows stay in the requested city",
);
assert(
  riyadhRows.some((row) => row.id === "hittin"),
  "Riyadh index still includes Hittin",
);

const hittinIntent = parseIntent("حطين", "riyadh");
assert(hittinIntent.neighborhoods.includes("hittin"), "Riyadh parse still matches Hittin");
assert(extractPrimaryDistrict("Hittin", "riyadh") === "hittin", "Riyadh extract Hittin");
assert(isExactDistrictAsk("olaya", "riyadh"), "Riyadh exact Olaya ask");

const picks = pickCafes({ text: "حطين", language: "ar", city: "riyadh" });
assert(picks.matchedDistrict === "hittin", "district chat still matches Hittin");
assert(
  picks.picks.every((row) => row.shop.city === "riyadh" && row.shop.neighborhood === "hittin"),
  "Hittin picks never leak another city",
);

assert(
  mostPopularHeadingForCity("en") === "Most popular coffee shops in Riyadh",
  "popular heading stays Riyadh for the live city",
);
assert(
  MOST_POPULAR_HEADING.ar === "أشهر القهاوي في الرياض",
  "AR popular heading stays Riyadh",
);
assert(copy.directoryHint.en === "Cafes we like in Riyadh.", "directory hint uses live city");
assert(copy.directoryHint.ar === "قهوة نحبها في الرياض.", "AR directory hint uses live city");
assert(copy.offTopic.en.includes("coffee in Riyadh"), "off-topic uses live city");
assert(copy.meetHalfwayCity.ar === "الرياض", "بيننا city label is the live city entity");
assert(!("cityOnly" in copy), "hard-coded cityOnly eyebrow is gone");

const aboutAr = aboutFaqs("ar");
const aboutEn = aboutFaqs("en");
assert(
  aboutAr.some((item) => item.a.includes("جدة") && item.a.includes("الدمام")),
  "About AR names coming-soon cities without inventing catalogs",
);
assert(
  aboutEn.some((item) => /Jeddah/.test(item.a) && /Dammam/.test(item.a)),
  "About EN names coming-soon cities",
);
assert(
  !aboutEn.some((item) => /Riyadh only/.test(item.a)),
  "About EN dropped Riyadh-only product claim",
);

const citiesSource = readRepo("lib/cities.ts");
assert(
  !citiesSource.includes("weeen") && !citiesSource.includes("Ween"),
  "city registry never says ween",
);
assert(
  /comingSoon/.test(citiesSource) &&
    citiesSource.includes("jeddah") &&
    citiesSource.includes("dammam"),
  "coming-soon cities are registry flags",
);

const selector = readRepo("components/city-selector.tsx");
assert(selector.includes("data-city-selector"), "city selector is in the header chrome");
assert(!selector.includes("/jeddah") && !selector.includes("/dammam"), "no coming-soon city URLs");

const comingSoon = readRepo("components/coming-soon-city.tsx");
assert(
  comingSoon.includes("comingSoonHeading") && comingSoon.includes("data-coming-soon-city"),
  "coming-soon state is a dedicated EN+AR surface",
);

const home = readRepo("components/home-landing.tsx");
assert(home.includes("CityDiscovery"), "home hides live catalog under coming soon");

const chat = readRepo("components/chat.tsx");
assert(chat.includes("CitySelector") && chat.includes("ComingSoonCity"), "chat chrome is city-aware");
assert(chat.includes("city: cityId"), "chat asks are scoped by city");

const robots = readRepo("app/robots.ts");
assert(!robots.includes("/jeddah") && !robots.includes("/dammam"), "robots has no empty city paths");

for (const id of NEIGHBORHOOD_IDS) {
  assert(NEIGHBORHOODS[id], `district ${id} exists`);
  assert(districtCity(id) === "riyadh", `district ${id} stays Riyadh in v1`);
}

console.log("check-city-scope: ok");
