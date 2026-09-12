/**
 * Ajz-locked dedicated chip URLs (12 Sep 2026).
 * Soft Places stays parked. Do not rename paths.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { categoryListingStaticParams } from "../lib/most-popular";
import { isNeighborhoodId } from "../lib/neighborhoods";
import {
  COFFEE_SHOP_CHIP_SLUGS,
  HALFWAY_INVITE_PATH_PREFIX,
  HALFWAY_LANDING_PATH,
  MEET_HALFWAY_CHIP,
  NEARBY_CHIP,
  VIBE_CHIPS,
  chipSharePath,
  coffeeShopChipPath,
  halfwayInvitePath,
  halfwayPath,
  isCoffeeShopChipSlug,
  isMostPopularSlug,
  mostPopularPath,
} from "../lib/product";
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
  date: { ar: "/coffee-shops/date", en: "/en/coffee-shops/date" },
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
assert(MEET_HALFWAY_CHIP.id === "meet-halfway", "بيننا chip id stays");

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
  TEMPORARY_DEFAULT_LANDING_MOST_POPULAR === true,
  "TEMP Most Popular default stays on",
);
assert(
  mostPopularPath("ar") === LOCKED_CHIP_PATHS.popular.ar,
  "popular path unchanged",
);

const repo = process.cwd();
const read = (rel: string) => readFileSync(join(repo, rel), "utf8");

assert(existsSync(join(repo, "app/halfway/page.tsx")), "AR /halfway page");
assert(existsSync(join(repo, "app/en/halfway/page.tsx")), "EN /halfway page");

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
    categoryAr.includes("selectedChipId={slug}") &&
    categoryEn.includes("isCoffeeShopChipSlug") &&
    categoryEn.includes("selectedChipId={slug}"),
  "directory category routes open vibe/nearby chips",
);

const chips = read("components/vibe-chips.tsx");
assert(chips.includes("chipSharePath"), "every live chip has a share path");
assert(
  chips.includes("href={chipSharePath(chip.id, language)}"),
  "vibe/nearby/popular chips are Links to dedicated paths",
);
assert(
  chips.includes("MEET_HALFWAY_CHIP.id && selected"),
  "selected بيننا stays on /h/{id} and does not jump to /halfway",
);
assert(
  !chips.includes("ثلاث الليلة") && !chips.includes("ON TONIGHT"),
  "Soft Places chips stay parked",
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

const chat = read("components/chat.tsx");
assert(
  chat.includes("openRoutedChip") &&
    chat.includes("selectedChipId") &&
    chat.includes("router.replace") &&
    chat.includes("halfwayInvitePath"),
  "direct chip URLs open the same UI; اعزم خويك still replace → /h/{id}",
);
assert(
  chat.includes("chipId === \"popular\"") || chat.includes('chipId === "popular"'),
  "popular still does not post to /api/chat",
);
assert(!/Soft Places/i.test(chat), "no Soft Places analytics or UI in chat");

const nextConfig = read("next.config.ts");
assert(
  /source:\s*"\/"\s*,\s*\n\s*destination:\s*"\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "TEMP `/` 308 to Most Popular stays",
);

console.log("check-chip-urls: ok");
