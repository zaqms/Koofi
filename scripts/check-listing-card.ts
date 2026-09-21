/**
 * Approved listing-card lock (Option 3 – With Tags, 19 Sep 2026).
 * One shared DirectoryCard, mirrored by dir. Soft Places stays parked.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { copy } from "../lib/copy";
import { listingLocationOrder } from "../lib/listing-location";
import { listingCardTags, MAX_LISTING_TAGS } from "../lib/listing-tags";
import { neighborhoodLabel } from "../lib/neighborhoods";
import { PRODUCT_NAME } from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(PRODUCT_NAME === "wain.lol", "brand stays wain.lol");
assert(MAX_LISTING_TAGS === 2, "listing pills cap at 2");

assert(listingLocationOrder("en") === "distance-first", "EN is km · district");
assert(
  listingLocationOrder("ar") === "neighborhood-first",
  "AR is district · km",
);

assert(
  neighborhoodLabel("hittin", "ar") === "حطين",
  "Hittin AR stays حطين, never هيتين",
);
assert(
  neighborhoodLabel("diplomatic-quarter", "ar") === "الحي الدبلوماسي",
  "DQ AR is the district registry name",
);
assert(
  neighborhoodLabel("diplomatic-quarter", "en") === "Diplomatic Quarter",
  "DQ EN is the district registry name",
);

const jazean = { vibeTags: ["قهوة"], momentTags: ["qahwa" as const] };
assert(
  listingCardTags(jazean, "en").join(",") === "Coffee",
  "qahwa vibe is Coffee, not a ranking title",
);
assert(
  listingCardTags(jazean, "ar").join(",") === "قهوة",
  "qahwa vibe AR stays قهوة",
);

const roaster = { vibeTags: ["محمصة"], momentTags: ["roaster" as const] };
assert(
  listingCardTags(roaster, "en").join(",") === "Roastery,Specialty coffee",
  "roaster fills the second pill from the specialty registry row",
);
assert(
  listingCardTags(roaster, "ar").join(",") === "محمصة,قهوة مختصة",
  "AR specialty pill is the locked registry label",
);

const twoVibe = {
  vibeTags: ["محمصة", "قهوة"],
  momentTags: ["roaster" as const, "qahwa" as const],
};
assert(
  listingCardTags(twoVibe, "en").length === 2,
  "two vibe tags stay at the cap",
);

assert(copy.listingMap.en === "Map", "listing Map label");
assert(copy.listingMap.ar === "الخريطة", "listing الخريطة label");
assert(copy.listingShare.en === "Share", "listing Share label");
assert(copy.listingShare.ar === "مشاركة", "listing مشاركة label");

const card = read("components/directory-card.tsx");
assert(card.includes("export function DirectoryCard"), "shared listing card");
assert(card.includes('data-listing-card=""'), "listing card has a stable hook");
assert(card.includes('dir={dir}'), "card sets document direction");
assert(card.includes('language === "ar" ? "rtl" : "ltr"'), "true RTL, not flipped LTR");
assert(card.includes("listingCardTags"), "pills come from listing tags helper");
assert(card.includes("listingLocationOrder"), "location order is locale-aware");
assert(card.includes("shopDistanceForVisitor"), "km uses the existing distance helper");
assert(card.includes("ShareListingButton"), "share stays the existing listing packet");
assert(card.includes("source={mapsSource}"), "Maps hop keeps pack vs list vs card");
assert(card.includes('source="list"'), "listing share stays the list packet");
assert(card.includes("MapsLink"), "Map opens cafe Maps");
assert(card.includes("ListingActionFace"), "Map + Share share square chrome");
assert(card.includes("rounded-[var(--radius-card)]"), "radius.card token");
assert(card.includes("bg-wain-paper"), "Wain Paper fill");
assert(card.includes("border-wain-divider"), "Divider border");
assert(!card.includes("DirectoryUpvote"), "no like on listing");
assert(!card.includes("VerifiedBadge"), "no معتمد on listing");
assert(!card.includes("cardLink"), "no Cafe card / بطاقة المكان chrome");
assert(!card.includes("chevron"), "no chevron");
assert(!card.includes("CardBeen"), "Been here stays off listing");
assert(!card.includes("SHOW_BEEN_HERE"), "Been here flag stays off listing");
assert(!card.includes("SHOW_INVITE_CTA"), "وين؟ stays off listing");
assert(!card.includes("inviteCta"), "no وين؟ copy on listing");
assert(!/Soft Places/i.test(card), "Soft Places parked");
assert(!/ween/i.test(card), "never romanize وين as ween");
assert(!card.includes("هيتين"), "never هيتين");
assert(!card.includes("meet-halfway"), "do not force Halfway copy into the shared card");
assert(card.includes("badge"), "optional Top Match stays a generic badge slot");

const tags = read("lib/listing-tags.ts");
assert(tags.includes("discoveryCategoryLabel"), "second pill can use the registry");
assert(tags.includes("vibeLabels"), "first pills are existing vibe tags");
assert(!/label:\s*["']Café/.test(tags), "do not invent a Café pill");
assert(!/["']مقهى["']/.test(tags), "do not invent a cafe-type Arabic pill");
assert(!/Soft Places/i.test(tags), "Soft Places parked on tags");

const visual = read("components/shop-visual.tsx");
assert(visual.includes('"listing"'), "listing logo size");
assert(visual.includes("bg-wain-warm-cream"), "listing logo sits on Warm Cream");
assert(visual.includes("p-1.5"), "listing logo has padding from the edge");

const share = read("components/share-listing-button.tsx");
assert(share.includes('"listing"'), "listing share variant");
assert(share.includes("listingShare"), "listing share label is مشاركة / Share");
assert(share.includes("ListingActionFace"), "listing share uses square chrome");

const action = read("components/listing-action.tsx");
assert(action.includes("rounded-[10px]"), "actions are rounded squares, not circles");
assert(!action.includes("rounded-full"), "actions are not pills");

const directory = read("components/shop-directory.tsx");
assert(directory.includes("DirectoryCard"), "home / chip / district lists share DirectoryCard");

const week = read("components/new-this-week.tsx");
assert(week.includes("DirectoryCard"), "New this week uses the same listing card");

const halfway = read("components/meet-halfway-result-cards.tsx");
assert(halfway.includes("DirectoryCard"), "بيننا results use the shared listing card");
assert(halfway.includes("directoryShopFromPick"), "بيننا maps picks onto DirectoryShop");
assert(halfway.includes("meetHalfwayBestMatch"), "first بيننا card may show Top Match");
assert(!halfway.includes("ChevronIcon"), "بيننا listing has no arrows");
assert(!halfway.includes("cardLink"), "بيننا listing has no بطاقة المكان");
assert(!halfway.includes("pick.why"), "بيننا listing has no AI blurb inside the card");

const pickList = read("components/pick-list.tsx");
assert(pickList.includes("DirectoryCard"), "chat three-picks use the shared listing card");
assert(pickList.includes("directoryShopFromPick"), "chat maps picks onto DirectoryShop");
assert(!pickList.includes("cardLink"), "chat listing has no بطاقة المكان");
assert(!pickList.includes("pick.why"), "chat listing has no AI blurb inside the card");

const adapter = read("lib/listing-shop.ts");
assert(
  adapter.includes("export function directoryShopFromPick"),
  "one pick → listing adapter, not per-surface cards",
);
assert(adapter.includes("vibeTags: pick.vibeTags"), "picks carry catalog vibe tags");
assert(adapter.includes("momentTags: pick.momentTags"), "picks carry catalog moment tags");

const chatPick = read("lib/chat-pick.ts");
assert(chatPick.includes("neighborhood: shop.neighborhood"), "ChatPick keeps district id");
assert(chatPick.includes("vibeTags: shop.vibeTags"), "ChatPick keeps vibe tags for listing pills");
assert(chatPick.includes("momentTags: shop.momentTags"), "ChatPick keeps moment tags for listing pills");

const passport = read("components/cafe-passport-card.tsx");
assert(!passport.includes("DirectoryCard"), "Passport chrome is not the listing card");

const thin = read("components/cafe-card.tsx");
assert(!thin.includes("DirectoryCard"), "thin /c/[id] card is not the listing card");
assert(thin.includes("SHOW_BEEN_HERE"), "Been here stays parked on the thin card");
assert(thin.includes("CafeDetail"), "thin /c/[id] uses the approved detail layout");
assert(!thin.includes("localeHref"), "language switch stays on the page header, not the card");

const cafeDetail = read("components/cafe-detail.tsx");
assert(!cafeDetail.includes("DirectoryCard"), "detail chrome is not the listing card");
assert(cafeDetail.includes("listingCardTags"), "detail pills reuse listing tags");
assert(cafeDetail.includes("size=\"listing\""), "detail logo uses listing treatment");

const home = read("components/home-landing.tsx");
const district = read("components/district-page.tsx");
assert(!home.includes("ShopUpvoteProvider"), "listing home does not mount like");
assert(!home.includes("ShopClaimProvider"), "listing home does not mount معتمد");
assert(!district.includes("ShopUpvoteProvider"), "district listing does not mount like");
assert(!district.includes("ShopClaimProvider"), "district listing does not mount معتمد");
assert(!/Soft Places/i.test(home), "Soft Places parked on home landing");
assert(district.includes("Soft Places stays parked"), "district Soft Places stay parked");

console.log("check-listing-card: ok");
