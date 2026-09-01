import { pickCafes } from "../lib/picker";
import { shopBrandKey } from "../lib/shop-brand";
import { encodePackId, resolvePack } from "../lib/pack";
import { formatSharePacket, packetHasMapsUrl } from "../lib/packet";
import { toChatPicks } from "../lib/picker";
import { packSharePath } from "../lib/product";

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

console.log("ok");
console.log(
  hittin.picks
    .map((pick, i) => `${i + 1}) ${pick.shop.nameEn} [${pick.shop.neighborhood}] — ${pick.why}`)
    .join("\n"),
);
console.log("--- packet ---");
console.log(packet);
