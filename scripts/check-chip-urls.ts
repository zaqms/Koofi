/**
 * Ajz-locked dedicated chip URLs (12 Sep 2026).
 * 18 Sep: with-friends chip id matches the public slug
 * (old `/date` and `/for-two` 308). Soft Places stays parked.
 * Do not rename other paths.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isDriveThroughLane,
  listDirectoryShops,
  listDriveThroughDirectoryShops,
  listRealShops,
} from "../lib/catalog";
import { filterDirectoryShopsByMoment } from "../lib/directory";
import {
  categoryListingStaticParams,
  listPopularDirectoryShops,
} from "../lib/most-popular";
import { isNeighborhoodId } from "../lib/neighborhoods";
import {
  COFFEE_SHOP_CHIP_SLUGS,
  DATE_CHIP_ID,
  DATE_CHIP_PUBLIC_SLUG,
  HALFWAY_INVITE_PATH_PREFIX,
  HALFWAY_LANDING_PATH,
  HOME_CHIP_IDS,
  LEGACY_CHIP_REDIRECTS,
  LEGACY_SHOP_REDIRECTS,
  LEGACY_DATE_CHIP_SLUGS,
  LOCKED_HOME_SUPPORT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  MEET_HALFWAY_CHIP,
  MEET_HALFWAY_HOME_ART,
  MEET_HALFWAY_HOME_SUB,
  NEARBY_CHIP,
  OFF_HOME_CHIP_IDS,
  VIBE_CHIPS,
  chipDirectoryMoment,
  chipIdFromCoffeeShopSlug,
  chipSharePath,
  isStaticDirectoryChip,
  coffeeShopChipPath,
  coffeeShopChipSlugForId,
  halfwayInvitePath,
  halfwayPath,
  homeSurfaceChips,
  isCoffeeShopChipSlug,
  isHomeChipId,
  isOffHomeChipId,
  isMostPopularSlug,
  mostPopularPath,
} from "../lib/product";
import { restoreOffHomeChipOpen } from "../lib/chip-open";
import { TEMPORARY_DEFAULT_LANDING_MOST_POPULAR } from "../lib/landing-experiment";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const LOCKED_CHIP_PATHS = {
  "meet-halfway": { ar: "/halfway", en: "/en/halfway" },
  popular: {
    ar: "/coffee-shops/most-popular",
    en: "/en/coffee-shops/most-popular",
  },
  nearby: { ar: "/coffee-shops/nearby", en: "/en/coffee-shops/nearby" },
  coffee: { ar: "/coffee-shops/coffee", en: "/en/coffee-shops/coffee" },
  pastry: { ar: "/coffee-shops/pastry", en: "/en/coffee-shops/pastry" },
  roaster: { ar: "/coffee-shops/roaster", en: "/en/coffee-shops/roaster" },
  specialty: { ar: "/coffee-shops/specialty", en: "/en/coffee-shops/specialty" },
  quiet: { ar: "/coffee-shops/quiet", en: "/en/coffee-shops/quiet" },
  work: { ar: "/coffee-shops/work", en: "/en/coffee-shops/work" },
  study: { ar: "/coffee-shops/study", en: "/en/coffee-shops/study" },
  late: { ar: "/coffee-shops/late", en: "/en/coffee-shops/late" },
  outdoor: { ar: "/coffee-shops/outdoor", en: "/en/coffee-shops/outdoor" },
  "with-friends": { ar: "/coffee-shops/with-friends", en: "/en/coffee-shops/with-friends" },
  matcha: { ar: "/coffee-shops/matcha", en: "/en/coffee-shops/matcha" },
  "drive-through": {
    ar: "/coffee-shops/drive-through",
    en: "/en/coffee-shops/drive-through",
  },
} as const;

for (const [chipId, paths] of Object.entries(LOCKED_CHIP_PATHS)) {
  assert(
    chipSharePath(chipId, "ar") === paths.ar,
    `AR path lock ${chipId} → ${paths.ar}`,
  );
  assert(
    chipSharePath(chipId, "en") === paths.en,
    `EN path lock ${chipId} → ${paths.en}`,
  );
}

assert(halfwayPath("ar") === "/halfway", "AR بيننا landing is /halfway");
assert(halfwayPath("en") === "/en/halfway", "EN بيننا landing is /en/halfway");
assert(
  HALFWAY_LANDING_PATH === "/halfway",
  "landing segment stays halfway, not h",
);
assert(
  HALFWAY_INVITE_PATH_PREFIX === "/h",
  "invite sessions stay /h/{id}",
);
assert(
  halfwayInvitePath("demo") === "/h/demo",
  "guest invite path stays /h/{id}",
);
assert(
  halfwayInvitePath("demo", "en") === "/en/h/demo",
  "EN guest invite path is /en/h/{id}",
);
assert(
  halfwayPath("ar") !== halfwayInvitePath("halfway"),
  "/halfway must not collide with /h/{id}",
);
assert(
  !isCoffeeShopChipSlug("meet-halfway") && !isCoffeeShopChipSlug("popular"),
  "بيننا and popular are not coffee-shops chip slugs",
);
assert(
  !isMostPopularSlug("coffee") && !isMostPopularSlug("nearby"),
  "vibe/nearby slugs are not most-popular",
);
assert(
  !isNeighborhoodId("coffee") &&
    !isNeighborhoodId("nearby") &&
    !isNeighborhoodId("halfway") &&
    !isNeighborhoodId("most-popular"),
  "chip slugs must not collide with district ids",
);

for (const slug of COFFEE_SHOP_CHIP_SLUGS) {
  assert(!isNeighborhoodId(slug), `${slug} is not a district`);
  assert(
    coffeeShopChipPath(slug, "ar") === `/coffee-shops/${slug}`,
    `AR coffee-shops/${slug}`,
  );
  assert(
    coffeeShopChipPath(slug, "en") === `/en/coffee-shops/${slug}`,
    `EN coffee-shops/${slug}`,
  );
}

const vibeIds: readonly string[] = VIBE_CHIPS.map((chip) => chip.id);
assert(vibeIds.includes("popular"), "popular chip stays live");
assert(
  !vibeIds.includes("meet-halfway"),
  "بيننا is not a Soft Places vibe chip",
);
assert(VIBE_CHIPS.length === 13, "Soft Places stay parked — 13 vibe chips");
assert(NEARBY_CHIP.id === "nearby", "nearby chip id stays nearby");
assert(NEARBY_CHIP.ar === "قريب مني", "nearby AR display is قريب مني");
assert(MEET_HALFWAY_CHIP.id === "meet-halfway", "بيننا chip id stays");
assert(MEET_HALFWAY_CHIP.ar === "بيننا", "بيننا AR title stays");
assert(
  MEET_HALFWAY_HOME_SUB.ar === "نلقى لكم قهوة بالنص",
  "بيننا home subtitle is locked",
);
assert(
  MEET_HALFWAY_HOME_ART.src === "/brand/baynana-3d.png",
  "بيننا 3D cluster is a public asset",
);
assert(
  HOME_CHIP_IDS.join(",") ===
    "popular,nearby,matcha,coffee,work,with-friends,outdoor,drive-through",
  "P0 home order is the 8-tile grid — Nearby 2nd, Drive-through last",
);
assert(
  OFF_HOME_CHIP_IDS.join(",") === "roaster,specialty,study,late,quiet",
  "off-home chip ids stay shareable",
);
assert(homeSurfaceChips().length === 8, "home chrome is eight chips");
const homeChipIds: readonly string[] = homeSurfaceChips().map((chip) => chip.id);
assert(
  !homeChipIds.includes("meet-halfway"),
  "بيننا is not a home grid tile",
);
assert(!isHomeChipId("roaster"), "off-home chips stay off the 4×2");
assert(
  OFF_HOME_CHIP_IDS.every((id) => isOffHomeChipId(id)) &&
    !isOffHomeChipId("coffee") &&
    !isOffHomeChipId("popular"),
  "off-home helper matches only the shareable off-home URLs",
);
for (const language of ["ar", "en"] as const) {
  for (const id of OFF_HOME_CHIP_IDS) {
    const open = restoreOffHomeChipOpen(id, language);
    assert(open, `${language} ${id} still opens`);
    assert(
      open.picks.length === 3,
      `${language} ${id} must serve three picks, got ${open.picks.length}`,
    );
  }
}
assert(
  restoreOffHomeChipOpen("coffee", "ar") === null,
  "home-strip chips are not off-home restores",
);
assert(
  !(HOME_CHIP_IDS as readonly string[]).includes("meet-halfway"),
  "بيننا is not a home chip id",
);
assert(LOCKED_OPENER === "وين ودّك تروح اليوم؟", "AR P0 headline locked");
assert(
  LOCKED_OPENER_EN === "Where do you want to go today?",
  "EN P0 headline locked",
);
assert(
  LOCKED_HOME_SUPPORT.ar === "اختر جوّك، أو خلّنا نلقى لكم مكان بالنص.",
  "AR P0 support locked",
);

const LOCKED_HOME_LABELS: Record<string, string> = {
  popular: "الأكثر شعبية",
  coffee: "أفضل قهوة",
  pastry: "قهوة وحلى",
  matcha: "ماتشا",
  "drive-through": "طلبات السيارة",
  work: "للشغل",
  "with-friends": "مع الأصحاب",
  outdoor: "جلسات خارجية",
  nearby: "قريب مني",
};
for (const chip of homeSurfaceChips()) {
  assert(
    chip.ar === LOCKED_HOME_LABELS[chip.id],
    `AR home label ${chip.id} → ${LOCKED_HOME_LABELS[chip.id]}`,
  );
}

const LOCKED_HOME_LABELS_EN: Record<string, string> = {
  popular: "Most Popular",
  coffee: "Best Coffee",
  pastry: "Coffee and sweets",
  matcha: "Matcha",
  "drive-through": "Drive-through",
  work: "Best for Work",
  "with-friends": "With friends",
  outdoor: "Outdoor seating",
  nearby: "Nearby",
};
for (const chip of homeSurfaceChips()) {
  assert(
    chip.en === LOCKED_HOME_LABELS_EN[chip.id],
    `EN home label ${chip.id} → ${LOCKED_HOME_LABELS_EN[chip.id]}`,
  );
}

assert(DATE_CHIP_ID === "with-friends", "catalog filter key is with-friends");
assert(
  DATE_CHIP_PUBLIC_SLUG === "with-friends",
  "public with-friends slug matches the chip id",
);
assert(
  LEGACY_DATE_CHIP_SLUGS.join(",") === "date,for-two,good-for-a-date",
  "old public slugs stay date, for-two, and good-for-a-date",
);
assert(
  coffeeShopChipSlugForId(DATE_CHIP_ID) === DATE_CHIP_PUBLIC_SLUG,
  "with-friends id maps to with-friends slug",
);
assert(
  chipIdFromCoffeeShopSlug(DATE_CHIP_PUBLIC_SLUG) === DATE_CHIP_ID,
  "with-friends slug maps back to with-friends id",
);
for (const slug of LEGACY_DATE_CHIP_SLUGS) {
  assert(
    !isCoffeeShopChipSlug(slug),
    `legacy ${slug} slug is not a live coffee-shops path`,
  );
}
assert(
  isCoffeeShopChipSlug(DATE_CHIP_PUBLIC_SLUG),
  "with-friends is a live coffee-shops slug",
);
assert(
  !isNeighborhoodId(DATE_CHIP_PUBLIC_SLUG),
  "with-friends must not collide with a district",
);
assert(
  LEGACY_CHIP_REDIRECTS.length === 6 &&
    LEGACY_CHIP_REDIRECTS.every((row) => row.statusCode === 308),
  "old dating URLs 308 to with-friends",
);
assert(
  LEGACY_CHIP_REDIRECTS[0]?.source === "/coffee-shops/date" &&
    LEGACY_CHIP_REDIRECTS[0]?.destination === "/coffee-shops/with-friends",
  "AR date → with-friends",
);
assert(
  LEGACY_CHIP_REDIRECTS[1]?.source === "/en/coffee-shops/date" &&
    LEGACY_CHIP_REDIRECTS[1]?.destination === "/en/coffee-shops/with-friends",
  "EN date → with-friends",
);
assert(
  LEGACY_CHIP_REDIRECTS[2]?.source === "/coffee-shops/for-two" &&
    LEGACY_CHIP_REDIRECTS[2]?.destination === "/coffee-shops/with-friends",
  "AR for-two → with-friends",
);
assert(
  LEGACY_CHIP_REDIRECTS[3]?.source === "/en/coffee-shops/for-two" &&
    LEGACY_CHIP_REDIRECTS[3]?.destination === "/en/coffee-shops/with-friends",
  "EN for-two → with-friends",
);
assert(
  LEGACY_CHIP_REDIRECTS[4]?.source === "/coffee-shops/good-for-a-date" &&
    LEGACY_CHIP_REDIRECTS[4]?.destination === "/coffee-shops/with-friends",
  "AR good-for-a-date → with-friends",
);
assert(
  LEGACY_CHIP_REDIRECTS[5]?.source === "/en/coffee-shops/good-for-a-date" &&
    LEGACY_CHIP_REDIRECTS[5]?.destination === "/en/coffee-shops/with-friends",
  "EN good-for-a-date → with-friends",
);

const staticParams = categoryListingStaticParams();
for (const slug of ["most-popular", ...COFFEE_SHOP_CHIP_SLUGS]) {
  assert(
    staticParams.some(
      (row) => row.category === "coffee-shops" && row.slug === slug,
    ),
    `static param missing ${slug}`,
  );
}
assert(
  !staticParams.some((row) => row.slug === "meet-halfway"),
  "meet-halfway is not a coffee-shops slug",
);
for (const slug of LEGACY_DATE_CHIP_SLUGS) {
  assert(
    !staticParams.some((row) => row.slug === slug),
    `legacy ${slug} slug is not a generated coffee-shops page`,
  );
}

assert(
  TEMPORARY_DEFAULT_LANDING_MOST_POPULAR === false,
  "P0 home is `/` — Most Popular redirect is off",
);
assert(
  mostPopularPath("ar") === LOCKED_CHIP_PATHS.popular.ar,
  "popular path unchanged",
);

const repo = process.cwd();
const read = (rel: string) => readFileSync(join(repo, rel), "utf8");

assert(existsSync(join(repo, "app/halfway/page.tsx")), "AR /halfway page");
assert(existsSync(join(repo, "app/en/halfway/page.tsx")), "EN /halfway page");
assert(existsSync(join(repo, "app/h/[id]/page.tsx")), "AR /h/{id} page");
assert(existsSync(join(repo, "app/en/h/[id]/page.tsx")), "EN /en/h/{id} page");

const halfwayAr = read("app/halfway/page.tsx");
const halfwayEn = read("app/en/halfway/page.tsx");
assert(
  halfwayAr.includes("HomeLanding") &&
    halfwayAr.includes("selectedChipId") &&
    halfwayAr.includes("meet-halfway") &&
    !/Koofi/i.test(halfwayAr),
  "AR /halfway opens HomeLanding Invite chip",
);
assert(
  halfwayEn.includes('language="en"') &&
    halfwayEn.includes("meet-halfway") &&
    !/Koofi/i.test(halfwayEn),
  "EN /halfway opens HomeLanding Invite chip",
);

const categoryAr = read("app/[category]/[slug]/page.tsx");
const categoryEn = read("app/en/[category]/[slug]/page.tsx");
assert(
  categoryAr.includes("isCoffeeShopChipSlug") &&
    categoryAr.includes("chipIdFromCoffeeShopSlug") &&
    categoryAr.includes("selectedChipId={chipId}") &&
    categoryAr.includes("dynamicParams = true") &&
    categoryEn.includes("isCoffeeShopChipSlug") &&
    categoryEn.includes("chipIdFromCoffeeShopSlug") &&
    categoryEn.includes("selectedChipId={chipId}") &&
    categoryEn.includes("dynamicParams = true"),
  "directory category routes open vibe/nearby chips",
);

const chips = read("components/vibe-chips.tsx");
assert(chips.includes("chipSharePath"), "every live chip has a share path");
assert(
  chips.includes("href={chipSharePath(chip.id, language)}"),
  "vibe/nearby/popular chips are Links to dedicated paths",
);
assert(
  chips.includes("homeSurfaceChips") && chips.includes("grid-cols-4"),
  "home chip chrome is the locked 4×2 subset",
);
assert(
  !chips.includes("meet-halfway") && !chips.includes("MEET_HALFWAY_CHIP"),
  "بيننا is not a tile in the chip grid",
);
assert(
  !chips.includes("ثلاث الليلة") && !chips.includes("ON TONIGHT"),
  "Soft Places chips stay parked",
);
assert(
  chips.includes('case "with-friends"') &&
    chips.includes('<circle cx="6.8" cy="7.8" r="2.4" />') &&
    chips.includes('<circle cx="17.2" cy="7.8" r="2.4" />') &&
    !chips.includes('a2.5 2.5 0 0 1 0 5') &&
    !chips.includes('<circle cx="9" cy="8" r="2.65" />') &&
    !chips.includes('<circle cx="12" cy="8" r="3.1" />') &&
    !/heart|romance|💕|❤|couple|hand-hold/i.test(chips),
  "with-friends chip is two heads with a gap — no overlap or romance",
);
assert(
  chips.includes('case "matcha"') &&
    chips.includes("{/* bowl + whisk */}") &&
    chips.includes('viewBox="0 0 512 512"') &&
    chips.includes('strokeWidth="14"') &&
    chips.includes('d="M92 190C110 155 170 139 244 139c46 0 86 6 116 19"') &&
    chips.includes(
      'd="M371 247l-21 74c-2 9 4 16 13 19l18 6c9 3 17-2 19-11l18-69"',
    ) &&
    !chips.includes("{/* chawan + chasen */}") &&
    !chips.includes('<ellipse cx="9"') &&
    !chips.includes("M3 9.25c.25 4.85") &&
    !chips.includes("M12.4 4.8c3.2") &&
    !chips.includes('stroke="#111"') &&
    chips.includes('stroke="currentColor"') &&
    chips.includes('strokeWidth = "1.55"') &&
    chips.includes("className=\"size-7 shrink-0\"") &&
    !chips.includes("bg-matcha") &&
    !chips.includes("text-matcha") &&
    !chips.includes("border-matcha") &&
    !chips.includes("vibeChipClass(chip.id") &&
    !chips.includes("vibeChipClass(id"),
  "Matcha uses Amjad v2 512 bowl+whisk ship SVG with currentColor",
);
assert(
  chips.includes("border-line bg-foam") &&
    chips.includes("text-ink") &&
    chips.includes("border-bean bg-bean") &&
    chips.includes("text-foam") &&
    (chips.match(/border-line bg-foam/g)?.length ?? 0) === 1 &&
    (chips.match(/border-bean bg-bean/g)?.length ?? 0) === 1,
  "vibe chips share Paper/white + Ink unselected and dusty-bean selected",
);
assert(
  !read("app/globals.css").includes("--matcha") &&
    !read("app/globals.css").includes("--color-matcha"),
  "no special Matcha color tokens",
);
assert(chipDirectoryMoment("matcha") === "matcha", "matcha slug filters matcha tags");
assert(
  filterDirectoryShopsByMoment(listDirectoryShops(), "matcha").length === 26,
  "Matcha route directory is the 26 tagged shops",
);
assert(
  chipDirectoryMoment("drive-through") === "drive-through",
  "drive-through slug filters drive-through tags",
);
assert(
  listDriveThroughDirectoryShops().length === 77,
  "Drive-through directory is 67 ADD + 10 TAG",
);
assert(
  listDriveThroughDirectoryShops().every((shop) =>
    shop.momentTags.includes("drive-through"),
  ),
  "Drive-through directory is drive-through-tagged only",
);
assert(
  listDriveThroughDirectoryShops().every(
    (shop) => !shop.vibeTags.includes("درايف ثرو"),
  ),
  "DT cards dropped legacy درايف ثرو vibe tag",
);
assert(
  listRealShops()
    .filter(isDriveThroughLane)
    .every((shop) => shop.vibeTags.includes("طلبات السيارة")),
  "DT-lane cards show طلبات السيارة",
);
assert(
  listDriveThroughDirectoryShops().find((shop) => shop.id === "a-plus-as-salam")
    ?.nameAr === "اي بلس درايف ثرو",
  "A PLUS cafe name stays اي بلس درايف ثرو",
);
assert(
  !listDirectoryShops().some((shop) => shop.id === "java-cafe-al-wadi"),
  "DT-lane additions stay out of default specialty directory",
);
assert(
  chips.includes('case "drive-through"') &&
    chips.includes("{/* car + pickup cup */}") &&
    chips.includes('viewBox="0 0 512 512"') &&
    chips.includes('strokeWidth="18"') &&
    chips.includes('d="M414 398V145c0-15-12-27-27-27H278"') &&
    chips.includes('d="M349 240l8 48h30l8-48"') &&
    !chips.includes('strokeWidth="0.9"') &&
    !chips.includes('d="M21.2 18.55 V5.2 H14.0"') &&
    !chips.includes('d="M20.4 18.8V6.6H15.9"') &&
    !chips.includes('d="M16.05 10l.3 2.4h1.5l.3-2.4z"') &&
    !chips.includes('d="M15 17.8V5.6H21"') &&
    !chips.includes('d="M17.45 9L17.7 11.55H19.9L20.15 9Z"') &&
    !chips.includes('d="M4.2 14.2h15.6"') &&
    !chips.includes("{/* cup at window */}") &&
    !chips.includes('<rect x="3.2" y="3.8" width="10.2" height="16.4" rx="1.4" />') &&
    !chips.includes("bg-drive") &&
    !chips.includes("text-drive") &&
    !chips.includes("border-drive") &&
    !chips.includes('stroke="#1E1714"') &&
    !chips.includes('stroke="#111"') &&
    chips.includes('stroke="currentColor"'),
  "Drive-through uses Amjad v2 512 ship SVG with currentColor",
);
assert(
  !listDriveThroughDirectoryShops().some(
    (shop) => shop.id === "camel-step-hittin",
  ) &&
    listDriveThroughDirectoryShops().some(
      (shop) => shop.id === "camel-step-al-mursalat",
    ),
  "DT directory is branch-tagged only — Camel Step Hittin stays out",
);

const product = read("lib/product.ts");
const registry = read("lib/discovery-categories.ts");
const why = read("lib/why-line.ts");
const vibeLabels = read("lib/vibe-labels.ts");
assert(
  !product.includes("Good for a date") &&
    !product.includes("لموعد") &&
    !product.includes('"For two"') &&
    !product.includes('"لاثنين"') &&
    !registry.includes("Good for a date") &&
    !registry.includes("لموعد") &&
    !registry.includes('"For two"') &&
    !registry.includes('"لاثنين"'),
  "product + registry chip labels dropped date / For two",
);
assert(
  registry.includes("With friends") && registry.includes("مع الأصحاب"),
  "registry chip labels are With friends / مع الأصحاب",
);
assert(
  !why.includes("Good for a date") &&
    !why.includes("لموعد") &&
    !why.includes("For a quiet date") &&
    !why.includes("For a date,") &&
    !why.includes("For two") &&
    !why.includes("لاثنين"),
  "why-lines dropped date / For two chip names",
);
assert(
  why.includes("With friends") && why.includes("مع الأصحاب"),
  "why-lines use With friends / مع الأصحاب",
);
assert(
  vibeLabels.includes('"with-friends": "With friends"') &&
    !vibeLabels.includes('date: "Date"') &&
    !vibeLabels.includes('date: "For two"'),
  "moment fallback label is With friends",
);
assert(
  registry.includes('ar: "طلبات السيارة"') &&
    registry.includes('en: "Drive-through"') &&
    !registry.includes('ar: "درايف ثرو"') &&
    !registry.includes('ar: "طلبات السياره"') &&
    !product.includes('ar: "درايف ثرو"'),
  "Drive-through AR chip label is طلبات السيارة",
);
assert(
  vibeLabels.includes('"طلبات السيارة": "Drive-through"'),
  "vibe map translates طلبات السيارة on EN cards",
);

const halfwayCard = read("components/meet-halfway-card.tsx");
assert(
  halfwayCard.includes("chipSharePath(MEET_HALFWAY_CHIP.id, language)"),
  "بيننا utility card links to /halfway",
);
assert(
  halfwayCard.includes("MEET_HALFWAY_CHIP.id") &&
    halfwayCard.includes("selected") &&
    halfwayCard.includes('type="button"'),
  "selected بيننا stays on /h/{id} and does not jump to /halfway",
);
assert(
  halfwayCard.includes("MEET_HALFWAY_HOME_ART"),
  "بيننا card uses the locked 3D cluster",
);
assert(
  existsSync(join(repo, "public/brand/baynana-3d.png")),
  "3D pins+cup art is committed under public/",
);
assert(
  halfwayCard.includes("language === \"ar\"") &&
    halfwayCard.includes('path d="M19 12H5"'),
  "RTL forward CTA arrow points left",
);

const landing = read("components/home-landing.tsx");
assert(
  landing.includes("pageChipId") && landing.includes("selectedChipId={pageChipId}"),
  "HomeLanding forwards the route chip to Chat",
);
assert(
  landing.includes("chipDirectoryMoment") &&
    landing.includes("moment={chipMoment}") &&
    landing.includes("chipId={chipMoment ? pageChipId : null}"),
  "chip share URLs filter ShopDirectory to that moment tag",
);
const directory = read("components/shop-directory.tsx");
assert(
  directory.includes("isDirectoryResultSortChip") &&
    directory.includes("DirectoryResultSortPills"),
  "Matcha and Drive-through results share the same sort pills",
);
assert(
  directory.includes("`wain-chip-${vibe.id}`") &&
    !directory.includes("koofi-chip-") &&
    !directory.includes("chip-date"),
  "chip heading id is wain-chip-{id}, never *-chip-date",
);
assert(
  !listRealShops().some((shop) =>
    (shop.momentTags as readonly string[]).includes("date"),
  ),
  "catalog moment tags have no date leftover",
);
assert(
  chipDirectoryMoment("with-friends") === "with-friends",
  "with-friends slug filters with-friends tags",
);
const parseIntent = read("lib/parse-intent.ts");
assert(
  !parseIntent.includes("لموعد") &&
    !parseIntent.includes("مواعدة") &&
    !parseIntent.includes("dating") &&
    !parseIntent.includes("good for a date") &&
    !parseIntent.includes("for two") &&
    !parseIntent.includes('"date"'),
  "parse-intent dropped dating aliases",
);
assert(
  landing.includes(': "popular"') && landing.includes("chipSharePath"),
  "most-popular still selects popular and locale-switches on that path",
);
assert(
  landing.includes('pageChipId === "popular"') &&
    landing.includes("popularChipSelected") &&
    landing.includes("listPopularDirectoryShops()"),
  "default Most Popular chip serves the popularityIndex ranking",
);
const popularRank = listPopularDirectoryShops().map((shop) => shop.id);
const neighborhoodRank = listDirectoryShops().map((shop) => shop.id);
assert(popularRank.length > 0, "Most Popular ranking is non-empty");
assert(
  popularRank.join(",") !== neighborhoodRank.join(","),
  "Most Popular ranking is not the neighborhood directory order",
);
assert(
  landing.includes("<HomeTrending") &&
    landing.indexOf("<HomeTrending") < landing.indexOf("<ShopDirectory") &&
    landing.includes("listPopularDirectoryShops()"),
  "home shows trending above the café list; Most Popular still ranks that list",
);
assert(
  landing.includes("restoreOffHomeChipOpen") &&
    landing.includes("chipOpen") &&
    landing.includes("isOffHomeChipId"),
  "off-home share URLs server-serve three picks",
);

const chat = read("components/chat.tsx");
assert(
  chat.includes("openRoutedChip") &&
    chat.includes("selectedChipId") &&
    chat.includes("router.replace") &&
    chat.includes("halfwayInvitePath"),
  "direct chip URLs open the same UI; اعزم خويك still replace → /h/{id}",
);
assert(
  chat.includes("chipOpen") &&
    chat.includes("chipOpenMessages") &&
    chat.includes("isOffHomeChipId") &&
    chat.includes("liveChipLabel"),
  "off-home URLs paint three picks; live chips still open by label",
);
assert(
  !chat.includes("isHomeChipId"),
  "chip-open is not gated on the 4×2 home set",
);
assert(
  chat.includes("isStaticDirectoryChip") &&
    !chat.includes('chipId === "popular"') &&
    !chat.includes("selectedChipId === \"popular\""),
  "Most Popular, Matcha, and Drive-through are static directory chips — no ask→3",
);
assert(isStaticDirectoryChip("popular"), "popular is a static directory chip");
assert(isStaticDirectoryChip("matcha"), "matcha is a static directory chip");
assert(
  isStaticDirectoryChip("drive-through"),
  "drive-through is a static directory chip",
);
assert(!isStaticDirectoryChip("quiet"), "quiet stays off-home three-pick");
assert(!isStaticDirectoryChip("coffee"), "coffee still opens chat");
assert(!/Soft Places/i.test(chat), "no Soft Places analytics or UI in chat");

const nextConfig = read("next.config.ts");
assert(
  !/source:\s*"\/"\s*,\s*\n\s*destination:\s*"\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "`/` is the P0 home — no 308 to Most Popular",
);
assert(
  !/source:\s*"\/en"\s*,\s*\n\s*destination:\s*"\/en\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "`/en` is the EN home — no 308 to Most Popular",
);
assert(
  nextConfig.includes("TEMPORARY_DEFAULT_LANDING_MOST_POPULAR"),
  "Most Popular redirect stays behind the revert flag",
);
assert(
  nextConfig.includes("LEGACY_CHIP_REDIRECTS"),
  "old date slug redirects are wired in next.config",
);
assert(
  nextConfig.includes("LEGACY_SHOP_REDIRECTS"),
  "retired cafe-card ids 308 through next.config",
);
assert(
  LEGACY_SHOP_REDIRECTS.some(
    (row) =>
      row.source === "/c/sand-clock-sulimaniyah" &&
      row.destination === "/c/sand-clock-al-muruj",
  ),
  "sand-clock-sulimaniyah card 308s to al-muruj",
);

const hero = read("components/home-hero.tsx");
assert(
  hero.includes("copy.opener") &&
    !hero.includes("copy.homeSupport") &&
    !hero.includes("cityOnly") &&
    !/Koofi/i.test(hero),
  "home chrome is the headline only — subtitle removed, no eyebrow, no Koofi",
);
assert(
  chat.includes("HomeHero") &&
    chat.includes("MeetHalfwayCard") &&
    chat.includes("VibeChips") &&
    chat.includes('pickedChipId ?? "popular"') &&
    chat.indexOf("<HomeHero") < chat.indexOf("<VibeChips") &&
    chat.indexOf("<VibeChips") < chat.indexOf("<MeetHalfwayCard"),
  "landing stacks the category grid above بيننا; default selected is popular",
);
const vibeChips = read("components/vibe-chips.tsx");
assert(
  vibeChips.includes('chip.id === "popular"') &&
    vibeChips.includes('type="button"') &&
    vibeChips.includes("chipSharePath(chip.id, language)"),
  "re-tap of selected Most Popular stays put; other chips stay shareable links",
);
assert(
  !read("components/shop-directory.tsx").includes("allDistricts"),
  "shop directory does not mount the old district-chip grid",
);

console.log("check-chip-urls: ok");
