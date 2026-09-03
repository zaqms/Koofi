import { listRealShops } from "../lib/catalog";
import { isNearAskedNeighborhood } from "../lib/neighborhood-tight";
import { pickCafes } from "../lib/picker";
import { shopBrandKey } from "../lib/shop-brand";
import { encodePackId, resolvePack } from "../lib/pack";
import { formatListingPacket, formatSharePacket, packetHasMapsUrl } from "../lib/packet";
import { listingPacketForShop } from "../lib/share-pack";
import { shopWhyLine } from "../lib/why-line";
import { toChatPicks, headingForPicks } from "../lib/picker";
import { packSharePath, VIBE_CHIPS } from "../lib/product";
import { NEIGHBORHOODS } from "../lib/neighborhoods";
import { matchCatalogShops } from "../lib/shop-name";
import { whatsAppShareHref } from "../lib/share-pack";
import { isOffTopicAsk } from "../lib/off-topic-intent";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const hittin = pickCafes({ text: "حطين", language: "ar" });
assert(hittin.picks.length === 3, `حطين should return 3, got ${hittin.picks.length}`);

const hittinWhys = hittin.picks.map((pick) => pick.why);
assert(
  new Set(hittinWhys).size === hittinWhys.length,
  `حطين why-lines must differ: ${hittinWhys.join(" | ")}`,
);
assert(
  hittin.picks.every((pick) => pick.shop.neighborhoodAr !== "هيتين"),
  "Hittin Arabic must stay حطين",
);

const brands = hittin.picks.map((pick) => shopBrandKey(pick.shop));
assert(
  new Set(brands).size === brands.length,
  `same-brand collision in حطين pack: ${brands.join(", ")}`,
);
assert(
  !brands.includes("origin") || brands.filter((b) => b === "origin").length === 1,
  "ORIGIN Lab + ORIGIN Roasters must not appear together",
);

const malqa = pickCafes({ text: "الملقا", language: "ar" });
assert(
  malqa.picks.every((pick) => pick.shop.neighborhood !== "diriyah"),
  `الملقا padded with الدرعية: ${malqa.picks.map((p) => p.shop.id).join(", ")}`,
);

const picks = toChatPicks(hittin);
const packId = encodePackId({
  locale: "ar",
  shopIds: picks.map((pick) => pick.id),
  ask: "حطين",
});
const restored = resolvePack(packId);
assert(restored, "pack must decode");
assert(
  restored.shopIds.join(",") === picks.map((pick) => pick.id).join(","),
  "restore shop ids must match",
);
assert(restored.ask === "حطين", "restore ask must match");
assert(restored.locale === "ar", "restore locale must stay ar");
assert(
  new Set(restored.whys).size === restored.whys.length,
  `restored why-lines must differ: ${restored.whys.join(" | ")}`,
);

const packet = formatSharePacket({
  ask: "حطين",
  picks,
  language: "ar",
  restoreUrl: `https://wain.lol${packSharePath(packId)}`,
});
assert(!packetHasMapsUrl(packet), `packet leaked Maps URL:\n${packet}`);
assert(!/maps\.google|maps\.app/i.test(packet), "packet must not contain maps hosts");
assert(packet.includes("asked: حطين"), "packet must quote the ask");
assert(packet.includes("wain.lol/p/"), "packet must use /p/ restore URL");
assert(!packet.includes("/c/"), "packet must not use /c/ cafe cards");
assert(packet.includes("?from=wa"), "packet URL must carry from=wa");

const listing = listingPacketForShop({
  shop: hittin.picks[0]!.shop,
  language: "ar",
  origin: "https://wain.lol",
});
assert(!packetHasMapsUrl(listing.text), `listing packet leaked Maps:\n${listing.text}`);
assert(listing.text.includes("/c/"), "listing packet must use /c/");
assert(listing.text.includes("?from=wa"), "listing packet must carry from=wa");
assert(!listing.text.includes("/p/"), "listing packet must not use /p/");
assert(listing.text.includes(shopWhyLine(hittin.picks[0]!.shop, "ar")), "listing packet needs why-line");

const wa = whatsAppShareHref(packet);
assert(
  wa.startsWith("https://wa.me/?text="),
  `wa.me must have no phone number: ${wa.slice(0, 80)}`,
);
assert(!wa.includes("966570064331"), "share must not use the Contact us number");
assert(!wa.includes("web.whatsapp.com"), "share must not use WhatsApp Web");

const catalog = listRealShops();
const catalogIds = new Set(catalog.map((shop) => shop.id));

function assertNamedFirst(ask: string, language: "ar" | "en", pred: (id: string) => boolean) {
  const result = pickCafes({ text: ask, language });
  assert(result.picks.length === 3, `${ask} should return 3, got ${result.picks.length}`);
  assert(
    result.picks.every((pick) => catalogIds.has(pick.shop.id)),
    `${ask} invented a shop: ${result.picks.map((pick) => pick.shop.id).join(", ")}`,
  );
  assert(
    pred(result.picks[0]!.shop.id),
    `${ask} first pick was ${result.picks[0]?.shop.id} (${result.picks[0]?.shop.nameEn})`,
  );
  assert(
    headingForPicks(result) === "Three cafes that suit your choice:" ||
      headingForPicks(result) === "ثلاث قهاوي تناسب اختيارك",
    `locked heading changed for ${ask}: ${headingForPicks(result)}`,
  );
}

assertNamedFirst("woods", "en", (id) => id.startsWith("woods-"));
assertNamedFirst("وودز", "ar", (id) => id.startsWith("woods-"));
assertNamedFirst("drip", "en", (id) => id === "drip-olaya");
assertNamedFirst("نسج", "ar", (id) => id === "nasj-al-malqa");
assertNamedFirst("خطوة جمل", "ar", (id) => id.startsWith("camel-step"));
assertNamedFirst("nasj", "en", (id) => id === "nasj-al-malqa");

assert(
  matchCatalogShops("drops", catalog).length === 0,
  "drops is not a catalog shop — do not invent Drops or alias it onto Drip",
);
assert(
  matchCatalogShops("Drops", catalog).length === 0,
  "Drops is not a catalog shop",
);

const dropsPick = pickCafes({ text: "drops", language: "en" });
assert(dropsPick.picks.length === 3, "drops vibe fallback should still return 3");
assert(
  dropsPick.picks.every((pick) => catalogIds.has(pick.shop.id)),
  "drops fallback invented a shop",
);
assert(
  !dropsPick.picks.some((pick) => /drops/i.test(`${pick.shop.id} ${pick.shop.nameEn} ${pick.shop.nameAr}`)),
  "do not invent a Drops listing",
);

const quietHittin = pickCafes({ text: "quiet in Hittin", language: "en" });
assert(quietHittin.picks.length === 3, "quiet in Hittin should return 3");
assert(quietHittin.askedNeighborhoods.includes("hittin"), "quiet in Hittin must keep حي parse");
assert(quietHittin.askedMoments.includes("quiet"), "quiet in Hittin must keep vibe parse");
assert(
  quietHittin.picks.every((pick) =>
    isNearAskedNeighborhood(pick.shop, ["hittin"], catalog),
  ),
  `quiet in Hittin left the area: ${quietHittin.picks.map((pick) => pick.shop.id).join(", ")}`,
);
assert(
  quietHittin.picks.every((pick) => pick.shop.neighborhoodAr !== "هيتين"),
  "Hittin Arabic must stay حطين on vibe asks too",
);

for (const chip of VIBE_CHIPS) {
  assert(
    matchCatalogShops(chip.en, catalog).length === 0,
    `chip "${chip.en}" must not name-match a shop`,
  );
  assert(
    matchCatalogShops(chip.ar, catalog).length === 0,
    `chip "${chip.ar}" must not name-match a shop`,
  );
}

for (const place of Object.values(NEIGHBORHOODS)) {
  for (const alias of [place.en, place.ar, ...place.aliases]) {
    assert(
      matchCatalogShops(alias, catalog).length === 0,
      `حي alias "${alias}" must not name-match a shop`,
    );
  }
}

assert(!isOffTopicAsk("woods"), "a catalog name is on-topic");
assert(!isOffTopicAsk("نسج"), "an Arabic catalog name is on-topic");

console.log("ok");
console.log(
  hittin.picks
    .map((pick, i) => `${i + 1}) ${pick.shop.nameEn} [${pick.shop.neighborhood}] — ${pick.why}`)
    .join("\n"),
);
console.log("--- packet ---");
console.log(packet);
