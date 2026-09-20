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

const bakedHeroes = cafeHeroesFile as Record<string, { src: string }[]>;
assert(Object.keys(bakedHeroes).length === 50, "50-shop hero set is complete");
for (const [id, photos] of Object.entries(bakedHeroes)) {
  assert(photos.length === 4, `${id} has 4 cached cafe-heroes`);
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
  heroSrcs({ id: "camel-step-al-aqiq", photoUrl: "/photos/x.jpg" }) === "/photos/x.jpg",
  "shops outside the 50-set still use catalog photoUrl only",
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
assert(!page.includes("BrandHomeLink"), "old thin header is gone");
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
for (const id of ["qamaria-hittin", "salam-cafe-al-malqa", "qirat-al-yasmin"]) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  assert(!shop.openingHours, `${id} keeps Status hidden — no invented hours`);
  assert(
    cafeDetailHoursStatus(shop, "en") === null,
    `${id} Status stays hidden`,
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
