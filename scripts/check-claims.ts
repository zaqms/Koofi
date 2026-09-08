import { readFileSync } from "node:fs";
import { parseOwnerPhone, whatsAppTo } from "../lib/claim-phone";
import { matchCatalogShopFromMapsUrl } from "../lib/claim-resolve";
import {
  emptyPassport,
  parsePassport,
  parseProofType,
  STUB_OTP_CODE,
} from "../lib/claims-types";
import { copy } from "../lib/copy";
import { ownerClaimPath, ownerPath, PRODUCT_NAME } from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(PRODUCT_NAME === "wain.lol", "brand is wain.lol");
assert(copy.listedOn.en === "Listed on wain.lol", "EN listed line");
assert(copy.listedOn.ar === "معروض على wain.lol", "AR listed line keeps Latin brand");
assert(copy.ownThisCafe.ar === "تملك المقهى؟", "Najdi own-this CTA");
assert(copy.ownThisCafe.en === "Own this cafe?", "EN own-this CTA");
assert(
  copy.ownerUnderReview.en === "Under review. We’ll verify your claim.",
  "EN under-review lock",
);
assert(copy.ownerUnderReview.ar.includes("تحت المراجعة"), "AR under-review spoken");
assert(copy.ownerUnderReview.ar.includes("بنتحقق"), "AR uses بنتحقق not MSA");
assert(ownerPath("ar") === "/owner", "AR owner path");
assert(ownerPath("en") === "/en/owner", "EN owner path");
assert(
  ownerClaimPath("woods-olaya", "ar") === "/owner?shop=woods-olaya",
  "card deep-link",
);
assert(
  ownerClaimPath("woods-olaya", "en") === "/en/owner?shop=woods-olaya",
  "EN card deep-link",
);

assert(parseOwnerPhone("0551234567") === "+966551234567", "05 local → E.164");
assert(parseOwnerPhone("+966551234567") === "+966551234567", "E.164 kept");
assert(parseOwnerPhone("966551234567") === "+966551234567", "966 without plus");
assert(parseOwnerPhone("551234567") === "+966551234567", "bare 9-digit 5…");
assert(parseOwnerPhone("not-a-phone") === undefined, "junk phone rejected");
assert(whatsAppTo("+966551234567") === "966551234567", "Cloud API to-field");

assert(parseProofType("cr") === "cr", "CR proof");
assert(parseProofType("storefront_photo") === "storefront_photo", "storefront fallback");
assert(parseProofType("voice") === undefined, "no voice notes");
assert(STUB_OTP_CODE === "000000", "marked stub OTP");

const passport = emptyPassport();
assert(Array.isArray(passport.photos) && passport.photos.length === 0, "empty photos[]");
assert(passport.brewingNote === "", "empty brewing/note");
assert(passport.hours === "", "empty hours");
assert(passport.thinOffer === "", "empty thin offer");
assert(parsePassport({ photos: ["x"], brewingNote: "y" }).photos[0] === "x", "passport parse");

const woodsUrl =
  "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03581602b92d:0x60ea07cc3fa5339d";
const woods = matchCatalogShopFromMapsUrl(woodsUrl);
assert(woods?.id === "woods-olaya", `woods hex should resolve, got ${woods?.id}`);
assert(
  !matchCatalogShopFromMapsUrl("https://www.google.com/maps/place/NotAListedCafe"),
  "unknown place is not invented",
);

const ownerFiles = [
  "components/owner-claim.tsx",
  "components/cafe-claim-footer.tsx",
  "app/owner/page.tsx",
  "app/en/owner/page.tsx",
  "lib/copy.ts",
];
for (const file of ownerFiles) {
  const source = readFileSync(file, "utf8");
  assert(!/koofi/i.test(source), `${file} must not say Koofi`);
  assert(!/Amjad|Ajz/i.test(source), `${file} must not name Amjad/Ajz`);
  assert(
    !/Maps is the last click/i.test(source),
    `${file} must not use parked Maps line`,
  );
  assert(!/web\.whatsapp\.com/i.test(source), `${file} must not use WhatsApp Web`);
}

const cafeCard = readFileSync("components/cafe-card.tsx", "utf8");
assert(cafeCard.includes("CafeClaimFooter"), "cafe card renders claim footer");
assert(!cafeCard.includes("DirectoryUpvote"), "cafe card still has no upvote");

const footer = readFileSync("components/cafe-claim-footer.tsx", "utf8");
assert(footer.includes("listedOn"), "footer has Listed on wain.lol");
assert(footer.includes("ownThisCafe"), "footer has Own this cafe?");
assert(footer.includes("ownerClaimPath"), "footer deep-links shop id");
assert(footer.includes('status === "none"'), "CTA hidden when not none");

const claims = readFileSync("lib/claims.ts", "utf8");
assert(claims.includes("CREATE TABLE IF NOT EXISTS shop_claims"), "ensure-on-first-use");
assert(claims.includes("emptyPassport"), "Passport scaffold on claim");
assert(claims.includes("pending"), "pending status");
assert(claims.includes("STUB_OTP_CODE"), "stub OTP when WA missing");
assert(claims.includes("sendWhatsAppText"), "Cloud API send, not WA Web");
assert(claims.includes("alertClaimSubmitted"), "ops alert on submit");
assert(!claims.includes("web.whatsapp.com"), "no WhatsApp Web");

const sql = readFileSync("sql/shop-claims.sql", "utf8");
assert(sql.includes("shop_id TEXT PRIMARY KEY"), "claims are per shop_id");
assert(sql.includes("pending"), "pending in SQL");
assert(sql.includes("verified"), "verified in SQL");
assert(sql.includes("cr"), "CR proof type");
assert(sql.includes("storefront_photo"), "storefront fallback");

const picker = readFileSync("lib/picker.ts", "utf8");
assert(!picker.includes("claim"), "Soft Places parked — picker untouched");

const ownerUi = readFileSync("components/owner-claim.tsx", "utf8");
assert(ownerUi.includes("ownerUnderReview"), "owner sees under review");
assert(ownerUi.includes("/api/claims/otp"), "OTP step exists");
assert(ownerUi.includes("storefront_photo"), "storefront fallback in UI");
assert(!ownerUi.includes("voice"), "no voice-note proof");
assert(ownerUi.includes("fromCard"), "deep-link skips pick/paste");
assert(ownerUi.includes("ownerConfirmed"), "deep-link shows confirmed cafe");
assert(ownerUi.includes("ownerLead"), "bare /owner still has pick/paste lead");
assert(
  ownerUi.includes("ownerClaimPath(selected.id, other)"),
  "locale switch keeps shop query",
);
assert(copy.ownerConfirmed.ar === "هالمقهى", "Najdi confirmed label");
assert(copy.ownerConfirmed.en === "This cafe", "EN confirmed label");

const ownerAr = readFileSync("app/owner/page.tsx", "utf8");
const ownerEn = readFileSync("app/en/owner/page.tsx", "utf8");
assert(ownerAr.includes("generateMetadata"), "AR owner title follows ?shop=");
assert(ownerEn.includes("generateMetadata"), "EN owner title follows ?shop=");
assert(ownerAr.includes("shopDisplayName"), "AR metadata uses cafe name");
assert(ownerEn.includes("shopDisplayName"), "EN metadata uses cafe name");

console.log("check-claims: ok");
