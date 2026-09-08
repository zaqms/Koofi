import { readFileSync } from "node:fs";
import { getShop, listDirectoryShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { filterDirectoryShops } from "../lib/directory";
import { listNewThisWeekShops, NEW_THIS_WEEK_IDS } from "../lib/new-this-week";
import { parseShopIdShape, parseVoteAction } from "../lib/upvotes-types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(parseShopIdShape("percent-arabica-hittin") === "percent-arabica-hittin", "real id shape");
assert(getShop("percent-arabica-hittin"), "real catalog shop");
assert(parseShopIdShape("  cred-al-mughrizat  ") === "cred-al-mughrizat", "trim id");
assert(parseShopIdShape("") === undefined, "empty id");
assert(parseShopIdShape("not a shop") === undefined, "spaces rejected");
assert(parseShopIdShape("../etc/passwd") === undefined, "path rejected");
assert(parseShopIdShape(12) === undefined, "number rejected");
assert(!getShop("not-a-real-shop-id"), "unknown shop is not in catalog");

assert(parseVoteAction(undefined) === "upvote", "missing action is upvote");
assert(parseVoteAction("upvote") === "upvote", "upvote action");
assert(parseVoteAction("unvote") === "unvote", "unvote action");
assert(parseVoteAction("down") === undefined, "unknown action rejected");
assert(parseVoteAction("") === undefined, "empty action rejected");

assert(copy.shopUpvote.ar === "أعجبني", "Najdi upvote label");
assert(copy.shopUpvote.en === "Upvote", "EN upvote label");
assert(!/koofi/i.test(copy.shopUpvote.ar + copy.shopUpvote.en), "upvote copy is not Koofi");
assert(
  !/koofi/i.test(copy.shopUpvoteNoStorage.ar + copy.shopUpvoteNoStorage.en),
  "storage copy is not Koofi",
);

const shops = listDirectoryShops();
const ids = shops.map((shop) => shop.id);
assert(ids.length === new Set(ids).size, "directory ids are unique");
assert(
  JSON.stringify(listDirectoryShops().map((shop) => shop.id)) === JSON.stringify(ids),
  "directory list order is stable and vote-free",
);
assert(
  filterDirectoryShops(shops, "hittin").every((shop) => shop.neighborhood === "hittin"),
  "district filter is neighborhood only",
);

const week = listNewThisWeekShops();
assert(
  week.map((shop) => shop.id).join(",") ===
    NEW_THIS_WEEK_IDS.filter((id) => getShop(id)).join(","),
  "New this week keep allowlist order",
);

const cafeCard = readFileSync("components/cafe-card.tsx", "utf8");
const cafePage = readFileSync("components/cafe-card-page.tsx", "utf8");
const cafeRoute = readFileSync("app/c/[id]/page.tsx", "utf8");
const cafeRouteEn = readFileSync("app/en/c/[id]/page.tsx", "utf8");
for (const [name, source] of [
  ["cafe-card", cafeCard],
  ["cafe-card-page", cafePage],
  ["c/[id]", cafeRoute],
  ["en/c/[id]", cafeRouteEn],
] as const) {
  assert(!source.includes("DirectoryUpvote"), `${name} must not render upvote`);
  assert(!source.includes("shopUpvote"), `${name} must not use upvote copy`);
  assert(!source.includes("cafe_upvote"), `${name} must not fire cafe_upvote`);
  assert(!source.includes("cafe_unvote"), `${name} must not fire cafe_unvote`);
}

const directoryCard = readFileSync("components/directory-card.tsx", "utf8");
assert(directoryCard.includes("DirectoryUpvote"), "directory rows render ▲");

const picker = readFileSync("lib/picker.ts", "utf8");
assert(!picker.includes("upvote"), "picker must not read upvotes");

const upvotes = readFileSync("lib/upvotes.ts", "utf8");
assert(upvotes.includes("export async function unvoteShop"), "unvoteShop exists");
assert(upvotes.includes("GREATEST(votes - 1, 0)"), "unvote never goes negative");
assert(upvotes.includes("DELETE FROM shop_vote_receipts"), "unvote deletes receipt");

const provider = readFileSync("components/shop-upvote-provider.tsx", "utf8");
assert(provider.includes('"unvote"'), "client toggles via unvote action");
assert(provider.includes("cafe_unvote"), "client tracks cafe_unvote");

const route = readFileSync("app/api/upvotes/vote/route.ts", "utf8");
assert(route.includes("parseVoteAction"), "vote route accepts action");
assert(route.includes("applyShopVote"), "vote route applies upvote or unvote");

console.log("check-upvotes: ok");
