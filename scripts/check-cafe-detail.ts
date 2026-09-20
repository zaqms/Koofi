/**
 * Approved cafe detail lock (Passport /c/[id], 19 Sep 2026).
 * Wain Paper language. Soft Places parked. Heart parked.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import cafeHeroesFile from "../data/cafe-heroes.json";
import {
  CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS,
  cafeDetailDescription,
  cafeDetailHeroNeedsGoogleCredit,
  cafeDetailHeroPhotos,
  cafeDetailHoursStatus,
  neighborhoodCafesHeading,
} from "../lib/cafe-detail";
import { copy } from "../lib/copy";
import { listingLocationOrder } from "../lib/listing-location";
import { listingCardTags, MAX_LISTING_TAGS } from "../lib/listing-tags";
import { neighborhoodLabel } from "../lib/neighborhoods";
import { cafeArMarkdown } from "../lib/ar-content";
import { cafeEnMarkdown } from "../lib/en-content";
import { getShop } from "../lib/catalog";
import { PRODUCT_NAME } from "../lib/product";
import { SHOW_BEEN_HERE, SHOW_DETAIL_FAVORITE, SHOW_INVITE_CTA } from "../lib/tonight";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(PRODUCT_NAME === "wain.lol", "brand stays wain.lol");
assert(SHOW_BEEN_HERE === false, "Been here stays parked");
assert(SHOW_INVITE_CTA === false, "وين؟ stays parked");
assert(SHOW_DETAIL_FAVORITE === false, "hero heart stays parked");
assert(MAX_LISTING_TAGS === 2, "detail pills cap at 2");

assert(copy.takeMeThere.ar === "ودّني هناك", "Passport Maps CTA stays ودّني هناك");
assert(copy.takeMeThere.en === "Take me there", "Passport EN Maps CTA");
assert(copy.detailTakeMeThere.ar === "خذني له", "detail AR Maps CTA is خذني له");
assert(copy.detailTakeMeThere.en === "Take me there", "detail EN Maps CTA");
assert(copy.listingShare.ar === "مشاركة", "AR Share is مشاركة");
assert(copy.listingShare.en === "Share", "EN Share");
assert(copy.detailSeeAll.ar === "عرض الكل", "AR See all is عرض الكل");
assert(copy.detailSeeAll.en === "See all", "EN See all");
assert(copy.detailStatus.ar === "الحالة", "AR status label");
assert(copy.detailOpenNow.en === "Open now", "EN Open now");
assert(copy.detailOpenNow.ar === "مفتوح الآن", "AR Open now");
assert(copy.detailClosedNow.en === "Closed", "EN Closed");
assert(copy.detailClosedNow.ar === "مغلق", "AR Closed");
assert(copy.detailOpensAt.en === "Opens at", "EN Opens at");
assert(copy.detailOpensAt.ar === "يفتح الساعة", "AR Opens at");
assert(copy.detailPhotosGoogle.en === "Photos · Google", "EN photo credit is quiet Google");
assert(copy.detailPhotosGoogle.ar === "صور · Google", "AR photo credit is quiet Google");
assert(copy.detailHeroNext.en === "Next photo", "EN hero next");
assert(copy.detailHeroPrev.en === "Previous photo", "EN hero prev");
assert(copy.detailVibe.ar === "التصنيف", "AR vibe row is التصنيف");
assert(copy.neighborhood.ar === "الحي", "AR neighborhood label");

assert(
  neighborhoodCafesHeading("الرحمانية", "ar") === "قهاوي الرحمانية",
  "AR related heading is قهاوي {الحي}",
);
assert(
  neighborhoodCafesHeading("Al Rahmaniyyah", "en") === "Al Rahmaniyyah cafés",
  "EN related heading is {Neighborhood} cafés",
);
assert(
  neighborhoodLabel("hittin", "ar") === "حطين",
  "Hittin AR stays حطين, never هيتين",
);
assert(
  listingLocationOrder("en") === "distance-first",
  "EN identity is km · district",
);
assert(
  listingLocationOrder("ar") === "neighborhood-first",
  "AR identity is district · km",
);

const camel = {
  vibeTags: ["محمصة", "قهوة"],
  momentTags: ["roaster" as const, "qahwa" as const],
};
assert(
  listingCardTags(camel, "en").join(" · ") === "Roastery · Coffee",
  "Camel Step EN pills stay catalog Roastery · Coffee",
);
assert(
  listingCardTags(camel, "ar").join(" · ") === "محمصة · قهوة",
  "Camel Step AR pills stay catalog محمصة · قهوة",
);

function heroSrcs(shop: { id: string; photoUrl?: string }): string {
  return cafeDetailHeroPhotos(shop)
    .map((photo) => photo.src)
    .join(",");
}

const BATCH2_IDS = [
  "first-series-olaya",
  "drip-olaya",
  "tobys-estate-olaya",
  "hjeen-roaster-factory-al-yasmin",
  "ror-coffee-roasters-al-yasmin",
  "yamm-olaya",
  "brew-crew-sulimaniyah",
  "urth-caffe-tahlia-sulimaniyah",
  "sombrero-sulimaniyah",
  "seven-beans-sulimaniyah",
  "dear-you-sulimaniyah",
  "sand-clock-as-sulimaniyah",
  "carve-roastery-ar-rabwah",
  "yly-specialty-coffee-ar-rabwah",
  "get-up-coffee-ar-rabwah",
  "carve-coffee-bar-al-wurud",
  "eya-specialty-coffee-al-wurud",
  "the-gate-specialty-coffee-al-wurud",
  "y97-specialty-coffee-as-sahafah",
  "hakwah-speciality-coffee-as-sahafah",
  "12-cups-roastery-and-cafe-kafd",
  "coffee-planet-kafd",
  "hal-alkeif-kafd",
  "draft-cafe-kafd",
  "cafe-tale-kafd",
  "trieste-kafd",
  "archi-al-bujairi-diriyah",
  "archi-and-jax-diriyah",
  "kmr-diriyah",
  "malfa-coffee-house-diriyah",
  "offbrief-cafe-diriyah",
  "cosefan-diriyah",
  "khasib-al-bun-diriyah",
  "dips-plus-diriyah",
  "sirius-speciality-coffee-diriyah",
  "jazel-speciality-cafe-diriyah",
  "repository-coffee-roasters-al-narjis",
  "core-coffee-and-roastery-al-narjis",
  "hjeen-roaster-al-narjis",
  "kail-roastery-and-cafe-al-narjis",
  "volume-coffee-roasters-al-narjis",
  "elixir-bunn-al-narjis",
  "melex-specialty-coffee-al-narjis",
  "nosound-al-narjis",
  "aim-al-narjis",
  "archi-al-narjis",
  "caf-lab-al-narjis",
  "cred-al-mughrizat",
  "specialty-bean-ghirnatah",
  "mkth-ghirnatah",
] as const;

const BATCH3_IDS = [
  "bind-specialty-coffee-ghirnatah",
  "file-coffee-ghirnatah",
  "sanva-specialty-coffee-ghirnatah",
  "jae-specialty-coffee-ghirnatah",
  "moff-ghirnatah",
  "semi-specialty-cafe-ghirnatah",
  "camel-step-granada-business",
  "archi-ghirnatah",
  "blumen-al-safa",
  "hawaf-al-safa",
  "recaf-al-safa",
  "raslania-al-safa",
  "dyar-bakery-al-safa",
  "jazwa-specialty-coffee-ar-rabwah",
  "makhsousa-coffee-ar-rabwah",
  "blog-coffee-ar-rabwah",
  "enzo-coffee-ar-rabwah",
  "window-coffee-ar-rabwah",
  "b-cafe-ar-rabwah",
  "hai-coffee-roasters-al-rawdah",
  "coffeehood-qurtubah",
  "obo-qurtubah",
  "lattio-lounge-qurtubah",
  "n5-caffe-qurtubah",
  "cacti-roastery-qurtubah",
  "najd-roastery-qurtubah",
  "najd-alathiah-qurtubah",
  "klatch-qurtubah",
  "nosound-qurtubah",
  "vanilla-coffee-qurtubah",
  "mill-coffee-qurtubah",
  "cofen-qurtubah",
  "mud-speciality-coffee-an-nazhah",
  "wathba-an-nazhah",
  "moraq-cafe-an-nazhah",
  "november-coffee-an-nazhah",
  "elite-cup-roasters-an-nazhah",
  "belong-an-nazhah",
  "desired-coffee-an-nazhah",
  "cross-coffee-an-nazhah",
  "kraz-an-nazhah",
  "ghandoura-an-nazhah",
  "serene-coffee-roastery",
  "rimthan-coffee-al-hamra",
  "mind-break-al-hamra",
  "jather-al-hamra",
  "harf-coffee-al-hamra",
  "zeila-al-hamra",
  "cord-cafe-al-hamra",
  "drip-al-hamra",
] as const;

const BATCH4_IDS = [
  "coffee-address-al-hamra",
  "glint-al-hamra",
  "silo-cafe-al-yarmouk",
  "nosound-al-yarmouk",
  "obo-speciality-al-yarmouk",
  "shafel-roastery-al-yarmouk",
  "coffee-address-al-yarmouk",
  "aleel-roastery-al-yarmouk",
  "bourbon-al-yarmouk",
  "ratio-speciality-al-yarmouk",
  "coffee-zam-al-yarmouk",
  "nus-talqimah-al-yarmouk",
  "kapu-cafe-al-nahdah",
  "dahal-specialty-al-nahdah",
  "ghazala-cafe-al-nahdah",
  "shafel-roastery-al-nahdah",
  "half-ten-al-nahdah",
  "bon-ferro-al-nahdah",
  "coffee-address-al-nahdah",
  "chord-daily-coffee-al-nahdah",
  "taco-cup-al-nahdah",
  "awj-cafe-al-nahdah",
  "vase-coffee-al-manar",
  "recaf-al-manar",
  "kultura-al-rayyan",
  "da-nonna-al-rayyan",
  "amber-speciality-al-rayyan",
  "floated-al-rayyan",
  "sica-al-rayyan",
  "fabrica-de-cafe-al-rayyan",
  "78-specialty-coffee-al-rayyan",
  "the-it-al-rawabi",
  "essert-al-rawabi",
  "rukyah-al-fayha",
  "roof-coffee-al-fayha",
  "maqha-mahamasa-al-raqban",
  "on-al-rawdah",
  "steam-roastery-al-rawdah",
  "serb-specialty-al-munsiyah",
  "roasting-stages-al-munsiyah",
  "eagle-coffee-al-munsiyah",
  "najd-roastery-al-munsiyah",
  "cu-specialty-al-munsiyah",
  "45-degrees-al-munsiyah",
  "true-side-al-munsiyah",
  "coffee-address-al-munsiyah",
  "das-mond-al-munsiyah",
  "anotherside-cafe-al-munsiyah",
  "brew92-an-nada",
  "ashjar-cafe-ar-rabi",
] as const;

const BATCH4_MISSING_HOURS = [] as const;

const BATCH5_IDS = [
  "jazean-diplomatic-quarter",
  "markab-king-fahd",
  "kernel-al-takhassusi",
  "percent-arabica-the-zone-al-takhassusi",
  "idmi-nakheel-takhassusi",
  "groovy-al-takhassusi",
  "dust-and-verse-al-takhassusi",
  "somo-al-takhassusi",
  "glim-al-takhassusi",
  "sculpture-al-aqiq",
  "ashjar-cafe-al-aqiq",
  "shovel-al-aqiq",
  "out-of-line-al-aqiq",
  "camel-step-al-aqiq",
  "scarf-al-aqiq",
  "the-coffee-kingdom-al-aqiq",
  "file-coffee-al-aqiq",
  "kultura-al-ghadeer",
  "tad-coffee-al-ghadeer",
  "ulica-al-ghadeer",
  "drip-al-ghadeer",
  "blumen-al-ghadeer",
  "brsk-al-ghadeer",
  "drive-al-ghadeer",
  "ghandoura-al-ghadeer",
  "acres-al-arid",
  "kicksters-lab-al-arid",
  "shovel-al-arid",
  "archi-al-arid",
  "drive-al-arid",
  "roasting-house-al-arid",
  "coffee-address-al-arid",
  "shiro-al-arid",
  "cypress-al-qirawan",
  "3bean-al-qirawan",
  "ashjar-cafe-al-qirawan",
  "drip-al-qirawan",
  "coffee-side-al-qirawan",
  "caf-lab-al-qirawan",
  "drive-al-qirawan",
  "scout-coffee-al-qirawan",
  "white-roastery-al-wadi",
  "parole-cafe-al-wadi",
  "wama-coffee-al-wadi",
  "unique-drip-al-mohammadiyah",
  "hjeen-roasters-al-mohammadiyah",
  "hekaya-tale-al-mohammadiyah",
  "parka-coffee-al-muruj",
  "terra-cafe-al-muruj",
  "rabka-al-muruj",
  "lasani-cafe-al-malaz",
  "golden-pot-al-malaz",
  "walnut-wood-coffee-al-malaz",
  "hazzah-coffee-al-malaz",
  "canto-al-malaz",
  "house-of-matcha-al-mohammadiyah",
  "house-of-matcha-sulimaniyah",
  "somatcha-an-nada",
  "the-matcha-bar-olaya",
  "with-heart-diriyah",
  "kuro-sulimaniyah",
  "opinion-al-mathar",
  "opinion-hittin",
  "kultura-hittin",
  "kultura-al-malqa",
  "quokka-coffee-al-muruj",
  "quokka-coffee-ghirnatah",
  "iota-al-ghadeer",
  "some-coffee-bar-al-muruj",
  "remis-matcha-club-hittin",
  "okawa-cafe-al-malqa",
  "re-matcha-al-hamra",
  "flow-matcha-at-taawun",
  "hokkaido-al-hamra",
  "happyland-matcha-diriyah",
  "24cafe-al-wadi",
  "24cafe-al-yasmin",
  "24cafe-al-rabi",
  "agrio-al-rabi",
  "camel-step-al-mursalat",
  "camel-step-diriyah",
  "coffee-address-al-malaz",
  "coffee-address-al-murabba",
  "coffee-address-al-muruj",
  "coffee-address-al-wadi",
  "coffee-address-al-rabi",
  "coffee-address-al-rabwah",
  "java-cafe-al-malaz",
  "java-cafe-al-manar",
  "java-cafe-al-muruj",
  "java-cafe-al-wadi",
  "java-cafe-al-rabi",
  "java-cafe-al-rawabi",
  "meeting-caffeine-al-rabi",
  "mezaj-al-malaz",
  "mezaj-maghrebi-al-wadi",
  "moroccan-taste-al-muruj",
  "n5-caffe-al-rabi",
  "n5-caffe-al-rabi-2",
  "sol-olas-al-ghadeer",
] as const;

const BATCH5_MISSING_HOURS = [
  "hekaya-tale-al-mohammadiyah",
  "opinion-al-mathar",
] as const;

const bakedHeroes = cafeHeroesFile as Record<string, { src: string }[]>;
const batch2HeroIds = BATCH2_IDS.filter((id) => bakedHeroes[id]);
const batch3HeroIds = BATCH3_IDS.filter((id) => bakedHeroes[id]);
const batch4HeroIds = BATCH4_IDS.filter((id) => bakedHeroes[id]);
const batch5HeroIds = BATCH5_IDS.filter((id) => bakedHeroes[id]);
assert(
  Object.keys(bakedHeroes).length ===
    50 +
      batch2HeroIds.length +
      batch3HeroIds.length +
      batch4HeroIds.length +
      batch5HeroIds.length,
  "batch 1–4 cafe-heroes stay; batch 5 merges in",
);
assert(batch2HeroIds.length === 50, "batch 2 50-shop hero set is complete");
assert(batch3HeroIds.length === 50, "batch 3 50-shop hero set is complete");
assert(batch4HeroIds.length === 50, "batch 4 50-shop hero set is complete");
assert(batch5HeroIds.length === 99, "batch 5 99-shop hero set is complete");
assert(bakedHeroes["wathba-an-nazhah"]?.length === 4, "Wathba uses the correct-pin cafe-heroes");
assert(bakedHeroes["mill-coffee-qurtubah"]?.length === 2, "mill-coffee-qurtubah keeps the 2 downloaded frames");
assert(bakedHeroes["first-series-olaya"]?.length === 4, "First Series pack 1 heroes");
assert(bakedHeroes["tobys-estate-olaya"]?.length === 4, "Toby's Estate pack 2–3 heroes");
assert(bakedHeroes["mkth-ghirnatah"]?.length === 4, "MKTH Ghirnatah pack 2–3 heroes");
assert(bakedHeroes["elixir-bunn-al-narjis"]?.length === 3, "elixir-bunn-al-narjis keeps the 3 downloaded frames");
assert(bakedHeroes["bind-specialty-coffee-ghirnatah"]?.length === 4, "BIND pack 1 heroes");
function expectedHeroCount(id: string): number {
  if (id === "elixir-bunn-al-narjis") return 3;
  if (id === "mill-coffee-qurtubah") return 2;
  if (id === "hokkaido-al-hamra") return 3;
  return 4;
}
for (const [id, photos] of Object.entries(bakedHeroes)) {
  const expected = expectedHeroCount(id);
  assert(photos.length === expected, `${id} has ${expected} cached cafe-heroes`);
  for (const photo of photos) {
    assert(photo.src.startsWith(`/cafe-heroes/${id}/`), `${photo.src} is shop-scoped`);
    assert(existsSync(join("public", photo.src.slice(1))), `${photo.src} is on disk`);
  }
}
assert(
  cafeDetailHeroPhotos({ id: "percent-arabica-hittin" }).length === 4,
  "pack 2–4 shops resolve baked cafe-heroes",
);
assert(
  cafeDetailHeroPhotos({ id: "camel-step-hittin" }).length === 4,
  "Hittin Camel Step uses baked cafe-heroes",
);
assert(
  heroSrcs({ id: "hekaya-tale-al-mohammadiyah", photoUrl: "/photos/x.jpg" }) ===
    "/photos/x.jpg",
  "shops without baked cafe-heroes still use catalog photoUrl only",
);
assert(
  heroSrcs({ id: "camel-step-al-rahmaniyyah" }) ===
    CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS.join(","),
  "Rahmaniyyah Camel Step uses baked cafe-heroes",
);
assert(
  CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS.length === 4,
  "Rahmaniyyah carousel is up to 4 cached photos",
);
for (const src of CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS) {
  assert(src.startsWith("/cafe-heroes/camel-step-al-rahmaniyyah/"), `${src} is shop-scoped`);
  assert(existsSync(join("public", src.slice(1))), `${src} is on disk`);
}
assert(
  cafeDetailHeroPhotos({ id: "camel-step-al-rahmaniyyah" })[0]?.attribution?.displayName,
  "Places author attribution stays in the bake data",
);
assert(
  cafeDetailHeroPhotos({ id: "woods-olaya" })[0]?.attribution?.displayName ===
    "Nawaf Saleh",
  "Woods Olaya bake still has the Places author name",
);
assert(
  cafeDetailHeroPhotos({ id: "camel-step-hittin" })[0]?.attribution?.displayName ===
    "Dr. Fahad AlShammari",
  "Hittin Camel Step bake still has the Places author name",
);
assert(
  cafeDetailHeroNeedsGoogleCredit(cafeDetailHeroPhotos({ id: "camel-step-al-rahmaniyyah" })),
  "baked Places photos still require a Google credit",
);
assert(
  !cafeDetailHeroNeedsGoogleCredit([{ src: "/photos/x.jpg" }]),
  "catalog photoUrl-only heroes have no invented credit",
);
assert(cafeDetailDescription({ id: "camel-step-al-rahmaniyyah" }) === null, "no AI description");
assert(
  cafeDetailHoursStatus({ id: "camel-step-al-rahmaniyyah", hours: "Open daily" }, "en") ===
    null,
  "catalog hours strings still never become Open now",
);

const detail = read("components/cafe-detail.tsx");
assert(detail.includes('data-cafe-detail=""'), "detail has a stable hook");
assert(detail.includes('dir={dir}'), "detail sets direction");
assert(detail.includes('language === "ar" ? "rtl" : "ltr"'), "true RTL");
assert(detail.includes("aspect-video"), "hero is ~16:9");
assert(detail.includes("rounded-[var(--radius-card)]"), "hero uses radius.card");
assert(detail.includes("bg-wain-paper"), "Wain Paper page");
assert(detail.includes("bg-wain-warm-cream"), "Warm Cream hero fallback + pills");
assert(detail.includes("border-wain-divider"), "Divider rows");
assert(detail.includes("listingCardTags"), "pills come from listing tags");
assert(detail.includes("listingLocationOrder"), "pin line is locale-aware");
assert(detail.includes("neighborhoodCafesHeading"), "related heading is district cafés");
assert(detail.includes("copy.detailSeeAll"), "See all / عرض الكل");
assert(detail.includes("districtPath"), "neighborhood row + See all use district route");
assert(detail.includes("shopMapsHref"), "Take me there opens existing Maps");
assert(detail.includes('source="card"'), "Maps hop stays the card source");
assert(detail.includes("ShareListingButton"), "share stays the listing packet");
assert(
  (detail.match(/<ShareListingButton/g) ?? []).length === 1,
  "one Share on the whole screen — hero only",
);
assert(!detail.includes('variant="detail"'), "no lower Share CTA next to Maps");
assert(detail.includes('variant="hero"'), "hero Share is the overlay control");
assert(!detail.includes("copy.switchLanguage"), "language switch stays off the hero");
assert(!detail.includes("data-language-switch"), "language switch stays off the identity card");
assert(detail.includes("SHOW_DETAIL_FAVORITE"), "heart is flagged");
assert(detail.includes("const parked = !SHOW_DETAIL_FAVORITE"), "heart stays parked without a real like");
assert(detail.includes("<CafeDetailFavorite"), "hero keeps the Favorite control");
assert(detail.includes("size=\"listing\""), "floating logo uses listing treatment");
assert(detail.includes("start-1 -bottom-8"), "logo overlaps hero start edge");
assert(detail.includes("rounded-full"), "hero overlays match the circular mock chrome");
assert(detail.includes("absolute bottom-3 end-3"), "1/N sits at the inline-end");
assert(detail.includes('<span dir="ltr">'), "1/N numerals stay LTR inside the pill");
assert(
  !/<p\b[^>]*\bend-3\b[^>]*\bdir="ltr"/.test(detail),
  "do not set dir=ltr on the positioned 1/N pill",
);
assert(detail.includes("rtl:scale-x-[-1]"), "back + chevron flip with RTL");
assert(detail.includes("copy.detailTakeMeThere"), "Maps label is the detail lock");
assert(detail.includes("w-full"), "Take me there is the single wide CTA");
assert(!detail.includes("copy.takeMeThere"), "Passport ودّني هناك stays off this page");
assert(!detail.includes("CafePresenceRow"), "detail replaces the old presence row");
assert(!detail.includes("DirectoryCard"), "detail is not the listing card");
assert(!detail.includes("CardBeen"), "Been here stays off the identity layout");
assert(!detail.includes("ownThisCafe"), "Own this cafe stays off the identity card");
assert(!detail.includes("listedOn"), "Listed on stays off the identity card");
assert(!detail.includes("iframe"), "no embedded map");
assert(!detail.includes("You might also like"), "no invented related heading");
assert(!detail.includes("shop.hours"), "catalog hours are not painted");
assert(!/Soft Places/i.test(detail), "Soft Places parked");
assert(!/\bween\b/i.test(detail), "never romanize وين as ween");
assert(!detail.includes("هيتين"), "never هيتين");
assert(!/koofi/i.test(detail), "detail must not say Koofi");
assert(!/Amjad|Ajz/i.test(detail), "detail must not name Amjad/Ajz");

const page = read("components/cafe-card-page.tsx");
assert(page.includes("bg-wain-paper"), "every /c/[id] sits on Wain Paper");
assert(!page.includes("bg-charcoal"), "no charcoal Passport chrome on public detail");
assert(!page.includes("passportPage"), "no dual public layouts");
assert(!page.includes("previewPassport"), "Woods preview does not open Passport");
assert(!page.includes("preferPassportUi"), "verified does not switch the public template");
assert(!page.includes("CafePassportCard"), "public page never mounts Passport");
assert(page.includes("<CafeEnBlurb"), "SEO essay stays in the main public flow");
assert(!page.includes("visuallyHidden"), "SEO essay is not forced off-screen");
assert(page.includes("listDirectoryShopsForDistrict"), "related is same-neighborhood catalog");
assert(page.includes("<header"), "language switch sits in a top header");
assert(page.includes("copy.switchLanguage[language]"), "header switcher is EN / عربي");
assert(page.includes('data-language-switch=""'), "header has a stable switcher hook");
assert(page.includes("href={localeHref}"), "header keeps locale switch on /c vs /en/c");
assert(
  page.indexOf("<header") < page.indexOf("<CafeCard"),
  "header sits above the card, not under the essay",
);
assert(!page.includes("BrandHomeLink"), "old thin wordmark header is gone");
assert(!page.includes("backToChat"), "old back-to-chat line is gone from the thin page");

const blurb = read("components/cafe-en-blurb.tsx");
assert(blurb.includes('data-cafe-seo-essay=""'), "visible SEO body has a stable hook");
assert(!blurb.includes("sr-only"), "SEO essay is not sr-only");
assert(!blurb.includes("visuallyHidden"), "SEO essay has no hidden prop");
assert(blurb.includes("cafeEnMarkdown"), "EN SEO markdown stays");
assert(blurb.includes("cafeArMarkdown"), "AR SEO markdown stays");
assert(blurb.includes("text-wain-soft-taupe"), "essay is quiet taupe under the rail");

const hittin = getShop("camel-step-hittin");
assert(hittin, "Hittin Camel Step is in the catalog");
const enEssay = cafeEnMarkdown(hittin);
const arEssay = cafeArMarkdown(hittin);
assert(
  enEssay.includes("Others on the same Hittin list:"),
  "EN essay keeps the same-district sibling list",
);
assert(enEssay.includes("/c/percent-arabica-hittin"), "EN sibling links are catalog shops");
assert(
  arEssay.includes("الباقي بنفس قائمة حطين:"),
  "AR essay keeps the same-district sibling list",
);
assert(arEssay.includes("/c/percent-arabica-hittin"), "AR sibling links are catalog shops");
const rahmaniyyah = getShop("camel-step-al-rahmaniyyah");
assert(rahmaniyyah, "Rahmaniyyah Camel Step is in the catalog");
assert(
  cafeEnMarkdown(rahmaniyyah).includes("/coffee-shops/al-rahmaniyyah"),
  "solo-district essay still links the neighborhood page",
);
assert(
  (rahmaniyyah.openingHours?.periods?.length ?? 0) > 0,
  "Rahmaniyyah has baked catalog periods",
);
assert(
  hittin.openingHours?.periods?.length === 1 &&
    hittin.openingHours.periods[0]?.open.day === 0 &&
    !("close" in (hittin.openingHours.periods[0] ?? {})),
  "Hittin Camel Step is baked 24h",
);
for (const id of [
  "qamaria-hittin",
  "salam-cafe-al-malqa",
  "qirat-al-yasmin",
  "sombrero-sulimaniyah",
  "coffee-planet-kafd",
  "kmr-diriyah",
  "malfa-coffee-house-diriyah",
]) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(!shop.openingHours, `${id} keeps Status hidden — no invented hours`);
  assert(
    cafeDetailHoursStatus(shop, "en") === null,
    `${id} Status stays hidden`,
  );
}

const firstSeries = getShop("first-series-olaya");
assert(firstSeries, "First Series Olaya is in the catalog");
assert(
  (firstSeries.openingHours?.periods?.length ?? 0) > 0,
  "First Series has baked catalog periods",
);
assert(
  cafeDetailHeroPhotos(firstSeries).length === 4,
  "First Series uses baked cafe-heroes",
);
assert(
  cafeDetailHeroNeedsGoogleCredit(cafeDetailHeroPhotos(firstSeries)),
  "batch 2 Places photos still require a Google credit",
);
const tobys = getShop("tobys-estate-olaya");
const mkth = getShop("mkth-ghirnatah");
assert(tobys && (tobys.openingHours?.periods?.length ?? 0) > 0, "Toby's has baked periods");
assert(mkth && (mkth.openingHours?.periods?.length ?? 0) > 0, "MKTH has baked periods");
assert(cafeDetailHeroPhotos(tobys).length === 4, "Toby's uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(mkth).length === 4, "MKTH uses baked cafe-heroes");

for (const id of BATCH3_IDS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(
    (shop.openingHours?.periods?.length ?? 0) > 0,
    `${id} has baked catalog periods — no invented hours omitted`,
  );
}
const bind = getShop("bind-specialty-coffee-ghirnatah");
const dripHamra = getShop("drip-al-hamra");
const wathba = getShop("wathba-an-nazhah");
assert(bind && (bind.openingHours?.periods?.length ?? 0) > 0, "BIND has baked periods");
assert(dripHamra && (dripHamra.openingHours?.periods?.length ?? 0) > 0, "Drip Al Hamra has baked periods");
assert(wathba && (wathba.openingHours?.periods?.length ?? 0) > 0, "Wathba has baked periods");
assert(
  wathba.placeId === "ChIJcZz_CAADLz4RfeFA9IJmOdM",
  "Wathba uses وثبة | قهوة مختصة - النزهة, not Alwathba Consulting",
);
assert(
  wathba.openingHours?.periods?.[0]?.open.hour === 6,
  "Wathba hours are the cafe pin (6 AM), not the consulting office",
);
assert(cafeDetailHeroPhotos(bind).length === 4, "BIND uses baked cafe-heroes");
assert(
  cafeDetailHeroNeedsGoogleCredit(cafeDetailHeroPhotos(bind)),
  "batch 3 Places photos still require a Google credit",
);
assert(
  cafeDetailHeroPhotos(bind)[0]?.attribution?.displayName === "zainb alshammri",
  "BIND bake still has the Places author name",
);
const fileCoffee = getShop("file-coffee-ghirnatah");
const sanva = getShop("sanva-specialty-coffee-ghirnatah");
const mill = getShop("mill-coffee-qurtubah");
assert(fileCoffee && cafeDetailHeroPhotos(fileCoffee).length === 4, "File Coffee uses baked cafe-heroes");
assert(sanva && cafeDetailHeroPhotos(sanva).length === 4, "Sanva uses baked cafe-heroes");
assert(mill && cafeDetailHeroPhotos(mill).length === 2, "Mill keeps the 2 downloaded frames");
assert(cafeDetailHeroPhotos(dripHamra).length === 4, "Drip Al Hamra uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(wathba).length === 4, "Wathba uses baked cafe-heroes");
assert(
  cafeDetailHeroPhotos(wathba)[0]?.attribution?.displayName ===
    "وثبة | قهوة مختصة - النزهة",
  "Wathba bake has the cafe Places author name",
);

const BATCH4_MISSING_HOUR_IDS = new Set<string>(BATCH4_MISSING_HOURS);
const BATCH4_HOURS_IDS = BATCH4_IDS.filter((id) => !BATCH4_MISSING_HOUR_IDS.has(id));
for (const id of BATCH4_HOURS_IDS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(
    (shop.openingHours?.periods?.length ?? 0) > 0,
    `${id} has baked catalog periods — no invented hours`,
  );
}
for (const id of BATCH4_MISSING_HOURS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(!shop.openingHours, `${id} keeps Status hidden — no invented hours`);
  assert(
    cafeDetailHoursStatus(shop, "en") === null,
    `${id} Status stays hidden`,
  );
}
const coffeeAddress = getShop("coffee-address-al-hamra");
const ashjar = getShop("ashjar-cafe-ar-rabi");
assert(coffeeAddress, "Coffee Address Al Hamra is in the catalog");
assert(
  (coffeeAddress.openingHours?.periods?.length ?? 0) > 0,
  "Coffee Address Al Hamra has baked periods",
);
assert(
  coffeeAddress.openingHours?.periods?.length === 1 &&
    coffeeAddress.openingHours.periods[0]?.open.day === 0 &&
    !("close" in (coffeeAddress.openingHours.periods[0] ?? {})),
  "Coffee Address Al Hamra is baked 24h",
);
assert(
  cafeDetailHeroPhotos(coffeeAddress).length === 4,
  "Coffee Address Al Hamra uses baked cafe-heroes",
);
assert(
  cafeDetailHeroNeedsGoogleCredit(cafeDetailHeroPhotos(coffeeAddress)),
  "batch 4 Places photos still require a Google credit",
);
assert(
  cafeDetailHeroPhotos(coffeeAddress)[0]?.attribution?.displayName === "Sk Ajeez",
  "Coffee Address Al Hamra bake still has the Places author name",
);
assert(ashjar && (ashjar.openingHours?.periods?.length ?? 0) > 0, "Ashjar has baked periods");
assert(cafeDetailHeroPhotos(ashjar).length === 4, "Ashjar uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("brew92-an-nada")!).length === 4, "Brew92 uses baked cafe-heroes");
assert(
  cafeDetailHeroPhotos(getShop("anotherside-cafe-al-munsiyah")!).length === 4,
  "Anotherside uses baked cafe-heroes",
);
assert(cafeDetailHeroPhotos(getShop("glint-al-hamra")!).length === 4, "Glint uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("silo-cafe-al-yarmouk")!).length === 4, "Silo uses baked cafe-heroes");
const theIt = getShop("the-it-al-rawabi");
assert(theIt, "THE IT is in the catalog");
assert(
  theIt.placeId === "ChIJ7UTZTQ0HLz4RHXt3m3J-4ME",
  "THE IT uses the coffee_shop pin, not Ar Rawabi neighborhood",
);
assert(
  (theIt.openingHours?.periods?.length ?? 0) === 7,
  "THE IT has cafe Maps periods",
);
assert(
  theIt.openingHours?.periods?.[0]?.open.hour === 6,
  "THE IT Sunday opens at 6 AM",
);
assert(
  theIt.openingHours?.periods?.[5]?.open.hour === 8,
  "THE IT Friday opens at 8 AM",
);
assert(
  cafeDetailHeroPhotos(theIt).length === 4,
  "THE IT uses cafe-pin cafe-heroes",
);
assert(
  cafeDetailHeroPhotos(theIt)[0]?.attribution?.displayName === "Khalid",
  "THE IT bake has the cafe Places author name",
);
assert(
  cafeDetailHoursStatus(theIt, "en", new Date("2026-09-20T15:00:00+03:00"))
    ?.kind === "open",
  "THE IT Sunday afternoon is Open now",
);
const theItAttrs = (
  JSON.parse(read("data/places-attrs-2026-09-19.json")) as {
    shops: { id: string; place_id?: string; place_name?: string }[];
  }
).shops.find((row) => row.id === "the-it-al-rawabi");
assert(
  theItAttrs?.place_id === "ChIJ7UTZTQ0HLz4RHXt3m3J-4ME" &&
    theItAttrs.place_name === "THE IT",
  "places-attrs THE IT uses the coffee_shop pin, not Ar Rawabi",
);
const theItScout = (
  JSON.parse(read("data/scout-manual-verdicts-2026-09-19.json")) as {
    id: string;
    place_id?: string;
    maps_url?: string;
    wrong_place_match?: boolean;
  }[]
).find((row) => row.id === "the-it-al-rawabi");
assert(
  theItScout?.place_id === "ChIJ7UTZTQ0HLz4RHXt3m3J-4ME" &&
    theItScout.wrong_place_match === false &&
    theItScout.maps_url?.includes("ChIJ7UTZTQ0HLz4RHXt3m3J-4ME"),
  "scout THE IT pin hotfix matches the coffee_shop place",
);
const mahmasa = getShop("maqha-mahamasa-al-raqban");
assert(mahmasa, "Maqha Mahamasa is in the catalog");
assert(
  mahmasa.placeId === "ChIJO6S1MwCpLz4RadufNTMpDCE",
  "Maqha Mahamasa uses مقهى ومحمصة حي Al Raqban, not GOAT Olaya",
);
assert(
  (mahmasa.openingHours?.periods?.length ?? 0) === 8,
  "Maqha Mahamasa has cafe Maps periods",
);
assert(
  mahmasa.openingHours?.periods?.[0]?.open.hour === 6,
  "Maqha Mahamasa Sunday opens at 6 AM",
);
assert(
  mahmasa.openingHours?.periods?.[5]?.open.hour === 7 &&
    mahmasa.openingHours?.periods?.[5]?.close?.hour === 11,
  "Maqha Mahamasa Friday morning period is 7–11:30 AM",
);
assert(
  cafeDetailHeroPhotos(mahmasa).length === 4,
  "Maqha Mahamasa uses cafe-pin cafe-heroes",
);
assert(
  cafeDetailHeroPhotos(mahmasa)[0]?.attribution?.displayName === "M A",
  "Maqha Mahamasa bake has the cafe Places author name",
);
assert(
  cafeDetailHoursStatus(mahmasa, "en", new Date("2026-09-20T15:00:00+03:00"))
    ?.kind === "open",
  "Maqha Mahamasa Sunday afternoon is Open now",
);
const mahmasaAttrs = (
  JSON.parse(read("data/places-attrs-2026-09-19.json")) as {
    shops: { id: string; place_id?: string; place_name?: string }[];
  }
).shops.find((row) => row.id === "maqha-mahamasa-al-raqban");
assert(
  mahmasaAttrs?.place_id === "ChIJO6S1MwCpLz4RadufNTMpDCE" &&
    mahmasaAttrs.place_name === "مقهى ومحمصة حي",
  "places-attrs Mahmasa uses the Al Raqban cafe pin, not GOAT Olaya",
);
for (const id of BATCH4_IDS) {
  assert(
    cafeDetailHeroPhotos(getShop(id)!).length === 4,
    `${id} uses 4 baked cafe-heroes`,
  );
}

const BATCH5_MISSING_HOUR_IDS = new Set<string>(BATCH5_MISSING_HOURS);
const BATCH5_HOURS_IDS = BATCH5_IDS.filter((id) => !BATCH5_MISSING_HOUR_IDS.has(id));
for (const id of BATCH5_HOURS_IDS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(
    (shop.openingHours?.periods?.length ?? 0) > 0,
    `${id} has baked catalog periods — no invented hours`,
  );
}
for (const id of BATCH5_MISSING_HOURS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(!shop.openingHours, `${id} keeps Status hidden — no invented hours`);
  assert(
    cafeDetailHoursStatus(shop, "en") === null,
    `${id} Status stays hidden`,
  );
}
const jazean = getShop("jazean-diplomatic-quarter");
const markab = getShop("markab-king-fahd");
const kernel = getShop("kernel-al-takhassusi");
const solOlas = getShop("sol-olas-al-ghadeer");
assert(jazean, "Jazean DQ is in the catalog");
assert(
  (jazean.openingHours?.periods?.length ?? 0) > 0,
  "Jazean DQ has baked periods",
);
assert(markab && (markab.openingHours?.periods?.length ?? 0) > 0, "Markab has baked periods");
assert(kernel && (kernel.openingHours?.periods?.length ?? 0) > 0, "Kernel has baked periods");
assert(solOlas && (solOlas.openingHours?.periods?.length ?? 0) > 0, "Sol Olas has baked periods");
assert(cafeDetailHeroPhotos(solOlas).length === 4, "Sol Olas uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("with-heart-diriyah")!).length === 4, "With Heart uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("white-roastery-al-wadi")!).length === 4, "White Roastery uses baked cafe-heroes");
assert(
  cafeDetailHeroPhotos(getShop("camel-step-al-aqiq")!).length === 4,
  "Al Aqiq Camel Step uses baked cafe-heroes",
);
assert(
  cafeDetailHeroNeedsGoogleCredit(cafeDetailHeroPhotos(getShop("camel-step-al-aqiq")!)),
  "batch 5 Places photos still require a Google credit",
);
assert(
  cafeDetailHeroPhotos(getShop("camel-step-al-aqiq")!)[0]?.attribution?.displayName ===
    "Nawaf Saleh",
  "Al Aqiq Camel Step bake still has the Places author name",
);
assert(cafeDetailHeroPhotos(getShop("24cafe-al-rabi")!).length === 4, "24Cafe Al Rabi uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("ashjar-cafe-al-aqiq")!).length === 4, "Ashjar Al Aqiq uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("camel-step-al-mursalat")!).length === 4, "Mursalat Camel Step uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("camel-step-diriyah")!).length === 4, "Diriyah Camel Step uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("file-coffee-al-aqiq")!).length === 4, "File Coffee Al Aqiq uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("dust-and-verse-al-takhassusi")!).length === 4, "Dust and Verse uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(jazean).length === 4, "Jazean DQ uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(kernel).length === 4, "Kernel uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("hokkaido-al-hamra")!).length === 3, "Hokkaido keeps the 3 downloaded frames");
assert(cafeDetailHeroPhotos(markab).length === 4, "Markab uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("n5-caffe-al-rabi")!).length === 4, "N5 Al Rabi uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("n5-caffe-al-rabi-2")!).length === 4, "N5 Al Rabi 2 uses baked cafe-heroes");
assert(cafeDetailHeroPhotos(getShop("opinion-al-mathar")!).length === 4, "Opinion Al Mathar uses baked cafe-heroes");
const opinionHittin = getShop("opinion-hittin");
assert(opinionHittin, "Opinion Hittin is in the catalog");
assert(
  opinionHittin.placeId === "ChIJed24-Q_jLj4Ry57c9ZIft5Q",
  "Opinion Hittin uses Opinion | اوبنيون, not Hittin district",
);
assert(
  opinionHittin.openingHours?.periods?.length === 1 &&
    opinionHittin.openingHours.periods[0]?.open.day === 0 &&
    !("close" in (opinionHittin.openingHours.periods[0] ?? {})),
  "Opinion Hittin is baked 24h",
);
assert(
  cafeDetailHoursStatus(opinionHittin, "en", new Date("2026-09-20T15:00:00+03:00"))
    ?.kind === "open",
  "Opinion Hittin Sunday afternoon is Open now",
);
assert(cafeDetailHeroPhotos(opinionHittin).length === 4, "Opinion Hittin uses baked cafe-heroes");
assert(
  cafeDetailHeroPhotos(opinionHittin)[0]?.attribution?.displayName === "Opinion | اوبنيون",
  "Opinion Hittin bake has the cafe Places author name",
);
assert(
  !bakedHeroes["hekaya-tale-al-mohammadiyah"],
  "Hekaya Tale keeps heroes hidden — no invented photos",
);
for (const id of batch5HeroIds) {
  assert(
    cafeDetailHeroPhotos(getShop(id)!).length === expectedHeroCount(id),
    `${id} uses ${expectedHeroCount(id)} baked cafe-heroes`,
  );
}

const wedOpen = new Date("2026-09-16T10:00:00+03:00");
const wedLate = new Date("2026-09-16T23:30:00+03:00");
const thuEarly = new Date("2026-09-17T05:00:00+03:00");
const friGap = new Date("2026-09-18T11:45:00+03:00");
assert(
  cafeDetailHoursStatus(rahmaniyyah, "en", wedOpen)?.kind === "open",
  "periods can show Open now",
);
assert(
  cafeDetailHoursStatus(rahmaniyyah, "en", wedOpen)?.label === "Open now",
  "EN Open now label",
);
assert(
  cafeDetailHoursStatus(rahmaniyyah, "ar", wedOpen)?.label === "مفتوح الآن",
  "AR Open now label",
);
assert(
  cafeDetailHoursStatus(rahmaniyyah, "en", wedLate)?.kind === "closed",
  "after last period today is Closed",
);
const thuOpens = cafeDetailHoursStatus(rahmaniyyah, "en", thuEarly);
assert(thuOpens?.kind === "opens", "later today is Opens at…");
assert(thuOpens?.label === "Opens at 6:30 AM", "EN Opens at 6:30 AM");
assert(
  cafeDetailHoursStatus(rahmaniyyah, "ar", thuEarly)?.label === "يفتح الساعة ٦:٣٠ ص",
  "AR Opens at uses Riyadh time",
);
const friOpens = cafeDetailHoursStatus(rahmaniyyah, "en", friGap);
assert(friOpens?.kind === "opens", "Friday gap uses the next period");
assert(friOpens?.label === "Opens at 12:15 PM", "EN Opens at 12:15 PM");
assert(
  cafeDetailHoursStatus(hittin, "en", wedLate)?.kind === "open",
  "24h catalog periods stay Open now",
);

const thin = read("components/cafe-card.tsx");
assert(thin.includes("CafeDetail"), "every /c/[id] uses the approved detail");
assert(!thin.includes("CafePassportCard"), "verified shops stay on CafeDetail");
assert(!thin.includes("preferPassportUi"), "claim status does not pick a second layout");
assert(!thin.includes("woodsPassportFixture"), "Woods fixture stays off the public card");
assert(thin.includes("CafeClaimFooter"), "claim footer stays for SEO / claim path");
assert(thin.includes("sr-only"), "Listed on / Own this cafe stay off the visible UI");
assert(thin.includes("SHOW_BEEN_HERE"), "Been here stays parked on the thin card");
assert(thin.includes("{SHOW_BEEN_HERE ?"), "Been here is not rendered while parked");
assert(!thin.includes("CafePresenceRow"), "thin no longer mounts the old action row");
assert(!thin.includes("DirectoryCard"), "thin /c/[id] is not the listing card");

const woods = getShop("woods-olaya");
assert(woods, "WOODS Olaya is in the catalog");
assert(
  cafeDetailHeroPhotos(woods).length === 4,
  "WOODS uses baked cafe-heroes, not Passport fixtures",
);
assert(
  (woods.openingHours?.periods?.length ?? 0) > 0,
  "WOODS keeps baked catalog periods",
);

const share = read("components/share-listing-button.tsx");
assert(share.includes('"hero"'), "hero share variant");
assert(!share.includes('"detail"'), "lower detail Share variant is gone");
assert(share.includes("listingShare"), "hero share label stays مشاركة / Share");
assert(!share.includes("rtl:scale-x-[-1]"), "share glyph does not flip in RTL");

const arPage = read("app/c/[id]/page.tsx");
const enPage = read("app/en/c/[id]/page.tsx");
assert(arPage.includes("cafePageMetadata"), "AR route keeps unique title+meta");
assert(enPage.includes("cafePageMetadata"), "EN route keeps unique title+meta");
assert(arPage.includes("shopJsonLd"), "AR route keeps Cafe JSON-LD");
assert(enPage.includes("shopJsonLd"), "EN route keeps Cafe JSON-LD");
assert(read("lib/cafe-metadata.ts").includes("pageAlternates"), "canonical + hreflang stay");

const tonight = read("lib/tonight.ts");
assert(tonight.includes("SHOW_DETAIL_FAVORITE = false"), "favorite flag defaults false");

const helper = read("lib/cafe-detail.ts");
assert(helper.includes("photoUrl"), "other shops still read catalog photoUrl");
assert(helper.includes("camel-step-al-rahmaniyyah"), "Rahmaniyyah heroes stay shop-scoped");
assert(helper.includes("Asia/Riyadh"), "Status clock is Asia/Riyadh");
assert(helper.includes("openingHours"), "Status reads baked catalog openingHours");
assert(helper.includes("periods"), "Status computes from periods");
assert(!helper.includes("logoUrl"), "logos are not stretched into the hero");
assert(!/Soft Places/i.test(helper), "Soft Places parked on helpers");
assert(!/\bween\b/i.test(helper), "never ween");
assert(!helper.includes("هيتين"), "never هيتين");
assert(!helper.includes("places.ts"), "no live Place Details on detail helpers");

assert(detail.includes("photo.src"), "hero paints cached photo src");
assert(detail.includes("cafeDetailHeroNeedsGoogleCredit"), "hero keeps a quiet Google credit");
assert(detail.includes("detailPhotosGoogle"), "visible credit is Photos · Google");
assert(detail.includes("sr-only"), "author names stay off the primary chrome");
assert(!detail.includes("maps.google.com/maps/contrib"), "no contrib-profile links in hero");
assert(!detail.includes("creditHref"), "author uri is not painted as a link");
assert(detail.includes("detailHeroNext"), "hero has a next control");
assert(detail.includes("detailHeroPrev"), "hero has a prev control");
assert(detail.includes("go(1)"), "tap/click advances the carousel");
assert(detail.includes("heroNavClass"), "hero chevrons are dedicated nav controls");
assert(detail.includes("cursor-pointer"), "multi-photo hero shows a click affordance");
assert(
  detail.includes('data-cafe-detail-hero-meta=""'),
  "credit and 1/N share a meta cluster",
);
assert(detail.includes("bottom-3 end-3"), "photo credit sits with the 1/N pill");
assert(
  !detail.includes("bottom-3 start-3"),
  "photo credit is not on the floating-logo edge",
);
assert(
  detail.includes("absolute start-1 -bottom-8"),
  "floating ShopVisual stays on the start edge",
);
assert(detail.includes("draggable={false}"), "hero img is not a native drag ghost");
assert(detail.includes("setPointerCapture"), "hero swipe captures the pointer");
assert(!detail.includes("shop.openingHours"), "raw openingHours are not painted");

console.log("check-cafe-detail: ok");
