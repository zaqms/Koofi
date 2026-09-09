import { listRealShops } from "../lib/catalog";
import {
  dictionaryCoversLiveDistricts,
  dictionaryDistrictIds,
  districtListHref,
  extractPrimaryDistrict,
  listLiveDistrictIds,
} from "../lib/district-dictionary";
import {
  DISTRICT_POPULARITY_WEIGHTS,
  logNorm,
  rankInDistrict,
  shopsMissingIgFollowers,
} from "../lib/district-rank";
import { NEIGHBORHOODS } from "../lib/neighborhoods";
import { parseIntent } from "../lib/parse-intent";
import { pickCafes } from "../lib/picker";
import { districtPath } from "../lib/product";
import { dedupeSameBrand } from "../lib/shop-brand";
import { matchCatalogShops } from "../lib/shop-name";
import type { NeighborhoodId } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const catalog = listRealShops();
const catalogIds = new Set(catalog.map((shop) => shop.id));

const coverage = dictionaryCoversLiveDistricts();
assert(
  coverage.ok,
  `dictionary missing live districts: ${coverage.missing.join(", ")}`,
);

const live = listLiveDistrictIds();
assert(live.length === 22, `expected 22 live districts, got ${live.length}`);
assert(
  dictionaryDistrictIds().length >= live.length,
  "dictionary smaller than live catalog",
);

for (const id of live) {
  const place = NEIGHBORHOODS[id];
  assert(place, `live district ${id} has no dictionary row`);
  assert(place.ar.trim().length > 0, `${id} missing AR label`);
  assert(place.en.trim().length > 0, `${id} missing EN label`);
  assert(place.aliases.length > 0, `${id} missing aliases`);
  assert(
    extractPrimaryDistrict(place.en) === id,
    `${id} EN "${place.en}" did not extract`,
  );
  assert(
    extractPrimaryDistrict(place.ar) === id,
    `${id} AR "${place.ar}" did not extract`,
  );
  assert(
    extractPrimaryDistrict(place.id) === id,
    `${id} slug did not extract`,
  );
  for (const alias of place.aliases) {
    assert(
      extractPrimaryDistrict(alias) === id,
      `${id} alias "${alias}" did not extract`,
    );
    assert(
      matchCatalogShops(alias, catalog).length === 0,
      `حي alias "${alias}" must not name-match a shop`,
    );
  }
}

assert(extractPrimaryDistrict("Hittin") === "hittin", "Hittin");
assert(extractPrimaryDistrict("hittin") === "hittin", "hittin");
assert(extractPrimaryDistrict("حطين") === "hittin", "حطين");
assert(extractPrimaryDistrict("hitin") === "hittin", "hitin typo");
assert(extractPrimaryDistrict("al narjis") === "al-narjis", "al narjis");
assert(extractPrimaryDistrict("Al Narjis") === "al-narjis", "Al Narjis");
assert(extractPrimaryDistrict("النرجس") === "al-narjis", "النرجس");
assert(extractPrimaryDistrict("alnarjis") === "al-narjis", "alnarjis");
assert(extractPrimaryDistrict("Olaya") === "olaya", "Olaya");
assert(extractPrimaryDistrict("العليا") === "olaya", "العليا");
assert(extractPrimaryDistrict("quiet in Hittin") === "hittin", "quiet in Hittin");
assert(
  extractPrimaryDistrict("ابغى قهوة في حطين") === "hittin",
  "ابغى قهوة في حطين",
);

assert(extractPrimaryDistrict("Izdihar") === null, "do not invent Izdihar");
assert(extractPrimaryDistrict("الازدهار") === null, "do not invent الازدهار");
assert(parseIntent("Izdihar").neighborhoods.length === 0, "Izdihar not a حي");
assert(
  parseIntent("الازدهار").neighborhoods.length === 0,
  "الازدهار not a حي",
);

assert(DISTRICT_POPULARITY_WEIGHTS.maps === 0.6, "maps weight locked at 0.6");
assert(DISTRICT_POPULARITY_WEIGHTS.ig === 0.4, "IG weight locked at 0.4");
assert(logNorm(0, 100) === 0, "missing/0 reviewCount is bottom");
assert(logNorm(null, 100) === 0, "null reviewCount is bottom");
assert(logNorm(undefined, 50) === 0, "missing IG is bottom");
assert(logNorm(99, 0) === 0, "empty max is bottom");
assert(logNorm(Math.E - 1, Math.E - 1) === 1, "log-norm at max is 1");

const missingIg = shopsMissingIgFollowers(catalog);
assert(
  missingIg.length === catalog.length,
  `expected every live shop to lack a durable igFollowers field, got ${missingIg.length}/${catalog.length}`,
);

const LOCKED_POPULAR = [
  "namq-al-malqa",
  "urth-caffe-tahlia-sulimaniyah",
  "breehant-al-yasmin",
];

function assertPopularUnchanged(ask: string, language: "ar" | "en") {
  const result = pickCafes({ text: ask, language });
  const ids = result.picks.map((pick) => pick.shop.id);
  assert(result.askedMoments.join(",") === "popular", `${ask} must stay popular`);
  assert(
    ids.join(",") === LOCKED_POPULAR.join(","),
    `Most Popular chip formula changed: ${ids.join(",")}`,
  );
  assert(!result.matchedDistrict, `${ask} is not a district ask`);
}

assertPopularUnchanged("Most Popular", "en");
assertPopularUnchanged("اللي عليها طلب", "ar");

function assertDistrictTop3(
  ask: string,
  language: "ar" | "en",
  district: NeighborhoodId,
) {
  const result = pickCafes({ text: ask, language });
  const expected = dedupeSameBrand(
    rankInDistrict(
      catalog.filter((shop) => shop.neighborhood === district),
      district,
    ),
  )
    .slice(0, 3)
    .map((shop) => shop.id);

  assert(result.matchedDistrict === district, `${ask} matchedDistrict`);
  assert(result.picks.length === 3, `${ask} should return 3, got ${result.picks.length}`);
  assert(
    result.picks.every((pick) => pick.shop.neighborhood === district),
    `${ask} left the district: ${result.picks.map((pick) => pick.shop.id).join(", ")}`,
  );
  assert(
    result.picks.every((pick) => catalogIds.has(pick.shop.id)),
    `${ask} invented a shop`,
  );
  const ids = result.picks.map((pick) => pick.shop.id);
  assert(
    ids.join(",") === expected.join(","),
    `${ask} rank was ${ids.join(",")} expected ${expected.join(",")}`,
  );
  const again = pickCafes({ text: ask, language });
  assert(
    again.picks.map((pick) => pick.shop.id).join(",") === ids.join(","),
    `${ask} must not shuffle`,
  );
  assert(
    districtListHref(district, language) === districtPath(district, language),
    `${ask} district list path`,
  );
}

assert(districtPath("hittin", "ar") === "/coffee-shops/hittin", "AR hittin path");
assert(
  districtPath("al-narjis", "en") === "/en/coffee-shops/al-narjis",
  "EN narjis path",
);

assertDistrictTop3("حطين", "ar", "hittin");
assertDistrictTop3("Hittin", "en", "hittin");
assertDistrictTop3("hittin", "en", "hittin");
assertDistrictTop3("quiet in Hittin", "en", "hittin");
assertDistrictTop3("ابغى قهوة في حطين", "ar", "hittin");
assertDistrictTop3("al narjis", "en", "al-narjis");
assertDistrictTop3("النرجس", "ar", "al-narjis");
assertDistrictTop3("Olaya", "en", "olaya");
assertDistrictTop3("العليا", "ar", "olaya");

const woods = pickCafes({ text: "woods", language: "en" });
assert(woods.picks[0]?.shop.id.startsWith("woods-"), "named shop path stays");
assert(!woods.matchedDistrict, "woods is not a district ask");

console.log("check-district-chat: ok");
console.log(
  `live districts ${live.length}; shops missing IG followers ${missingIg.length}/${catalog.length}`,
);
console.log(
  pickCafes({ text: "حطين", language: "ar" })
    .picks.map(
      (pick, i) =>
        `${i + 1}) ${pick.shop.nameEn} [${pick.shop.neighborhood}] ${pick.shop.popularityIndex}`,
    )
    .join("\n"),
);
