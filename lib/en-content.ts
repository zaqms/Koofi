import {
  chainBranchesEn,
  chainOnlyBlock,
  countWord,
  countedCafesEn,
  countedCafesEnHead,
  fillHereIntroEn,
  localCafesEn,
} from "./cafe-count";
import { listDirectoryShops, listDirectoryShopsForDistrict } from "./catalog";
import { districtPageHidden } from "./district-dictionary";
import { cityLabel } from "./cities";
import { districtCity } from "./district-city";
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

export { countWord } from "./cafe-count";

export const DROPPED_SLOGANS = [
  "Maps is the last click",
  "A link, not an app",
] as const;

/** Consumer district/cafe bodies must not pitch the agent catalog. */
export const CONSUMER_PAGE_DROPPED = [
  "/llms.txt",
  "If you build tools or agents",
  "the public catalog is in",
  "machine-readable",
] as const;

/** Cafe blurbs must not lecture about the thin card / pasted hours. */
export const CAFE_META_DROPPED = [
  "We keep the card simple",
  "Looking for a specialty coffee stop in Al Wurud",
  "quieter streets beside KAFD",
] as const;

/** Consumer cafe/district bodies must not narrate what we don’t paste. */
export const PASTE_LECTURE_DROPPED = [
  "We don’t paste hours onto the page",
  "We don't paste hours onto the page",
  "We don’t paste hours here",
  "We don't paste hours here",
  "We don’t copy hours onto the page",
  "We don't copy hours onto the page",
  "we don’t copy those onto the page",
  "we don't copy those onto the page",
  "opening times pasted",
] as const;

export const GATE_FORBIDDEN_CLAIMS = ["parking", "wifi", "wi-fi", "outdoor"] as const;

/** Locked 9 Sep 2026. Do not rewrite. */
export const GOLD_MASTER_KAFD = {
  title: `Coffee shops in KAFD · ${PRODUCT_NAME}`,
  meta: `A short list of cafes in KAFD on wain.lol — ${countWord(7)} places in Riyadh, each with a Maps link.`,
  markdown: `# Coffee shops in KAFD

If you’re around KAFD and you just want a coffee without scrolling forever, this page is for you. It’s our list of places in that part of Riyadh that we’ve put on wain.lol so far.

## What’s here

There are **${countWord(7)}** cafes from KAFD on the list right now:

- [12 Cups Roastery and Cafe](/en/c/12-cups-roastery-and-cafe-kafd)
- [Cafe Tale](/en/c/cafe-tale-kafd)
- [Coffee Planet](/en/c/coffee-planet-kafd)
- [DRAFT Café](/en/c/draft-cafe-kafd)
- [Hal Alkeif](/en/c/hal-alkeif-kafd)
- [Toby's Estate (KAFD)](/en/c/tobys-estate-kafd)
- [Trieste](/en/c/trieste-kafd)

Pick one that sounds right, open the card, and hit **Take me there** when you’re ready to go. Hours and the exact pin live on Google Maps.

## Other neighborhoods nearby

Worth a look nearby:

- [Coffee shops in Al Wurud](/en/coffee-shops/al-wurud)
- [Coffee shops in As Sahafah](/en/coffee-shops/as-sahafah)
- [Coffee shops in Al Olaya](/en/coffee-shops/olaya)
- [Coffee shops in An Narjis](/en/coffee-shops/al-narjis)

## About wain

wain.lol is a small Riyadh coffee guide. You can ask for three suggestions, or browse by area like this. We’re not trying to be a review site or a delivery app — just a clean list with Maps when you need directions. More background is on [About](/en/about).

We’re Riyadh-only for now. Missing a place you like? You can send a Maps link from the site.`,
} as const;

/** Locked 9 Sep 2026. Do not rewrite. */
export const GOLD_MASTER_AL_WURUD = {
  title: `Coffee shops in Al Wurud · ${PRODUCT_NAME}`,
  meta: `${countedCafesEnHead(4)} in Al Wurud on wain.lol — a quieter Riyadh neighborhood list, with Maps links.`,
  markdown: `# Coffee shops in Al Wurud

Al Wurud is more residential streets than office towers — the kind of Riyadh neighborhood where you might want a calm coffee without driving across town. This page is the small set of Al Wurud places we’ve added to wain.lol so far. (الورود)

## What’s here

**${countWord(4)}** cafes from Al Wurud are on the catalog today:

- [Carve Coffee Bar](/en/c/carve-coffee-bar-al-wurud)
- [EYA Specialty Coffee](/en/c/eya-specialty-coffee-al-wurud)
- [Joe Barrel Coffee](/en/c/joe-barrel-al-wurud)
- [The Gate Specialty Coffee](/en/c/the-gate-specialty-coffee-al-wurud)

Short list on purpose — soft launch, only what we’ve actually added. Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.

## Other neighborhoods nearby

- [Coffee shops in KAFD](/en/coffee-shops/kafd)
- [Coffee shops in Ar Rabwah](/en/coffee-shops/al-rabwah)
- [Coffee shops in Ar Rabi](/en/coffee-shops/al-rabi)
- [Coffee shops in Al Olaya](/en/coffee-shops/olaya)

## About wain

wain.lol helps you find coffee in Riyadh — ask for three suggestions, or open a neighborhood list like this one. We’re not a review site and we’re not delivery. [About](/en/about) has the longer explanation.

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
} as const;

/** Locked 9 Sep 2026. Do not rewrite. Do not invent nameAr. */
export const GOLD_MASTER_GATE = {
  title: `The Gate Specialty Coffee · Al Wurud · Riyadh · ${PRODUCT_NAME}`,
  meta: "The Gate Specialty Coffee in Al Wurud on wain.lol — specialty coffee and desserts near KAFD; open Maps for the pin and hours.",
  markdown: `**The Gate Specialty Coffee** is on wain.lol’s Al Wurud list, in the Al Olaya Mall area. Reviews often mention specialty brews, cheesecake and other desserts, friendly service, and a calm, aesthetic spot to unwind.

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

export const NEARBY_DISTRICTS: Record<NeighborhoodId, readonly NeighborhoodId[]> = {
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
  "al-hamra": ["ghirnatah", "al-rawdah", "qurtubah", "al-safa"],
  "al-yarmouk": ["al-hamra", "qurtubah", "al-rawdah", "ghirnatah"],
  "al-nahdah": ["al-yarmouk", "al-hamra", "al-rawdah", "al-safa"],
  "al-manar": ["al-safa", "al-fayha", "al-rawabi", "al-rayyan"],
  "al-rayyan": ["al-rawdah", "al-safa", "al-rawabi", "al-fayha"],
  "al-rawabi": ["al-rayyan", "al-manar", "al-fayha", "al-safa"],
  "al-fayha": ["al-safa", "al-manar", "al-rayyan", "al-rawabi"],
  "al-raqban": ["al-manar", "al-safa", "al-fayha", "al-rawabi"],
  "al-munsiyah": ["qurtubah", "al-yarmouk", "al-hamra", "al-rawdah"],
  "an-nada": ["al-yasmin", "al-malqa", "hittin", "as-sahafah"],
  "diplomatic-quarter": ["olaya", "al-rahmaniyyah", "diriyah", "kafd"],
  "king-fahd": ["olaya", "sulimaniyah", "al-wurud", "al-masif"],
  "al-takhassusi": ["olaya", "sulimaniyah", "king-fahd", "al-wurud"],
  "al-aqiq": ["hittin", "al-yasmin", "al-nakheel", "al-malqa"],
  "al-ghadeer": ["al-yasmin", "as-sahafah", "al-narjis", "hittin"],
  "al-arid": ["al-narjis", "al-yasmin", "as-sahafah", "hittin"],
  "al-qirawan": ["hittin", "al-malqa", "al-yasmin", "al-nakheel"],
  "al-wadi": ["al-yasmin", "al-nakheel", "as-sahafah", "hittin"],
  "al-mohammadiyah": ["olaya", "sulimaniyah", "al-masif", "king-fahd"],
  "al-muruj": ["al-yasmin", "al-nakheel", "al-rabi", "as-sahafah"],
  "al-malaz": ["sulimaniyah", "olaya", "al-rabwah", "al-mughrizat"],
  "al-mathar": ["olaya", "sulimaniyah", "al-takhassusi", "king-fahd"],
  "at-taawun": ["olaya", "al-mughrizat", "al-wurud", "al-rabwah"],
  "al-mursalat": ["al-mughrizat", "al-masif", "al-wurud", "king-fahd"],
  "al-murabba": ["al-malaz", "olaya", "sulimaniyah", "king-fahd"],
  "as-salam": ["al-nahdah", "al-yarmouk", "al-hamra", "al-rawdah"],
  ghubairah: ["al-malaz", "al-murabba", "sulimaniyah", "al-rabwah"],
  "al-wisham": ["al-murabba", "al-malaz", "olaya", "sulimaniyah"],
  badr: ["al-malaz", "al-murabba", "sulimaniyah", "al-rabwah"],
  "al-aziziyah": ["al-malaz", "al-murabba", "sulimaniyah", "al-rabwah"],
  "al-hazm": ["al-malaz", "al-murabba", "sulimaniyah", "king-fahd"],
  "al-andalus": ["al-hamra", "al-yarmouk", "al-nahdah", "qurtubah"],
  "al-khaleej": ["al-hamra", "al-yarmouk", "al-nahdah", "al-rawdah"],
  "an-nasim-al-gharbi": ["an-nasim-ash-sharqi", "al-nahdah", "al-yarmouk", "al-hamra"],
  "ar-rimal": ["al-munsiyah", "qurtubah", "al-yarmouk", "al-hamra"],
  "al-janadriyyah": ["al-munsiyah", "qurtubah", "al-yarmouk", "al-hamra"],
  namar: ["as-suwaidi", "ash-shifa", "badr", "as-suwaidi-al-gharbi"],
  kkia: ["ar-rimal", "al-janadriyyah", "al-munsiyah", "qurtubah"],
  "al-jazirah": ["al-nahdah", "al-yarmouk", "al-hamra", "al-rawdah"],
  "an-nasim-ash-sharqi": ["an-nasim-al-gharbi", "al-nahdah", "al-yarmouk", "al-hamra"],
  "an-nasim": ["an-nasim-ash-sharqi", "an-nasim-al-gharbi", "al-nahdah", "al-yarmouk"],
  shubra: ["as-suwaidi", "namar", "as-suwaidi-al-gharbi", "badr"],
  manfuha: ["ghubairah", "al-malaz", "al-murabba", "al-aziziyah"],
  tuwaiq: ["al-hazm", "badr", "al-malaz", "king-fahd"],
  "as-suwaidi": ["dhahrat-al-badiah", "al-wisham", "badr", "al-malaz"],
  "al-falah": ["as-sahafah", "an-nada", "al-yasmin", "al-narjis"],
  "al-izdihar": ["al-mughrizat", "olaya", "sulimaniyah", "qurtubah"],
  "dhahrat-al-badiah": ["badr", "diplomatic-quarter", "al-takhassusi", "al-mathar"],
  jarir: ["al-malaz", "al-murabba", "al-rabwah", "ghubairah"],
  "umm-al-hamam-al-gharbi": ["diplomatic-quarter", "al-mathar", "al-rahmaniyyah", "al-takhassusi"],
  "an-nafal": ["al-rabi", "al-masif", "al-wadi", "at-taawun"],
  "king-salman": ["al-mursalat", "an-nazhah", "al-wurud", "king-fahd"],
  "as-suwaidi-al-gharbi": ["dhahrat-al-badiah", "namar", "as-suwaidi", "ash-shifa"],
  "ash-shifa": ["badr", "namar", "as-suwaidi", "as-suwaidi-al-gharbi"],
  "al-qadisiyah": ["al-yarmouk", "al-nahdah", "al-munsiyah", "al-hamra"],
  "dhahrat-laban": ["diplomatic-quarter", "umm-al-hamam-al-gharbi", "dhahrat-al-badiah", "al-mathar"],
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
    lead: `An Narjis sits up in north Riyadh. If you’re already in that part of town and you just want a coffee from the catalog, this page is the An Narjis set on wain.lol.

A few of the names people ask about first are [CORE COFFEE & ROASTERY](/en/c/core-coffee-and-roastery-al-narjis), [CAF LAB](/en/c/caf-lab-al-narjis), and [Repository Coffee Roasters](/en/c/repository-coffee-roasters-al-narjis). They’re on this list with the rest. We don’t rank them.

That’s how many An Narjis places we’ve actually added. Open a card if a name fits. Skip it if it doesn’t.`,
    hereIntro: `There are **{count}** cafes from An Narjis on the catalog today:`,
    hereOutro: `Names come from the catalog as we added them. Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    nearbyIntro: `If An Narjis isn’t the stop, these north-Riyadh lists are next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Narjis. Not a review site, not delivery. [About](/en/about) has the longer note.

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "Cafes in An Narjis on wain.lol — a north Riyadh list including Core, CAF LAB, and Repository, each with a Maps link.",
  },
  diriyah: {
    lead: `Diriyah sits west of the usual north-Riyadh loop — JAX, Bujairi, the older town. This page is the Diriyah set we’ve put on wain.lol so far.`,
    hereIntro: `**{countWordCap}** cafes from Diriyah are on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a neighborhood list like Diriyah. [About](/en/about) has the longer explanation.

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-yasmin": {
    lead: `Al Yasmin is a north Riyadh neighborhood next to Malqa and Narjis. This page is the Yasmin cafes we’ve added to wain.lol so far — still only what’s actually in the catalog.`,
    hereIntro: `There are **{count}** cafes from Al Yasmin on the list right now:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin.`,
    about: `Browse by area or ask the chat. wain.lol stays a clean Riyadh list with Maps. More on [About](/en/about).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  "al-mughrizat": {
    lead: `Al Mughrizat (المغرزات) is a Riyadh list on wain.lol. This page is the Mughrizat cafes we’ve added so far — only what’s actually in the catalog.`,
    hereIntro: `There are **{count}** cafes from Al Mughrizat on the catalog today:`,
    hereOutro: `That’s the whole set for now. Open the card, then **Take me there** for the Maps pin and today’s hours.`,
    about: `wain.lol is a small Riyadh coffee guide. You can ask for three suggestions, or open a neighborhood page like this. [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "al-rabwah": {
    lead: `Ar Rabwah (الربوة) sits east of the Al Olaya–Wurud stretch. This page is the Rabwah cafes on the catalog today.`,
    hereIntro: `There are **{count}** cafes from Ar Rabwah on wain.lol right now:`,
    hereOutro: `Short of inventing extra names. Open a card, then **Take me there** so Maps can show the pin and hours.`,
    about: `wain.lol helps you find coffee in Riyadh — ask for three suggestions, or open a neighborhood list like Ar Rabwah. We’re not a review site and we’re not delivery. [About](/en/about).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "as-sahafah": {
    lead: `As Sahafah sits on the north side of Riyadh. This page is the Sahafah cafes we’ve added so far.`,
    hereIntro: `**{countWordCap}** cafes from As Sahafah are on the catalog today:`,
    hereOutro: `Soft launch length. Open a card when one fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. Three suggestions, or a neighborhood list. [About](/en/about) has the longer note.

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
  },
  ghirnatah: {
    lead: `Ghirnatah (غرناطة) is east Riyadh. This page is the Granada-area cafes we’ve put on wain.lol so far.`,
    hereIntro: `There are **{count}** cafes from Ghirnatah on the list right now:`,
    hereOutro: `Pick one that sounds right, open the card, and hit **Take me there** when you want the pin.`,
    about: `Browse by area or ask the chat. wain.lol stays a clean Riyadh list with Maps. More on [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  hittin: {
    lead: `Hittin is one of the north-west Riyadh neighborhoods on the catalog. This page is the Hittin places we’ve added to wain.lol so far.`,
    hereIntro: `There are **{count}** cafes from Hittin on the list right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list. [About](/en/about).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  "al-malqa": {
    lead: `Al Malqa is a north Riyadh neighborhood on wain.lol. Here’s the Malqa set from the catalog — the names we’ve added.`,
    hereIntro: `There are **{count}** cafes from Al Malqa on the catalog today:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin. Hours stay on Maps.`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a list like this. [About](/en/about).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-nakheel": {
    lead: `An Nakheel’s page is the Nakheel cafes on the list today — a north Riyadh neighborhood.`,
    hereIntro: `**{countWordCap}** cafes from An Nakheel are on wain.lol right now:`,
    hereOutro: `Short of what we’ve actually added. **Take me there** opens Maps for the pin and today’s hours.`,
    about: `Browse by area or ask the chat. More on [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  olaya: {
    lead: `Al Olaya is the central stretch a lot of people already know. This is the Al Olaya set on wain.lol, each with a Maps link.`,
    hereIntro: `There are **{count}** cafes from Al Olaya on the list right now:`,
    hereOutro: `Open a card when a name fits, then **Take me there**. Hours and the exact pin live on Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. You can ask for three suggestions, or browse by area like Al Olaya. [About](/en/about).

We’re Riyadh-only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  sulimaniyah: {
    lead: `As Sulimaniyah sits beside Al Olaya and Tahlia. These are the As Sulimaniyah cafes on the catalog so far.`,
    hereIntro: `There are **{count}** cafes from As Sulimaniyah on the catalog today:`,
    hereOutro: `Pick one, open the card, and hit **Take me there** when you’re ready.`,
    about: `wain.lol helps you find coffee in Riyadh — ask for three suggestions, or open a neighborhood list. [About](/en/about).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
  },
  "al-rabi": {
    lead: `[Piccolo Roasters](/en/c/piccolo-al-rabi), [Ashjar cafe](/en/c/ashjar-cafe-ar-rabi), and [3bean Coffee Roastery](/en/c/3bean-al-rabi) are among the cards on this page today.`,
    hereIntro: `There are **{count}** cafes from Ar Rabi on wain.lol right now:`,
    hereOutro: `That’s the set. Open a card, then **Take me there** for the Maps pin.`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
    meta: "{countCafe} in Ar Rabi on wain.lol — a north Riyadh list including Piccolo, Ashjar, and 3bean, each with a Maps link.",
  },
  "al-masif": {
    lead: `Al Masif (المصيف) is a north-central Riyadh list on wain.lol. This page is the Masif cafes we’ve added so far — only what’s actually in the catalog.`,
    hereIntro: `There are **{count}** cafes from Al Masif on the catalog today:`,
    hereOutro: `Open a card, then **Take me there** so Google Maps can show the pin and hours.`,
    about: `Browse by area or ask the chat. More on [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
  },
  "al-rahmaniyyah": {
    lead: `Ar Rahmaniyyah (الرحمانية) sits between Olaya and Al Nakheel. This page is the Ar Rahmaniyyah set on wain.lol so far.

[Camel Step](/en/c/camel-step-al-rahmaniyyah), [Sipology](/en/c/sipology-al-rahmaniyyah), [Ramli Cafe](/en/c/ramli-cafe-al-rahmaniyyah), and [Peaks – The Tent](/en/c/peaks-the-tent-al-rahmaniyyah) are among the local cafes on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from Ar Rahmaniyyah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Ar Rahmaniyyah isn’t the stop, these lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Ar Rahmaniyyah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Ar Rahmaniyyah on wain.lol — a Riyadh neighborhood list including Camel Step, Sipology, and Ramli Cafe, each with a Maps link.",
  },
  "al-shohda": {
    lead: `Ash Shuhada is a small east-Riyadh list — one cafe added so far.`,
    hereIntro: `There is **{count}** cafe from Ash Shuhada on the catalog today:`,
    hereOutro: `Open the card when you want the pin. **Take me there** goes to Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "al-safa": {
    lead: `As Safa is an east Riyadh neighborhood on the list. Here are the Safa places we’ve added.`,
    hereIntro: `There are **{count}** cafes from As Safa on wain.lol right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    about: `Ask for three suggestions, or browse a neighborhood list. [About](/en/about).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
  },
  "al-rawdah": {
    lead: `Ar Rawdah (الروضة) is an east Riyadh neighborhood on the catalog. If you’re already in الروضة and you just want a coffee from the list, this is the Rawdah set on wain.lol.

Names on this list include [HAI Coffee & Roasters](/en/c/hai-coffee-roasters-al-rawdah), [ON](/en/c/on-al-rawdah), and [Steam Roastery](/en/c/steam-roastery-al-rawdah). They’re here with the rest. We don’t rank them.

That’s how many Ar Rawdah places we’ve actually added.`,
    hereIntro: `There are **{count}** cafes from Ar Rawdah on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there**. Hours stay on Google Maps.`,
    nearbyIntro: `If Ar Rawdah isn’t the stop, these east-Riyadh lists are next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
    meta: "{countCafe} in Ar Rawdah on wain.lol — an east Riyadh list including HAI, ON, and Steam, each with a Maps link.",
  },
  qurtubah: {
    lead: `Qurtubah is an east Riyadh neighborhood. These are the Qurtubah cafes on wain.lol — still only what’s in the catalog.`,
    hereIntro: `There are **{count}** cafes from Qurtubah on the list right now:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin.`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a neighborhood list like Qurtubah. [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
  },
  "an-nazhah": {
    lead: `An Nuzhah is on the catalog as its own neighborhood list. Here are the places we’ve added so far.`,
    hereIntro: `There are **{count}** cafes from An Nuzhah on the catalog today:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the Maps pin and today’s hours.`,
    about: `Browse by area or ask the chat. More on [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
  },
  "al-hamra": {
    lead: `Al Hamra (الحمراء) sits on Riyadh’s east belt — same side of town as Ghirnatah and Qurtubah. This page is the Al Hamra set on wain.lol: twelve cafes we’ve actually added, each with a Maps pin.

A few names on this list are [SERENE COFFEE ROASTERY](/en/c/serene-coffee-roastery), [Rimthan + Coffee](/en/c/rimthan-coffee-al-hamra), and [Harf coffee](/en/c/harf-coffee-al-hamra). They’re here with the rest. We don’t rank them.

Twelve cards is the whole set for now. Open a card if a name fits. Skip it if it doesn’t.`,
    hereIntro: `There are **{count}** cafes from Al Hamra on the catalog today:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin.`,
    nearbyIntro: `If Al Hamra isn’t the stop, these east-Riyadh lists are next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Hamra. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Hamra on wain.lol — an east Riyadh list including Serene, Rimthan, and Harf, each with a Maps link.",
  },
  "al-yarmouk": {
    lead: `Al Yarmuk (اليرموك) sits out on Riyadh’s east side toward the Eastern Ring. If you’re already out that way and you just want a coffee from the catalog, this is the Al Yarmuk set on wain.lol.

Names people ask about on this list include [Silo Cafe](/en/c/silo-cafe-al-yarmouk), [NOSOUND](/en/c/nosound-al-yarmouk), and [RATIO Speciality Coffee](/en/c/ratio-speciality-al-yarmouk). They’re on the page with the other 7. We don’t rank them.

The count is ten because that’s how many Al Yarmuk places we’ve added.`,
    hereIntro: `There are **{count}** cafes from Al Yarmuk on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Yarmuk isn’t the stop, these east-Riyadh lists sit closer in on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Yarmuk. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Yarmuk on wain.lol — an east Riyadh list including Silo, NOSOUND, and RATIO, each with a Maps link.",
  },
  "al-nahdah": {
    lead: `An Nahdah (النهضة) is a Riyadh حي on the city’s east side. If you’re already in النهضة and you just want a coffee from the catalog, this is the An Nahdah set on wain.lol.

Names people ask about on this list include [Kapu Cafe](/en/c/kapu-cafe-al-nahdah), [Ghazala Cafe](/en/c/ghazala-cafe-al-nahdah), and [Coffee Address](/en/c/coffee-address-al-nahdah). They’re on the page with the other 7. We don’t rank them.

The count is ten because that’s how many An Nahdah places we’ve added.`,
    hereIntro: `There are **{count}** cafes from An Nahdah on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If An Nahdah isn’t the stop, these east-Riyadh lists are next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Nahdah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in An Nahdah on wain.lol — an east Riyadh list including Kapu, Ghazala, and Coffee Address, each with a Maps link.",
  },
  "al-manar": {
    lead: `Al Manar (المنار) sits on Riyadh’s east side. If you’re already in المنار and you just want a coffee from the catalog, this is the Al Manar set on wain.lol.

Names on this list include [VASE Coffee](/en/c/vase-coffee-al-manar), [Recaf I](/en/c/recaf-al-manar), and [ON OFF Coffee](/en/c/on-off-coffee-al-manar). They’re the Manar pins we’ve added. We don’t rank them.

Open a card if a name fits. The list below is the whole set for now.`,
    hereIntro: `There are **{count}** cafes from Al Manar on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Manar isn’t the stop, these east-Riyadh lists sit on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Manar. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Manar on wain.lol — an east Riyadh list including VASE, Recaf I, and ON OFF Coffee, each with a Maps link.",
  },
  "al-rayyan": {
    lead: `Ar Rayyan (الريان) is a Riyadh حي on the city’s east side. If you’re already in الريان and you just want a coffee from the catalog, this is the Ar Rayyan set on wain.lol.

Names people ask about on this list include [Kultúra](/en/c/kultura-al-rayyan), [Amber Speciality Coffee & Roastery](/en/c/amber-speciality-al-rayyan), and [sica](/en/c/sica-al-rayyan). They’re on the page with the rest. We don’t rank them.

The count is seven because that’s how many Ar Rayyan places we’ve added.`,
    hereIntro: `There are **{count}** cafes from Ar Rayyan on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Ar Rayyan isn’t the stop, these east-Riyadh lists are next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Ar Rayyan. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Ar Rayyan on wain.lol — an east Riyadh list including Kultúra, Amber, and sica, each with a Maps link.",
  },
  "al-rawabi": {
    lead: `Ar Rawabi (الروابي) is an east Riyadh neighborhood on the list. Here are the Rawabi places we’ve added.

[THE IT](/en/c/the-it-al-rawabi), [Essert](/en/c/essert-al-rawabi), [Bala](/en/c/bala-al-rawabi), and [TORRE Cafe](/en/c/torre-al-rawabi) are the 4 cards on this page today. We don’t invent extras.`,
    hereIntro: `There are **{count}** cafes from Ar Rawabi on wain.lol right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    nearbyIntro: `If Ar Rawabi isn’t the stop, these east-Riyadh lists sit closer in on the site:`,
    about: `Ask for three suggestions, or browse a neighborhood list. [About](/en/about).

Riyadh only for now. Missing a place you like? Send a Maps link from the site.`,
    meta: "{countCafe} in Ar Rawabi on wain.lol — an east Riyadh list including THE IT and Essert, each with a Maps link.",
  },
  "al-fayha": {
    lead: `Al Fayha (الفيحاء) sits on Riyadh’s east side. This page is the Fayha cafes we’ve put on wain.lol so far — still only what’s in the catalog.

[Rukyah](/en/c/rukyah-al-fayha) and [Roof coffee](/en/c/roof-coffee-al-fayha) are the names on this list. We don’t rank them.`,
    hereIntro: `There are **{count}** cafes from Al Fayha on the list right now:`,
    hereOutro: `Pick a name, open the card, and use **Take me there** when you want the pin.`,
    nearbyIntro: `If Al Fayha isn’t the stop, these east-Riyadh lists are next door on the site:`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a neighborhood list like Al Fayha. [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
    meta: "{countCafe} in Al Fayha on wain.lol — an east Riyadh list including Rukyah and Roof coffee, each with a Maps link.",
  },
  "al-raqban": {
    lead: `Al Raqban (الرقبان) is a short east-Riyadh list — one cafe added so far. We only add what we have.`,
    hereIntro: `There is **{count}** cafe from Al Raqban on the catalog today:`,
    hereOutro: `Open the card when you want the pin. **Take me there** goes to Google Maps.`,
    about: `wain.lol is a small Riyadh coffee guide. [About](/en/about).

Riyadh only for now. Send a Maps link from the site if we missed a shop.`,
    meta: "{countCafe} in Al Raqban on wain.lol — a Riyadh neighborhood list, with a Maps link.",
  },
  "al-munsiyah": {
    lead: `Al Munsiyah (المونسية) sits on Riyadh’s east belt, past Qurtubah. If you’re already in المونسية and you just want a coffee from the catalog, this is the Al Munsiyah set on wain.lol.

Names people ask about on this list include [Serb Specialty Coffee](/en/c/serb-specialty-al-munsiyah), [Roasting Stages](/en/c/roasting-stages-al-munsiyah), and [Eagle Coffee](/en/c/eagle-coffee-al-munsiyah). They’re on the page with the other 7. We don’t rank them.

The count is ten because that’s how many Al Munsiyah places we’ve added.`,
    hereIntro: `There are **{count}** cafes from Al Munsiyah on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Munsiyah isn’t the stop, these east-Riyadh lists sit closer in on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Munsiyah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Munsiyah on wain.lol — an east Riyadh list including Serb, Roasting Stages, and Eagle, each with a Maps link.",
  },
  "an-nada": {
    lead: `An Nada (الندى) sits on Riyadh’s north side, next to Yasmin and Malqa. This page is the An Nada set on wain.lol — 3 cafes we’ve actually added.

[Brew 92 - Al Nada](/en/c/brew92-an-nada), [SoMatcha](/en/c/somatcha-an-nada), and [Century Cafe](/en/c/century-cafe-an-nada) are the 3 cards on this list today. We don’t invent extras.`,
    hereIntro: `There is **{count}** cafe from An Nada on the catalog today:`,
    hereOutro: `Open the card when you want the pin. **Take me there** goes to Google Maps.`,
    nearbyIntro: `If An Nada isn’t the stop, these north-Riyadh lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Nada. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in An Nada on wain.lol — a north Riyadh list including Brew 92 and Century Cafe, with a Maps link.",
  },
  "diplomatic-quarter": {
    lead: `The Diplomatic Quarter (الحي الدبلوماسي) is its own Riyadh list — السفارات on the maps card. This page is the DQ set we’ve put on wain.lol so far.

[Jazean DQ](/en/c/jazean-diplomatic-quarter) is the name on this page today. We don’t rank it.`,
    hereIntro: `There is **{count}** cafe from the Diplomatic Quarter on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If the Diplomatic Quarter isn’t the stop, these Riyadh lists sit closer in on the site:`,
    about: `wain.lol helps you find coffee in Riyadh — three suggestions, or a neighborhood list like the Diplomatic Quarter. [About](/en/about).

Riyadh only for now. Know a shop we missed? Send a Maps link from the site.`,
    meta: "{countCafe} in the Diplomatic Quarter on wain.lol — a Riyadh list including Jazean DQ, with a Maps link.",
  },
  "king-fahd": {
    lead: `King Fahd District (الملك فهد) is its own district on the catalog — Al Olaya Street runs through it, but this is not the Al Olaya page. This is the King Fahd District set on wain.lol.

[Markab](/en/c/markab-king-fahd) and [Ōkawa](/en/c/okawa-king-fahd) are the two cards we’ve added. Coffee first. We don’t invent extras.`,
    hereIntro: `There is **{count}** cafe from King Fahd District on the catalog today:`,
    hereOutro: `Open the card when you want the pin. **Take me there** goes to Google Maps.`,
    nearbyIntro: `If King Fahd District isn’t the stop, these central Riyadh lists sit on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like King Fahd District. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in King Fahd District on wain.lol — a Riyadh district list including Markab, with a Maps link.",
  },
  "at-taawun": {
    lead: `At Taawun (التعاون) sits between Al Olaya and Al Mughrizat — a mid-north Riyadh حي of its own. This page is the At Taawun set on wain.lol so far.

[FLOW MATCHA](/en/c/flow-matcha-at-taawun), [Jadeel Coffee](/en/c/jadeel-coffee-at-taawun), [Soul Cafe](/en/c/soul-cafe-at-taawun), and [Peaks](/en/c/peaks-at-taawun) are among the cards on this page today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from At Taawun on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If At Taawun isn’t the stop, these mid-north lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like At Taawun. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in At Taawun on wain.lol — a Riyadh neighborhood list including FLOW MATCHA, Jadeel, Soul Cafe, and Peaks, each with a Maps link.",
  },
  "al-mursalat": {
    lead: `Al Mursalat (المرسلات) sits between Al Mughrizat and Al Masif. This page is the Al Mursalat set on wain.lol so far.

[Camel Step](/en/c/camel-step-al-mursalat) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Mursalat on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Mursalat isn’t the stop, these central-north lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Mursalat. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Mursalat on wain.lol — a Riyadh neighborhood list including Camel Step, with a Maps link.",
  },
  "al-murabba": {
    lead: `Al Murabba (المربع) sits by Al Malaz and Al Olaya. This page is the Al Murabba set on wain.lol so far.

[Coffee Address](/en/c/coffee-address-al-murabba) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Murabba on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Murabba isn’t the stop, these central Riyadh lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Murabba. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Murabba on wain.lol — a Riyadh neighborhood list including Coffee Address, with a Maps link.",
  },
  "as-salam": {
    lead: `As Salam (السلام) is on the east side of Riyadh. This page is the As Salam set on wain.lol so far.

[A PLUS](/en/c/a-plus-as-salam) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from As Salam on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If As Salam isn’t the stop, these east Riyadh lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like As Salam. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in As Salam on wain.lol — a Riyadh neighborhood list including A PLUS, with a Maps link.",
  },
  ghubairah: {
    lead: `Ghubairah (غبيرة) sits south of the old-city stretch. This page is the Ghubairah set on wain.lol so far.

[Arabica Cafe](/en/c/arabica-cafe-ghubairah) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Ghubairah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Ghubairah isn’t the stop, these central-south lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Ghubairah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Ghubairah on wain.lol — a Riyadh neighborhood list including Arabica Cafe, with a Maps link.",
  },
  "al-wisham": {
    lead: `Al Wisham (الوشام) is an old-city Riyadh حي. This page is the Al Wisham set on wain.lol so far.

[Arabica coffee](/en/c/arabica-coffee-al-wisham) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Wisham on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Wisham isn’t the stop, these central lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Wisham. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Wisham on wain.lol — a Riyadh neighborhood list including Arabica coffee, with a Maps link.",
  },
  badr: {
    lead: `[Shubak Al Bun](/en/c/shubak-al-bun-badr) and [Soliz](/en/c/soliz-badr) are the two cards on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Badr on the catalog today:`,
    hereOutro: `Open a card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Badr isn’t the stop, these south-central lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Badr. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Badr on wain.lol — a Riyadh neighborhood list including Shubak Al Bun, with a Maps link.",
  },
  "al-aziziyah": {
    lead: `Al Aziziyah (العزيزية) sits on the south side of Riyadh. This page is the Al Aziziyah set on wain.lol so far.

[Waqar](/en/c/waqar-al-aziziyah) and [SAMA Cafe Coffee Bar](/en/c/sama-cafe-al-aziziyah) are the two cards on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Aziziyah on the catalog today:`,
    hereOutro: `Open a card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Aziziyah isn’t the stop, these south-central lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Aziziyah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Aziziyah on wain.lol — a Riyadh neighborhood list including Waqar, with a Maps link.",
  },
  "al-hazm": {
    lead: `Al Hazm (الحزم) is a southwest Riyadh حي. This page is the Al Hazm set on wain.lol so far.

[Drive Coffee](/en/c/drive-al-hazm) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Hazm on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Hazm isn’t the stop, these south-west lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Hazm. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Hazm on wain.lol — a Riyadh neighborhood list including Drive Coffee, with a Maps link.",
  },
  "al-andalus": {
    lead: `Al Andalus (الأندلس) sits on the northeast side of Riyadh. This page is the Al Andalus set on wain.lol so far.

[Drive Coffee](/en/c/drive-al-andalus) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Andalus on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Andalus isn’t the stop, these east lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Andalus. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Andalus on wain.lol — a Riyadh neighborhood list including Drive Coffee, with a Maps link.",
  },
  "al-khaleej": {
    lead: `Al Khaleej (الخليج) is an east Riyadh حي. This page is the Al Khaleej set on wain.lol so far.

[Drive Coffee](/en/c/drive-al-khaleej) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Khaleej on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Khaleej isn’t the stop, these east lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Khaleej. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Khaleej on wain.lol — a Riyadh neighborhood list including Drive Coffee, with a Maps link.",
  },
  "an-nasim-al-gharbi": {
    lead: `An Nasim Al Gharbi (النسيم الغربي) sits on the east side of Riyadh. If you’re already in النسيم الغربي and you just want a coffee from the catalog, this is the An Nasim Al Gharbi set on wain.lol.

Names people ask about on this list include [Trivali Roaster](/en/c/trivali-roaster-al-naseem-gharbi), [Gusn Coffee (Al Naseem)](/en/c/gusn-coffee-al-naseem-gharbi), and [BE SUCH](/en/c/be-such-al-naseem-gharbi). They’re on the page. We don’t rank them.

The count is three because that’s how many specialty shops we’ve added from النسيم الغربي.`,
    hereIntro: `There are **{count}** cafes from An Nasim Al Gharbi on the catalog today:`,
    hereOutro: `Open a card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If An Nasim Al Gharbi isn’t the stop, these east lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Nasim Al Gharbi. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in An Nasim Al Gharbi on wain.lol — an east Riyadh list including Trivali, Gusn, and BE SUCH, each with a Maps link.",
  },
  "ar-rimal": {
    lead: `Ar Rimal (الرمال) sits on the northeast edge of Riyadh. This page is the Ar Rimal set on wain.lol so far.

[Drive Coffee](/en/c/drive-ar-rimal) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Ar Rimal on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Ar Rimal isn’t the stop, these northeast lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Ar Rimal. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Ar Rimal on wain.lol — a Riyadh neighborhood list including Drive Coffee, with a Maps link.",
  },
  "al-janadriyyah": {
    lead: `Al Janadriyyah (الجنادرية) sits on the northeast edge of Riyadh. This page is the Al Janadriyyah set on wain.lol so far.

[Drive Coffee](/en/c/drive-al-janadriyyah) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Janadriyyah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Janadriyyah isn’t the stop, these northeast lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Janadriyyah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Janadriyyah on wain.lol — a Riyadh neighborhood list including Drive Coffee, with a Maps link.",
  },
  namar: {
    lead: `Namar (نمار) sits on the south side of Riyadh. This page is the Namar set on wain.lol so far.

[ON OFF Coffee](/en/c/on-off-coffee-namar) is the local cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Namar on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Namar isn’t the stop, these south lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Namar. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Namar on wain.lol — a Riyadh neighborhood list including ON OFF Coffee, with a Maps link.",
  },
  kkia: {
    lead: `KKIA (مطار الملك خالد) is the airport locality on the official Maps pin. This page is the KKIA set on wain.lol so far.

[dr.CAFE](/en/c/drcafe-kkia) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from KKIA on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If KKIA isn’t the stop, these northeast lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like KKIA. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} at KKIA on wain.lol — a Riyadh locality list including dr.CAFE, with a Maps link.",
  },
  "al-jazirah": {
    lead: `Al Jazirah (الجزيرة) sits on the east side of Riyadh. This page is the Al Jazirah set on wain.lol so far.

[dr.CAFE](/en/c/drcafe-al-jazirah) is on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from Al Jazirah on the catalog today:`,
    hereOutro: `Open a card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Jazirah isn’t the stop, these east lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Jazirah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Jazirah on wain.lol — a Riyadh neighborhood list including dr.CAFE, with Maps links.",
  },
  "an-nasim-ash-sharqi": {
    lead: `An Nasim Ash Sharqi (النسيم الشرقي) sits on the east side of Riyadh, after النهضة. If you’re already in النسيم الشرقي and you just want a coffee from the catalog, this is the An Nasim Ash Sharqi set on wain.lol.

Names people ask about on this list include [VOÛTE / Fot](/en/c/voute-fot-al-naseem-sharqi), [JARO Cafe](/en/c/jaro-cafe-al-naseem-sharqi), and [Tamper Speciality Coffee](/en/c/tamper-speciality-al-naseem-sharqi). They’re on the page with the rest. We don’t rank them.

The count is seven because that’s how many An Nasim Ash Sharqi places we’ve added.`,
    hereIntro: `There are **{count}** cafes from An Nasim Ash Sharqi on the catalog today:`,
    hereOutro: `Open a card when a name fits, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If An Nasim Ash Sharqi isn’t the stop, these east lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Nasim Ash Sharqi. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in An Nasim Ash Sharqi on wain.lol — an east Riyadh list including VOÛTE, JARO, and Tamper, each with a Maps link.",
  },
  "an-nasim": {
    lead: `An Nasim (النسيم) sits on the east side of Riyadh. This page is the An Nasim set on wain.lol so far.

[dr.CAFE](/en/c/drcafe-an-nasim) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from An Nasim on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If An Nasim isn’t the stop, these east lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Nasim. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in An Nasim on wain.lol — a Riyadh neighborhood list including dr.CAFE, with a Maps link.",
  },
  shubra: {
    lead: `Shubra (شبرا) sits on the south side of Riyadh. This page is the Shubra set on wain.lol so far.

[mhj cafe](/en/c/mhj-cafe-shubra), [Nasaq](/en/c/nasaq-shubra), [Jadeel Coffee](/en/c/jadeel-coffee-shubra), and [Address Mood Café](/en/c/address-mood-shubra) are among the local cafes on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from Shubra on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Shubra isn’t the stop, these south lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Shubra. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Shubra on wain.lol — a Riyadh neighborhood list including mhj cafe, Nasaq, and Jadeel, each with a Maps link.",
  },
  manfuha: {
    lead: `Manfuha (منفوحة) sits south of the old-city stretch. This page is the Manfuha set on wain.lol so far.

[dr.CAFE](/en/c/drcafe-manfuha) is the name on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Manfuha on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Manfuha isn’t the stop, these south-central lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Manfuha. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Manfuha on wain.lol — a Riyadh neighborhood list including dr.CAFE, with a Maps link.",
  },
  tuwaiq: {
    lead: `Tuwaiq (طويق) sits on the southwest side of Riyadh. This page is the Tuwaiq set on wain.lol so far.

[Drip](/en/c/drip-tuwaiq) is the local cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Tuwaiq on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Tuwaiq isn’t the stop, these are the nearest lists on the site so far. Al Hazm is close too, but its only cafe is a drive-thru, so it isn’t listed here:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Tuwaiq. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Tuwaiq on wain.lol — a Riyadh neighborhood list including Drip, with a Maps link.",
  },
  "al-falah": {
    lead: `Al Falah (الفلاح) sits on the north side of Riyadh. This page is the Al Falah set on wain.lol so far.

[Mood Masters](/en/c/mood-masters-al-falah), [Ostrich Coffee House](/en/c/ostrich-al-falah), and [Filter Roastery](/en/c/filter-roastery-al-falah) are among the cards on this page today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Falah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Falah isn’t the stop, these north lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Falah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Falah on wain.lol — a Riyadh neighborhood list including Mood Masters, Ostrich, and Filter Roastery, each with a Maps link.",
  },
  "al-izdihar": {
    lead: `Al Izdihar (الازدهار) sits beside Al Mughrizat. This page is the Al Izdihar set on wain.lol so far.

[Slant Specialty Coffee](/en/c/slant-specialty-coffee-al-izdihar), [Steam Roastery](/en/c/steam-roastery-al-izdihar), [temper](/en/c/temper-al-izdihar), and [CONVOY](/en/c/convoy-coffee-al-izdihar) are among the local cafes on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from Al Izdihar on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Izdihar isn’t the stop, these lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Izdihar. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Izdihar on wain.lol — a Riyadh neighborhood list including Slant, Steam Roastery, and temper, each with a Maps link.",
  },
  "dhahrat-al-badiah": {
    lead: `Dhahrat Al Badiah (ظهرة البديعة) is a Riyadh neighborhood on wain.lol. This page is the Dhahrat Al Badiah set so far.

[WAY Coffee & Bakery](/en/c/way-coffee-dhahrat-al-badiah) is the cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Dhahrat Al Badiah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Dhahrat Al Badiah isn’t the stop, these are the closest lists on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Dhahrat Al Badiah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Dhahrat Al Badiah on wain.lol — a Riyadh neighborhood list including WAY Coffee & Bakery, with a Maps link.",
  },
  "umm-al-hamam-al-gharbi": {
    lead: `Umm Al Hamam Al Gharbi (أم الحمام الغربي) sits on the west side of central Riyadh. This page is the Umm Al Hamam Al Gharbi set on wain.lol so far.

[Bisat](/en/c/bisat-umm-al-hamam-al-gharbi) is the cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Umm Al Hamam Al Gharbi on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Umm Al Hamam Al Gharbi isn’t the stop, these west-central lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Umm Al Hamam Al Gharbi. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Umm Al Hamam Al Gharbi on wain.lol — a Riyadh neighborhood list including Bisat, with a Maps link.",
  },
  "an-nafal": {
    lead: `An Nafal (النفل) sits on the north side of Riyadh. This page is the An Nafal set on wain.lol so far.

[Bisat](/en/c/bisat-an-nafal), [ROASTREE](/en/c/roastree-an-nafal), [Black Stamp](/en/c/black-stamp-an-nafal), and [PEACOCK](/en/c/peacock-an-nafal) are among the local cafes on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from An Nafal on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If An Nafal isn’t the stop, these north lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like An Nafal. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in An Nafal on wain.lol — a north Riyadh list including Bisat, ROASTREE, and Black Stamp, each with a Maps link.",
  },
  "king-salman": {
    lead: `King Salman (الملك سلمان) is a north-central Riyadh حي. This page is the King Salman set on wain.lol so far.

[Rex](/en/c/rex-king-salman) and [Tul Cafe](/en/c/tul-cafe-king-salman) are the two cafes on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from King Salman on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If King Salman isn’t the stop, these north-central lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like King Salman. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in King Salman on wain.lol — a Riyadh neighborhood list including Rex and Tul Cafe, with a Maps link.",
  },
  "as-suwaidi": {
    lead: `As Suwaidi (السويدي) is a Riyadh neighborhood. This page is the As Suwaidi set on wain.lol so far.

[Alwaal Albari](/en/c/alwaal-albari-as-suwaidi), [Plant Cafe](/en/c/plant-cafe-as-suwaidi), [Seen Cafe](/en/c/seen-cafe-as-suwaidi), [Hot Sip](/en/c/hot-sip-as-suwaidi), [Era Coffee](/en/c/era-coffee-as-suwaidi), [Naham Specialty Coffee](/en/c/naham-specialty-as-suwaidi) and [Coffee Address](/en/c/coffee-address-as-suwaidi) are the local cafes on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There are **{count}** cafes from As Suwaidi on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If As Suwaidi isn’t the stop, these three lists are the closest on the site. Al Wisham is close too, but its only cafe is a drive-thru, so it isn’t listed here:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like As Suwaidi. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in As Suwaidi on wain.lol — a Riyadh neighborhood list including Alwaal Albari and Era Coffee, with Maps links.",
  },
  "as-suwaidi-al-gharbi": {
    lead: `As Suwaidi Al Gharbi (السويدي الغربي) sits on the southwest side of Riyadh. This page is the As Suwaidi Al Gharbi set on wain.lol so far.

[Tul Cafe](/en/c/tul-cafe-as-suwaidi-al-gharbi) is the cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from As Suwaidi Al Gharbi on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If As Suwaidi Al Gharbi isn’t the stop, these southwest lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like As Suwaidi Al Gharbi. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in As Suwaidi Al Gharbi on wain.lol — a Riyadh neighborhood list including Tul Cafe, with a Maps link.",
  },
  "ash-shifa": {
    lead: `Ash Shifa (الشفا) sits on the south side of Riyadh. This page is the Ash Shifa set on wain.lol so far.

[Tul Cafe](/en/c/tul-cafe-ash-shifa) is the cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Ash Shifa on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Ash Shifa isn’t the stop, these south lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Ash Shifa. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Ash Shifa on wain.lol — a Riyadh neighborhood list including Tul Cafe, with a Maps link.",
  },
  "al-qadisiyah": {
    lead: `Al Qadisiyah (القادسية) sits on the east side of Riyadh. This page is the Al Qadisiyah set on wain.lol so far.

[ON OFF Coffee](/en/c/on-off-coffee-al-qadisiyah) is the cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Al Qadisiyah on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Al Qadisiyah isn’t the stop, these east-Riyadh lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Al Qadisiyah. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Al Qadisiyah on wain.lol — a Riyadh neighborhood list including ON OFF Coffee, with a Maps link.",
  },
  "dhahrat-laban": {
    lead: `Dhahrat Laban (ظهرة لبن) sits on the west side of Riyadh. This page is the Dhahrat Laban set on wain.lol so far.

[ON OFF Coffee](/en/c/on-off-coffee-dhahrat-laban) is the cafe on this list today. We don’t invent extras to fill the page.`,
    hereIntro: `There is **{count}** cafe from Dhahrat Laban on the catalog today:`,
    hereOutro: `Open the card, then **Take me there** for the pin. Hours stay on Google Maps.`,
    nearbyIntro: `If Dhahrat Laban isn’t the stop, these west lists sit next door on the site:`,
    about: `wain.lol is a small Riyadh coffee guide. Ask for three suggestions, or browse a neighborhood list like Dhahrat Laban. [About](/en/about).

Riyadh only for now. Missing a place? Send a Maps link from the site.`,
    meta: "{countCafe} in Dhahrat Laban on wain.lol — a Riyadh neighborhood list including ON OFF Coffee, with a Maps link.",
  },
};

const CNI_BLURBS: Record<string, string> = {
  "core-coffee-and-roastery-al-narjis": `**CORE COFFEE & ROASTERY** is on our list for An Narjis on the north side of Riyadh — same An Narjis page as CAF LAB and Repository. If you want another name from the same north-Riyadh list, the siblings are below.`,
  "caf-lab-al-narjis": `**CAF LAB** is one of the An Narjis places on wain.lol. If you’re already up north and you just want this shop, you’re in the right spot. Other An Narjis names on the catalog are linked underneath.`,
  "repository-coffee-roasters-al-narjis": `**Repository Coffee Roasters** is on the An Narjis catalog with the other north-Riyadh names — same list as Core and CAF LAB, its own card. The rest of the An Narjis list is linked below if you want to hop.`,
  "jazel-speciality-cafe-diriyah": `**Jazel speciality cafe** is on the Diriyah list on wain.lol — west of the usual north-Riyadh loop. Other Diriyah places we’ve added sit on the same neighborhood list if this one isn’t the stop.`,
  "qirat-al-yasmin": `**Qirat – Specialty Coffee** is one of the Al Yasmin cafes on wain.lol. If you’re browsing that north-Riyadh neighborhood next to Malqa and Narjis, this is the card. The other Yasmin names on the catalog are linked below — we don’t invent extras.`,
  "cred-al-mughrizat": `**CRED** is on the Al Mughrizat list on wain.lol — only the names we’ve actually added. We don’t pad it. If this card isn’t the stop, the other Al Mughrizat cafes on the catalog are linked below, and the district page has the whole set.`,
  "sulalat-coffee-ar-rabwah": `**Sulalat** is on the Ar Rabwah catalog — east of the Al Olaya–Wurud stretch, its own neighborhood page. Other Rabwah places on the catalog are linked below if you want a different name from the same list.`,
  "taim-specialty-coffee-as-sahafah": `**Taim Specialty Coffee** is on the As Sahafah list. The other Sahafah names we’ve added are linked underneath — short list, only what’s in the catalog. We don’t invent a longer Sahafah set.`,
  "archi-ghirnatah": `**Archi Granada** is on the Ghirnatah list — east Riyadh. Other Granada-area places on wain.lol are linked below if you want to stay on that side of the city.`,
  "serene-coffee-roastery": `**SERENE COFFEE ROASTERY** is on the Al Hamra list on wain.lol — the east-belt page. Catalog tags on the card: Roastery. Other الحمراء names sit underneath if this one isn’t the stop.`,
  "rimthan-coffee-al-hamra": `**Rimthan + Coffee** is one of the Al Hamra cafes on wain.lol. If you’re already on that east-Riyadh stretch and you want this card, you’re in the right spot. The rest of the Al Hamra catalog is linked below.`,
  "mind-break-al-hamra": `**Mind Break** is on the Al Hamra catalog — its own card on the الحمراء list. Other Al Hamra names we’ve added are linked underneath.`,
  "jather-al-hamra": `Al Hamra has **Jather** on the catalog. This is the card if you want that name from the east-belt list. Siblings from the same حي sit below — only what’s actually added.`,
  "harf-coffee-al-hamra": `**Harf coffee** is on the wain.lol list for Al Hamra in Riyadh. Same neighborhood page as Serene and Rimthan, its own pin. Hop the other الحمراء cards below if you want a different name.`,
  "zeila-al-hamra": `**Zeila** is on the Al Hamra list on wain.lol — east belt. The other Al Hamra places on the catalog are linked below.`,
  "cord-cafe-al-hamra": `**Cord Cafe** is on the Al Hamra list — a roastery card on that east-Riyadh page. Catalog tags on the card: Roastery. The rest of الحمراء is linked underneath.`,
  "drip-al-hamra": `This is the **Drip** page on wain.lol for Al Hamra. Other Al Hamra names on the catalog sit below if you want to stay in that حي.`,
  "coffee-address-al-hamra": `**Coffee Address** is on the Al Hamra catalog on wain.lol. If this east-belt name is the one you wanted, the card is here. We don’t invent extras; the other الحمراء shops we’ve added are linked below.`,
  "glint-al-hamra": `Al Hamra has **Glint** on our catalog. The card is here if you want the Maps pin from that neighborhood list. Other Al Hamra places on wain.lol are linked below.`,
  "silo-cafe-al-yarmouk": `**Silo Cafe** is on the Al Yarmuk list on wain.lol. Catalog tags on the card: Roastery. Other اليرموك names sit underneath if this one isn’t the stop.`,
  "nosound-al-yarmouk": `This is the **NOSOUND** page on wain.lol for Al Yarmuk. Other Al Yarmuk names on the catalog sit below if you want to stay in that حي.`,
  "obo-speciality-al-yarmouk": `**OBO Speciality Coffee** is on the Al Yarmuk catalog — its own east-Riyadh pin. Other اليرموك names we’ve added are linked underneath.`,
  "shafel-roastery-al-yarmouk": `**Shafel Coffee Roastery** is on the wain.lol list for Al Yarmuk in Riyadh. Catalog tags on the card: Roastery. Same neighborhood page as Silo and RATIO, its own pin. Hop the other اليرموك cards below if you want a different name.`,
  "coffee-address-al-yarmouk": `**Coffee Address** is on the Al Yarmuk catalog on wain.lol. This is the اليرموك pin. We don’t invent extras; the other Al Yarmuk shops we’ve added are linked below.`,
  "aleel-roastery-al-yarmouk": `Al Yarmuk has **Aleel Roastery** on the catalog. Catalog tags on the card: Roastery. This is the card if you want that name from the اليرموك list. Siblings from the same حي sit below.`,
  "bourbon-al-yarmouk": `**Bourbon Speciality Coffee** is one of the Al Yarmuk cafes on wain.lol. If you’re already out toward the Eastern Ring and you want this card, you’re in the right spot. The rest of the Al Yarmuk catalog is linked below.`,
  "ratio-speciality-al-yarmouk": `**RATIO Speciality Coffee** is on the Al Yarmuk list. The other Al Yarmuk places on the catalog are linked below.`,
  "coffee-zam-al-yarmouk": `**COFFEE ZAM** is on the wain.lol list for Al Yarmuk in Riyadh. Same neighborhood page as Silo and NOSOUND, its own pin. Hop the other اليرموك cards below if you want a different name.`,
  "nus-talqimah-al-yarmouk": `Al Yarmuk has **Nus Talqimah** on our catalog. The card is here if you want the Maps pin from that neighborhood list. Other Al Yarmuk places on wain.lol are linked below.`,
  "kapu-cafe-al-nahdah": `**Kapu Cafe** is on the An Nahdah list on wain.lol. Catalog tags on the card: Roastery. Other النهضة names sit underneath if this one isn’t the stop.`,
  "dahal-specialty-al-nahdah": `**Dahal Specialty Coffee** is on the An Nahdah catalog — its own النهضة pin. Other النهضة names we’ve added are linked underneath.`,
  "ghazala-cafe-al-nahdah": `This is the **Ghazala Cafe** page on wain.lol for An Nahdah. Other An Nahdah names on the catalog sit below if you want to stay in that حي.`,
  "shafel-roastery-al-nahdah": `**Shafel Coffee Roastery** is on the wain.lol list for An Nahdah in Riyadh. Catalog tags on the card: Roastery. Same neighborhood page as Kapu and Coffee Address, its own pin. Hop the other النهضة cards below if you want a different name.`,
  "half-ten-al-nahdah": `**Half Ten** is one of the An Nahdah cafes on wain.lol. If you’re already in النهضة and you want this card, you’re in the right spot. The rest of the An Nahdah catalog is linked below.`,
  "bon-ferro-al-nahdah": `An Nahdah has **Bon Ferro Specialty Coffee** on the catalog. This is the card if you want that name from the النهضة list. Siblings from the same حي sit below.`,
  "coffee-address-al-nahdah": `**Coffee Address** is on the An Nahdah catalog on wain.lol. This is the النهضة pin. We don’t invent extras; the other An Nahdah shops we’ve added are linked below.`,
  "chord-daily-coffee-al-nahdah": `**Chord Daily Coffee** is on the An Nahdah list. The other An Nahdah places on the catalog are linked below.`,
  "taco-cup-al-nahdah": `**TACO CUP** is on the wain.lol list for An Nahdah in Riyadh. Same neighborhood page as Kapu and Ghazala, its own pin. Hop the other النهضة cards below if you want a different name.`,
  "awj-cafe-al-nahdah": `An Nahdah has **Awj Cafe** on our catalog. The card is here if you want the Maps pin from that neighborhood list. Other An Nahdah places on wain.lol are linked below.`,
  "serb-specialty-al-munsiyah": `**Serb Specialty Coffee** is on the Al Munsiyah list on wain.lol. Other المونسية names sit underneath if this one isn’t the stop.`,
  "roasting-stages-al-munsiyah": `**Roasting Stages** is on the Al Munsiyah catalog — a roastery card on that east-Riyadh page. Catalog tags on the card: Roastery. Other المونسية names we’ve added are linked underneath.`,
  "eagle-coffee-al-munsiyah": `This is the **Eagle Coffee** page on wain.lol for Al Munsiyah. Other Al Munsiyah names on the catalog sit below if you want to stay in that حي.`,
  "najd-roastery-al-munsiyah": `**Najd Roastery** is on the wain.lol list for Al Munsiyah in Riyadh. Catalog tags on the card: Roastery. Same neighborhood page as Serb and Eagle, its own pin. Hop the other المونسية cards below if you want a different name.`,
  "cu-specialty-al-munsiyah": `**CU Specialty Coffee** is one of the Al Munsiyah cafes on wain.lol. If you’re already in المونسية and you want this card, you’re in the right spot. The rest of the Al Munsiyah catalog is linked below.`,
  "45-degrees-al-munsiyah": `Al Munsiyah has **45 Degrees Coffee** on the catalog. This is the card if you want that name from the المونسية list. Siblings from the same حي sit below.`,
  "true-side-al-munsiyah": `**TRUE SIDE** is on the Al Munsiyah list. The other Al Munsiyah places on the catalog are linked below.`,
  "coffee-address-al-munsiyah": `**Coffee Address** is on the Al Munsiyah catalog on wain.lol. This is the المونسية pin. We don’t invent extras; the other Al Munsiyah shops we’ve added are linked below.`,
  "das-mond-al-munsiyah": `Al Munsiyah has **Das Mond Café** on our catalog. The card is here if you want the Maps pin from that neighborhood list. Other Al Munsiyah places on wain.lol are linked below.`,
  "anotherside-cafe-al-munsiyah": `**ANOTHERSIDE Cafe** is on the Al Munsiyah list on wain.lol. Other المونسية names sit underneath if this one isn’t the stop.`,
  "voute-fot-al-naseem-sharqi": `**VOÛTE / Fot** is on the An Nasim Ash Sharqi list on wain.lol. Catalog tags on the card: Roastery. Other النسيم الشرقي names sit underneath if this one isn’t the stop.`,
  "jaro-cafe-al-naseem-sharqi": `**JARO Cafe** is on the An Nasim Ash Sharqi catalog — its own النسيم الشرقي pin. Other النسيم الشرقي names we’ve added are linked underneath.`,
  "tamper-speciality-al-naseem-sharqi": `This is the **Tamper Speciality Coffee** page on wain.lol for An Nasim Ash Sharqi. Other An Nasim Ash Sharqi names on the catalog sit below if you want to stay in that حي.`,
  "luxo-coffee-al-naseem-sharqi": `**LUXO Coffee** is on the wain.lol list for An Nasim Ash Sharqi in Riyadh. Same neighborhood page as VOÛTE and JARO, its own pin. Hop the other النسيم الشرقي cards below if you want a different name.`,
  "ma-specialty-al-naseem-sharqi": `**MA Specialty Coffee** is one of the An Nasim Ash Sharqi cafes on wain.lol. If you’re already in النسيم الشرقي and you want this card, you’re in the right spot. The rest of the An Nasim Ash Sharqi catalog is linked below.`,
  "get-up-coffee-al-naseem-sharqi": `An Nasim Ash Sharqi has **GET UP COFFEE** on the catalog. This is the النسيم الشرقي card. Siblings from the same حي sit below.`,
  "trivali-roaster-al-naseem-gharbi": `**Trivali Roaster** is on the An Nasim Al Gharbi list on wain.lol. Catalog tags on the card: Roastery. Other النسيم الغربي names sit underneath if this one isn’t the stop.`,
  "gusn-coffee-al-naseem-gharbi": `**Gusn Coffee (Al Naseem)** is on the An Nasim Al Gharbi catalog — its own النسيم الغربي pin. Other النسيم الغربي names we’ve added are linked underneath.`,
  "public-al-naseem-sharqi": `This is the **Public** page on wain.lol for An Nasim Ash Sharqi. Other An Nasim Ash Sharqi names on the catalog sit below if you want to stay in that حي.`,
  "be-such-al-naseem-gharbi": `**BE SUCH** is on the wain.lol list for An Nasim Al Gharbi in Riyadh. Same neighborhood page as Trivali and Gusn, its own pin. Hop the other النسيم الغربي cards below if you want a different name.`,
  "brew92-an-nada": `**Brew 92 - Al Nada** is on the An Nada list on wain.lol. Catalog tags on the card: Roastery. Other الندى names sit underneath if this one isn’t the stop — short list, only what’s added.`,
  "ashjar-cafe-ar-rabi": `**Ashjar cafe** is one of the Ar Rabi cafes on wain.lol. Same الربيع page as Piccolo, its own pin. Hop the other Ar Rabi card below if you want a different name.`,
  "jazean-diplomatic-quarter": `This is the **Jazean DQ** page on wain.lol for the Diplomatic Quarter. The الحي الدبلوماسي list is that card today. Full neighborhood page is linked below.`,
  "markab-king-fahd": `**Markab** is on the King Fahd District list on wain.lol — الملك فهد, not the Al Olaya district page. Coffee first. The rest of that حي sits below if another name lands.`,
  "hjeen-roaster-saudi-90s-ar-rabwah": `**Hjeen Roaster Saudi 90's** is on the Ar Rabwah list on wain.lol. Catalog tags on the card: Roastery. Other الربوة names sit underneath if this one isn’t the stop.`,
  "on-move-ar-rabwah": `**ON MOVE** is on the Ar Rabwah catalog — its own الربوة pin. Other الربوة names we’ve added are linked underneath.`,
  "claz-ar-rabwah": `This is the **CLAZ** page on wain.lol for Ar Rabwah. Other Ar Rabwah names on the catalog sit below if you want to stay in that حي.`,
  "coffee-address-ar-rabwah": `**Coffee Address (Ar Rabwah)** is on the Ar Rabwah catalog on wain.lol. This card is the MQR6 pin (24.6909538, 46.7602769). Other الربوة names we’ve added are linked below.`,
  "coffee-address-ar-rabwah-ihsaa": `**Coffee Address (Al Ihsaa / Rabwah)** is on the Ar Rabwah catalog on wain.lol. This card is the Al Ihsaa pin (24.6941875, 46.7323125). Other الربوة names we’ve added are linked below.`,
  "somatcha-ar-rabwah": `**SoMatcha** is on the Ar Rabwah list. The other الربوة places on the catalog are linked below.`,
  "jaam-coffee-ar-rabwah": `**Jaam Coffee** is on the wain.lol list for Ar Rabwah in Riyadh. Same neighborhood page as Hjeen and CLAZ, its own pin. Hop the other الربوة cards below if you want a different name.`,
  "hello-cafe-olaya": `**Hello Cafe** is on the Al Olaya list on wain.lol. This is the العليا pin. Other Al Olaya names sit underneath if this one isn’t the stop.`,
  "booze-specialty-coffee-bar-al-mughrizat": `**Booze Specialty Coffee Bar** is specialty coffee on the Al Mughrizat list on wain.lol, inside Nakheel Mall. Other المغرزات cafes on the catalog are linked below.`,
};

const CAFE_OPENERS = [
  (name: string, district: string, city: string) =>
    `**${name}** is on the wain.lol list for ${district} in ${city}.`,
  (name: string, district: string) =>
    `If you’re looking up **${name}** in ${district}, this is the card we have on wain.lol.`,
  (name: string, district: string, city: string) =>
    `This is the **${name}** page on wain.lol — one of the ${district} places on the ${city} list.`,
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
  return listDirectoryShopsForDistrict(district);
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
  shops: { id: string; nameEn: string; isChain?: boolean | true }[],
): string {
  return shops
    .map((shop) => `- ${shop.isChain ? "{chain} " : ""}${cafeLink(shop.id, shop.nameEn)}`)
    .join("\n");
}

function nearbyListMarkdown(district: NeighborhoodId): string {
  const listed = new Set(listDirectoryShops().map((shop) => shop.neighborhood));
  return NEARBY_DISTRICTS[district]
    .filter((id) => listed.has(id) && id !== district)
    .map((id) => `- ${districtLink(id)}`)
    .join("\n");
}

function leadWithLiveTotal(lead: string, count: number): string {
  const word = countWord(count);
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  const noun = count === 1 ? "cafe" : "cafes";
  return lead
    .replace(/The count is [a-z0-9]+/gi, `The count is ${word}`)
    .replace(
      /[a-z0-9]+ cafes? we['’]ve actually added/gi,
      `${word} ${noun} we’ve actually added`,
    )
    .replace(
      /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+) cafe added so far/gi,
      `${word} ${noun} added so far`,
    )
    .replace(
      /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+) cards\b/gi,
      (match) => `${match[0] === match[0]?.toUpperCase() ? cap : word} cards`,
    );
}

function fillCount(template: string, count: number): string {
  const word = countWord(count);
  return template
    .replaceAll("{countCafe}", countedCafesEnHead(count))
    .replaceAll("{count}", word)
    .replaceAll("{countWordCap}", word);
}

function chainBreakdownEn(local: number, chains: number): string {
  const parts = [localCafesEn(local), chainBranchesEn(chains)].filter(
    (part): part is string => part != null,
  );
  return parts.length ? ` — ${parts.join(", ")}` : "";
}

/** Chain district description, Open Graph, and Twitter. */
export function chainDistrictMetaEn(
  name: string,
  total: number,
  local: number,
  chains: number,
  at: "at" | "in" = "in",
): string {
  if (total <= 0) {
    return `No cafes ${at} ${name} on wain.lol yet — a Riyadh neighborhood list.`;
  }
  const head = countedCafesEnHead(total);
  if (local <= 0) {
    const maps = total === 1 ? "a Maps link" : "Maps links";
    const branches = chains === 1 ? "chain branch" : "chain branches";
    return `${head} ${at} ${name} on wain.lol — ${branches} only so far, with ${maps}.`;
  }
  return `${head} ${at} ${name} on wain.lol — local specialty plus chain branches, each with a Maps link.`;
}

/** Shown only when the district list includes at least one chain branch. */
export function chainDistrictHereIntroEn(
  name: string,
  total: number,
  local: number,
  chains: number,
): string {
  if (total <= 0) return `No cafes from ${name} on the catalog yet.`;
  const verb = total === 1 ? "is" : "are";
  const noun = total === 1 ? "cafe" : "cafes";
  const full = `There ${verb} **${countWord(total)}** ${noun} from ${name} on the catalog today${chainBreakdownEn(local, chains)}:`;
  if (local <= 0) return chainOnlyBlock(full);
  const localPhrase = localCafesEn(local) ?? countedCafesEn(local);
  const localWord = localPhrase.split(" ")[0] ?? localPhrase;
  const localRest = localPhrase.slice(localWord.length).trim();
  const localVerb = local === 1 ? "is" : "are";
  const localSentence = `There ${localVerb} **${localWord}** ${localRest} from ${name} on the catalog today:`;
  return `{chain-counts}${full}{/chain-counts}{local-counts}${localSentence}{/local-counts}`;
}

/** Nameless chain sentence. Appended after a handwritten local lead. */
export function chainDistrictLeadEn(
  name: string,
  total: number,
  local: number,
  chains: number,
): string {
  const full = `${countedCafesEn(total)}${chainBreakdownEn(local, chains)}`;
  if (local <= 0) return `This page is the ${name} catalog on wain.lol: ${full}.`;
  const localPhrase = localCafesEn(local) ?? countedCafesEn(local);
  return `This page is the ${name} catalog on wain.lol: {chain-counts}${full}{/chain-counts}{local-counts}${localPhrase}{/local-counts}.`;
}

function defaultDistrictCopy(district: NeighborhoodId): DistrictLead {
  const name = neighborhoodLabel(district, "en");
  const cityName = cityLabel(districtCity(district), "en");
  return {
    lead: `${name} is one of the ${cityName} neighborhoods on wain.lol. This page is the ${name} places we’ve added to the catalog so far.`,
    hereIntro: `There are **{count}** cafes from ${name} on the list right now:`,
    hereOutro: `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`,
    about: `wain.lol is a small ${cityName} coffee guide. Ask for three suggestions, or browse a neighborhood list. [About](/en/about).

${cityName} only for now. Missing a place you like? Send a Maps link from the site.`,
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

function lockedLocalLead(markdown: string, heading: string): string {
  const body = markdown.replace(/^#[^\n]*\n+/, "");
  const cut = body.indexOf(heading);
  return (cut === -1 ? body : body.slice(0, cut)).trim();
}

export function districtEnMeta(district: NeighborhoodId): string {
  const shops = shopsInDistrict(district);
  const chainCount = shops.filter((shop) => shop.isChain).length;
  const name = neighborhoodLabel(district, "en");
  if (chainCount > 0) {
    return chainDistrictMetaEn(
      name,
      shops.length,
      shops.length - chainCount,
      chainCount,
      district === "kkia" ? "at" : "in",
    );
  }
  if (shops.length === 0) {
    const at = district === "kkia" ? "at" : "in";
    return `No cafes ${at} ${name} on wain.lol yet — a Riyadh neighborhood list.`;
  }
  const locked = lockedDistrictCopy(district);
  if (locked) return locked.meta;
  const custom = DISTRICT_COPY[district];
  if (custom?.meta) return fillCount(custom.meta, shops.length);
  const count = shops.length;
  const maps = count === 1 ? "a Maps link" : "Maps links";
  return `${countedCafesEnHead(count)} in ${name} on wain.lol — a Riyadh neighborhood list, with ${maps}.`;
}

export function districtEnMarkdown(district: NeighborhoodId): string {
  const shops = shopsInDistrict(district);
  const count = shops.length;
  const chainCount = shops.filter((shop) => shop.isChain).length;
  const locked = lockedDistrictCopy(district);
  if (locked && chainCount === 0) return locked.markdown;

  const name = neighborhoodLabel(district, "en");
  const copy = DISTRICT_COPY[district] ?? defaultDistrictCopy(district);
  const local = count - chainCount;
  const chainSentence =
    chainCount > 0 ? chainDistrictLeadEn(name, count, local, chainCount) : "";
  const handwritten = locked
    ? lockedLocalLead(locked.markdown, "## What’s here")
    : DISTRICT_COPY[district]?.lead;
  const handwrittenLead =
    handwritten && !locked && local > 0
      ? leadWithLiveTotal(handwritten, local)
      : handwritten;
  const leadBody = handwrittenLead
    ? chainSentence
      ? `${handwrittenLead}\n\n${chainSentence}`
      : handwrittenLead
    : chainSentence || copy.lead;
  const lead = chainCount > 0 && local <= 0 ? chainOnlyBlock(leadBody) : leadBody;
  const hereHeading = "## What’s here";
  const hereDefault =
    count === 0
      ? `No cafes from ${name} on the catalog yet.`
      : count === 1
        ? `There is **${countWord(count)}** cafe from ${name} on the list right now:`
        : `There are **${countWord(count)}** cafes from ${name} on the list right now:`;
  const hereIntro =
    chainCount > 0
      ? chainDistrictHereIntroEn(name, count, count - chainCount, chainCount)
      : fillHereIntroEn(
          count === 0 ? hereDefault : (copy.hereIntro ?? hereDefault),
          count,
        );
  const hereOutroRaw =
    count === 0
      ? ""
      : copy.hereOutro ??
        `Open a card when one fits, then **Take me there** for the pin and hours on Google Maps.`;
  const hereOutro =
    chainCount > 0 && local <= 0 && hereOutroRaw
      ? chainOnlyBlock(hereOutroRaw)
      : hereOutroRaw;
  const nearbyIntro = copy.nearbyIntro ?? "";
  const nearby = nearbyListMarkdown(district);

  return `# Coffee shops in ${name}

${lead}

${hereHeading}

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
  const cityName = cityLabel(shop.city, "en");
  const opener = CAFE_OPENERS[variantIndex(shop.id, CAFE_OPENERS.length)];
  const vibe = vibeLabels(shop, "en").filter((label) => label !== "Outdoor");
  const vibeLine =
    vibe.length > 0 && vibe[0] !== "Coffee"
      ? ` Catalog tags on the card: ${vibe.join(", ")}.`
      : "";
  const linked = districtPageHidden(shop.neighborhood)
    ? ""
    : " If you want the rest of that neighborhood, the district page is linked below.";
  return `${opener(shop.nameEn, district, cityName)}${vibeLine}${linked}`;
}

function plainDistrictLabel(id: NeighborhoodId): string {
  return `Coffee shops in ${neighborhoodLabel(id, "en")}`;
}

function withoutNameListPitch(body: string): string {
  return body
    .replace(/\s*[^.]*\blinked below\b[^.]*\./gi, (sentence) =>
      /district page is linked below|full neighborhood page is linked below/i.test(sentence)
        ? sentence
        : "",
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function withoutDistrictLinkPitch(body: string): string {
  return body
    .replace(/\s*If you want the rest of that neighborhood, the district page is linked below\.?/g, "")
    .replace(/\s*Full neighborhood page is linked below\.?/g, "")
    .replace(/\s*The rest of the .+? list is linked below[^.]*\./g, "")
    .replace(/\s*[^.]*\blinked below\b[^.]*\./gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function cafeSiblingsMarkdown(shop: Shop): string {
  const siblings = siblingShops(shop);
  const hidden = districtPageHidden(shop.neighborhood);
  const page = hidden ? plainDistrictLabel(shop.neighborhood) : districtLink(shop.neighborhood);
  if (siblings.length === 0) {
    return `Full neighborhood page: ${page}.`;
  }
  const district = neighborhoodLabel(shop.neighborhood, "en");
  return `Others on the same ${district} list:

${shopListMarkdown(siblings)}

Full neighborhood page: ${page}.`;
}

export function cafeEnMarkdown(shop: Shop): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE.markdown;
  const hidden = districtPageHidden(shop.neighborhood);
  const raw = CNI_BLURBS[shop.id] ?? defaultCafeBlurb(shop);
  let body = raw;
  if (siblingShops(shop).length === 0) body = withoutNameListPitch(body);
  if (hidden) body = withoutDistrictLinkPitch(body);
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
