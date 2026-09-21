import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  neighborhoodsSearchParams,
  trackEvent,
  trackNeighborhoodsSearch,
  type AnalyticsEventName,
} from "../lib/track";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const requiredEvents = [
  "district_select",
  "neighborhoods_view_all",
  "neighborhoods_search",
  "neighborhoods_sort",
] as const satisfies readonly AnalyticsEventName[];

const trackSource = readFileSync(join(process.cwd(), "lib/track.ts"), "utf8");
for (const name of requiredEvents) {
  assert(trackSource.includes(`"${name}"`), `track.ts exports ${name}`);
}
assert(trackSource.includes("home_pill"), "DistrictSelectSource includes home_pill");
assert(trackSource.includes("view_all"), "DistrictSelectSource includes view_all");
assert(trackSource.includes("city?: City"), "AnalyticsParams carries city");
assert(trackSource.includes("sort?: NeighborhoodsSortId"), "AnalyticsParams carries sort");

assert(
  neighborhoodsSearchParams({ query: "", locale: "en", city: "riyadh" }) === null,
  "empty search is not tracked",
);
assert(
  neighborhoodsSearchParams({ query: "   ", locale: "ar", city: "riyadh" }) === null,
  "whitespace search is not tracked",
);

const olaya = neighborhoodsSearchParams({
  query: "  olaya  ",
  locale: "en",
  city: "riyadh",
});
assert(olaya?.query_text === "olaya", "search trims query_text");
assert(olaya?.locale === "en", "search locale");
assert(olaya?.city === "riyadh", "search city");

type WindowStub = { dataLayer: Array<Record<string, unknown>> };
const previousWindow = (globalThis as { window?: unknown }).window;
const stub: WindowStub = { dataLayer: [] };
(globalThis as { window: WindowStub }).window = stub;

try {
  assert(
    trackNeighborhoodsSearch({ query: "olaya", locale: "en", city: "riyadh" }),
    "non-empty search tracks",
  );
  const afterSearch = stub.dataLayer.length;
  trackNeighborhoodsSearch({ query: "olaya", locale: "en", city: "riyadh" });
  assert(stub.dataLayer.length === afterSearch, "same search within 400ms is deduped");
  assert(
    trackNeighborhoodsSearch({ query: "   ", locale: "en", city: "riyadh" }) === false,
    "whitespace search does not push",
  );

  trackEvent(
    "district_select",
    {
      district_id: "hittin",
      district_ar: "حطين",
      district_en: "Hittin",
      locale: "en",
      source: "home_pill",
      city: "riyadh",
    },
    { dedupeKey: "district_select:home_pill:hittin" },
  );
  trackEvent(
    "district_select",
    {
      district_id: "olaya",
      district_ar: "العليا",
      district_en: "Al Olaya",
      locale: "ar",
      source: "view_all",
      city: "riyadh",
    },
    { dedupeKey: "district_select:view_all:olaya" },
  );
  trackEvent(
    "neighborhoods_view_all",
    { locale: "en", city: "riyadh" },
    { dedupeKey: "neighborhoods_view_all:en:riyadh" },
  );
  trackEvent(
    "neighborhoods_sort",
    { sort: "az", locale: "en", city: "riyadh" },
    { dedupeKey: "neighborhoods_sort:en:riyadh:az" },
  );

  const events = stub.dataLayer.map((row) => row.event);
  assert(events.includes("neighborhoods_search"), "search event on dataLayer");
  assert(events.includes("district_select"), "district_select on dataLayer");
  assert(events.includes("neighborhoods_view_all"), "view-all event on dataLayer");
  assert(events.includes("neighborhoods_sort"), "sort event on dataLayer");

  const homePill = stub.dataLayer.find(
    (row) => row.event === "district_select" && row.source === "home_pill",
  );
  assert(homePill?.city === "riyadh", "home pill carries city");
  assert(homePill?.district_id === "hittin", "home pill keeps district_id");
  assert(homePill?.locale === "en", "home pill keeps locale");

  const viewAll = stub.dataLayer.find(
    (row) => row.event === "district_select" && row.source === "view_all",
  );
  assert(viewAll?.district_id === "olaya", "view-all row keeps district_id");
} finally {
  if (previousWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    (globalThis as { window: unknown }).window = previousWindow;
  }
}

console.log("check-neighborhoods-analytics: ok");
