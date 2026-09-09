import { listDirectoryShops } from "./catalog";
import { filterDirectoryShops } from "./directory";
import { neighborhoodLabel } from "./neighborhoods";
import { cardPath, districtPath, PRODUCT_NAME } from "./product";
import type { NeighborhoodId, Shop } from "./types";
import { vibeLabels } from "./vibe-labels";

/** Editorial freshness for EN enrichment locked 9 Sep 2026. */
export const EN_CONTENT_DATE_MODIFIED = "2026-09-09";

export const GATE_CAFE_ID = "the-gate-specialty-coffee-al-wurud";

export const CNI_PRIORITY_CAFE_IDS = [
  "core-coffee-and-roastery-al-narjis",
  "caf-lab-al-narjis",
  "repository-coffee-roasters-al-narjis",
  "jazel-speciality-cafe-diriyah",
  "qirat-al-yasmin",
  "cred-al-mughrizat",
  "sulalat-coffee-ar-rabwah",
  "taim-specialty-coffee-as-sahafah",
  "archi-ghirnatah",
] as const;

export const LOCKED_DISTRICT_IDS = ["kafd", "al-wurud"] as const;

const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

export function countWord(n: number): string {
  if (n >= 0 && n < COUNT_WORDS.length) return COUNT_WORDS[n];
  return String(n);
}

export const DROPPED_SLOGANS = [
  "Maps is the last click",
  "A link, not an app",
] as const;

export const GATE_FORBIDDEN_CLAIMS = ["parking", "wifi", "wi-fi", "outdoor"] as const;

/** Locked 9 Sep 2026. Do not rewrite. */
export const GOLD_MASTER_KAFD = {
  title: `Coffee shops in KAFD · ${PRODUCT_NAME}`,
  meta: "A short list of cafes in KAFD on wain.lol — seven places in Riyadh, each with a Maps link.",
  markdown: `# Coffee shops in KAFD

If you’re around KAFD and you just want a coffee without scrolling forever, this page is for you. It’s our list of places in that part of Riyadh that we’ve put on wain.lol so far.

## What’s here

There are **seven** cafes from KAFD on the list right now:

- [12 Cups Roastery and Cafe](/en/c/12-cups-roastery-and-cafe-kafd)
- [Cafe Tale](/en/c/cafe-tale-kafd)
- [Coffee Planet](/en/c/coffee-planet-kafd)
- [DRAFT Café](/en/c/draft-cafe-kafd)
- [Hal Alkeif](/en/c/hal-alkeif-kafd)
- [Toby's Estate (KAFD)](/en/c/tobys-estate-kafd)
- [Trieste](/en/c/trieste-kafd)

Pick one that sounds right, open the card, and hit **Take me there** when you’re ready to go. Hours and the exact pin live on Google Maps — we don’t copy those onto the page, so you always see what’s current.

## Other neighborhoods nearby

Worth a look if you’re not locked to KAFD:

- [Coffee shops in Al Wurud](/en/coffee-shops/al-wurud)
- [Coffee shops in Al Sahafah](/en/coffee-shops/as-sahafah)
- [Coffee shops in Olaya](/en/coffee-shops/olaya)
- [Coffee shops in Al Narjis](/en/coffee-shops/al-narjis)

## About wain

wain.lol is a small Riyadh coffee guide. You can ask for three suggestions, or browse by area like this. We’re not trying to be a review site or a delivery app — just a clean list with Maps when you need directions. More background is on [About](/en/about). If you build tools or agents, the public catalog is in [\`/llms.txt\`](/llms.txt).

We’re Riyadh-only for now. Missing a place you like? You can send a Maps link from the site.`,
} as const;

/** Locked 9 Sep 2026. Do not rewrite. */
export const GOLD_MASTER_AL_WURUD = {
  title: `Coffee shops in Al Wurud · ${PRODUCT_NAME}`,
  meta: "Four cafes in Al Wurud on wain.lol — a quieter Riyadh neighborhood list, with Maps links.",
  markdown: `# Coffee shops in Al Wurud

Al Wurud is more residential streets than office towers — the kind of Riyadh neighborhood where you might want a calm coffee without driving across town. This page is the small set of Al Wurud places we’ve added to wain.lol so far. (الورود)

KAFD is right next door if you need that list instead: [Coffee shops in KAFD](/en/coffee-shops/kafd).

## What’s here

**Four** cafes from Al Wurud are on the catalog today:

- [Carve Coffee Bar](/en/c/carve-coffee-bar-al-wurud)
- [EYA Specialty Coffee](/en/c/eya-specialty-coffee-al-wurud)
- [Joe Barrel Coffee](/en/c/joe-barrel-al-wurud)
- [The Gate Specialty Coffee](/en/c/the-gate-specialty-coffee-al-wurud)

Short list on purpose — soft launch, only what we’ve actually added. Open a card when one fits, then **Take me there** for the pin and hours on Google Maps. We don’t paste hours onto the page.

## Other neighborhoods nearby

- [Coffee shops in KAFD](/en/coffee-shops/kafd)
- [Coffee shops in Al Rabwah](/en/coffee-shops/al-rabwah)
- [Coffee shops in Al Rabi](/en/coffee-shops/al-rabi)
- [Coffee shops in Olaya](/en/coffee-shops/olaya)

## About wain

wain.lol helps you find coffee in Riyadh — ask for three suggestions, or open a neighborhood list like this one. We’re not a review site and we’re not delivery. [About](/en/about) has the longer explanation; [\`/llms.txt\`](/llms.txt) is the public catalog if you need it machine-readable.

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
} as const;

/** Locked 9 Sep 2026. Do not rewrite. Do not invent nameAr. */
export const GOLD_MASTER_GATE = {
  title: `The Gate Specialty Coffee · Al Wurud · Riyadh · ${PRODUCT_NAME}`,
  meta: "The Gate Specialty Coffee in Al Wurud on wain.lol — specialty coffee and desserts near KAFD; open Maps for the pin and hours.",
  markdown: `Looking for a specialty coffee stop in Al Wurud — the quieter streets beside KAFD? **The Gate Specialty Coffee** is on our Riyadh list for that neighborhood. In Al Wurud’s Al Olaya Mall area, reviews often mention specialty brews, cheesecake and other desserts, friendly service, and a calm, aesthetic spot to unwind. We keep the card simple: name, Al Wurud, and **Take me there** so Google Maps can show the pin and today’s hours. No menu, ratings, or opening times pasted here.

Others on the same Al Wurud list:

- [Carve Coffee Bar](/en/c/carve-coffee-bar-al-wurud)
- [EYA Specialty Coffee](/en/c/eya-specialty-coffee-al-wurud)
- [Joe Barrel Coffee](/en/c/joe-barrel-al-wurud)

Full neighborhood page: [Coffee shops in Al Wurud](/en/coffee-shops/al-wurud).`,
} as const;

const GOLD_DISTRICT = {
  kafd: GOLD_MASTER_KAFD,
  "al-wurud": GOLD_MASTER_AL_WURUD,
} as const;

const NEARBY_DISTRICTS: Record<NeighborhoodId, readonly NeighborhoodId[]> = {
  hittin: ["al-malqa", "al-yasmin", "al-narjis", "al-nakheel"],
  "al-malqa": ["hittin", "al-yasmin", "al-narjis", "al-nakheel"],
  "al-nakheel": ["hittin", "al-malqa", "olaya", "al-rahmaniyyah"],
  "al-yasmin": ["al-malqa", "al-narjis", "hittin", "as-sahafah"],
  olaya: ["sulimaniyah", "al-wurud", "kafd", "al-mughrizat"],
  sulimaniyah: ["olaya", "al-mughrizat", "al-masif", "al-rabwah"],
  "al-wurud": ["kafd", "al-rabwah", "al-rabi", "olaya"],
  "al-rabwah": ["al-wurud", "olaya", "ghirnatah", "al-rawdah"],
  "al-rabi": ["al-wurud", "as-sahafah", "kafd", "al-malqa"],
  "al-masif": ["al-rabi", "sulimaniyah", "al-nakheel", "olaya"],
  "al-rahmaniyyah": ["olaya", "al-nakheel", "diriyah", "kafd"],
  "as-sahafah": ["kafd", "al-malqa", "al-yasmin", "al-narjis"],
  kafd: ["al-wurud", "as-sahafah", "olaya", "al-narjis"],
  diriyah: ["olaya", "kafd", "al-rahmaniyyah", "al-wurud"],
  "al-narjis": ["al-yasmin", "al-malqa", "hittin", "as-sahafah"],
  "al-mughrizat": ["olaya", "sulimaniyah", "al-rabwah", "qurtubah"],
  ghirnatah: ["al-rabwah", "qurtubah", "al-rawdah", "al-safa"],
  "al-shohda": ["ghirnatah", "qurtubah", "al-safa", "al-rawdah"],
  "al-safa": ["ghirnatah", "al-rawdah", "qurtubah", "al-shohda"],
  "al-rawdah": ["ghirnatah", "al-safa", "al-rabwah", "qurtubah"],
  qurtubah: ["ghirnatah", "al-rawdah", "al-mughrizat", "al-safa"],
  "an-nazhah": ["qurtubah", "al-malqa", "al-yasmin", "olaya"],
};

type DistrictLead = {
  lead: string;
  hereIntro?: string;
  hereOutro?: string;
  nearbyIntro?: string;
  about: string;
  meta?: string;
};

/**
 * Unique EN openers. Not KAFD find-replace clones. No invented hours, menus,
 * ratings, parking, wifi, or “best of”.
 */
const DISTRICT_COPY: Partial<Record<NeighborhoodId, DistrictLead>> = {
  "al-narjis": {
    lead: `Al Narjis sits up in north Riyadh — a different stretch from KAFD’s office blocks, and not the same list as Al Wurud next to them. If you’re already in that part of town and you just want a coffee from the catalog, this page is the Al Narjis set on wain.lol.

A few of the names people ask about first are [CORE COFFEE & ROASTERY](/en/c/core-coffee-and-roastery-al-narjis), [CAF LAB](/en/c/caf-lab-al-narjis), and [Repository Coffee Roasters](/en/c/repository-coffee-roasters-al-narjis). They’re on this list with the rest. We don’t rank them.

The list is longer than KAFD’s seven and longer than Al Wurud’s four. That’s just how many Al Narjis places we’ve actually added — not a claim that this neighborhood is “the” coffee district. Open a card if a name fits. Skip it if it doesn’t.`,
    hereIntro: `There are **{count}** cafes from Al Narjis on the catalog today:`,
    hereOutro: `Names come from the catalog as we added them. Open a card when one fits, then **Take me there** for the pin and hours on Google Maps. We don’t paste hours onto the page.`,
    nearbyIntro: `If Al Narjis isn’t the stop, these north-Riyadh lists are next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Narjis. Not a review site, not delivery. [About](/en/about) has the longer note; [\`/llms.txt\`](/llms.txt) is the public catalog.

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "Cafes in Al Narjis on wain.lol — a north Riyadh list including Core, CAF LAB, and Repository, each with a Maps link.",
  },
  diriyah: {
    lead: `Diriyah sits west of the usual north-Riyadh loop — JAX, Bujairi, the older town. This page is the Diriyah set we’ve put on wain.lol so far, not the KAFD office list and not a citywide ranking.`,
    hereIntro: `**{countWordCap}** cafes from Diriyah are on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a neighborhood list like Diriyah. [About](/en/about) has the longer explanation; [\`/llms.txt\`](/llms.txt) is the public catalog.

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-yasmin": {
    lead: `Al Yasmin is a north Riyadh neighborhood next to Malqa and Narjis. This page is the Yasmin cafes we’ve added to wain.lol so far — a longer list than some, still only what’s actually in the catalog.`,
    hereIntro: `There are **{count}** cafes from Al Yasmin on the list right now:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin. We don’t copy hours onto the page.`,
    about: `Browse by area or ask the chat. wain.lol stays a clean Riyadh list with Maps. More on [About](/en/about). Agents can use [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  "al-mughrizat": {
    lead: `Al Mughrizat is one of the thinner lists on wain.lol. We only add what we have — no filler names to make the page look busy.`,
    hereIntro: `There is **{count}** cafe from Al Mughrizat on the catalog today:`,
    hereOutro: `That’s the whole set for now. Open the card, then **Take me there** for the Maps pin and today’s hours.`,
    about: `wain.lol is a small Riyadh coffee guide. You can ask for three suggestions, or open a neighborhood page like this. [About](/en/about). [\`/llms.txt\`](/llms.txt) if you need the catalog machine-readable.

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "al-rabwah": {
    lead: `Al Rabwah (الربوة) sits east of the Olaya–Wurud stretch. This page is the Rabwah cafes on the catalog today — a neighborhood list, not a “best of.”`,
    hereIntro: `There are **{count}** cafes from Al Rabwah on wain.lol right now:`,
    hereOutro: `Short of inventing extra names. Open a card, then **Take me there** so Maps can show the pin and hours.`,
    about: `wain.lol helps you find coffee in Riyadh — ask for three suggestions, or open a neighborhood list like Al Rabwah. We’re not a review site and we’re not delivery. [About](/en/about); [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "as-sahafah": {
    lead: `Al Sahafah sits on the north side near KAFD, but this is its own list. If you want the financial-district page, that’s [Coffee shops in KAFD](/en/coffee-shops/kafd). This one is the Sahafah cafes we’ve added so far.`,
    hereIntro: `**{countWordCap}** cafes from Al Sahafah are on the catalog today:`,
    hereOutro: `Soft launch length. Open a card when one fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. Three suggestions, or a neighborhood list. [About](/en/about) has the longer note; [\`/llms.txt\`](/llms.txt) is the public catalog.

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
  },
  ghirnatah: {
    lead: `Ghirnatah (غرناطة) is east Riyadh — a different side of town from KAFD. This page is the Granada-area cafes we’ve put on wain.lol so far.`,
    hereIntro: `There are **{count}** cafes from Ghirnatah on the list right now:`,
    hereOutro: `Pick one that sounds right, open the card, and hit **Take me there** when you want the pin. We don’t paste hours here.`,
    about: `Browse by area or ask the chat. wain.lol stays a clean Riyadh list with Maps. More on [About](/en/about). [\`/llms.txt\`](/llms.txt) for agents.

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  hittin: {
    lead: `Hittin is one of the north-west Riyadh neighborhoods on the catalog. This page is the Hittin places we’ve added to wain.lol so far.`,
    hereIntro: `There are **{count}** cafes from Hittin on the list right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list. [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  "al-malqa": {
    lead: `Al Malqa is a north Riyadh neighborhood on wain.lol. Here’s the Malqa set from the catalog — not a ranking, just the names we’ve added.`,
    hereIntro: `There are **{count}** cafes from Al Malqa on the catalog today:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin. Hours stay on Maps.`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a list like this. [About](/en/about); [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-nakheel": {
    lead: `Al Nakheel’s page is the Nakheel cafes on the list today — a north Riyadh neighborhood, not a citywide ranking.`,
    hereIntro: `**{countWordCap}** cafes from Al Nakheel are on wain.lol right now:`,
    hereOutro: `Short of what we’ve actually added. **Take me there** opens Maps for the pin and today’s hours.`,
    about: `Browse by area or ask the chat. More on [About](/en/about). [\`/llms.txt\`](/llms.txt) is the public catalog.

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  olaya: {
    lead: `Olaya is the central stretch a lot of people already know. This is the Olaya set on wain.lol, each with a Maps link — not a “best cafes in Olaya” essay.`,
    hereIntro: `There are **{count}** cafes from Olaya on the list right now:`,
    hereOutro: `Open a card when a name fits, then **Take me there**. Hours and the exact pin live on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. You can ask for three suggestions, or browse by area like Olaya. [About](/en/about). [\`/llms.txt\`](/llms.txt).

We’re Riyadh-only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  sulimaniyah: {
    lead: `Sulimaniyah sits beside Olaya and Tahlia. These are the Sulimaniyah cafes on the catalog so far — its own page, not folded into Olaya.`,
    hereIntro: `There are **{count}** cafes from Sulimaniyah on the catalog today:`,
    hereOutro: `Pick one, open the card, and hit **Take me there** when you’re ready. We don’t copy hours onto the page.`,
    about: `wain.lol helps you find coffee in Riyadh — ask for three suggestions, or open a neighborhood list. [About](/en/about); [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-rabi": {
    lead: `Al Rabi is a thin list today — one shop on the catalog. We don’t pad it with names we haven’t added.`,
    hereIntro: `There is **{count}** cafe from Al Rabi on wain.lol right now:`,
    hereOutro: `That’s the set. Open the card, then **Take me there** for the Maps pin.`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "al-masif": {
    lead: `Al Masif has one place on wain.lol right now. Short on purpose — only what we’ve actually added.`,
    hereIntro: `There is **{count}** cafe from Al Masif on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** so Google Maps can show the pin and hours.`,
    about: `Browse by area or ask the chat. More on [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
  },
  "al-rahmaniyyah": {
    lead: `Al Rahmaniyyah is on the catalog with a single shop for now. This page stays that honest.`,
    hereIntro: `There is **{count}** cafe from Al Rahmaniyyah on the list right now:`,
    hereOutro: `**Take me there** opens Maps for the pin. We don’t paste hours here.`,
    about: `wain.lol helps you find coffee in Riyadh. [About](/en/about); [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-shohda": {
    lead: `Al Shohda is a small east-Riyadh list — one cafe added so far. Not a clone of Ghirnatah next door.`,
    hereIntro: `There is **{count}** cafe from Al Shohda on the catalog today:`,
    hereOutro: `Open the card when you want the pin. **Take me there** goes to Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "al-safa": {
    lead: `Al Safa is an east Riyadh neighborhood on the list. Here are the Safa places we’ve added — its own page, not folded into Ghirnatah.`,
    hereIntro: `There are **{count}** cafes from Al Safa on wain.lol right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    about: `Ask for three suggestions, or browse a neighborhood list. [About](/en/about); [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  "al-rawdah": {
    lead: `Al Rawdah has one shop on the catalog today. That’s the whole page — we don’t invent neighbors to fill the list.`,
    hereIntro: `There is **{count}** cafe from Al Rawdah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there**. Hours stay on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  qurtubah: {
    lead: `Qurtubah is an east Riyadh neighborhood with a longer list than most. These are the Qurtubah cafes on wain.lol — still only what’s in the catalog.`,
    hereIntro: `There are **{count}** cafes from Qurtubah on the list right now:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin. We don’t copy hours onto the page.`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a neighborhood list like Qurtubah. [About](/en/about); [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "an-nazhah": {
    lead: `An Nuzhah is on the catalog as its own neighborhood list. Here are the places we’ve added so far — not a citywide ranking.`,
    hereIntro: `There are **{count}** cafes from An Nuzhah on the catalog today:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the Maps pin and today’s hours.`,
    about: `Browse by area or ask the chat. More on [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
  },
};

const CNI_BLURBS: Record<string, string> = {
  "core-coffee-and-roastery-al-narjis": `Looking for a coffee stop in Al Narjis on the north side of Riyadh? **CORE COFFEE & ROASTERY** is on our list for that neighborhood — same Al Narjis page as CAF LAB and Repository, not the KAFD list. We keep the card simple: name, Al Narjis, and **Take me there** so Google Maps can show the pin and today’s hours. No menu, ratings, or opening times pasted here. If you want another name from the same north-Riyadh list, the siblings are below.`,
  "caf-lab-al-narjis": `**CAF LAB** is one of the Al Narjis places on wain.lol. If you’re already up north and you just want this card, you’re in the right spot — not a KAFD page, not a citywide ranking. The page stays thin: name, district, and **Take me there** for the pin. Hours live on Google Maps, not here. Other Al Narjis names on the catalog are linked underneath.`,
  "repository-coffee-roasters-al-narjis": `**Repository Coffee Roasters** is on the Al Narjis catalog with the other north-Riyadh names. This card is the wain.lol entry for that shop — not a review, not a menu, not a copy of the Core or CAF LAB cards. Open **Take me there** when you want the Maps pin and today’s hours. The rest of the Al Narjis list is linked below if you want to hop.`,
  "jazel-speciality-cafe-diriyah": `**Jazel speciality cafe** is on the Diriyah list on wain.lol — west of the usual north-Riyadh loop, not folded into Olaya or KAFD. The card is the name, Diriyah, and **Take me there**. We don’t paste hours, ratings, or a menu onto the page. Other Diriyah places we’ve added sit on the same neighborhood list if this one isn’t the stop.`,
  "qirat-al-yasmin": `**Qirat – Specialty Coffee** is one of the Al Yasmin cafes on wain.lol. If you’re browsing that north-Riyadh neighborhood next to Malqa and Narjis, this is the card. Name, Al Yasmin, **Take me there** for the pin. Hours stay on Google Maps. The other Yasmin names on the catalog are linked below — we don’t invent extras.`,
  "cred-al-mughrizat": `Al Mughrizat is a short list on wain.lol, and **CRED** is the cafe on it today. We only add what we have, so this page is that one card — name, Al Mughrizat, and **Take me there** so Google Maps can show the pin and today’s hours. No menu, ratings, or opening times pasted here. If you wanted a longer neighborhood list, the district page points at nearby areas we actually cover. There’s no sibling cafe on this list yet.`,
  "sulalat-coffee-ar-rabwah": `**Sulalat** is on the Al Rabwah catalog — east of the Olaya–Wurud stretch, its own neighborhood page. The card stays simple: name, Al Rabwah, **Take me there** for the Google Maps pin. We don’t copy hours or ratings here. Other Rabwah places on the catalog are linked below if you want a different name from the same list.`,
  "taim-specialty-coffee-as-sahafah": `**Taim Specialty Coffee** is on the Al Sahafah list, next to KAFD but not on the KAFD page. This is the wain.lol card: name, Al Sahafah, and **Take me there** when you want the pin. Hours live on Google Maps. The other Sahafah names we’ve added are linked underneath — short list, only what’s in the catalog. We don’t invent a longer Sahafah set.`,
  "archi-ghirnatah": `**Archi Granada** is on the Ghirnatah list — east Riyadh, a different side of town from KAFD. The card is name, Ghirnatah, and **Take me there**. No menu, ratings, or opening times pasted here. Other Granada-area places on wain.lol are linked below if you want to stay on that side of the city.`,
};

const CAFE_OPENERS = [
  (name: string, district: string) =>
    `**${name}** is on the wain.lol list for ${district} in Riyadh.`,
  (name: string, district: string) =>
    `If you’re looking up **${name}** in ${district}, this is the card we have on wain.lol.`,
  (name: string, district: string) =>
    `This is the **${name}** page on wain.lol — one of the ${district} places on the Riyadh list.`,
  (name: string, district: string) =>
    `${district} has **${name}** on our catalog. The card is here if you want the Maps pin.`,
] as const;

function variantIndex(id: string, modulo: number): number {
  let n = 0;
  for (const ch of id) n = (n + ch.charCodeAt(0)) % modulo;
  return n;
}

export function shopsInDistrict(district: NeighborhoodId): ReturnType<
  typeof filterDirectoryShops
> {
  return filterDirectoryShops(listDirectoryShops(), district);
}

export function siblingShops(
  shop: Pick<Shop, "id" | "neighborhood">,
): ReturnType<typeof filterDirectoryShops> {
  return shopsInDistrict(shop.neighborhood).filter((row) => row.id !== shop.id);
}

function cafeLink(id: string, name: string): string {
  return `[${name}](${cardPath(id, "en")})`;
}

function districtLink(id: NeighborhoodId): string {
  const name = neighborhoodLabel(id, "en");
  return `[Coffee shops in ${name}](${districtPath(id, "en")})`;
}

function shopListMarkdown(
  shops: { id: string; nameEn: string }[],
): string {
  return shops.map((shop) => `- ${cafeLink(shop.id, shop.nameEn)}`).join("\n");
}

function nearbyListMarkdown(district: NeighborhoodId): string {
  const listed = new Set(
    listDirectoryShops().map((shop) => shop.neighborhood),
  );
  return NEARBY_DISTRICTS[district]
    .filter((id) => listed.has(id) && id !== district)
    .map((id) => `- ${districtLink(id)}`)
    .join("\n");
}

function fillCount(template: string, count: number): string {
  const word = countWord(count);
  const wordCap = word.charAt(0).toUpperCase() + word.slice(1);
  return template
    .replaceAll("{count}", word)
    .replaceAll("{countWordCap}", wordCap);
}

function defaultDistrictCopy(district: NeighborhoodId): DistrictLead {
  const name = neighborhoodLabel(district, "en");
  return {
    lead: `${name} is one of the Riyadh neighborhoods on wain.lol. This page is the ${name} places we’ve added to the catalog so far.`,
    hereIntro: `There are **{count}** cafes from ${name} on the list right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps. We don’t paste hours onto the page.`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list. [About](/en/about). [\`/llms.txt\`](/llms.txt).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  };
}

export function lockedDistrictCopy(
  district: NeighborhoodId,
): (typeof GOLD_DISTRICT)[keyof typeof GOLD_DISTRICT] | null {
  if (district === "kafd") return GOLD_MASTER_KAFD;
  if (district === "al-wurud") return GOLD_MASTER_AL_WURUD;
  return null;
}

export function districtEnTitle(district: NeighborhoodId): string {
  const locked = lockedDistrictCopy(district);
  if (locked) return locked.title;
  return `Coffee shops in ${neighborhoodLabel(district, "en")} · ${PRODUCT_NAME}`;
}

export function districtEnMeta(district: NeighborhoodId): string {
  const locked = lockedDistrictCopy(district);
  if (locked) return locked.meta;
  const custom = DISTRICT_COPY[district];
  if (custom?.meta) return custom.meta;
  const name = neighborhoodLabel(district, "en");
  const count = shopsInDistrict(district).length;
  const word = countWord(count);
  if (count === 1) {
    return `One cafe in ${name} on wain.lol — a Riyadh neighborhood list, with a Maps link.`;
  }
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} cafes in ${name} on wain.lol — a Riyadh neighborhood list, with Maps links.`;
}

export function districtEnMarkdown(district: NeighborhoodId): string {
  const locked = lockedDistrictCopy(district);
  if (locked) return locked.markdown;

  const name = neighborhoodLabel(district, "en");
  const shops = shopsInDistrict(district);
  const count = shops.length;
  const copy = DISTRICT_COPY[district] ?? defaultDistrictCopy(district);
  const hereDefault =
    count === 1
      ? `There is **${countWord(count)}** cafe from ${name} on the list right now:`
      : `There are **${countWord(count)}** cafes from ${name} on the list right now:`;
  const hereIntro = fillCount(copy.hereIntro ?? hereDefault, count);
  const hereOutro =
    copy.hereOutro ??
    `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps. We don’t paste hours onto the page.`;
  const nearbyIntro = copy.nearbyIntro ?? "";
  const nearby = nearbyListMarkdown(district);

  return `# Coffee shops in ${name}

${copy.lead}

## What’s here

${hereIntro}

${shopListMarkdown(shops)}

${hereOutro}

## Other neighborhoods nearby

${nearbyIntro ? `${nearbyIntro}\n\n` : ""}${nearby}

## About wain

${copy.about}`;
}

export function cafeEnTitle(shop: Pick<Shop, "id" | "nameEn" | "neighborhood">): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE.title;
  const district = neighborhoodLabel(shop.neighborhood, "en");
  return `${shop.nameEn} · ${district} · Riyadh · ${PRODUCT_NAME}`;
}

export function cafeEnMeta(shop: Pick<Shop, "id" | "nameEn" | "neighborhood">): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE.meta;
  const district = neighborhoodLabel(shop.neighborhood, "en");
  return `${shop.nameEn} in ${district} on wain.lol — open Maps for the pin and hours.`;
}

function defaultCafeBlurb(shop: Shop): string {
  const district = neighborhoodLabel(shop.neighborhood, "en");
  const opener = CAFE_OPENERS[variantIndex(shop.id, CAFE_OPENERS.length)];
  const vibe = vibeLabels(shop, "en").filter((label) => label !== "Outdoor");
  const vibeLine =
    vibe.length > 0 && vibe[0] !== "Coffee"
      ? ` Catalog tags on the card: ${vibe.join(", ")}.`
      : "";
  return `${opener(shop.nameEn, district)}${vibeLine} We keep the card simple: name, ${district}, and **Take me there** so Google Maps can show the pin and today’s hours. No menu, ratings, or opening times pasted here. If you want the rest of that neighborhood, the district page is linked below.`;
}

function cafeSiblingsMarkdown(shop: Shop): string {
  const siblings = siblingShops(shop);
  if (siblings.length === 0) {
    return `Full neighborhood page: ${districtLink(shop.neighborhood)}.`;
  }
  const district = neighborhoodLabel(shop.neighborhood, "en");
  return `Others on the same ${district} list:

${shopListMarkdown(siblings)}

Full neighborhood page: ${districtLink(shop.neighborhood)}.`;
}

export function cafeEnMarkdown(shop: Shop): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE.markdown;
  const body = CNI_BLURBS[shop.id] ?? defaultCafeBlurb(shop);
  return `${body}

${cafeSiblingsMarkdown(shop)}`;
}

export function hasEnDistrictBody(district: NeighborhoodId): boolean {
  return Boolean(lockedDistrictCopy(district) || DISTRICT_COPY[district]);
}

export function cafeOgImagePath(id: string, language: "ar" | "en"): string {
  return `${cardPath(id, language)}/opengraph-image`;
}

export function districtHasShops(district: NeighborhoodId): boolean {
  return shopsInDistrict(district).length > 0;
}
