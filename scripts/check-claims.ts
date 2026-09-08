import { existsSync, readFileSync } from "node:fs";
import { parseOwnerPhone, whatsAppTo } from "../lib/claim-phone";
import {
  emptyPassport,
  parsePassport,
  parseProofType,
  STUB_OTP_CODE,
} from "../lib/claims-types";
import { copy } from "../lib/copy";
import { ownerClaimPath, ownerPath, PRODUCT_NAME } from "../lib/product";
import {
  claimOtpLanguageCode,
  claimOtpTemplateComponents,
  claimOtpTemplateName,
  DEFAULT_WHATSAPP_OTP_TEMPLATE,
  mapGraphClaimOtpError,
} from "../lib/whatsapp";

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
assert(claims.includes("sendWhatsAppClaimOtp"), "Cloud API auth template, not WA Web");
assert(!claims.includes("sendWhatsAppText"), "claim OTP is not freeform text");
assert(!claims.includes("رمز wain.lol"), "no freeform OTP body");
assert(claims.includes("otp_send_failed"), "Graph send failure is an error");
assert(claims.includes("alertClaimSubmitted"), "ops alert on submit");
assert(!claims.includes("web.whatsapp.com"), "no WhatsApp Web");

const requestFn = claims.slice(claims.indexOf("export async function requestClaimOtp"));
const sendIdx = requestFn.indexOf("sendWhatsAppClaimOtp");
const insertIdx = requestFn.indexOf("INSERT INTO shop_claim_otp");
const memoryIdx = requestFn.indexOf("memoryOtps.set");
assert(
  sendIdx >= 0 && sendIdx < insertIdx && sendIdx < memoryIdx,
  "store OTP only after template send succeeds",
);

const wa = readFileSync("lib/whatsapp.ts", "utf8");
assert(wa.includes("wain_claim_otp"), "default auth template name");
assert(wa.includes("WHATSAPP_OTP_TEMPLATE"), "template name is overridable");
assert(wa.includes("graph.facebook.com/v21.0"), "Graph v21");
assert(wa.includes("sub_type"), "copy-code / URL OTP button component");
assert(wa.includes("wain_whatsapp_graph_error"), "Graph errors are logged");
assert(!wa.includes("web.whatsapp.com"), "no WhatsApp Web in Cloud API helper");

assert(DEFAULT_WHATSAPP_OTP_TEMPLATE === "wain_claim_otp", "default template name");
assert(claimOtpTemplateName() === "wain_claim_otp", "env default is wain_claim_otp");
assert(claimOtpLanguageCode("ar") === "ar", "AR owner flow uses ar");
assert(claimOtpLanguageCode("en") === "en", "EN owner flow uses en");
assert(claimOtpLanguageCode(undefined) === "ar", "missing language defaults to ar");
const components = claimOtpTemplateComponents("123456");
assert(components[0]?.type === "body", "body parameter is the code");
assert(
  JSON.stringify(components).includes("123456"),
  "body and copy-code button get the same code",
);
assert(
  (components[1] as { sub_type?: string } | undefined)?.sub_type === "url",
  "button is URL / copy-code OTP",
);
assert(
  mapGraphClaimOtpError({ ok: false, skipped: false, graphCode: 132001 }) ===
    "otp_template_not_ready",
  "132001 is template-not-ready",
);
assert(
  mapGraphClaimOtpError({ ok: false, skipped: false, graphCode: 132000 }) ===
    "otp_template_not_ready",
  "132000 is template-not-ready",
);
assert(
  mapGraphClaimOtpError({
    ok: false,
    skipped: false,
    graphCode: 10,
    graphMessage: "This WhatsApp business account does not have permission to create message template.",
  }) === "otp_account_not_ready",
  "permission Graph body is account-not-ready",
);
assert(
  mapGraphClaimOtpError({
    ok: false,
    skipped: false,
    graphCode: 190,
    graphMessage: "Invalid OAuth access token",
  }) === "otp_send_failed",
  "invalid token stays generic send-failed",
);

const envKeys = readFileSync("lib/env.ts", "utf8");
assert(envKeys.includes("WHATSAPP_OTP_TEMPLATE"), "env contract includes template name");
assert(envKeys.includes("CLAIM_OTP_DEV_STUB"), "env contract includes optional stub hatch");
const envExample = readFileSync(".env.example", "utf8");
assert(envExample.includes("WHATSAPP_OTP_TEMPLATE"), ".env.example lists template name");
assert(envExample.includes("CLAIM_OTP_DEV_STUB"), ".env.example lists optional stub hatch");
assert(claims.includes("CLAIM_OTP_DEV_STUB"), "dev stub is an explicit env path");
assert(claims.includes("mapGraphClaimOtpError"), "Graph codes map to owner errors");

const sql = readFileSync("sql/shop-claims.sql", "utf8");
assert(sql.includes("shop_id TEXT PRIMARY KEY"), "claims are per shop_id");
assert(sql.includes("pending"), "pending in SQL");
assert(sql.includes("verified"), "verified in SQL");
assert(sql.includes("proof_type = 'cr'"), "CR-only proof type");
assert(!sql.includes("storefront_photo"), "SQL has no storefront fallback");

const picker = readFileSync("lib/picker.ts", "utf8");
assert(!picker.includes("claim"), "Soft Places parked — picker untouched");

const ownerUi = readFileSync("components/owner-claim.tsx", "utf8");
assert(ownerUi.includes("ownerUnderReview"), "owner sees under review");
assert(ownerUi.includes("/api/claims/otp"), "OTP step exists");
assert(ownerUi.includes("otp_send_failed"), "UI surfaces Graph send failure");
assert(ownerUi.includes("otp_template_not_ready"), "UI surfaces missing template");
assert(ownerUi.includes("otp_account_not_ready"), "UI surfaces WABA permission");
assert(
  ownerUi.includes("{ shopId, phone, language }"),
  "OTP request sends owner UI language",
);

const otpRoute = readFileSync("app/api/claims/otp/route.ts", "utf8");
assert(otpRoute.includes("otp_send_failed"), "OTP route returns Graph send failure");
assert(otpRoute.includes("502"), "OTP send failure is 502");
assert(otpRoute.includes("language"), "OTP route accepts owner language");
assert(copy.ownerOtpSendFailed.ar.includes("واتساب"), "AR send-fail copy");
assert(
  copy.ownerOtpSendFailed.en.includes("WhatsApp"),
  "EN send-fail copy",
);
assert(
  copy.ownerOtpTemplateNotReady.en.includes("template"),
  "EN template-not-ready copy",
);
assert(
  copy.ownerOtpAccountNotReady.en.includes("verification"),
  "EN account-not-ready copy",
);
assert(!/koofi/i.test(copy.ownerOtpSendFailed.ar), "AR send-fail has no Koofi");
assert(!/koofi/i.test(copy.ownerOtpSendFailed.en), "EN send-fail has no Koofi");
assert(!ownerUi.includes("storefront_photo"), "no storefront fallback in UI");
assert(!ownerUi.includes("ownerProofStorefront"), "no storefront radio copy");
assert(ownerUi.includes("ownerProofHint"), "CR proof hint");
assert(ownerUi.includes('proofType: "cr"'), "submit always sends CR");
assert(!ownerUi.includes("voice"), "no voice-note proof");
assert(ownerUi.includes("fromCard"), "deep-link skips catalog pick");
assert(ownerUi.includes("ownerConfirmed"), "deep-link shows confirmed cafe");
assert(ownerUi.includes("ownerLead"), "bare /owner still has pick-from-list lead");
assert(!ownerUi.includes("mapsUrl"), "no Maps paste state");
assert(!ownerUi.includes("/api/claims/resolve"), "no Maps resolve API");
assert(!/Google Maps|قوقل ماب|paste/i.test(ownerUi), "owner UI has no paste/Maps-link copy");
assert(!copy.ownerLead.en.toLowerCase().includes("paste"), "EN lead is pick-only");
assert(!copy.ownerLead.ar.includes("ماب"), "AR lead is pick-only");
assert(copy.ownerLead.en === "Pick the cafe from the list.", "EN pick-only lead");
assert(copy.ownerLead.ar === "اختار المقهى من القائمة.", "AR pick-only lead");
assert(
  !("ownerMapsPlaceholder" in copy) &&
    !("ownerResolve" in copy) &&
    !("ownerNeedPick" in copy),
  "Maps paste copy keys removed",
);
assert(
  ownerUi.includes("ownerClaimPath(selected.id, other)"),
  "locale switch keeps shop query",
);
assert(copy.ownerConfirmed.ar === "هالمقهى", "Najdi confirmed label");
assert(copy.ownerConfirmed.en === "This cafe", "EN confirmed label");
assert(!("ownerProofStorefront" in copy), "storefront copy key removed");
assert(
  copy.ownerProofHint.en === "Upload a commercial registration (CR) photo.",
  "EN CR-only proof hint",
);
assert(copy.ownerProofHint.ar === "ارفع صورة السجل التجاري.", "AR CR-only proof hint");
assert(!/storefront|الواجهة|إذا ما تقدر|If you can/i.test(copy.ownerProofHint.en), "EN hint has no fallback");
assert(!copy.ownerProofHint.ar.includes("الواجهة"), "AR hint has no storefront");
assert(copy.ownerBadProof.en === "Upload a CR photo.", "EN bad proof is CR-only");
assert(copy.ownerBadProof.ar === "ارفع صورة السجل التجاري.", "AR bad proof is CR-only");
assert(!claims.includes("storefront_photo"), "claims store has no storefront type");
assert(!claims.includes("storefront"), "claims store has no storefront path");

const ownerAr = readFileSync("app/owner/page.tsx", "utf8");
const ownerEn = readFileSync("app/en/owner/page.tsx", "utf8");
assert(ownerAr.includes("generateMetadata"), "AR owner title follows ?shop=");
assert(ownerEn.includes("generateMetadata"), "EN owner title follows ?shop=");
assert(ownerAr.includes("shopDisplayName"), "AR metadata uses cafe name");
assert(ownerEn.includes("shopDisplayName"), "EN metadata uses cafe name");
assert(!existsSync("app/api/claims/resolve/route.ts"), "Maps resolve route removed");
assert(!existsSync("lib/claim-resolve.ts"), "Maps claim-resolve helper removed");

console.log("check-claims: ok");
