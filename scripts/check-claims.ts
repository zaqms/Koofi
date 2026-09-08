import { existsSync, readFileSync } from "node:fs";
import { parseOwnerPhone, whatsAppTo } from "../lib/claim-phone";
import {
  emptyPassport,
  parsePassport,
  parseProofType,
  STUB_OTP_CODE,
} from "../lib/claims-types";
import { copy } from "../lib/copy";
import {
  CONTACT_WHATSAPP_HREF,
  claimWhatsAppHref,
  claimWhatsAppText,
  ownerClaimPath,
  ownerPath,
  PRODUCT_NAME,
  publicCardUrl,
  shopClaimWhatsAppHref,
} from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(PRODUCT_NAME === "wain.lol", "brand is wain.lol");
assert(copy.listedOn.en === "Listed on wain.lol", "EN listed line");
assert(copy.listedOn.ar === "معروض على wain.lol", "AR listed line keeps Latin brand");
assert(copy.ownThisCafe.ar === "تملك المقهى؟", "Najdi own-this CTA");
assert(copy.ownThisCafe.en === "Own this cafe?", "EN own-this CTA");
assert(copy.ownerChatWhatsApp.en === "Chat on WhatsApp", "EN WhatsApp CTA");
assert(copy.ownerChatWhatsApp.ar === "كلّمنا على واتساب", "AR WhatsApp CTA");
assert(
  copy.ownerLead.en === "Continue the claim on WhatsApp.",
  "EN lead is WhatsApp chat",
);
assert(
  copy.ownerLead.ar === "كمّل المطالبة على واتساب.",
  "AR lead is WhatsApp chat",
);
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

assert(CONTACT_WHATSAPP_HREF === "https://wa.me/966570064331", "reuse Contact us wa.me");
assert(
  publicCardUrl("woods-olaya", "ar") === "https://wain.lol/c/woods-olaya",
  "AR public card URL",
);
assert(
  publicCardUrl("woods-olaya", "en") === "https://wain.lol/en/c/woods-olaya",
  "EN public card URL",
);

const woodsAr = claimWhatsAppText({
  language: "ar",
  shopName: "مقهى ومحمصة وودز",
  cardUrl: publicCardUrl("woods-olaya", "ar"),
});
const woodsEn = claimWhatsAppText({
  language: "en",
  shopName: "WOODS Cafe and Roastery",
  cardUrl: publicCardUrl("woods-olaya", "en"),
});
assert(
  woodsAr ===
    "أبي أطالب بمقهى مقهى ومحمصة وودز على wain.lol — https://wain.lol/c/woods-olaya",
  "AR shop prefill",
);
assert(
  woodsEn ===
    "I want to claim WOODS Cafe and Roastery on wain.lol — https://wain.lol/en/c/woods-olaya",
  "EN shop prefill",
);
assert(
  claimWhatsAppText({ language: "ar" }) === "أبي أطالب بمقهى على wain.lol",
  "AR generic prefill",
);
assert(
  claimWhatsAppText({ language: "en" }) === "I want to claim a cafe on wain.lol",
  "EN generic prefill",
);

const woodsHref = shopClaimWhatsAppHref(
  { id: "woods-olaya", nameAr: "مقهى ومحمصة وودز", nameEn: "WOODS Cafe and Roastery" },
  "ar",
);
assert(woodsHref.startsWith(`${CONTACT_WHATSAPP_HREF}?text=`), "claim wa.me uses Contact number");
assert(woodsHref.includes(encodeURIComponent(woodsAr)), "AR prefill is encoded");
assert(!woodsHref.includes("web.whatsapp.com"), "no WhatsApp Web");
assert(
  claimWhatsAppHref({ language: "en" }).startsWith(`${CONTACT_WHATSAPP_HREF}?text=`),
  "generic claim still uses Contact number",
);

assert(parseOwnerPhone("0551234567") === "+966551234567", "05 local → E.164");
assert(parseOwnerPhone("+966551234567") === "+966551234567", "E.164 kept");
assert(parseOwnerPhone("966551234567") === "+966551234567", "966 without plus");
assert(parseOwnerPhone("551234567") === "+966551234567", "bare 9-digit 5…");
assert(parseOwnerPhone("not-a-phone") === undefined, "junk phone rejected");
assert(whatsAppTo("+966551234567") === "966551234567", "Cloud API to-field");

assert(parseProofType("cr") === "cr", "CR proof");
assert(parseProofType("storefront_photo") === undefined, "storefront proof rejected");
assert(parseProofType("voice") === undefined, "no voice notes");
assert(STUB_OTP_CODE === "000000", "marked stub OTP");

const passport = emptyPassport();
assert(Array.isArray(passport.photos) && passport.photos.length === 0, "empty photos[]");
assert(passport.brewingNote === "", "empty brewing/note");
assert(passport.hours === "", "empty hours");
assert(passport.thinOffer === "", "empty thin offer");
assert(parsePassport({ photos: ["x"], brewingNote: "y" }).photos[0] === "x", "passport parse");

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
  assert(!/storefront/i.test(source), `${file} must not mention storefront`);
}

const cafeCard = readFileSync("components/cafe-card.tsx", "utf8");
assert(cafeCard.includes("CafeClaimFooter"), "thin cafe card renders claim footer");
assert(cafeCard.includes("CafePassportCard"), "verified shops switch to Passport");
assert(cafeCard.includes("preferPassportUi"), "Passport only when verified");

const footer = readFileSync("components/cafe-claim-footer.tsx", "utf8");
assert(footer.includes("listedOn"), "footer has Listed on wain.lol");
assert(footer.includes("ownThisCafe"), "footer has Own this cafe?");
assert(footer.includes("shopClaimWhatsAppHref"), "footer is wa.me with shop prefill");
assert(!footer.includes("ownerClaimPath"), "footer no longer routes through /owner");
assert(footer.includes('status === "none"'), "CTA hidden when not none");
assert(!footer.includes("966570064331"), "footer source does not hardcode digits");

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
assert(sql.includes("proof_type = 'cr'"), "CR-only proof type");
assert(!sql.includes("storefront_photo"), "SQL has no storefront fallback");

const picker = readFileSync("lib/picker.ts", "utf8");
assert(!picker.includes("claim"), "Soft Places parked — picker untouched");

const ownerUi = readFileSync("components/owner-claim.tsx", "utf8");
assert(ownerUi.includes("ownerChatWhatsApp"), "owner sees Chat on WhatsApp");
assert(ownerUi.includes("claimWhatsAppHref"), "bare /owner uses generic wa.me");
assert(ownerUi.includes("shopClaimWhatsAppHref"), "known shop uses shop prefill");
assert(!ownerUi.includes("/api/claims"), "visitors are not routed through claim APIs");
assert(!ownerUi.includes("otp"), "no OTP step in visitor UI");
assert(!ownerUi.includes("proof"), "no CR upload in visitor UI");
assert(!ownerUi.includes("storefront_photo"), "no storefront fallback in UI");
assert(!ownerUi.includes("ownerProofStorefront"), "no storefront radio copy");
assert(!ownerUi.includes("voice"), "no voice-note proof");
assert(!/Verified badge/i.test(ownerUi), "no Verified badge in visitor UI");
assert(!/Passport/i.test(ownerUi), "no Passport card UI");
assert(!/Verified badge/i.test(footer), "footer has no Verified badge");
assert(!ownerUi.includes("mapsUrl"), "no Maps paste state");
assert(!ownerUi.includes("/api/claims/resolve"), "no Maps resolve API");
assert(!/Google Maps|قوقل ماب|paste/i.test(ownerUi), "owner UI has no paste/Maps-link copy");
assert(!copy.ownerLead.en.toLowerCase().includes("paste"), "EN lead is not paste");
assert(!copy.ownerLead.ar.includes("ماب"), "AR lead is not Maps");
assert(
  !("ownerMapsPlaceholder" in copy) &&
    !("ownerResolve" in copy) &&
    !("ownerNeedPick" in copy),
  "Maps paste copy keys removed",
);
assert(
  ownerUi.includes("ownerClaimPath(shop.id, other)"),
  "locale switch keeps shop query",
);
assert(copy.ownerConfirmed.ar === "هالمقهى", "Najdi confirmed label");
assert(copy.ownerConfirmed.en === "This cafe", "EN confirmed label");
assert(!("ownerProofStorefront" in copy), "storefront copy key removed");
assert(!copy.ownerChatWhatsApp.en.includes("966"), "EN CTA has no digits");
assert(!copy.ownerChatWhatsApp.ar.includes("966"), "AR CTA has no digits");
assert(!copy.ownerLead.en.includes("966"), "EN lead has no digits");
assert(!copy.ownerLead.ar.includes("966"), "AR lead has no digits");
assert(!copy.ownThisCafe.en.includes("966"), "EN footer CTA has no digits");
assert(!copy.ownThisCafe.ar.includes("966"), "AR footer CTA has no digits");
assert(!claims.includes("storefront_photo"), "claims store has no storefront type");
assert(!claims.includes("storefront"), "claims store has no storefront path");

const ownerAr = readFileSync("app/owner/page.tsx", "utf8");
const ownerEn = readFileSync("app/en/owner/page.tsx", "utf8");
assert(ownerAr.includes("generateMetadata"), "AR owner title follows ?shop=");
assert(ownerEn.includes("generateMetadata"), "EN owner title follows ?shop=");
assert(ownerAr.includes("shopDisplayName"), "AR metadata uses cafe name");
assert(ownerEn.includes("shopDisplayName"), "EN metadata uses cafe name");
assert(!ownerAr.includes("ownerCatalogOptions"), "AR owner is not the catalog picker");
assert(!ownerEn.includes("ownerCatalogOptions"), "EN owner is not the catalog picker");
assert(!existsSync("app/api/claims/resolve/route.ts"), "Maps resolve route removed");
assert(!existsSync("lib/claim-resolve.ts"), "Maps claim-resolve helper removed");
assert(existsSync("app/api/claims/route.ts"), "claim status API stays parked");
assert(existsSync("app/api/claims/otp/route.ts"), "OTP API stays parked");
assert(existsSync("sql/shop-claims.sql"), "claim SQL stays parked");

console.log("check-claims: ok");
