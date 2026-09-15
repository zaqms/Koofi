/**
 * Ajz-locked dedicated chip URLs (12 Sep 2026).
 * 15 Sep: date chip public slug is `for-two` (old `/date` 308s).
 * Soft Places stays parked. Do not rename other paths.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { categoryListingStaticParams } from "../lib/most-popular";
import { isNeighborhoodId } from "../lib/neighborhoods";
import {
  COFFEE_SHOP_CHIP_SLUGS,
  DATE_CHIP_ID,
  DATE_CHIP_PUBLIC_SLUG,
  HALFWAY_INVITE_PATH_PREFIX,
  HALFWAY_LANDING_PATH,
  HOME_CHIP_IDS,
  LEGACY_CHIP_REDIRECTS,
  LEGACY_DATE_CHIP_SLUG,
  LOCKED_HOME_SUPPORT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  MEET_HALFWAY_CHIP,
  MEET_HALFWAY_HOME_ART,
  MEET_HALFWAY_HOME_SUB,
  NEARBY_CHIP,
  OFF_HOME_CHIP_IDS,
  VIBE_CHIPS,
  chipIdFromCoffeeShopSlug,
  chipSharePath,
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
  date: { ar: "/coffee-shops/for-two", en: "/en/coffee-shops/for-two" },
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
assert(VIBE_CHIPS.length === 11, "Soft Places stay parked — 11 vibe chips");
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
    "popular,coffee,pastry,quiet,nearby,outdoor,date,work",
  "P0 home 4×2 RTL order is locked",
);
assert(
  OFF_HOME_CHIP_IDS.join(",") === "roaster,specialty,study,late",
  "off-home chip ids stay shareable",
);
assert(homeSurfaceChips().length === 8, "home chrome is 4×2 — eight chips");
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
  "off-home helper matches only the four share URLs",
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
  quiet: "هادي ورايق",
  work: "للشغل",
  date: "لاثنين",
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
  quiet: "Cozy and Quiet",
  work: "Best for Work",
  date: "For two",
  outdoor: "Outdoor seating",
  nearby: "Nearby",
};
for (const chip of homeSurfaceChips()) {
  assert(
    chip.en === LOCKED_HOME_LABELS_EN[chip.id],
    `EN home label ${chip.id} → ${LOCKED_HOME_LABELS_EN[chip.id]}`,
  );
}

assert(DATE_CHIP_ID === "date", "catalog filter key stays date");
assert(DATE_CHIP_PUBLIC_SLUG === "for-two", "public date slug is for-two");
assert(LEGACY_DATE_CHIP_SLUG === "date", "old public slug stays date");
assert(
  coffeeShopChipSlugForId(DATE_CHIP_ID) === DATE_CHIP_PUBLIC_SLUG,
  "date id maps to for-two slug",
);
assert(
  chipIdFromCoffeeShopSlug(DATE_CHIP_PUBLIC_SLUG) === DATE_CHIP_ID,
  "for-two slug maps back to date id",
);
assert(
  !isCoffeeShopChipSlug(LEGACY_DATE_CHIP_SLUG),
  "legacy date slug is not a live coffee-shops path",
);
assert(
  isCoffeeShopChipSlug(DATE_CHIP_PUBLIC_SLUG),
  "for-two is a live coffee-shops slug",
);
assert(
  !isNeighborhoodId(DATE_CHIP_PUBLIC_SLUG),
  "for-two must not collide with a district",
);
assert(
  LEGACY_CHIP_REDIRECTS.length === 2 &&
    LEGACY_CHIP_REDIRECTS.every((row) => row.statusCode === 308),
  "old date URLs 308 to for-two",
);
assert(
  LEGACY_CHIP_REDIRECTS[0]?.source === "/coffee-shops/date" &&
    LEGACY_CHIP_REDIRECTS[0]?.destination === "/coffee-shops/for-two",
  "AR date → for-two",
);
assert(
  LEGACY_CHIP_REDIRECTS[1]?.source === "/en/coffee-shops/date" &&
    LEGACY_CHIP_REDIRECTS[1]?.destination === "/en/coffee-shops/for-two",
  "EN date → for-two",
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
assert(
  !staticParams.some((row) => row.slug === LEGACY_DATE_CHIP_SLUG),
  "legacy date slug is not a generated coffee-shops page",
);

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
    categoryEn.includes("isCoffeeShopChipSlug") &&
    categoryEn.includes("chipIdFromCoffeeShopSlug") &&
    categoryEn.includes("selectedChipId={chipId}"),
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
  chips.includes('case "date"') &&
    chips.includes('<circle cx="9" cy="8" r="2.65" />') &&
    chips.includes('d="M15.85 5.5a2.5 2.5 0 0 1 0 5"') &&
    !chips.includes('<circle cx="12" cy="8" r="3.1" />') &&
    !/heart|romance|💕|❤|couple|hand-hold/i.test(chips),
  "date chip is a two-heads stroke — no romance glyphs",
);

const product = read("lib/product.ts");
const why = read("lib/why-line.ts");
const vibeLabels = read("lib/vibe-labels.ts");
assert(
  !product.includes("Good for a date") && !product.includes("لموعد"),
  "product chip labels dropped date / موعد",
);
assert(
  !why.includes("Good for a date") &&
    !why.includes("لموعد") &&
    !why.includes("For a quiet date") &&
    !why.includes("For a date,"),
  "why-lines dropped date / موعد",
);
assert(
  vibeLabels.includes('date: "For two"') && !vibeLabels.includes('date: "Date"'),
  "moment fallback label is For two",
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
  landing.includes('? "popular"') && landing.includes("chipSharePath"),
  "most-popular still selects popular and locale-switches on that path",
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
  chat.includes("chipId === \"popular\"") || chat.includes('chipId === "popular"'),
  "popular still does not post to /api/chat",
);
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

const hero = read("components/home-hero.tsx");
assert(
  hero.includes("copy.opener") &&
    hero.includes("copy.homeSupport") &&
    !hero.includes("cityOnly") &&
    !/Koofi/i.test(hero),
  "home chrome is headline + support, no eyebrow, no Koofi",
);
assert(
  chat.includes("HomeHero") &&
    chat.includes("MeetHalfwayCard") &&
    chat.includes("VibeChips") &&
    chat.includes('pickedChipId ?? "popular"'),
  "landing stacks بيننا card above chips; default selected is popular",
);

console.log("check-chip-urls: ok");
