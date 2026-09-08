import { existsSync, readFileSync } from "node:fs";
import {
  emptyPassport,
  instagramHref,
  ownerPhoneHref,
  parsePassport,
  passportHasBrewing,
  passportHeroPhotos,
  preferPassportUi,
  publicPassport,
  safePassportPhoto,
} from "../lib/claims-types";
import { copy } from "../lib/copy";
import {
  allowPassportPreview,
  isPassportPreviewShop,
  PASSPORT_PREVIEW_SHOP_ID,
  shouldApplyPassportPreview,
  woodsPassportFixture,
} from "../lib/passport-preview";
import { PRODUCT_NAME } from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const prevEnv = process.env.VERCEL_ENV;

assert(PRODUCT_NAME === "wain.lol", "brand is wain.lol");
assert(PASSPORT_PREVIEW_SHOP_ID === "woods-olaya", "Woods is the preview shop");
assert(isPassportPreviewShop("woods-olaya"), "woods-olaya is preview shop");
assert(!isPassportPreviewShop("cafu-olaya"), "other shops are not the fixture");

process.env.VERCEL_ENV = "production";
assert(!allowPassportPreview(), "production never overlays fixture");
assert(
  !shouldApplyPassportPreview("woods-olaya", "none"),
  "production Woods none stays thin",
);
process.env.VERCEL_ENV = "preview";
assert(allowPassportPreview(), "preview may overlay fixture");
assert(
  shouldApplyPassportPreview("woods-olaya", "none"),
  "preview Woods none → Passport fixture",
);
assert(
  !shouldApplyPassportPreview("woods-olaya", "pending"),
  "pending stays thin even on preview",
);
assert(
  !shouldApplyPassportPreview("woods-olaya", "verified"),
  "real verified row is not replaced",
);
assert(
  !shouldApplyPassportPreview("cafu-olaya", "none"),
  "fixture is Woods only",
);
if (prevEnv === undefined) delete process.env.VERCEL_ENV;
else process.env.VERCEL_ENV = prevEnv;

const ar = woodsPassportFixture("ar");
const en = woodsPassportFixture("en");
assert(ar.hours === "", "AR fixture never invents hours");
assert(en.hours === "", "EN fixture never invents hours");
assert(ar.phone === "" && en.phone === "", "fixture has no invented phone");
assert(ar.instagram === "" && en.instagram === "", "fixture has no invented IG");
assert(ar.photos.length === 3 && en.photos.length === 3, "fixture has 3 hero frames");
assert(
  passportHeroPhotos(ar, { logoUrl: "/logos/woods-olaya.jpg" }).length === 3,
  "Woods fixture carousel is 1/3, not logo-only",
);
assert(
  ar.photos.every((src) => src.startsWith("/passport/woods-olaya-")),
  "fixture heroes are local preview assets",
);
assert(existsSync("public/passport/woods-olaya-1.jpg"), "hero 1 on disk");
assert(existsSync("public/passport/woods-olaya-2.jpg"), "hero 2 on disk");
assert(existsSync("public/passport/woods-olaya-3.jpg"), "hero 3 on disk");
assert(passportHasBrewing(ar) && passportHasBrewing(en), "fixture has brewing");
assert(ar.brewingTitle.includes("يرقاجيفي"), "AR fixture coffee title");
assert(en.brewingTitle.includes("Yirgacheffe"), "EN fixture coffee title");

const empty = emptyPassport();
assert(empty.hours === "", "empty hours");
assert(!passportHasBrewing(empty), "empty has no brewing");
assert(preferPassportUi("verified"), "verified prefers Passport");
assert(!preferPassportUi("pending"), "pending stays thin");
assert(!preferPassportUi("none"), "unclaimed stays thin");

const parsed = parsePassport({
  photos: ["https://example.com/a.jpg", "javascript:alert(1)"],
  brewingNote: "V60",
  brewingTitle: "Kochere",
  hours: "  till 23:00  ",
});
assert(parsed.brewingNote === "V60", "parse brewingNote");
assert(parsed.brewingTitle === "Kochere", "parse brewingTitle");
const pub = publicPassport(parsed);
assert(pub.photos.length === 1, "unsafe photo dropped");
assert(pub.photos[0] === "https://example.com/a.jpg", "https photo kept");
assert(pub.hours === "till 23:00", "owner hours trimmed, not invented");
assert(safePassportPhoto("/logos/woods-olaya.jpg") === "/logos/woods-olaya.jpg", "local photo ok");
assert(safePassportPhoto("javascript:alert(1)") === null, "javascript photo rejected");
assert(instagramHref("@woods") === "https://www.instagram.com/woods/", "handle → IG");
assert(instagramHref("https://evil.example/") === null, "non-IG URL rejected");
assert(ownerPhoneHref("+966551234567") === "tel:+966551234567", "owner phone tel");
assert(ownerPhoneHref("not-a-phone") === null, "junk phone rejected");

assert(copy.verified.ar === "معتمد", "AR verified badge");
assert(copy.verified.en === "Verified", "EN verified badge");
assert(copy.takeMeThere.ar === "ودّني هناك", "AR Maps CTA");
assert(copy.takeMeThere.en === "Take me there", "EN Maps CTA");
assert(copy.passportBack.ar === "رجوع للشات", "AR hero back matches mock");
assert(copy.reviewsTab.ar === "تقييمات", "AR reviews tab");
assert(copy.reviewsTab.en === "Reviews", "EN reviews tab");
assert(copy.brewingTab.ar === "وش يصبّون", "AR brewing tab");
assert(!/Maps is the last click/i.test(copy.takeMeThere.en), "no parked Maps line");
assert(!/koofi/i.test(copy.verified.ar + copy.verified.en), "badge is not Koofi");
assert(!/koofi/i.test(copy.takeMeThere.ar + copy.takeMeThere.en), "CTA is not Koofi");

const files = [
  "components/cafe-card.tsx",
  "components/cafe-passport-card.tsx",
  "components/cafe-card-page.tsx",
  "components/verified-badge.tsx",
  "components/shop-claim-provider.tsx",
  "components/target-icon.tsx",
  "lib/passport-preview.ts",
  "lib/copy.ts",
];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  assert(!/koofi/i.test(source), `${file} must not say Koofi`);
  assert(
    !/Maps is the last click/i.test(source),
    `${file} must not use parked Maps line`,
  );
  assert(!/Amjad|Ajz/i.test(source), `${file} must not name Amjad/Ajz`);
}

const thin = readFileSync("components/cafe-card.tsx", "utf8");
assert(thin.includes("CafeClaimFooter"), "unclaimed keeps WhatsApp footer");
assert(thin.includes('previewPassport ? "verified"'), "preview can open Passport");
assert(thin.includes("woodsPassportFixture"), "locale fixture on preview");

const footer = readFileSync("components/cafe-claim-footer.tsx", "utf8");
assert(footer.includes("shopClaimWhatsAppHref"), "footer still wa.me");
assert(!footer.includes("966570064331"), "footer source does not hardcode digits");
assert(footer.includes('status === "none"'), "CTA hidden when not none");

const passportCard = readFileSync("components/cafe-passport-card.tsx", "utf8");
assert(passportCard.includes("DirectoryUpvote"), "Passport reuses shared ▲");
assert(passportCard.includes("takeMeThere"), "Passport Maps CTA");
assert(passportCard.includes("VerifiedBadge"), "Passport has Verified");
assert(passportCard.includes("reviewsTab"), "Passport has Reviews tab");
assert(passportCard.includes("cardNo"), "Passport has CARD N° chrome");
assert(passportCard.includes("photoIndex + 1"), "hero shows n/m");
assert(passportCard.includes("passport.hours"), "hours only from passport");
assert(!passportCard.includes("shop.hours"), "catalog hours are not shown");
assert(!passportCard.includes("ownThisCafe"), "verified has no claim CTA");
assert(!/ON TONIGHT/i.test(passportCard), "Soft Places badge parked");
assert(!/من الثلاث اللي الليلة/.test(passportCard), "AR Soft Places badge parked");

const list = readFileSync("components/directory-card.tsx", "utf8");
assert(list.includes("VerifiedBadge"), "list can show معتمد");
assert(list.includes("useShopClaim"), "list reads verified ids");

const page = readFileSync("components/cafe-card-page.tsx", "utf8");
assert(page.includes("ShopUpvoteProvider"), "card page wraps upvote provider");
assert(page.includes("allowPassportPreview"), "page gates fixture off production");

const claims = readFileSync("lib/claims.ts", "utf8");
assert(claims.includes("listPublicVerifiedIds"), "verified id list for badges");
assert(claims.includes("withPreviewPassport"), "preview overlay is explicit");
assert(!claims.includes("web.whatsapp.com"), "no WhatsApp Web");

const picker = readFileSync("lib/picker.ts", "utf8");
assert(!picker.includes("claim"), "Soft Places parked — picker untouched");
assert(!picker.includes("passport"), "picker does not read passport");

assert(existsSync("app/api/claims/route.ts"), "claim status API stays");
assert(existsSync("components/owner-claim.tsx"), "interim WhatsApp owner door stays");

const owner = readFileSync("components/owner-claim.tsx", "utf8");
assert(owner.includes("claimWhatsAppHref"), "owner WhatsApp path intact");
assert(!owner.includes("/api/claims"), "visitors still not routed through OTP");
assert(existsSync("app/owner/edit/page.tsx"), "owner edit page exists");
const ownerEdit = readFileSync("components/owner-edit.tsx", "utf8");
assert(ownerEdit.includes("ownerEditLocked"), "edit UI locks name/district/pin");
assert(ownerEdit.includes("/api/owner/photos"), "edit can upload photos");
assert(
  passportCard.includes("passportHeroPhotos"),
  "Passport carousel reads full photos[]",
);
assert(passportCard.includes("photoIndex + 1"), "carousel is 1/n");
assert(!passportCard.includes("photos[0]"), "hero is not first-photo-only");

console.log("check-passport: ok");
