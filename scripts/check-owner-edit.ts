import { existsSync, readFileSync } from "node:fs";
import {
  canApproveClaims,
  CLAIM_APPROVE_COOKIE,
  CLAIM_APPROVE_HEADER,
  readApproveToken,
} from "../lib/claim-ops";
import {
  appendVerifiedPassportPhotos,
  grantVerifiedClaim,
  updateVerifiedPassport,
} from "../lib/claims";
import {
  emptyPassport,
  mergePassportPhotos,
  parsePhotoList,
  passportHeroPhotos,
  sanitizeOwnerPassport,
} from "../lib/claims-types";
import { copy, ownerEditErrorCopy, ownerPhotoErrorCopy } from "../lib/copy";
import {
  blobWriteConfigured,
  checkOwnerPhotoFile,
  collectOwnerPhotoFiles,
  OWNER_PHOTO_MAX,
  OWNER_PHOTO_MAX_BYTES,
  ownerPhotoPathname,
} from "../lib/owner-photos";
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
assert(copy.ownerEditAddUrl.en.includes("URL"), "EN add-URL copy");
assert(copy.ownerEditUpload.en.toLowerCase().includes("phone"), "EN phone upload");
assert(copy.ownerEditUpload.ar.includes("الجوال"), "AR phone upload");
assert(
  copy.ownerEditPhotosHint.en.toLowerCase().includes("carousel"),
  "hint says carousel",
);
assert(
  ownerPhotoErrorCopy("no_blob", "en").toLowerCase().includes("url"),
  "no-blob still allows URLs",
);
assert(
  ownerPhotoErrorCopy("bad_photo", "en").toLowerCase().includes("jpg"),
  "bad photo copy",
);
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
const blobLike =
  "https://abc.public.blob.vercel-storage.com/owner/cafu-olaya/" +
  `${"photo".repeat(70)}.jpg`;
assert(blobLike.length > 300, "sample Blob URL is longer than the old 300 clip");
assert(
  sanitizeOwnerPassport({ photos: [blobLike] }).photos[0] === blobLike,
  "Blob-length photo URL is kept",
);
assert(OWNER_PHOTO_MAX === 12, "same 12-photo cap as passport sanitize");
assert(
  parsePhotoList("https://cdn.example/last.jpg").length === 1,
  "string photo is not dropped",
);
assert(
  parsePhotoList(["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"])
    .length === 2,
  "array photos kept",
);
assert(
  mergePassportPhotos(
    ["https://cdn.example/a.jpg"],
    ["https://cdn.example/b.jpg", "https://cdn.example/a.jpg"],
  ).length === 2,
  "append keeps both unique URLs",
);
assert(
  passportHeroPhotos(
    { ...emptyPassport(), photos: ["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"] },
    { logoUrl: "/logos/cafu-olaya.jpg" },
  ).length === 2,
  "hero uses full owner array, not logo-only",
);
assert(
  passportHeroPhotos(emptyPassport(), { logoUrl: "/logos/cafu-olaya.jpg" })[0] ===
    "/logos/cafu-olaya.jpg",
  "logo is fallback only when owner photos are empty",
);
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
  "lib/owner-photos.ts",
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
assert(tokens.includes("__wainOwnerTokensMemory"), "tokens share memory across isolates");
assert(!tokens.includes("sendWhatsAppText"), "mint does not send WhatsApp");
assert(
  readFileSync("lib/claims.ts", "utf8").includes("__wainClaimsMemory"),
  "claims share memory across isolates",
);

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
assert(edit.includes('type="file"'), "phone file picker");
assert(edit.includes("multiple"), "multi-file picker");
assert(edit.includes('accept="image/*"'), "image picker");
assert(edit.includes("/api/owner/photos"), "upload hits Blob route");
assert(edit.includes("ownerEditAddUrl"), "URL add is a list, not one field");
assert(edit.includes("savedPhotos"), "upload reloads the full saved photos[]");
assert(!edit.includes("shop.hours"), "catalog hours are not written");
assert(!edit.includes("DirectoryUpvote"), "no buy-rank upvote on edit");
assert(!edit.includes("GoogleRating"), "no invented Google rating");

assert(existsSync("app/api/owner/photos/route.ts"), "photo upload route");
const photosApi = readFileSync("app/api/owner/photos/route.ts", "utf8");
assert(photosApi.includes("validateOwnerToken"), "upload is token-gated");
assert(photosApi.includes("putOwnerPhotos"), "upload uses Blob helper");
assert(
  photosApi.includes("appendVerifiedPassportPhotos"),
  "upload appends onto Neon photos[]",
);
assert(!photosApi.includes("sendWhatsAppText"), "upload does not send WhatsApp");

const photoLib = readFileSync("lib/owner-photos.ts", "utf8");
assert(photoLib.includes("@vercel/blob"), "Vercel Blob is the upload store");
assert(!/s3|cloudinary|supabase|r2|s3bucket/i.test(photoLib), "no third storage");
assert(
  ownerPhotoPathname("cafu-olaya", "../../evil.png") ===
    "owner/cafu-olaya/photo-evil.png",
  "pathname stays under owner/shop",
);
assert(
  ownerPhotoPathname("cafu-olaya", "image.jpg", "111-0") !==
    ownerPhotoPathname("cafu-olaya", "image.jpg", "111-1"),
  "same iPhone filename gets a unique path",
);
const twoFiles = new FormData();
twoFiles.set("shop", "cafu-olaya");
twoFiles.set("token", "tok");
twoFiles.append(
  "files",
  new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" }),
);
twoFiles.append(
  "files",
  new File([new Uint8Array([4, 5, 6])], "b.jpg", { type: "image/jpeg" }),
);
assert(
  collectOwnerPhotoFiles(twoFiles).length === 2,
  "FormData keeps both files, not last-wins",
);
assert(
  ownerPhotoPathname("cafu-olaya", "café shot!.JPG").startsWith(
    "owner/cafu-olaya/",
  ),
  "pathname uses shop from token",
);
assert(
  checkOwnerPhotoFile({
    type: "image/jpeg",
    size: 1200,
    name: "a.jpg",
  }).ok,
  "jpeg ok",
);
assert(
  !checkOwnerPhotoFile({
    type: "application/pdf",
    size: 1200,
    name: "a.pdf",
  }).ok,
  "pdf rejected",
);
assert(
  !checkOwnerPhotoFile({
    type: "image/jpeg",
    size: OWNER_PHOTO_MAX_BYTES + 1,
    name: "a.jpg",
  }).ok,
  "oversize rejected",
);
assert(typeof blobWriteConfigured() === "boolean", "blob helper is callable");

const envExample = readFileSync(".env.example", "utf8");
assert(envExample.includes("BLOB_READ_WRITE_TOKEN"), "example documents Blob");
assert(
  readFileSync("lib/env.ts", "utf8").includes("BLOB_READ_WRITE_TOKEN"),
  "env contract names Blob",
);
assert(
  readFileSync("README.md", "utf8").includes("BLOB_READ_WRITE_TOKEN"),
  "README documents Blob Preview env",
);
assert(
  !readFileSync("README.md", "utf8").includes("CLAIM_APPROVE_TOKEN="),
  "README does not paste a Production token",
);

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
      photos: [
        "https://cdn.example/p.jpg",
        "https://cdn.example/q.jpg",
      ],
      name: "should drop",
    },
  });
  assert(saved.ok && saved.passport.brewingTitle === "Test bean", "save brewing");
  assert(saved.ok && saved.passport.hours === "till 22:00", "save owner hours");
  assert(saved.ok && saved.passport.photos.length === 2, "multi URL photos saved");
  assert(saved.ok && !("name" in saved.passport), "name not saved");

  const appended = await appendVerifiedPassportPhotos({
    shopId: shopA,
    urls: ["https://cdn.example/r.jpg"],
  });
  assert(
    appended.ok && appended.passport.photos.length === 3,
    "upload append does not collapse to last URL",
  );
  assert(
    appended.ok && appended.passport.brewingTitle === "Test bean",
    "append keeps other passport fields",
  );

  const again = await validateOwnerToken({
    shopId: shopA,
    token: minted.token,
  });
  assert(
    again.ok && again.passport.brewingTitle === "Test bean",
    "reload sees saved passport",
  );
  assert(
    again.ok && again.passport.photos.length === 3,
    "reload lists the full photos array",
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
