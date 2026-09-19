/**
 * Discovery-category registry lock.
 * Homepage, districts, chip result pages, and SEO templates must read
 * lib/discovery-categories.ts — no per-page label arrays.
 * Soft Places parked. Dating labels stay gone.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  COFFEE_SHOP_CHIP_SLUGS,
  DIRECTORY_RESULT_SORT_CHIPS,
  DISCOVERY_CATEGORIES,
  HOME_CHIP_IDS,
  NEARBY_CHIP,
  OFF_HOME_CHIP_IDS,
  STATIC_DIRECTORY_CHIP_IDS,
  VIBE_CHIPS,
  chipDirectoryMoment,
  discoveryCategoryLabel,
  getDiscoveryCategory,
  homeSurfaceChips,
  isDirectoryResultSortChip,
  isDriveThroughDirectoryChip,
  isOffHomeChipId,
  isStaticDirectoryChip,
  vibeChipLabel,
} from "../lib/discovery-categories";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".git" ||
      name === ".next" ||
      name === "data"
    ) {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkFiles(full, acc);
      continue;
    }
    if (/\.(ts|tsx|js|jsx|md)$/.test(name)) acc.push(full);
  }
  return acc;
}

const DEPRECATED = [
  "Good for a date",
  "good-for-a-date",
  '"For two"',
  "/for-two",
  "لموعد",
  "مواعدة",
  "Best Pastries",
] as const;

const ALLOW_DEPRECATED = [
  "lib/product.ts", // LEGACY_DATE_CHIP_SLUGS 308 only
  "lib/discovery-categories.ts",
  "scripts/check-chip-urls.ts",
  "scripts/check-discovery-categories.ts",
  "scripts/check-district-page.ts",
  "scripts/check-district-urls.ts",
  "scripts/check-structured-data.ts",
  "scripts/check-plg.ts",
  "scripts/check-browse-neighborhoods.ts",
  "scripts/check-meet-halfway.ts",
  "next.config.ts",
];

assert(existsSync("lib/discovery-categories.ts"), "registry file exists");
assert(DISCOVERY_CATEGORIES.length === 14, "14 live discovery categories (13 vibe + nearby)");
assert(VIBE_CHIPS.length === 13, "Soft Places stay parked — 13 vibe chips");
assert(
  HOME_CHIP_IDS.join(",") ===
    "popular,coffee,pastry,matcha,nearby,outdoor,with-friends,work,drive-through",
  "P0 home order is locked",
);
assert(
  OFF_HOME_CHIP_IDS.join(",") === "roaster,specialty,study,late,quiet",
  "off-home share URLs stay enabled in the same registry",
);
assert(
  STATIC_DIRECTORY_CHIP_IDS.join(",") === "popular,matcha,drive-through",
  "static directory chips stay Most Popular + Matcha + Drive-through",
);
assert(
  COFFEE_SHOP_CHIP_SLUGS.join(",") ===
    "nearby,coffee,pastry,matcha,drive-through,roaster,specialty,quiet,work,study,late,outdoor,with-friends",
  "coffee-shops slug order is unchanged",
);
assert(
  DIRECTORY_RESULT_SORT_CHIPS.join(",") === "matcha,drive-through",
  "result-sort chips stay Matcha + Drive-through",
);
assert(NEARBY_CHIP.ar === "قريب مني" && NEARBY_CHIP.en === "Nearby", "Nearby labels");
assert(isStaticDirectoryChip("popular") && isStaticDirectoryChip("matcha"), "static chips");
assert(isDriveThroughDirectoryChip("drive-through"), "DT eligibility");
assert(!isDriveThroughDirectoryChip("matcha"), "matcha is not the DT lane");
assert(isDirectoryResultSortChip("matcha") && isDirectoryResultSortChip("drive-through"), "sort chips");
assert(chipDirectoryMoment("coffee") === "qahwa", "coffee filters qahwa");
assert(chipDirectoryMoment("specialty") === "roaster", "specialty still shares roaster");
assert(chipDirectoryMoment("popular") === null, "popular is not a moment filter");
assert(chipDirectoryMoment("nearby") === null, "nearby is not a moment filter");
assert(isOffHomeChipId("quiet") && !isOffHomeChipId("coffee"), "off-home helper");

const LOCKED_AR: Record<string, string> = {
  popular: "الأكثر شعبية",
  coffee: "أفضل قهوة",
  pastry: "قهوة وحلى",
  matcha: "ماتشا",
  "drive-through": "طلبات السيارة",
  roaster: "أفضل محامص",
  specialty: "قهوة مختصة",
  quiet: "هادي ورايق",
  work: "للشغل",
  study: "قعدة مذاكرة",
  late: "مفتوح لآخر الليل",
  outdoor: "جلسات خارجية",
  "with-friends": "مع الأصحاب",
  nearby: "قريب مني",
};
const LOCKED_EN: Record<string, string> = {
  popular: "Most Popular",
  coffee: "Best Coffee",
  pastry: "Coffee and sweets",
  matcha: "Matcha",
  "drive-through": "Drive-through",
  roaster: "Best Roasteries",
  specialty: "Specialty coffee",
  quiet: "Cozy and Quiet",
  work: "Best for Work",
  study: "Best for Studies",
  late: "Open late",
  outdoor: "Outdoor seating",
  "with-friends": "With friends",
  nearby: "Nearby",
};

for (const row of DISCOVERY_CATEGORIES) {
  assert(row.enabled, `${row.id} stays enabled — do not invent disabled live chips`);
  assert(row.label.ar === LOCKED_AR[row.id], `AR ${row.id}`);
  assert(row.label.en === LOCKED_EN[row.id], `EN ${row.id}`);
  assert(row.icon === row.id, `icon key for ${row.id}`);
  assert(
    discoveryCategoryLabel(row.id, "ar") === row.label.ar,
    `AR helper ${row.id}`,
  );
  assert(
    discoveryCategoryLabel(row.id, "en") === row.label.en,
    `EN helper ${row.id}`,
  );
  assert(Boolean(row.label.ar) && Boolean(row.label.en), `EN/AR parity ${row.id}`);
}

for (const chip of homeSurfaceChips()) {
  assert(
    vibeChipLabel(chip, "ar") === LOCKED_AR[chip.id],
    `home AR ${chip.id}`,
  );
  assert(
    vibeChipLabel(chip, "en") === LOCKED_EN[chip.id],
    `home EN ${chip.id}`,
  );
}

const vibeChips = read("components/vibe-chips.tsx");
assert(vibeChips.includes("homeSurfaceChips"), "home chrome reads registry via homeSurfaceChips");
assert(vibeChips.includes("getDiscoveryCategory"), "chip icons read registry icon key");
assert(
  vibeChips.includes('dir={language === "ar" ? "rtl" : "ltr"}'),
  "chip grid is RTL on Arabic pages",
);
assert(!vibeChips.includes("Good for a date"), "vibe chips have no dating label");

const districtPage = read("components/district-page.tsx");
assert(
  districtPage.includes("selectedChipId={null}") &&
    districtPage.includes("<Chat"),
  "district pages mount shared Chat (same chip registry as home)",
);
assert(
  !/id:\s*"(popular|coffee|pastry|matcha)"/.test(districtPage),
  "DistrictPage has no local category array",
);

const homeLanding = read("components/home-landing.tsx");
assert(
  homeLanding.includes("isDriveThroughDirectoryChip") &&
    homeLanding.includes("chipDirectoryMoment"),
  "chip result pages use registry eligibility",
);
assert(
  !/id:\s*"(popular|coffee|pastry|matcha)"/.test(homeLanding),
  "HomeLanding has no local category array",
);

const shopDirectory = read("components/shop-directory.tsx");
assert(
  shopDirectory.includes("getDiscoveryCategory") &&
    shopDirectory.includes("discoveryCategoryLabel"),
  "directory headings read the registry",
);
assert(
  !shopDirectory.includes("الأكثر شعبية") && !shopDirectory.includes("Most Popular"),
  "shop-directory dropped local popular labels",
);

const chipPage = read("lib/chip-page.ts");
assert(
  chipPage.includes("discoveryCategoryLabel"),
  "SEO chip metadata reads registry labels",
);

const chipOpen = read("lib/chip-open.ts");
assert(chipOpen.includes("getDiscoveryCategory"), "off-home restore reads registry");

const product = read("lib/product.ts");
assert(
  product.includes('from "./discovery-categories"'),
  "product re-exports the registry — does not redefine chips",
);
assert(
  !product.includes('id: "popular"') && !product.includes('id: "with-friends"'),
  "product.ts no longer owns vibe chip objects",
);

const copy = read("lib/copy.ts");
assert(copy.includes("VIBE_CHIPS"), "copy.chips is the derived vibe view");

const consumers = [
  ["components/vibe-chips.tsx", "homepage chips"],
  ["components/district-page.tsx", "district Chat → same chips"],
  ["components/home-landing.tsx", "chip result pages"],
  ["components/shop-directory.tsx", "directory headings"],
  ["components/chat.tsx", "chip_tap + live labels"],
  ["lib/chip-page.ts", "SEO metadata"],
  ["lib/chip-open.ts", "off-home three-pick"],
  ["lib/parse-intent.ts", "chip aliases"],
  ["lib/copy.ts", "copy.chips"],
  ["lib/sitemap-xml.ts", "indexed chip URLs"],
  ["lib/most-popular.ts", "static params"],
];
for (const [path, why] of consumers) {
  const src = read(path);
  assert(
    src.includes("discovery-categories") ||
      src.includes("VIBE_CHIPS") ||
      src.includes("homeSurfaceChips") ||
      src.includes("getDiscoveryCategory") ||
      src.includes("discoveryCategoryLabel") ||
      src.includes("chipDirectoryMoment") ||
      src.includes("COFFEE_SHOP_CHIP_SLUGS") ||
      src.includes("<Chat"),
    `${path} still consumes the registry (${why})`,
  );
}

const leftoverArrays: string[] = [];
for (const file of walkFiles(process.cwd())) {
  const rel = relative(process.cwd(), file);
  if (
    rel === "lib/discovery-categories.ts" ||
    rel.startsWith("scripts/") ||
    rel === "lib/product.ts"
  ) {
    continue;
  }
  const src = read(rel);
  if (
    /const\s+\w*(CHIPS|CATEGORIES|CHIP_IDS)\s*=\s*\[/.test(src) &&
    /id:\s*"(popular|coffee|pastry|matcha|with-friends)"/.test(src)
  ) {
    leftoverArrays.push(rel);
  }
}
assert(
  leftoverArrays.length === 0,
  `leftover local category arrays: ${leftoverArrays.join(", ")}`,
);

const deprecatedHits: string[] = [];
for (const file of walkFiles(process.cwd())) {
  const rel = relative(process.cwd(), file);
  if (ALLOW_DEPRECATED.includes(rel)) continue;
  const src = read(rel);
  for (const needle of DEPRECATED) {
    if (src.includes(needle)) {
      deprecatedHits.push(`${rel}: ${needle}`);
    }
  }
}
assert(
  deprecatedHits.length === 0,
  `deprecated category strings still live:\n${deprecatedHits.join("\n")}`,
);

assert(!getDiscoveryCategory("date"), "date is not a registry row");
assert(!getDiscoveryCategory("for-two"), "for-two is not a registry row");
assert(
  !getDiscoveryCategory("good-for-a-date"),
  "good-for-a-date is not a registry row",
);
assert(
  !DISCOVERY_CATEGORIES.some((row) => /soft.?places/i.test(row.id)),
  "Soft Places stays parked",
);

console.log("check-discovery-categories: ok");
console.log(
  `registry ${DISCOVERY_CATEGORIES.length} · home ${HOME_CHIP_IDS.length} · vibe ${VIBE_CHIPS.length} · off-home ${OFF_HOME_CHIP_IDS.length}`,
);
