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
  isInviteShareLine,
  sanitizeTonightCardLine,
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
  SHOW_TONIGHT_CARD,
  tonightImagePath,
  tonightShareText,
  VIRAL_SHARE_CHANNELS,
  xShareHref,
  type TonightMintStore,
} from "../lib/tonight";
import { loadTonightHeroDataUri } from "../lib/tonight-hero";
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
assert(SHOW_TONIGHT_CARD === false, "بطاقة الليلة is parked from cafe cards");
assert(copy.tonightCard.ar === "بطاقة الليلة", "parked AR tonight label stays");
assert(copy.tonightCard.en === "Tonight’s card", "parked EN tonight label stays");
assert(copy.tonightEyebrow.ar === "الليلة", "AR ephemeral eyebrow");
assert(copy.tonightEyebrow.en === "tonight", "EN ephemeral eyebrow");
assert(copy.inviteCta.ar === "وين؟", "AR invite CTA is وين؟");
assert(copy.inviteCta.en === "wain?", "EN invite CTA is wain?");
assert(copy.inviteTitle.ar === "وين؟", "AR invite title matches CTA");
assert(copy.inviteTitle.en === "wain?", "EN invite title matches CTA");
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
    `وين؟ أنا بـ ${shopDisplayName(woods, "ar")}\n\nhttps://wain.lol/c/woods-olaya?from=tonight`,
  `AR invite prefill:\n${woodsAr}`,
);
assert(
  woodsEn ===
    `wain? I'm at ${shopDisplayName(woods, "en")}\n\nhttps://wain.lol/en/c/woods-olaya?from=tonight`,
  `EN invite prefill:\n${woodsEn}`,
);
assert(!woodsAr.includes("تعال"), "AR invite has no تعال");
assert(!/\bcome\b/i.test(woodsEn), "EN invite has no come");
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
assert(
  isInviteShareLine(`وين؟ أنا بـ ${shopDisplayName(woods, "ar")}`),
  "AR وين؟ invite prefill is detected",
);
assert(
  isInviteShareLine(`wain? I'm at ${shopDisplayName(woods, "en")}`),
  "EN wain? invite prefill is detected",
);
assert(
  sanitizeTonightCardLine(`وين؟ أنا بـ ${shopDisplayName(woods, "ar")}`) === "",
  "invite copy never becomes a Tonight card line",
);
assert(
  sanitizeTonightCardLine("I'm at WOODS Cafe and Roastery — come through") === "",
  "parked invite phrasing still stays off the card",
);
assert(
  sanitizeTonightCardLine("جو الليلة") === "جو الليلة",
  "a real one-liner still mints",
);
assert(
  tonightImagePath("woods-olaya", {
    locale: "en",
    line: "I'm at WOODS Cafe and Roastery — come through",
  }).includes("line=") === false,
  "mint path drops invite copy",
);

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
  "lib/tonight-hero.ts",
  "lib/copy.ts",
  "lib/track.ts",
  "components/viral-share.tsx",
  "components/cafe-presence-row.tsx",
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
assert(viral.includes("SHOW_TONIGHT_CARD"), "بطاقة الليلة is gated");
assert(viral.includes("tonight_card_open"), "tonight_* stays wired while parked");
assert(viral.includes("tonight_card_mint"), "mint fires tonight_card_mint");
assert(viral.includes("tonight_card_share"), "share fires tonight_card_share");
assert(viral.includes("invite_open"), "invite sheet fires invite_open");
assert(viral.includes("invite_share"), "invite share is separate");
assert(viral.includes("navigator.share"), "Web Share API");
assert(viral.includes("canShareImageAndText"), "share requires image+text");
assert(viral.includes("downloadBlob"), "download fallback");
assert(viral.includes("tonightFallback"), "fallback tells them both landed");
assert(viral.includes("ShareCopy"), "sheet shows the copy next to the card");
assert(viral.includes("QuietShareExtras"), "Download · Copy are quiet secondaries");
assert(viral.includes('channel: "system"'), "primary share is system Web Share");
assert(viral.includes("border-gold bg-passport-wash"), "وين؟ is the gold CTA");
assert(!viral.includes("bg-bean"), "وين؟ is not the bean button");
assert(viral.includes('channel: "download"'), "download stays a secondary channel");
assert(viral.includes('channel: "copy"'), "copy stays a secondary channel");
assert(!viral.includes("tonightShareBoth"), "no IMAGE AND TEXT TOGETHER chrome");
assert(!viral.includes("tonightShareCopy"), "no The copy chrome");
assert(!viral.includes("الصورة والنص مع بعض"), "no AR instructional share header");
assert(!viral.includes("The copy"), "no EN The copy header");
assert(!viral.includes("tonightShareX"), "no X channel button");
assert(!viral.includes("tonightShareIg"), "no Stories channel button");
assert(!viral.includes("tonightShareSnap"), "no Snap channel button");
assert(!viral.includes("ستوريز"), "no Stories label in viral UI");
assert(!viral.includes("سناب"), "no Snap label in viral UI");
assert(!viral.includes("xShareHref"), "X intent is not a sheet action");
assert(!viral.includes("grid grid-cols-2"), "no 6-button channel grid");
assert(viral.includes("TONIGHT_WATERMARK"), "preview watermark is wain.lol");
assert(!/navigator\.share\(\{\s*text\s*\}\)/.test(viral), "no text-only Web Share");
assert(!viral.includes("wa.me/966"), "invite is not WhatsApp Cloud send");
assert(!viral.includes("line: inviteLine"), "invite must not bake copy onto the card");
assert(!viral.includes("line={inviteLine}"), "invite preview is Tonight framing");

const passport = readFileSync("components/cafe-passport-card.tsx", "utf8");
assert(passport.includes("CafePresenceRow"), "Passport has ▲ · share · وين؟ · Maps row");
assert(!passport.includes("ShareListingButton"), "Passport listing share lives in the presence row");

const thin = readFileSync("components/cafe-card.tsx", "utf8");
assert(thin.includes("CafePresenceRow"), "thin card has ▲ · share · وين؟ · Maps row");
assert(thin.includes("CafeClaimFooter"), "Own this cafe stays");
assert(thin.includes("CardBeen"), "Been here stays quiet");
assert(!thin.includes("ShareListingButton"), "thin listing share lives in the presence row");

const presence = readFileSync("components/cafe-presence-row.tsx", "utf8");
assert(presence.includes("DirectoryUpvote"), "row has ▲");
assert(presence.includes("ShareListingButton"), "row has compact listing share");
assert(presence.includes("ViralShareActions"), "row has وين؟ invite");
assert(presence.includes("takeMeThere"), "row Maps is ودّني هناك");
assert(presence.includes("compact"), "listing share is icon-only");
assert(presence.includes('source="card"'), "listing share is the card path");
assert(presence.includes("shrink-0"), "Maps hugs its label");
assert(!presence.includes("flex-1"), "Maps does not stretch");
assert(presence.includes("whitespace-nowrap"), "Maps label stays one line");
assert(!presence.includes("tonightShareX"), "no X channel on the bar");
assert(!presence.includes("ستوريز"), "no Stories on the bar");

const listingShare = readFileSync("components/share-listing-button.tsx", "utf8");
assert(listingShare.includes("listingPacketForShop"), "icon share is listing packet");
assert(listingShare.includes("sharePackPacket"), "icon share uses Web Share / copy");
assert(!listingShare.includes("tonightImagePath"), "listing share is not the وين؟ mint");
assert(!listingShare.includes("inviteShareText"), "listing share is not the وين؟ invite");

const directory = readFileSync("components/directory-card.tsx", "utf8");
assert(directory.includes("ShareListingButton"), "directory list can still share a listing");

assert(existsSync("app/c/[id]/tonight/image/route.tsx"), "mint route exists");
const image = readFileSync("app/c/[id]/tonight/image/route.tsx", "utf8");
assert(image.includes("ImageResponse"), "card is minted as an image");
assert(image.includes("TONIGHT_WATERMARK"), "watermark is wain.lol");
assert(image.includes("TONIGHT_WATERMARK_PX"), "watermark size is locked");
assert(image.includes("الليلة"), "AR-first eyebrow on the card");
assert(image.includes("objectFit: \"cover\""), "hero is full-bleed cover");
assert(image.includes("TONIGHT_IMAGE_SIZE.height"), "hero fills the 9:16 canvas");
assert(!image.includes("980"), "no black half / cropped top slab");
assert(image.includes("#f3ead8"), "empty fallback is cream, not black");
assert(image.includes("linear-gradient(to top"), "scrim keeps gold/cream type readable");
assert(image.includes("loadTonightHeroDataUri"), "mint embeds hero bytes, not an SSO-blocked URL");
assert(!image.includes("new URL(photo"), "mint must not HTTP-fetch the hero");
assert(viral.includes("aspect-[9/16]"), "composer preview is 9:16 photo-forward");
assert(!viral.includes("aspect-[4/5]"), "preview is not a split card");
assert(!viral.includes("max-h-80"), "minted preview must show the full 9:16 card");

loadTonightHeroDataUri("/passport/woods-olaya-1.jpg")
  .then((hero) => {
    assert(hero?.startsWith("data:image/jpeg;base64,"), "Woods hero embeds as a data URI");
    assert((hero?.length ?? 0) > 10_000, "embedded Woods hero is not an empty stub");
    console.log("check-tonight: ok");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
