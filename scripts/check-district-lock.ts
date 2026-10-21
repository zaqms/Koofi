/**
 * Shoug EN+AR district lock — 21 Sep 2026.
 * HOLD until Amjad says Yalla. Soft Places stays parked.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listNeighborhoodRows } from "../lib/browse-neighborhoods";
import { listBrowseDirectoryShops, listRealShops } from "../lib/catalog";
import {
  listLiveCatalogDistrictIds,
  listLiveDistrictIds,
} from "../lib/district-dictionary";
import {
  DISTRICT_LOCK_DATE,
  lockedDistrictRows,
  lockedEnRenames,
  lockedNameEnForProductId,
  productIdForLockedId,
} from "../lib/district-lock";
import { NEIGHBORHOODS, neighborhoodLabel } from "../lib/neighborhoods";
import { districtPath } from "../lib/product";
import { listSitemapLocs } from "../lib/sitemap-xml";
import type { NeighborhoodId } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(DISTRICT_LOCK_DATE === "2026-09-21", "lock date");

const rows = lockedDistrictRows();
assert(rows.length === 130, `expected 130 locked rows, got ${rows.length}`);
assert(
  rows.filter((row) => row.status === "live").length === 47,
  "sheet live count stays 47",
);
assert(
  rows.filter((row) => row.status === "dictionary_only").length === 83,
  "sheet dictionary_only count stays 83",
);

const industrial = rows.find((row) => row.stableId === "al-industrial-new");
assert(industrial, "al-industrial-new is in the lock");
assert(industrial.seoSlug === "al-industrial-new", "industrial slug is fixed");
assert(
  !rows.some((row) => row.stableId === "al-ndustrial-new" || row.seoSlug === "al-ndustrial-new"),
  "typo slug al-ndustrial-new is gone from the lock",
);
assert(
  !readRepo("lib/types.ts").includes("al-ndustrial-new") &&
    !readRepo("lib/neighborhoods.ts").includes("al-ndustrial-new") &&
    !readRepo("data/catalog.json").includes("al-ndustrial-new"),
  "typo slug al-ndustrial-new is not in product",
);

const sharqi = rows.find((row) => row.stableId === "an-nasim-ash-sharqi");
const gharbi = rows.find((row) => row.stableId === "an-nasim-al-gharbi");
assert(sharqi?.nameEn === "An Nasim Ash Sharqi", "Naseem East EN");
assert(sharqi?.nameAr === "النسيم الشرقي", "Naseem East AR");
assert(gharbi?.nameEn === "An Nasim Al Gharbi", "Naseem West EN");
assert(gharbi?.nameAr === "النسيم الغربي", "Naseem West AR");
assert(NEIGHBORHOODS["an-nasim-ash-sharqi"], "Naseem East is in the dictionary");
assert(NEIGHBORHOODS["an-nasim-al-gharbi"], "Naseem West is in the dictionary");
assert(
  neighborhoodLabel("an-nasim-ash-sharqi", "en") === "An Nasim Ash Sharqi",
  "product EN An Nasim Ash Sharqi",
);
assert(
  neighborhoodLabel("an-nasim-al-gharbi", "en") === "An Nasim Al Gharbi",
  "product EN An Nasim Al Gharbi",
);
assert(
  neighborhoodLabel("an-nasim-ash-sharqi", "ar") === "النسيم الشرقي",
  "product AR النسيم الشرقي",
);
assert(
  neighborhoodLabel("an-nasim-al-gharbi", "ar") === "النسيم الغربي",
  "product AR النسيم الغربي",
);

const naseemEastShops = listRealShops().filter(
  (shop) => shop.neighborhood === "an-nasim-ash-sharqi",
);
const naseemWestShops = listRealShops().filter(
  (shop) => shop.neighborhood === "an-nasim-al-gharbi",
);
assert(naseemEastShops.length >= 7, "Naseem East keeps #187 shops");
assert(naseemWestShops.length >= 3, "Naseem West keeps #187 shops");

const renames = lockedEnRenames();
assert(renames.sulimaniyah === "As Sulimaniyah", "Sulimaniyah lock is As Sulimaniyah");
assert(neighborhoodLabel("sulimaniyah", "en") === "As Sulimaniyah", "product Sulimaniyah EN");
assert(neighborhoodLabel("olaya", "en") === "Al Olaya", "product Olaya EN");
assert(neighborhoodLabel("al-nakheel", "en") === "An Nakheel", "product Nakheel EN");
assert(neighborhoodLabel("al-narjis", "en") === "An Narjis", "product Narjis EN");
assert(neighborhoodLabel("al-ghadeer", "en") === "Al Ghadir", "product Ghadir EN");
assert(neighborhoodLabel("al-yarmouk", "en") === "Al Yarmuk", "product Yarmuk EN");
assert(neighborhoodLabel("al-shohda", "en") === "Ash Shuhada", "product Shuhada EN");
assert(
  neighborhoodLabel("king-fahd", "en") === "King Fahd District",
  "product King Fahd District EN",
);

for (const [id, name] of Object.entries(renames)) {
  const productId = id as NeighborhoodId;
  assert(
    neighborhoodLabel(productId, "en") === name,
    `${id} EN display is ${name}, got ${neighborhoodLabel(productId, "en")}`,
  );
}

for (const row of rows) {
  const productId = productIdForLockedId(row.stableId);
  if (!productId) continue;
  const expected = lockedNameEnForProductId(productId);
  if (!expected) continue;
  assert(
    neighborhoodLabel(productId, "en") === expected,
    `${productId} EN must match locked ${expected}`,
  );
  assert(
    neighborhoodLabel(productId, "ar") === row.nameAr,
    `${productId} AR must match locked ${row.nameAr}`,
  );
}

const liveCatalog = listLiveCatalogDistrictIds();
assert(liveCatalog.length === 66, `expected 66 district pages (Ash Shuhada folded into Ghirnatah), got ${liveCatalog.length}`);
assert(liveCatalog.includes("as-suwaidi"), "as-suwaidi is live with Alwaal Albari");
assert(listLiveDistrictIds().every((id) => liveCatalog.includes(id)), "specialty live ⊆ catalog live");

const browse = listNeighborhoodRows("en", listBrowseDirectoryShops());
assert(
  browse.every((row) => row.cafeCount > 0),
  "browse has no 0-shop destinations",
);
assert(
  browse.length === liveCatalog.length,
  "browse rows match live catalog districts",
);
assert(
  browse.some((row) => row.id === "as-suwaidi" && row.cafeCount === 8),
  "As Suwaidi is on the neighborhood index with 8 cafes (Batch D1: 7 local + dr.CAFE)",
);

const sitemap = listSitemapLocs().join("\n");
for (const id of liveCatalog) {
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`),
    `sitemap missing ${id} AR`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    `sitemap missing ${id} EN`,
  );
}
assert(
  sitemap.includes("/coffee-shops/as-suwaidi") &&
    sitemap.includes("/en/coffee-shops/as-suwaidi"),
  "sitemap lists as-suwaidi AR + EN now that it has a cafe",
);
assert(
  !sitemap.includes("al-ndustrial-new") && !sitemap.includes("al-industrial-new"),
  "sitemap does not invent industrial-new as a live destination",
);
assert(!sitemap.includes("soft-places"), "Soft Places stays parked in sitemap");

const izdihar = rows.find((row) => row.stableId === "al-izdihar");
assert(izdihar?.status === "dictionary_only", "Izdihar sheet stays dictionary_only");
assert(izdihar?.nameEn === "Al Izdihar", "Izdihar EN lock");
assert(izdihar?.nameAr === "الازدهار", "Izdihar AR lock");
assert(liveCatalog.includes("al-izdihar"), "Slant makes Al Izdihar a live catalog district");
// Batch H (9 Oct): Al Izdihar gains 7 local cafés (McCafe dropped per Amjad, r3); local-only district.
assert(
  listRealShops().filter((shop) => shop.neighborhood === "al-izdihar").map((shop) => shop.id).join(",") ===
    "slant-specialty-coffee-al-izdihar,convoy-coffee-al-izdihar,knoll-al-izdihar,steam-roastery-al-izdihar,temper-al-izdihar,katf-al-izdihar,rakiza-al-izdihar,hijana-al-izdihar",
  "Al Izdihar catalog is Slant plus the 7 Batch H rows",
);
assert(izdihar?.shopCountLive === 8, "Izdihar sheet shop_count_live is 8 after Batch H");

// Batch I (10 Oct): Ar Rahmaniyyah gains 6 cafés (4 local + Starbucks and Java Time sit-down chains); Grind Coffee dropped in r2 (rule 5).
const rahmaniyyah = rows.find((row) => row.stableId === "al-rahmaniyyah");
assert(rahmaniyyah?.nameEn === "Ar Rahmaniyyah" && rahmaniyyah?.nameAr === "الرحمانية", "Ar Rahmaniyyah EN/AR lock");
assert(rahmaniyyah?.shopCountLive === 7, "Ar Rahmaniyyah sheet shop_count_live is 7 after Batch I r2");
assert(
  listRealShops().filter((shop) => shop.neighborhood === "al-rahmaniyyah").map((shop) => shop.id).join(",") ===
    "camel-step-al-rahmaniyyah,glim-al-takhassusi,peaks-the-tent-al-rahmaniyyah,november-coffee-al-rahmaniyyah,sipology-al-rahmaniyyah,ramli-cafe-al-rahmaniyyah,starbucks-the-plaza-al-rahmaniyyah,java-time-al-rahmaniyyah",
  "Ar Rahmaniyyah catalog is Camel Step, Glim (moved off Takhassusi St), plus the 6 Batch I rows",
);

// Batch J (11 Oct): Al Mathar gains 8 cafés (4 local + 3 Starbucks and Peet's sit-down chains), plus 4 other adds elsewhere (Nafees, THE HAT, DISAM, Robusta Bake).
const mathar = rows.find((row) => row.stableId === "al-mathar");
assert(mathar?.nameEn === "Al Mathar" && mathar?.nameAr === "المعذر", "Al Mathar EN/AR lock");
assert(mathar?.shopCountLive === 9, "Al Mathar sheet shop_count_live is 9 after Batch J");
assert(
  listRealShops().filter((shop) => shop.neighborhood === "al-mathar").map((shop) => shop.id).join(",") ===
    "dust-and-verse-al-takhassusi,opinion-al-mathar,drcafe-al-mathar,richony-cafe-al-mathar,leto-caffe-al-mathar,urth-caffe-al-mathar,waynes-coffee-al-mathar,peets-euromarche-al-mathar,starbucks-panorama-al-mathar,starbucks-tafaseel-al-mathar,starbucks-takhassusi-al-mathar",
  "Al Mathar catalog is Dust & Verse (moved off Takhassusi St), Opinion and the dr.CAFE drive-through plus the 8 Batch J rows",
);
const suwaidiGharbi = rows.find((row) => row.stableId === "as-suwaidi-al-gharbi");
assert(suwaidiGharbi?.status === "dictionary_only", "as-suwaidi-al-gharbi sheet stays dictionary_only");
assert(suwaidiGharbi?.nameEn === "As Suwaidi Al Gharbi" && suwaidiGharbi?.nameAr === "السويدي الغربي", "as-suwaidi-al-gharbi EN/AR lock");
assert(suwaidiGharbi?.shopCountLive === 2, "As Suwaidi Al Gharbi sheet shop_count_live is 2 after Batch J");
assert(
  listRealShops().filter((shop) => shop.neighborhood === "as-suwaidi-al-gharbi").map((shop) => shop.id).join(",") ===
    "tul-cafe-as-suwaidi-al-gharbi,nafees-as-suwaidi-al-gharbi,kultura-as-suwaidi-al-gharbi",
  "As Suwaidi Al Gharbi catalog is Tul Cafe, Nafees and Kultúra (trending add 18 Oct)",
);
const ashShifa = rows.find((row) => row.stableId === "ash-shifa");
assert(ashShifa?.status === "dictionary_only", "ash-shifa sheet stays dictionary_only");
assert(ashShifa?.nameEn === "Ash Shifa" && ashShifa?.nameAr === "الشفا", "ash-shifa EN/AR lock");
assert(ashShifa?.shopCountLive === 13, "Ash Shifa sheet shop_count_live is 13 after Batch Q");
assert(neighborhoodLabel("ash-shifa", "en") === "Ash Shifa", "ash-shifa EN label is Ash Shifa");
assert(neighborhoodLabel("ash-shifa", "ar") === "الشفا", "ash-shifa AR label is الشفا");
assert(liveCatalog.includes("ash-shifa"), "ash-shifa is a live catalog district");
assert(listLiveDistrictIds().includes("ash-shifa"), "ash-shifa is a live specialty district");
assert(
  listRealShops().filter((shop) => shop.neighborhood === "ash-shifa").map((shop) => shop.id).join(",") ===
    "tul-cafe-ash-shifa,yamm-ash-shifa,coffee-address-ash-shifa,folk-coffee-ash-shifa,light-dose-ash-shifa,third-place-ash-shifa,butterfly-cafe-ash-shifa,rwy-ash-shifa,icon-ash-shifa,linor-ash-shifa,java-cafe-ash-shifa,half-million-ibn-taymiyyah-ash-shifa,half-million-tirmidhi-ash-shifa",
  "Ash Shifa catalog is Tul Cafe plus the 12 Batch Q rows (9 local, 3 chain)",
);
assert(
  sitemap.includes(`https://wain.lol${districtPath("ash-shifa", "ar")}`) &&
    sitemap.includes(`https://wain.lol${districtPath("ash-shifa", "en")}`),
  "sitemap lists ash-shifa AR + EN",
);

const dhahrat = rows.find((row) => row.stableId === "dhahrat-al-badiah");
assert(dhahrat?.status === "dictionary_only", "Dhahrat Al Badiah sheet stays dictionary_only");
assert(dhahrat?.nameEn === "Dhahrat Al Badiah", "Dhahrat Al Badiah EN lock");
assert(dhahrat?.nameAr === "ظهرة البديعة", "Dhahrat Al Badiah AR lock");
assert(liveCatalog.includes("dhahrat-al-badiah"), "WAY makes Dhahrat Al Badiah a live catalog district");
assert(
  listRealShops().filter((shop) => shop.neighborhood === "dhahrat-al-badiah").map((shop) => shop.id).join(",") ===
    "way-coffee-dhahrat-al-badiah",
  "Dhahrat Al Badiah catalog is WAY only",
);

// Batch L (13 Oct): Umm Al Hamam Ash Sharqi goes live with 3 local cafés; on the locked sheet (dictionary_only), slug matches the al-gharbi sibling.
{
  const id = "umm-al-hamam-ash-sharqi";
  const row = rows.find((r) => r.stableId === id);
  assert(row?.status === "dictionary_only", `${id} sheet stays dictionary_only`);
  assert(row?.nameEn === "Umm Al Hamam Ash Sharqi" && row?.nameAr === "أم الحمام الشرقي", `${id} sheet EN/AR lock`);
  assert(neighborhoodLabel(id, "en") === "Umm Al Hamam Ash Sharqi" && neighborhoodLabel(id, "ar") === "أم الحمام الشرقي", `${id} labels`);
  assert(liveCatalog.includes(id) && listLiveDistrictIds().includes(id), `${id} is a live specialty district`);
  assert(
    listRealShops().filter((shop) => shop.neighborhood === id).map((shop) => shop.id).join(",") ===
      "elixir-bunn-umm-al-hamam-ash-sharqi,fill-umm-al-hamam-ash-sharqi,molten-umm-al-hamam-ash-sharqi",
    `${id} catalog is Elixir Bunn, Fill and molten`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`) && sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    `sitemap lists ${id} AR + EN`,
  );
}

// Batch N (15 Oct): Dhahrat Laban gains 15 cafés (13 local + Veloce and dr.CAFE sit-down chains); was one ON OFF row.
{
  const id = "dhahrat-laban" as const;
  const row = rows.find((r) => r.stableId === id);
  assert(row?.status === "dictionary_only", `${id} sheet stays dictionary_only`);
  assert(row?.nameEn === "Dhahrat Laban" && row?.nameAr === "ظهرة لبن", `${id} sheet EN/AR lock`);
  assert(neighborhoodLabel(id, "en") === "Dhahrat Laban" && neighborhoodLabel(id, "ar") === "ظهرة لبن", `${id} labels`);
  assert(liveCatalog.includes(id) && listLiveDistrictIds().includes(id), `${id} is a live specialty district`);
  assert(
    listRealShops().filter((shop) => shop.neighborhood === id).map((shop) => shop.id).join(",") ===
      "on-off-coffee-dhahrat-laban,filter-cafe-dhahrat-laban,veloce-dhahrat-laban,nakhat-almashrub-dhahrat-laban,crete-cafe-dhahrat-laban,arco-coffee-dhahrat-laban,coffee-address-najd-dhahrat-laban,angel-coffee-dhahrat-laban,ezwa-cafe-dhahrat-laban,sidedoor-dhahrat-laban,portafilter-dhahrat-laban,qasura-coffee-dhahrat-laban,shafel-coffee-dhahrat-laban,yabub-coffee-dhahrat-laban,jadeel-coffee-dhahrat-laban,drcafe-park-dhahrat-laban,dwell-dhahrat-laban",
    `${id} catalog is ON OFF plus the 15 Batch N rows and Dwell (trending add 18 Oct)`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`) && sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    `sitemap lists ${id} AR + EN`,
  );
}

// Bisat batch (3 Oct): four new live districts, one cafe each. Umm Al Hamam Al Gharbi and
// As Suwaidi are on the locked sheet (dictionary_only); An Nafal and King Salman are not.
for (const [id, en, ar, shopId, onSheet] of [
  // Batch K (12 Oct): Umm Al Hamam Al Gharbi gains 12 cafés (11 local + Starbucks Oruba Square sit-down chain; Java Time dropped).
  ["umm-al-hamam-al-gharbi", "Umm Al Hamam Al Gharbi", "أم الحمام الغربي", "bisat-umm-al-hamam-al-gharbi,archi-umm-al-hamam-al-gharbi,book-of-beans-umm-al-hamam-al-gharbi,caffeination-umm-al-hamam-al-gharbi,cafe-kitsune-laysen-umm-al-hamam-al-gharbi,jaam-coffee-umm-al-hamam-al-gharbi,midway-coffee-umm-al-hamam-al-gharbi,malmoum-cafe-umm-al-hamam-al-gharbi,tobys-estate-laysen-umm-al-hamam-al-gharbi,hamasat-coffee-umm-al-hamam-al-gharbi,mazaj-cafe-umm-al-hamam-al-gharbi,shafaq-cafe-umm-al-hamam-al-gharbi,starbucks-oruba-square-umm-al-hamam-al-gharbi", true],
  // Batch G (8 Oct): An Nafal gains 15 cafés (12 local + Costa, Starbucks and dr.CAFE sit-down chains).
  ["an-nafal", "An Nafal", "النفل", "bisat-an-nafal,air-speciality-an-nafal,black-stamp-an-nafal,nafel-coffee-an-nafal,pivot-espresso-an-nafal,roastree-an-nafal,cave-cafe-an-nafal,kaseb-concept-an-nafal,hatheeth-an-nafal,percol-an-nafal,peacock-an-nafal,grotta-an-nafal,btw-an-nafal,costa-tala-mall-an-nafal,starbucks-tala-mall-an-nafal,drcafe-an-nafal", false],
  ["king-salman", "King Salman", "الملك سلمان", "rex-king-salman,tul-cafe-king-salman", false],
  // Batch D1 (4 Oct): As Suwaidi gains 7 cafés (6 local + dr.CAFE chain). Batch D3 adds Tul Cafe beside Rex on King Salman.
  ["as-suwaidi", "As Suwaidi", "السويدي", "alwaal-albari-as-suwaidi,plant-cafe-as-suwaidi,seen-cafe-as-suwaidi,hot-sip-as-suwaidi,era-coffee-as-suwaidi,naham-specialty-as-suwaidi,coffee-address-as-suwaidi,drcafe-as-suwaidi", true],
] as const) {
  const row = rows.find((r) => r.stableId === id);
  if (onSheet) {
    assert(row?.status === "dictionary_only", `${id} sheet stays dictionary_only`);
    assert(row?.nameEn === en && row?.nameAr === ar, `${id} sheet EN/AR lock`);
  } else {
    assert(!row, `${id} is not on the locked sheet`);
  }
  assert(neighborhoodLabel(id, "en") === en, `${id} EN label is ${en}`);
  assert(neighborhoodLabel(id, "ar") === ar, `${id} AR label is ${ar}`);
  assert(liveCatalog.includes(id), `${id} is a live catalog district`);
  assert(listLiveDistrictIds().includes(id), `${id} is a live specialty district`);
  assert(
    listRealShops().filter((shop) => shop.neighborhood === id).map((shop) => shop.id).join(",") === shopId,
    `${id} catalog is ${shopId} only`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`) &&
      sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    `sitemap lists ${id} AR + EN`,
  );
}

// Batch D3 (4 Oct): four new live districts, one cafe each, all on the locked sheet (dictionary_only).
for (const [id, en, ar, shopId] of [
  // As Suwaidi Al Gharbi left this loop in Batch J (Nafees added); Ash Shifa left in Batch Q (12 added). Both asserted below.
  // Batch R (19 Oct): Al Qadisiyah adds 3 local + 5 sit-down chains beside ON OFF.
  ["al-qadisiyah", "Al Qadisiyah", "القادسية", "on-off-coffee-al-qadisiyah,tu-momento-al-qadisiyah,heet-coffee-al-qadisiyah,rewanted-al-qadisiyah,peets-sheikh-jaber-al-qadisiyah,half-million-al-qadisiyah,starbucks-rakaa-plaza-al-qadisiyah,starbucks-tamimi-al-qadisiyah,tim-hortons-sheikh-jaber-al-qadisiyah"],
] as const) {
  const row = rows.find((r) => r.stableId === id);
  assert(row?.status === "dictionary_only", `${id} sheet stays dictionary_only`);
  assert(row?.nameEn === en && row?.nameAr === ar, `${id} sheet EN/AR lock`);
  assert(neighborhoodLabel(id, "en") === en, `${id} EN label is ${en}`);
  assert(neighborhoodLabel(id, "ar") === ar, `${id} AR label is ${ar}`);
  assert(liveCatalog.includes(id), `${id} is a live catalog district`);
  assert(listLiveDistrictIds().includes(id), `${id} is a live specialty district`);
  assert(
    listRealShops().filter((shop) => shop.neighborhood === id).map((shop) => shop.id).join(",") === shopId,
    `${id} catalog is ${shopId} only`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`) &&
      sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    `sitemap lists ${id} AR + EN`,
  );
}

// Batch F (5 Oct): Shubra goes live (was chain-only: dr.CAFE drive-through lane). Sheet stays dictionary_only.
{
  const id = "shubra";
  const row = rows.find((r) => r.stableId === id);
  assert(row?.status === "dictionary_only", "shubra sheet stays dictionary_only");
  assert(row?.nameEn === "Shubra" && row?.nameAr === "شبرا", "shubra sheet EN/AR lock");
  assert(neighborhoodLabel(id, "en") === "Shubra", "shubra EN label is Shubra");
  assert(neighborhoodLabel(id, "ar") === "شبرا", "shubra AR label is شبرا");
  assert(liveCatalog.includes(id), "shubra is a live catalog district");
  assert(listLiveDistrictIds().includes(id), "shubra is a live specialty district");
  assert(
    listRealShops().filter((shop) => shop.neighborhood === id).map((shop) => shop.id).sort().join(",") ===
      "address-mood-shubra,coffee-address-shubra,drcafe-shubra,eco-cup-shubra,half-million-shubra,jadeel-coffee-shubra,mhj-cafe-shubra,nasaq-shubra,samus-shubra,tim-hortons-shubra",
    "shubra catalog is dr.CAFE (lane) + the 9 Batch F rows",
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`) &&
      sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    "sitemap lists shubra AR + EN",
  );
}

const aziziyah = rows.find((row) => row.stableId === "al-aziziyah");
assert(aziziyah?.status === "dictionary_only", "Al Aziziyah sheet stays dictionary_only");
assert(aziziyah?.nameEn === "Al Aziziyah", "Al Aziziyah EN lock");
assert(aziziyah?.nameAr === "العزيزية", "Al Aziziyah AR lock");
assert(liveCatalog.includes("al-aziziyah"), "Al Aziziyah stays a live catalog district");
assert(listLiveDistrictIds().includes("al-aziziyah"), "Waqar makes Al Aziziyah a live specialty district");
assert(
  listRealShops().filter((shop) => shop.neighborhood === "al-aziziyah" && shop.catalogLane !== "drive-through").map((shop) => shop.id).join(",") ===
    "waqar-al-aziziyah,sama-cafe-al-aziziyah",
  "Al Aziziyah specialty catalog is Waqar and SAMA",
);

assert(
  !readRepo("lib/browse-neighborhoods.ts").includes("BROWSE_EN_LABELS"),
  "browse EN comes from the locked dictionary, not a label overlay",
);
assert(
  !readRepo("components/district-page.tsx").includes("ثلاث الليلة") &&
    !readRepo("components/home-landing.tsx").includes("Soft Places"),
  "Soft Places stays parked",
);

const changed: string[] = [];
for (const [id, name] of Object.entries(renames)) {
  changed.push(`${id}: ${name}`);
}
console.log(
  `check-district-lock: ok (${rows.length} locked, ${liveCatalog.length} live catalog, ${browse.length} browse rows)`,
);
console.log(`EN renames applied: ${changed.join("; ")}`);
