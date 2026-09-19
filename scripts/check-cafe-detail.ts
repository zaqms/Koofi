/**
 * Approved cafe detail lock (Passport /c/[id], 19 Sep 2026).
 * Wain Paper language. Soft Places parked. Heart parked.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS,
  cafeDetailDescription,
  cafeDetailHeroPhotos,
  cafeDetailHoursStatus,
  neighborhoodCafesHeading,
} from "../lib/cafe-detail";
import { copy } from "../lib/copy";
import { listingLocationOrder } from "../lib/listing-location";
import { listingCardTags, MAX_LISTING_TAGS } from "../lib/listing-tags";
import { neighborhoodLabel } from "../lib/neighborhoods";
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

assert(copy.takeMeThere.ar === "ودّني هناك", "AR Maps CTA stays ودّني هناك");
assert(copy.takeMeThere.en === "Take me there", "EN Maps CTA");
assert(copy.listingShare.ar === "مشاركة", "AR Share is مشاركة");
assert(copy.listingShare.en === "Share", "EN Share");
assert(copy.detailSeeAll.ar === "عرض الكل", "AR See all is عرض الكل");
assert(copy.detailSeeAll.en === "See all", "EN See all");
assert(copy.detailStatus.ar === "الحالة", "AR status label");
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

assert(
  cafeDetailHeroPhotos({ id: "camel-step-hittin" }).length === 0,
  "no invented hero on other Camel Step rows",
);
assert(
  cafeDetailHeroPhotos({ id: "percent-arabica-hittin", photoUrl: "/photos/x.jpg" }).join(
    ",",
  ) === "/photos/x.jpg",
  "other shops still use catalog photoUrl only",
);
assert(
  cafeDetailHeroPhotos({ id: "camel-step-al-rahmaniyyah" }).join(",") ===
    CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS.join(","),
  "Rahmaniyyah Camel Step has the 3 sample hero slides",
);
assert(
  CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS.length === 3,
  "sample carousel is 1/3",
);
for (const src of CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS) {
  assert(src.startsWith("/cafe-heroes/camel-step-al-rahmaniyyah/"), `${src} is shop-scoped`);
  assert(existsSync(join("public", src.slice(1))), `${src} is on disk`);
}
assert(cafeDetailDescription({ id: "camel-step-al-rahmaniyyah" }) === null, "no AI description");
assert(
  cafeDetailHoursStatus({ id: "camel-step-al-rahmaniyyah", hours: "Open daily" }, "en") ===
    null,
  "catalog hours never become Open now",
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
assert(detail.includes('variant="detail"'), "primary row Share is the outline CTA");
assert(detail.includes('variant="hero"'), "hero Share is the square overlay");
assert(detail.includes("SHOW_DETAIL_FAVORITE"), "heart is flagged");
assert(detail.includes("{SHOW_DETAIL_FAVORITE ?"), "heart is not rendered while parked");
assert(detail.includes("size=\"listing\""), "floating logo uses listing treatment");
assert(detail.includes("start-1 -bottom-8"), "logo overlaps hero start edge");
assert(detail.includes("rounded-[8px]"), "overlay controls are rounded squares");
assert(detail.includes("rtl:scale-x-[-1]"), "back + chevron flip with RTL");
assert(detail.includes("copy.takeMeThere"), "Maps label is locked product copy");
assert(!detail.includes("خذني"), "do not use the mock’s خذني له");
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
assert(page.includes("bg-wain-paper"), "thin /c/[id] sits on Wain Paper");
assert(page.includes("visuallyHidden"), "SEO blurb stays off-screen");
assert(page.includes("listDirectoryShopsForDistrict"), "related is same-neighborhood catalog");
assert(!page.includes("BrandHomeLink"), "old thin header is gone");
assert(!page.includes("backToChat"), "old back-to-chat line is gone from the thin page");

const blurb = read("components/cafe-en-blurb.tsx");
assert(blurb.includes("sr-only"), "SEO body is visually hidden, not deleted");
assert(blurb.includes("cafeEnMarkdown"), "EN SEO markdown stays");
assert(blurb.includes("cafeArMarkdown"), "AR SEO markdown stays");

const thin = read("components/cafe-card.tsx");
assert(thin.includes("CafeDetail"), "thin /c/[id] uses the approved detail");
assert(thin.includes("CafeClaimFooter"), "claim footer stays below the identity card");
assert(thin.includes("SHOW_BEEN_HERE"), "Been here stays parked on the thin card");
assert(thin.includes("{SHOW_BEEN_HERE ?"), "Been here is not rendered while parked");
assert(!thin.includes("CafePresenceRow"), "thin no longer mounts the old action row");
assert(!thin.includes("DirectoryCard"), "thin /c/[id] is not the listing card");

const share = read("components/share-listing-button.tsx");
assert(share.includes('"hero"'), "hero share variant");
assert(share.includes('"detail"'), "detail share variant");
assert(share.includes("listingShare"), "detail share label stays مشاركة / Share");

const tonight = read("lib/tonight.ts");
assert(tonight.includes("SHOW_DETAIL_FAVORITE = false"), "favorite flag defaults false");

const helper = read("lib/cafe-detail.ts");
assert(helper.includes("photoUrl"), "other shops still read catalog photoUrl");
assert(helper.includes("camel-step-al-rahmaniyyah"), "sample heroes are this shop only");
assert(!helper.includes("camel-step-hittin"), "do not invent Hittin Camel Step photos");
assert(!helper.includes("logoUrl"), "logos are not stretched into the hero");
assert(!/Soft Places/i.test(helper), "Soft Places parked on helpers");
assert(!/\bween\b/i.test(helper), "never ween");
assert(!helper.includes("هيتين"), "never هيتين");

console.log("check-cafe-detail: ok");
