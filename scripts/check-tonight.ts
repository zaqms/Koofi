import { existsSync, readFileSync } from "node:fs";
import { getShop } from "../lib/catalog";
import { copy } from "../lib/copy";
import { PRODUCT_NAME, publicCardUrl, shopDisplayName } from "../lib/product";
import {
  canMintTonight,
  canShareImageAndText,
  inviteShareText,
  isViralShareChannel,
  satoriArabicLine,
  recordTonightMint,
  sanitizeTonightLine,
  TONIGHT_LINE_MAX,
  TONIGHT_MINTS_PER_SESSION,
  TONIGHT_MINTS_PER_SHOP,
  TONIGHT_WATERMARK,
  TONIGHT_WATERMARK_PX,
  tonightCardPath,
  tonightCardUrl,
  tonightDistrict,
  tonightFilename,
  tonightHeroForShop,
  tonightImagePath,
  tonightShareText,
  VIRAL_SHARE_CHANNELS,
  xShareHref,
  type TonightMintStore,
} from "../lib/tonight";
import type { AnalyticsEventName } from "../lib/track";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function memoryStore(initial = ""): TonightMintStore & { raw: string } {
  const box = { raw: initial };
  return {
    get raw() {
      return box.raw;
    },
    getItem() {
      return box.raw || null;
    },
    setItem(_key: string, value: string) {
      box.raw = value;
    },
  };
}

const woods = getShop("woods-olaya");
const cafu = getShop("cafu-olaya");
assert(woods, "Woods is in the catalog");
assert(cafu, "Cafu is in the catalog");

assert(PRODUCT_NAME === "wain.lol", "public brand is wain.lol");
assert(TONIGHT_WATERMARK === "wain.lol", "card watermark is wain.lol");
assert(TONIGHT_WATERMARK_PX >= 36, "watermark is large enough to read");
assert(copy.tonightShareBoth.ar === "الصورة والنص مع بعض", "share is image+text");
assert(copy.tonightFallback.ar.includes("نزّلنا الصورة"), "fallback downloads image");
assert(copy.tonightFallback.ar.includes("نسخنا النص"), "fallback copies text");
assert(
  canShareImageAndText(undefined, { files: [], text: "x" }) === false,
  "missing canShare cannot claim files+text",
);
assert(
  canShareImageAndText(() => true, { files: [], text: "x" }) === true,
  "canShare true allows files+text",
);
assert(
  canShareImageAndText(() => false, { files: [], text: "x" }) === false,
  "canShare false forces download+copy",
);
assert(copy.tonightCard.ar === "بطاقة الليلة", "AR tonight CTA");
assert(copy.tonightCard.en === "Tonight’s card", "EN tonight CTA");
assert(copy.tonightEyebrow.ar === "الليلة", "AR ephemeral eyebrow");
assert(copy.tonightEyebrow.en === "tonight", "EN ephemeral eyebrow");
assert(copy.inviteCta.ar === "تعال", "AR invite CTA");
assert(copy.inviteCta.en === "Come with me", "EN invite CTA");
assert(copy.inviteTitle.ar === "خذني معه", "AR invite title");
assert(copy.tonightMint.ar === "سوّ البطاقة", "Najdi mint verb");
assert(copy.tonightClose.ar === "سكّر", "Najdi close");
assert(copy.tonightDownload.ar === "نزّل الصورة", "Najdi download");
assert(copy.tonightEphemeral.ar === "هالليلة بس", "ephemeral AR frame");
assert(copy.takeMeThere.ar === "ودّني هناك", "Maps CTA stays");
assert(copy.ownThisCafe.ar === "تملك المقهى؟", "claim CTA stays");
assert(copy.beenHere.ar === "كنت هنا", "Been here stays");
assert(copy.shopUpvote.ar === "أعجبني", "upvote stays");

const arCopy = [
  copy.tonightCard.ar,
  copy.tonightEyebrow.ar,
  copy.tonightHint.ar,
  copy.tonightPlaceholder.ar,
  copy.tonightMint.ar,
  copy.tonightReady.ar,
  copy.tonightEphemeral.ar,
  copy.tonightRateLimited.ar,
  copy.tonightShareSystem.ar,
  copy.tonightShareIg.ar,
  copy.tonightShareSnap.ar,
  copy.tonightDownload.ar,
  copy.tonightCopyLink.ar,
  copy.tonightClose.ar,
  copy.inviteCta.ar,
  copy.inviteTitle.ar,
  copy.inviteHint.ar,
].join("\n");

assert(!/هذه|يمكنك|لقد|يرجى|قم ب|سوف /.test(arCopy), "no MSA stock phrases");
assert(!/تسجيل الوصول|تسجيل الدخول|ميورشب|نقاط|ترتيب/.test(arCopy), "no check-in / points MSA");
assert(!/koofi/i.test(arCopy), "AR viral copy is not Koofi");
const visitorLines = Object.values(copy).flatMap((row) => {
  if (!row || typeof row !== "object" || Array.isArray(row)) return [];
  if ("ar" in row && "en" in row && typeof row.ar === "string" && typeof row.en === "string") {
    return [row.ar, row.en];
  }
  return [];
});
assert(!/Maps is the last click/i.test(visitorLines.join("\n")), "parked Maps line stays out");

const woodsAr = inviteShareText({
  shop: woods,
  language: "ar",
  cardUrl: tonightCardUrl("woods-olaya", "ar", "https://wain.lol"),
});
const woodsEn = inviteShareText({
  shop: woods,
  language: "en",
  cardUrl: tonightCardUrl("woods-olaya", "en", "https://wain.lol"),
});
assert(
  woodsAr ===
    `أنا بـ ${shopDisplayName(woods, "ar")} الحين — تعال\n\nhttps://wain.lol/c/woods-olaya?from=tonight`,
  `AR invite prefill:\n${woodsAr}`,
);
assert(
  woodsEn ===
    `I'm at ${shopDisplayName(woods, "en")} — come through\n\nhttps://wain.lol/en/c/woods-olaya?from=tonight`,
  `EN invite prefill:\n${woodsEn}`,
);
assert(!/maps\.(google|app)|google\.com\/maps/i.test(woodsAr), "invite has no Maps URL");
assert(!/koofi/i.test(woodsAr + woodsEn), "invite is not Koofi");

const tonightText = tonightShareText({
  shop: woods,
  language: "ar",
  cardUrl: tonightCardUrl("woods-olaya", "ar", "https://wain.lol"),
  line: "جو هادي",
});
assert(tonightText.includes("جو هادي"), "tonight share keeps the one-liner");
assert(tonightText.includes("/c/woods-olaya?from=tonight"), "tonight deep-links /c/{id}");
assert(tonightCardPath("cafu-olaya", "ar") === "/c/cafu-olaya?from=tonight", "thin card deep link");
assert(publicCardUrl("cafu-olaya", "ar") === "https://wain.lol/c/cafu-olaya", "public card URL unchanged");

assert(
  satoriArabicLine(woods.nameAr) === "وودز ومحمصة مقهى",
  "Arabic name is token-reversed for Satori",
);
assert(satoriArabicLine("العليا") === "العليا", "single Arabic word stays");
assert(tonightDistrict(woods, "ar") === "العليا", "AR district");
assert(tonightDistrict(woods, "en") === "Olaya", "EN district");
assert(tonightHeroForShop(cafu) === "/logos/cafu-olaya.jpg", "thin Cafu uses logo");
const prevEnv = process.env.VERCEL_ENV;
process.env.VERCEL_ENV = "preview";
assert(
  tonightHeroForShop(woods) === "/passport/woods-olaya-1.jpg",
  "preview Woods mint uses Passport hero",
);
process.env.VERCEL_ENV = "production";
assert(
  tonightHeroForShop(woods) === "/logos/woods-olaya.jpg",
  "production Woods mint uses catalog logo",
);
if (prevEnv === undefined) delete process.env.VERCEL_ENV;
else process.env.VERCEL_ENV = prevEnv;
assert(tonightFilename("woods-olaya") === "wain-tonight-woods-olaya.png", "wain filename");
assert(!tonightFilename("woods-olaya").includes("koofi"), "filename is not Koofi");

const imagePath = tonightImagePath("woods-olaya", {
  locale: "ar",
  line: "جو الليلة",
  photo: "/passport/woods-olaya-1.jpg",
});
assert(imagePath.startsWith("/c/woods-olaya/tonight/image?"), "mint path is under /c/{id}");
assert(imagePath.includes("locale=ar"), "mint path keeps locale");
assert(imagePath.includes("line="), "mint path keeps line");
assert(imagePath.includes("photo=%2Fpassport%2Fwoods-olaya-1.jpg"), "safe photo is encoded");
assert(
  tonightImagePath("woods-olaya", {
    locale: "ar",
    photo: "https://evil.example/x.jpg",
  }).includes("photo=") === false,
  "remote photo is dropped",
);
assert(sanitizeTonightLine("  جو   هادي  ") === "جو هادي", "line collapse");
assert(sanitizeTonightLine("x".repeat(200)).length === TONIGHT_LINE_MAX, "line cap");
assert(sanitizeTonightLine("https://maps.app.goo.gl/abc") === "", "Maps line dropped");
assert(sanitizeTonightLine("go to maps.google.com") === "", "Maps line dropped");

const store = memoryStore();
const now = 1_700_000_000_000;
assert(canMintTonight("woods-olaya", now, store), "fresh session can mint");
for (let i = 0; i < TONIGHT_MINTS_PER_SHOP; i += 1) {
  recordTonightMint("woods-olaya", now + i, store);
}
assert(!canMintTonight("woods-olaya", now + 10, store), "shop window is capped");
assert(canMintTonight("cafu-olaya", now + 10, store), "other shop still open");
for (let i = 0; i < TONIGHT_MINTS_PER_SESSION; i += 1) {
  recordTonightMint("cafu-olaya", now + 20 + i, store);
}
assert(!canMintTonight("cafu-olaya", now + 40, store), "session cap after extra mints");

assert(VIRAL_SHARE_CHANNELS.join(",") === "system,x,ig,snap,download,copy", "locked channels");
assert(isViralShareChannel("ig"), "ig is a channel");
assert(!isViralShareChannel("whatsapp"), "WhatsApp Cloud is out of scope");
assert(
  xShareHref("hello").startsWith("https://twitter.com/intent/tweet?text="),
  "X uses intent URL",
);

const requiredEvents = [
  "tonight_card_open",
  "tonight_card_mint",
  "tonight_card_share",
  "invite_open",
  "invite_share",
] as const satisfies readonly AnalyticsEventName[];
const trackSource = readFileSync("lib/track.ts", "utf8");
for (const name of requiredEvents) {
  assert(trackSource.includes(`"${name}"`), `track.ts exports ${name}`);
}
assert(trackSource.includes("channel?: ViralShareChannel"), "share events carry channel");

const files = [
  "lib/tonight.ts",
  "lib/copy.ts",
  "lib/track.ts",
  "components/viral-share.tsx",
  "components/cafe-card.tsx",
  "components/cafe-passport-card.tsx",
  "app/c/[id]/tonight/image/route.tsx",
];
for (const file of files) {
  assert(existsSync(file), `${file} exists`);
  const source = readFileSync(file, "utf8");
  assert(!/koofi/i.test(source), `${file} must not say Koofi`);
  assert(!/Maps is the last click/i.test(source), `${file} must not use parked Maps line`);
  assert(!/mayorship|mayor\b|foursquare|buy-rank|whatsapp cloud/i.test(source), `${file} stays out of Foursquare`);
  assert(!/ثلاث الليلة|ON TONIGHT/.test(source), `${file} has no Soft Places badge`);
  assert(!/navigator\.geolocation|fake gps|geo-gate/i.test(source), `${file} has no GPS gate`);
}

const viral = readFileSync("components/viral-share.tsx", "utf8");
assert(viral.includes("tonight_card_open"), "composer fires tonight_card_open");
assert(viral.includes("tonight_card_mint"), "mint fires tonight_card_mint");
assert(viral.includes("tonight_card_share"), "share fires tonight_card_share");
assert(viral.includes("invite_open"), "invite sheet fires invite_open");
assert(viral.includes("invite_share"), "invite share is separate");
assert(viral.includes("navigator.share"), "Web Share API");
assert(viral.includes("canShareImageAndText"), "share requires image+text");
assert(viral.includes("downloadBlob"), "Stories download fallback");
assert(viral.includes("tonightFallback"), "fallback tells them both landed");
assert(viral.includes("ShareCopy"), "sheet shows the copy next to the card");
assert(viral.includes("TONIGHT_WATERMARK"), "preview watermark is wain.lol");
assert(!/navigator\.share\(\{\s*text\s*\}\)/.test(viral), "no text-only Web Share");
assert(viral.includes("xShareHref"), "explicit X");
assert(!viral.includes("wa.me/966"), "invite is not WhatsApp Cloud send");

const passport = readFileSync("components/cafe-passport-card.tsx", "utf8");
assert(passport.includes("ViralShareActions"), "Passport has Tonight / Invite");
assert(passport.includes("DirectoryUpvote"), "upvote stays");
assert(passport.includes("takeMeThere"), "Maps CTA stays");
assert(passport.includes("ShareListingButton"), "listing share stays");

const thin = readFileSync("components/cafe-card.tsx", "utf8");
assert(thin.includes("ViralShareActions"), "thin card has Tonight / Invite");
assert(thin.includes("CafeClaimFooter"), "Own this cafe stays");
assert(thin.includes("CardBeen"), "Been here stays quiet");
assert(thin.includes("MapsLink"), "thin Maps stays");

assert(existsSync("app/c/[id]/tonight/image/route.tsx"), "mint route exists");
const image = readFileSync("app/c/[id]/tonight/image/route.tsx", "utf8");
assert(image.includes("ImageResponse"), "card is minted as an image");
assert(image.includes("TONIGHT_WATERMARK"), "watermark is wain.lol");
assert(image.includes("TONIGHT_WATERMARK_PX"), "watermark size is locked");
assert(image.includes("الليلة"), "AR-first eyebrow on the card");

console.log("check-tonight: ok");
