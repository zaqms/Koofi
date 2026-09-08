import { existsSync, readFileSync } from "node:fs";
import {
  canApproveClaims,
  CLAIM_APPROVE_COOKIE,
  CLAIM_APPROVE_HEADER,
  readApproveToken,
  tokenEquals,
} from "../lib/claim-ops";
import { parseOwnerPhone, whatsAppTo } from "../lib/claim-phone";
import {
  emptyPassport,
  parseClaimReviewAction,
  parsePassport,
  parseProofType,
  STUB_OTP_CODE,
} from "../lib/claims-types";
import { copy } from "../lib/copy";
import { ENV_KEYS } from "../lib/env";
import { feedbackStorageKind } from "../lib/feedback";
import { listDirectoryShops } from "../lib/catalog";
import {
  listPendingClaims,
  publicClaimStatus,
  requestClaimOtp,
  reviewShopClaim,
  submitShopClaim,
} from "../lib/claims";
import { OPS_CLAIMS_PATH, ownerClaimPath, ownerPath, PRODUCT_NAME } from "../lib/product";

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
assert(ownerUi.includes("ownerUnderReview"), "owner sees under review");
assert(ownerUi.includes("/api/claims/otp"), "OTP step exists");
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

assert(OPS_CLAIMS_PATH === "/ops/claims", "ops path");
assert(ENV_KEYS.CLAIM_APPROVE_TOKEN === "CLAIM_APPROVE_TOKEN", "approve env key");
assert(parseClaimReviewAction("verify") === "verify", "verify action");
assert(parseClaimReviewAction("reject") === "reject", "reject action");
assert(parseClaimReviewAction("approved") === undefined, "no approved alias");
assert(CLAIM_APPROVE_COOKIE === "wain_claim_ops", "ops cookie name");
assert(CLAIM_APPROVE_HEADER === "x-claim-approve-token", "approve header");

const envExample = readFileSync(".env.example", "utf8");
assert(envExample.includes("CLAIM_APPROVE_TOKEN="), ".env.example documents token");

const readme = readFileSync("README.md", "utf8");
assert(readme.includes("CLAIM_APPROVE_TOKEN"), "README documents token");
assert(readme.includes("/ops/claims"), "README documents ops page");
assert(readme.includes('action":"verify"'), "README documents verify curl");
assert(readme.includes('action":"reject"'), "README documents reject curl");

assert(existsSync("app/api/claims/approve/route.ts"), "approve API exists");
assert(existsSync("app/api/claims/approve/session/route.ts"), "ops session exists");
assert(existsSync("app/ops/claims/page.tsx"), "ops page exists");
assert(existsSync("lib/claim-ops.ts"), "claim-ops helper exists");

const approveApi = readFileSync("app/api/claims/approve/route.ts", "utf8");
assert(approveApi.includes("canApproveClaims"), "approve API is token-gated");
assert(approveApi.includes("reviewShopClaim"), "approve API flips status");
assert(approveApi.includes("listPendingClaims"), "approve API lists pending");

const opsPage = readFileSync("app/ops/claims/page.tsx", "utf8");
assert(opsPage.includes("robots"), "ops page noindex");
assert(opsPage.includes("verify"), "ops page can verify");
assert(opsPage.includes("reject"), "ops page can reject");
assert(!/koofi/i.test(opsPage), "ops page must not say Koofi");
assert(!/Amjad|Ajz/i.test(opsPage), "ops page must not name people");
assert(
  !/Maps is the last click/i.test(opsPage),
  "ops page must not use parked Maps line",
);

const claimOps = readFileSync("lib/claim-ops.ts", "utf8");
assert(claimOps.includes("timingSafeEqual"), "token compare is timing-safe");
assert(claims.includes("listPendingClaims"), "store can list pending");
assert(claims.includes("reviewShopClaim"), "store can verify/reject");
assert(claims.includes("status = 'verified'"), "verify writes verified");

const noOpsLink = [
  "components/owner-claim.tsx",
  "components/cafe-claim-footer.tsx",
  "components/cafe-card.tsx",
  "components/site-footer.tsx",
  "app/owner/page.tsx",
  "app/en/owner/page.tsx",
];
for (const file of noOpsLink) {
  const source = readFileSync(file, "utf8");
  assert(!source.includes("/ops"), `${file} must not link ops`);
  assert(!source.includes("CLAIM_APPROVE"), `${file} must not mention approve token`);
}

const previous = process.env.CLAIM_APPROVE_TOKEN;
process.env.CLAIM_APPROVE_TOKEN = "check-claims-secret";
assert(tokenEquals("check-claims-secret"), "matching token");
assert(!tokenEquals("wrong-token-value"), "wrong token rejected");
assert(!tokenEquals(""), "empty token rejected");
const bearer = new Request("http://local/api/claims/approve", {
  headers: { Authorization: "Bearer check-claims-secret" },
});
assert(canApproveClaims(bearer), "Bearer authorize");
assert(readApproveToken(bearer) === "check-claims-secret", "Bearer parse");
const headerReq = new Request("http://local/api/claims/approve", {
  headers: { [CLAIM_APPROVE_HEADER]: "check-claims-secret" },
});
assert(canApproveClaims(headerReq), "header authorize");
const cookieReq = new Request("http://local/api/claims/approve", {
  headers: { cookie: `${CLAIM_APPROVE_COOKIE}=check-claims-secret` },
});
assert(canApproveClaims(cookieReq), "cookie authorize");
const missing = new Request("http://local/api/claims/approve");
assert(!canApproveClaims(missing), "missing token denied");
if (previous === undefined) delete process.env.CLAIM_APPROVE_TOKEN;
else process.env.CLAIM_APPROVE_TOKEN = previous;

async function checkMemoryReview(): Promise<void> {
  if (feedbackStorageKind() !== "memory") return;
  const shops = listDirectoryShops();
  const first = shops[0]?.id;
  const second = shops[1]?.id;
  assert(first && second && first !== second, "need two catalog shops");

  const phoneA = "0551234567";
  const phoneB = "0557654321";
  const otpA = await requestClaimOtp({ shopId: first, phone: phoneA });
  assert(otpA.ok, "otp A");
  const submitA = await submitShopClaim({
    shopId: first,
    phone: phoneA,
    code: STUB_OTP_CODE,
    proofType: "cr",
    proofName: "cr-a.jpg",
  });
  assert(submitA.ok && submitA.status === "pending", "submit A pending");

  const otpB = await requestClaimOtp({ shopId: second, phone: phoneB });
  assert(otpB.ok, "otp B");
  const submitB = await submitShopClaim({
    shopId: second,
    phone: phoneB,
    code: STUB_OTP_CODE,
    proofType: "cr",
    proofName: "cr-b.jpg",
  });
  assert(submitB.ok && submitB.status === "pending", "submit B pending");

  const listed = await listPendingClaims();
  assert(listed.ok, "list pending ok");
  assert(
    listed.claims.some((row) => row.shopId === first && row.ownerPhoneE164 === "+966551234567"),
    "list includes A phone",
  );
  assert(
    listed.claims.some((row) => row.shopId === second && row.proofAssetUrl?.includes("cr-b")),
    "list includes B proof",
  );

  const verified = await reviewShopClaim({ shopId: first, action: "verify" });
  assert(verified.ok && verified.status === "verified", "A verified");
  const pubA = await publicClaimStatus(first);
  assert(pubA.ok && pubA.status === "verified", "public A verified");
  const again = await reviewShopClaim({ shopId: first, action: "verify" });
  assert(!again.ok && again.error === "not_pending", "verified is not pending");

  const rejected = await reviewShopClaim({ shopId: second, action: "reject" });
  assert(rejected.ok && rejected.status === "none", "B rejected to none");
  const pubB = await publicClaimStatus(second);
  assert(pubB.ok && pubB.status === "none", "public B none");
}

void checkMemoryReview()
  .then(() => {
    console.log("check-claims: ok");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
