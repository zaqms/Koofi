import { existsSync, readFileSync } from "node:fs";
import {
  canApproveClaims,
  CLAIM_APPROVE_COOKIE,
  CLAIM_APPROVE_HEADER,
  readApproveToken,
} from "../lib/claim-ops";
import {
  grantVerifiedClaim,
  updateVerifiedPassport,
} from "../lib/claims";
import {
  emptyPassport,
  sanitizeOwnerPassport,
} from "../lib/claims-types";
import { copy, ownerEditErrorCopy } from "../lib/copy";
import { feedbackStorageKind } from "../lib/feedback";
import {
  hashOwnerToken,
  mintOwnerToken,
  OWNER_TOKEN_TTL_MS,
  revokeOwnerTokens,
  validateOwnerToken,
} from "../lib/owner-tokens";
import {
  OPS_CLAIMS_PATH,
  ownerEditPath,
  ownerPath,
  PRODUCT_NAME,
} from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(PRODUCT_NAME === "wain.lol", "brand is wain.lol");
assert(ownerPath("ar") === "/owner", "AR owner door stays");
assert(ownerPath("en") === "/en/owner", "EN owner door stays");
assert(
  ownerEditPath("cafu-olaya", "tok", "ar") ===
    "/owner/edit?shop=cafu-olaya&token=tok",
  "AR edit URL",
);
assert(
  ownerEditPath("cafu-olaya", "tok", "en") ===
    "/en/owner/edit?shop=cafu-olaya&token=tok",
  "EN edit URL",
);
assert(OPS_CLAIMS_PATH === "/ops/claims", "ops path");
assert(OWNER_TOKEN_TTL_MS === 7 * 24 * 60 * 60 * 1000, "7-day TTL");
assert(hashOwnerToken("a") !== "a", "tokens are hashed");
assert(hashOwnerToken("a") === hashOwnerToken("a"), "hash is stable");

assert(copy.ownerEditTitle.ar === "عدّل الباسبور", "AR edit title");
assert(copy.ownerEditTitle.en === "Edit Passport", "EN edit title");
assert(
  ownerEditErrorCopy("expired", "en").includes("expired"),
  "EN expired copy",
);
assert(
  ownerEditErrorCopy("expired", "ar").includes("انتهى"),
  "AR expired copy",
);
assert(
  ownerEditErrorCopy("wrong_shop", "en").includes("not for this cafe"),
  "EN wrong-shop copy",
);
assert(
  ownerEditErrorCopy("not_verified", "en").includes("not verified"),
  "EN not-verified copy",
);
assert(
  ownerEditErrorCopy("missing", "ar").includes("ناقص"),
  "AR missing copy",
);
assert(!/koofi/i.test(copy.ownerEditLead.ar + copy.ownerEditLead.en), "lead not Koofi");
assert(
  !copy.ownerEditHoursHint.en.toLowerCase().includes("invent") ||
    copy.ownerEditHoursHint.en.includes("will not invent"),
  "hours hint refuses invented hours",
);

const dirty = sanitizeOwnerPassport({
  photos: ["https://cdn.example/a.jpg", "javascript:alert(1)", "/passport/x.jpg"],
  brewingNote: "V60",
  brewingTitle: "Kochere",
  hours: "  till 23:00  ",
  name: "HACK",
  district: "HACK",
  pin: { lat: 1, lng: 2 },
  status: "verified",
});
assert(dirty.brewingNote === "V60", "writable brewing kept");
assert(dirty.hours === "till 23:00", "owner hours trimmed, not invented");
assert(dirty.photos.length === 2, "unsafe photo dropped");
assert(!("name" in dirty), "name is not a passport field");
assert(!("district" in dirty), "district is not a passport field");
assert(!("pin" in dirty), "pin is not a passport field");
assert(emptyPassport().hours === "", "empty hours default");

const files = [
  "components/owner-edit.tsx",
  "components/owner-edit-denied.tsx",
  "app/owner/edit/page.tsx",
  "app/en/owner/edit/page.tsx",
  "lib/owner-tokens.ts",
  "lib/copy.ts",
];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  assert(!/koofi/i.test(source), `${file} must not say Koofi`);
  assert(!/Amjad|Ajz/i.test(source), `${file} must not name Amjad/Ajz`);
  assert(!/ON TONIGHT/i.test(source), `${file} no Soft Places`);
  assert(!/من الثلاث اللي الليلة/.test(source), `${file} no AR Soft Places`);
  assert(!/buy.?rank/i.test(source), `${file} no buy-rank`);
  assert(!/web\.whatsapp\.com/i.test(source), `${file} no WhatsApp Web`);
}

const tokens = readFileSync("lib/owner-tokens.ts", "utf8");
assert(tokens.includes("mintOwnerToken"), "mint");
assert(tokens.includes("validateOwnerToken"), "validate");
assert(tokens.includes("revokeOwnerTokens"), "revoke");
assert(!tokens.includes("sendWhatsAppText"), "mint does not send WhatsApp");

const opsApi = readFileSync("app/api/claims/ops/route.ts", "utf8");
assert(opsApi.includes("mintOwnerToken"), "ops can mint");
assert(opsApi.includes("revokeOwnerTokens"), "ops can revoke");
assert(!opsApi.includes("sendWhatsAppText"), "ops does not send WhatsApp");
assert(!opsApi.includes("requestClaimOtp"), "ops does not revive OTP");

const edit = readFileSync("components/owner-edit.tsx", "utf8");
assert(edit.includes("ownerEditLocked"), "locked fields shown");
assert(edit.includes("shop.nameEn"), "name is catalog");
assert(edit.includes("neighborhood"), "district is catalog");
assert(edit.includes("ownerEditPin"), "pin is locked Maps link");
assert(edit.includes("ownerEditHoursHint"), "hours are owner-supplied");
assert(!edit.includes("shop.hours"), "catalog hours are not written");
assert(!edit.includes("DirectoryUpvote"), "no buy-rank upvote on edit");
assert(!edit.includes("GoogleRating"), "no invented Google rating");

const footer = readFileSync("components/cafe-claim-footer.tsx", "utf8");
assert(footer.includes("shopClaimWhatsAppHref"), "wa.me path stays");
assert(footer.includes("ownThisCafe"), "Own this cafe? stays");

const owner = readFileSync("components/owner-claim.tsx", "utf8");
assert(owner.includes("claimWhatsAppHref"), "interim WhatsApp door stays");
assert(!owner.includes("/api/claims"), "visitors still not routed through OTP");

assert(existsSync("app/api/claims/otp/route.ts"), "OTP API stays parked");
assert(existsSync("app/owner/page.tsx"), "claim door stays");
assert(existsSync("sql/shop-owner-tokens.sql"), "token SQL");
assert(
  readFileSync("sql/shop-claims.sql", "utf8").includes("shop_owner_tokens"),
  "claims SQL includes tokens",
);

const previous = process.env.CLAIM_APPROVE_TOKEN;
process.env.CLAIM_APPROVE_TOKEN = "check-owner-secret";
const bearer = new Request("http://local/api/claims/ops", {
  headers: { Authorization: "Bearer check-owner-secret" },
});
assert(canApproveClaims(bearer), "Bearer authorize");
assert(readApproveToken(bearer) === "check-owner-secret", "Bearer parse");
const headerReq = new Request("http://local/api/claims/ops", {
  headers: { [CLAIM_APPROVE_HEADER]: "check-owner-secret" },
});
assert(canApproveClaims(headerReq), "header authorize");
const cookieReq = new Request("http://local/api/claims/ops", {
  headers: { cookie: `${CLAIM_APPROVE_COOKIE}=check-owner-secret` },
});
assert(canApproveClaims(cookieReq), "cookie authorize");
assert(
  !canApproveClaims(new Request("http://local/api/claims/ops")),
  "missing token denied",
);
if (previous === undefined) delete process.env.CLAIM_APPROVE_TOKEN;
else process.env.CLAIM_APPROVE_TOKEN = previous;

async function checkMemoryTokens(): Promise<void> {
  if (feedbackStorageKind() !== "memory") return;

  const shopA = "cafu-olaya";
  const shopB = "woods-olaya";

  const unclaimed = await mintOwnerToken(shopA);
  assert(!unclaimed.ok && unclaimed.error === "not_verified", "unclaimed cannot mint");

  const missing = await validateOwnerToken({ shopId: "", token: "" });
  assert(!missing.ok && missing.error === "missing", "missing query fails closed");

  const granted = await grantVerifiedClaim(shopA);
  assert(granted.ok && granted.status === "verified", "grant verified A");

  const minted = await mintOwnerToken(shopA);
  assert(minted.ok, "mint for verified");
  if (!minted.ok) return;

  const ok = await validateOwnerToken({
    shopId: shopA,
    token: minted.token,
  });
  assert(ok.ok && ok.shopId === shopA, "valid token loads");

  const wrong = await validateOwnerToken({
    shopId: shopB,
    token: minted.token,
  });
  assert(!wrong.ok && wrong.error === "wrong_shop", "wrong shop fails closed");

  const junk = await validateOwnerToken({
    shopId: shopA,
    token: "not-a-real-token",
  });
  assert(!junk.ok && junk.error === "invalid", "junk token fails closed");

  const saved = await updateVerifiedPassport({
    shopId: shopA,
    passport: {
      brewingTitle: "Test bean",
      hours: "till 22:00",
      photos: ["https://cdn.example/p.jpg"],
      name: "should drop",
    },
  });
  assert(saved.ok && saved.passport.brewingTitle === "Test bean", "save brewing");
  assert(saved.ok && saved.passport.hours === "till 22:00", "save owner hours");
  assert(saved.ok && !("name" in saved.passport), "name not saved");

  const again = await validateOwnerToken({
    shopId: shopA,
    token: minted.token,
  });
  assert(
    again.ok && again.passport.brewingTitle === "Test bean",
    "reload sees saved passport",
  );

  const expired = await mintOwnerToken(shopA, -1000);
  assert(expired.ok, "mint expired token");
  if (expired.ok) {
    const dead = await validateOwnerToken({
      shopId: shopA,
      token: expired.token,
    });
    assert(!dead.ok && dead.error === "expired", "expired fails closed");
  }

  const revoked = await revokeOwnerTokens(shopA);
  assert(revoked.ok && revoked.revoked >= 1, "revoke active tokens");
  const after = await validateOwnerToken({
    shopId: shopA,
    token: minted.token,
  });
  assert(!after.ok && after.error === "revoked", "revoked fails closed");
}

void checkMemoryTokens()
  .then(() => {
    console.log("check-owner-edit: ok");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
