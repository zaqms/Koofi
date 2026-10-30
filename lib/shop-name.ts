import {
  CHAIN_BRANDS,
  chainBrandSearchAliases,
  isChainBrandId,
  type ChainBrandId,
} from "./chain-brands";
import { NEIGHBORHOODS, STREET_SEARCH_ALIASES } from "./neighborhoods";
import { MEET_HALFWAY_CHIP, NEARBY_CHIP, VIBE_CHIPS } from "./product";
import { shopBrandKey } from "./shop-brand";
import type { Shop } from "./types";

/**
 * Catalog name match for a typed ask. Vibe / حي parsing stays in parse-intent.
 * Only real catalog shops. Never invent a listing.
 */

/** Latin accents fold to the bare letter ("Rémi's" → "remis", "VOÛTE" → "voute"); Arabic is untouched. */
function stripLatinAccents(text: string): string {
  return text
    .replace(/[\u00C0-\u024F]/g, (ch) => ch.normalize("NFD"))
    .replace(/[\u0300-\u036F]/g, "");
}

function normalize(text: string): string {
  return stripLatinAccents(text)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/(^|\s)ال(?=\p{L})/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesAlias(haystack: string, alias: string): boolean {
  if (!alias) return false;
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`, "u");
  return pattern.test(haystack);
}

const GENERIC_ALIASES = new Set(
  [
    "the",
    "a",
    "an",
    "and",
    "و",
    "of",
    "at",
    "in",
    "for",
    "to",
    "by",
    "just",
    "al",
    "el",
    "cafe",
    "café",
    "caffe",
    "caffé",
    "coffee",
    "coffe",
    "cofee",
    "kofi",
    "kofe",
    "koffee",
    "qahwa",
    "qahwah",
    "kahwa",
    "gahwa",
    "roaster",
    "roastery",
    "roasters",
    "roastry",
    "specialty",
    "speciality",
    "bar",
    "house",
    "factory",
    "downtown",
    "lab",
    "co",
    "company",
    "riyadh",
    "digital",
    "city",
    "boulevard",
    "promenade",
    "sport",
    "estate",
    "plus",
    "one",
    "two",
    "first",
    "good",
    "new",
    "get",
    "up",
    "best",
    "قهوه",
    "قهوة",
    "قهاوي",
    "مقهى",
    "محمصه",
    "محامص",
    "كافيه",
    "كافية",
    "كافي",
    // Cafe-type words, not a brand. «كوفي» inside كوستا كوفي / درايف كوفي must not name the chain.
    "كوفي",
    "كوفيه",
    "كوفه",
    "مختصه",
    "بن",
    "فنجان",
  ].map((token) => normalize(token)).filter(Boolean),
);

const NEIGHBORHOOD_ALIASES = new Set(
  [
    ...Object.values(NEIGHBORHOODS).flatMap((place) => [
      place.id,
      place.en,
      place.ar,
      ...place.aliases,
    ]),
    // Streets are not districts, but the bare word still must not pin one café.
    ...Object.values(STREET_SEARCH_ALIASES).flatMap((place) => [
      place.en,
      place.ar,
      ...place.aliases,
    ]),
  ]
    .map((alias) => normalize(alias))
    .filter(Boolean),
);

const CHIP_ASKS = new Set(
  [...VIBE_CHIPS, NEARBY_CHIP, MEET_HALFWAY_CHIP]
    .flatMap((chip) => [chip.en, chip.ar])
    .map((label) => normalize(label))
    .filter(Boolean),
);

function isBlockedAlias(alias: string): boolean {
  if (!alias) return true;
  if (GENERIC_ALIASES.has(alias)) return true;
  if (NEIGHBORHOOD_ALIASES.has(alias)) return true;
  return false;
}

function tokens(text: string): string[] {
  return text.split(/[\s-]+/).filter(Boolean);
}

function distinctiveTokens(text: string): string[] {
  return tokens(text).filter((token) => !isBlockedAlias(token));
}

function stripNeighborhoodSuffix(id: string, neighborhood: string): string {
  const suffix = `-${neighborhood}`;
  return id.endsWith(suffix) ? id.slice(0, -suffix.length) : id;
}

function possessiveBases(name: string): string[] {
  return [...name.matchAll(/[\p{L}\p{N}]+(?=['’]s\b)/giu)].map((match) =>
    normalize(match[0] ?? ""),
  );
}

/**
 * Extra aliases the listing row does not generate.
 * Looked up by shop.id and by shopBrandKey so every branch of a brand
 * gets the same extras (Breehant Olaya + Yasmin both get بريهانت).
 * Known misspellings / Arabic-script names only. Not a fuzzy ranker.
 */
const EXTRA_ALIASES: Record<string, readonly string[]> = {
  breehant: ["بريهانت", "بريهنت", "breeahant"],
  "percent-arabica": ["percent", "arabica", "%", "ارابيكا"],
  "btw-olaya": ["btw"],
  "one-gram-sulimaniyah": ["one gram"],
  "sand-clock": ["ساعة الرمل"],
  "house-of-matcha": ["هاوس اوف ماتشا"],
  somatcha: ["سو ماتشا", "so matcha"],
  "the-matcha-bar-olaya": ["ذا ماتشا بار"],
  "with-heart-diriyah": ["ويث هارت"],
  "remis-matcha-club-hittin": ["ريمي"],
  "okawa-cafe-al-malqa": ["okawa", "اوكاوا"],
  "okawa-al-narjis": ["okawa", "اوكاوا"],
  "okawa-olaya": ["okawa", "اوكاوا"],
  "okawa-king-fahd": ["okawa", "اوكاوا"],
  "re-matcha-al-hamra": ["ري ماتشا"],
  "flow-matcha-at-taawun": ["فلو"],
  "hokkaido-al-hamra": ["هوكايدو"],
  "happyland-matcha-diriyah": ["هابي لاند"],
  "salam-cafe-al-malqa": ["قهوة سلام", "salam cafe"],
  "dr-cafe": ["د.كيف", "د كيف", "dr cafe", "drcafe", "dr.cafe"],
  // Brand spelling is ايزرت. إسرت is the previous catalog form.
  essert: ["إسرت"],
  // Catalog name is إرا; locals also type ايرا / إيرا (#247 QA L4).
  "era-coffee-as-suwaidi": ["ايرا", "إيرا"],
  // Catalog spelling is اوستريتش. اوستريتيش is the other spelling people type.
  "ostrich-al-falah": ["اوستريتيش"],
  // Batch G: نفل is also the حي token (النفل), so the full name needs to be an explicit alias (same as قهوة سلام).
  "nafel-coffee-an-nafal": ["قهوة نفل", "nafel coffee"],
  // Batch I r2: Starbucks at The Plaza (King Abdullah Rd), so "starbucks the plaza" / «ستاربكس بلازا» find this branch first.
  // r3 (#257 QA M1): brand-qualified only; bare "plaza" is a generic / other-venue word and must not pin a chain.
  "starbucks-the-plaza-al-rahmaniyyah": ["starbucks the plaza", "starbucks plaza", "ستاربكس ذا بلازا", "ستاربكس بلازا"],
  // Batch J: three Starbucks in Al Mathar, named by real location. Brand-qualified only (no bare panorama / mall / tafaseel /
  // takhassusi alias), so a generic or other-venue ask never pins a chain; "starbucks panorama" still finds Panorama Mall.
  "starbucks-panorama-al-mathar": ["starbucks panorama", "starbucks panorama mall", "ستاربكس بانوراما", "ستاربكس بانوراما مول"],
  "starbucks-tafaseel-al-mathar": ["starbucks tafaseel", "ستاربكس تفاصيل"],
  "starbucks-takhassusi-al-mathar": ["starbucks takhassusi", "starbucks al takhassusi", "starbucks takhassusi street", "ستاربكس التخصصي", "ستاربكس شارع التخصصي"],
  // Batch J: Peet's at Euromarché (Al Takhassusi).
  "peets-euromarche-al-mathar": ["peets euromarche", "peets coffee euromarche", "بيتس يورومارشيه", "بيتس كوفي يورومارشيه"],
  // Batch J other adds: Google lists ديسم, the sign says DISAM.
  "disam-al-narjis": ["disam", "ديسم", "disam cafe", "ديسم كافيه"],
  "the-hat-as-salam": ["the hat", "ذا هات", "the hat coffee", "ذا هات كافيه"],
  // Batch K (12 Oct): brand-qualified only. Bare "oruba" / "square" / «العروبة» never pin the chain; bare "archi" keeps the older rows first.
  "starbucks-oruba-square-umm-al-hamam-al-gharbi": ["starbucks oruba", "starbucks oruba square", "starbucks urubah", "ستاربكس العروبة", "ستاربكس العروبة سكوير", "ستاربكس عروبة سكوير"],
  "archi-umm-al-hamam-al-gharbi": ["archi umm al hamam", "ارتشي ام الحمام"],
  // Batch L (13 Oct): Fill («ملء», earlier read as Sill) still shows as DRIPORA CAFE on Google (same placeId); brand-qualified only, bare fill / sill / سيل / ملء are everyday words. Sill and DRIPORA stay as aliases.
  "fill-umm-al-hamam-ash-sharqi": ["fill cafe", "fill coffee", "fill umm al hamam", "sill cafe", "sill coffee", "sill umm al hamam", "مقهى سيل", "سيل كافيه", "مقهى ملء", "ملء للقهوة المختصة", "dripora", "dripora cafe", "دريبورا", "دريبورا كافيه"],
  "molten-umm-al-hamam-ash-sharqi": ["molten cafe", "molten coffee", "molten umm al hamam", "مولتن كافيه"],
  "elixir-bunn-umm-al-hamam-ash-sharqi": ["elixir umm al hamam", "elixir bunn umm al hamam", "اكسير ام الحمام"],
  // Batch M (14 Oct 2026): brand-qualified Starbucks branch aliases only — bare safarat/oud/square stay unpinned.
  "starbucks-safarat-diplomatic-quarter": ["starbucks safarat", "starbucks diplomatic quarter", "starbucks dq", "ستاربكس السفارات", "ستاربكس الحي الدبلوماسي"],
  "starbucks-oud-square-diplomatic-quarter": ["starbucks oud", "starbucks oud square", "ستاربكس العود", "ستاربكس ساحة العود"],
  // Batch N (15 Oct 2026): brand-qualified only. Bare filter / angel / crete / address / door / porta / jadeel never pin a café.
  "filter-cafe-dhahrat-laban": ["filter cafe", "filter coffee", "filter roastery", "فلتر كافيه", "فلتر كافية"],
  "veloce-dhahrat-laban": ["veloce dhahrat", "veloce laban", "فيلوتشي ظهرة لبن", "فيلوتشي لبن"],
  "nakhat-almashrub-dhahrat-laban": ["nakhat almashrub", "نكهة المشروب", "نكهه المشروب"],
  "crete-cafe-dhahrat-laban": ["crete cafe", "crete coffee", "كريت كافية", "كريت كافيه"],
  "arco-coffee-dhahrat-laban": ["arco dhahrat", "arco laban", "arco coffee laban", "أركو ظهرة لبن", "اركو لبن"],
  "coffee-address-najd-dhahrat-laban": ["coffee address najd", "address najd", "عنوان القهوة نجد", "عنوان القهوه نجد"],
  "angel-coffee-dhahrat-laban": ["angel coffee", "angel cafe", "انجل كوفي", "انجل كافيه"],
  "ezwa-cafe-dhahrat-laban": ["ezwa cafe", "عزوة كافيه"],
  "sidedoor-dhahrat-laban": ["sidedoor", "side door", "سايد دور", "سايددور"],
  "portafilter-dhahrat-laban": ["portafilter", "porta filter", "بورتافلتر", "بورتا فلتر", "بورتافلتر كافية"],
  "qasura-coffee-dhahrat-laban": ["qasura coffee", "قسورة كوفي", "قسوره كوفي"],
  "shafel-coffee-dhahrat-laban": ["shafel dhahrat", "shafel laban", "شفل ظهرة لبن", "شفل لبن"],
  "yabub-coffee-dhahrat-laban": ["yabub coffee", "يعبوب قهوة", "يعبوب كافية"],
  "jadeel-coffee-dhahrat-laban": ["jadeel dhahrat", "jadeel laban", "جديل ظهرة لبن", "جديل لبن"],
  "drcafe-park-dhahrat-laban": ["dr cafe park", "drcafe park", "dr cafe laban", "د.كيف حديقة", "د كيف حديقة", "د.كيف ظهرة لبن"],
  // Batch O (16 Oct 2026): «بانديمك كوفي» is a second Google pin for the same café (alias only, not a row).
  "pandemic-coffee-namar": ["pandemic coffee", "pandemic cafe", "بانديمك كوفي", "بانديمك", "باندميك كوفي"],
  "freedom-coffee-namar": ["freedom coffee", "freedom cafe", "فريدم كافيه", "فريدم كوفي"],
  "java-cafe-namar": ["java namar", "java cafe namar", "جافا نمار"],
  // AJ add (16 Oct 2026): bare "found" is an everyday word; brand-qualified names and «فاوند» match.
  "found-ar-rabwah": ["found cafe", "found coffee", "found rabwah", "فاوند كافيه", "فاوند كوفي"],
  // Batch P (17 Oct 2026): Tuwaiq — brand-qualified names for rows whose bare word is blocked below; Quba's Places log key was "qoba".
  "ratio-speciality-tuwaiq": ["ratio tuwaiq", "ريشيو طويق"],
  "quba-tuwaiq": ["qoba", "quba cafe", "quba roasters", "قوبا كافيه", "محمصة قوبا"],
  "oldlane-tuwaiq": ["old lane", "oldlane cafe", "اولد لين"],
  "breath-tuwaiq": ["breath coffee", "breath cafe", "بريث كافيه", "بريث كوفي"],
  "lihaf-tuwaiq": ["lihaf coffee", "lihaf cafe", "لحاف قهوة", "لحاف كافيه"],
  "saaf-tuwaiq": ["saaf cafe", "saaf coffee", "سعف كافيه", "مقهى سعف", "قهوة سعف"],
  "era-coffee-tuwaiq": ["era tuwaiq", "إرا طويق"],
  "taghrid-tuwaiq": ["taghrid coffee", "تغاريد كوفي"],
  // Batch Q (18 Oct 2026): Ash Shifa — brand-qualified names for rows whose bare word is blocked below, plus per-branch names for the sibling/chain rows.
  "yamm-ash-shifa": ["yamm shifa", "يم الشفا"],
  "coffee-address-ash-shifa": ["coffee address shifa", "عنوان القهوة الشفا"],
  "folk-coffee-ash-shifa": ["folk cafe", "فوك كوفي", "فوك كافيه"],
  "light-dose-ash-shifa": ["light dose coffee", "لايت دوز"],
  "third-place-ash-shifa": ["third place cafe", "third place coffee", "thirdplace", "ثيرد بليس كافيه"],
  "butterfly-cafe-ash-shifa": ["butterfly coffee", "بترفلاي كوفي"],
  "rwy-ash-shifa": ["rwy roastery", "rwy cafe", "محمصة rwy"],
  "icon-ash-shifa": ["ayquna", "icon cafe", "icon coffee", "أيقونة كافيه", "مقهى أيقونة", "قهوة أيقونة"],
  // r2 (QA M1): sign, cups and @linor.sa read LINOR; "Lenore" spellings stay as aliases.
  "linor-ash-shifa": ["linor", "linor cafe", "linor sa", "lenore", "lenore coffee", "lenore cafe", "لينور كافيه"],
  "java-cafe-ash-shifa": ["java shifa", "java cafe shifa", "جافا الشفا"],
  "half-million-ibn-taymiyyah-ash-shifa": ["half million ibn taymiyyah", "هاف مليون ابن تيمية"],
  "half-million-tirmidhi-ash-shifa": ["half million tirmidhi", "هاف مليون الترمذي"],
  // AJ add (18 Oct 2026): bare "trace" is an everyday word; brand-qualified names and «تريس» match.
  "trace-al-mursalat": ["trace cafe", "trace coffee", "trace mursalat", "trace manual brewing bar", "تريس كافيه", "تريس كوفي", "تريس المرسلات"],
  // Trending adds (18 Oct 2026).
  "dwell-dhahrat-laban": ["dwell cafe", "dwell coffee", "دويل كافيه"],
  "in-row-al-fayha": ["in row cafe", "in row coffee", "inrow", "together in row", "ان رو", "ان رو كافيه", "إن رو كافيه"],
  "veni-al-nakheel": ["veni cafe", "veni coffee", "فيني كافيه"],
  "horus-house-olaya": ["horus house caffee", "horus house cafe", "horus cafe", "بيت حورس كافيه"],
  "espresso-culture-al-mursalat": ["espresso culture cafe", "اسبريسو كالتشر كافيه"],
  // r2 (QA M1/Low): Google and TikTok spell the brand «كلتورا»; branch + district short forms rank that branch first.
  "kultura-as-suwaidi-al-gharbi": ["كلتورا", "kultura suwaidi", "kultura suwaidi al gharbi", "كولتورا السويدي", "كولتورا السويدي الغربي", "كلتورا السويدي", "كلتورا السويدي الغربي"],
  "kultura-hittin": ["كلتورا", "كلتورا حطين"],
  "kultura-al-malqa": ["كلتورا", "كلتورا الملقا"],
  "kultura-al-rayyan": ["كلتورا", "كلتورا الريان"],
  "kultura-al-ghadeer": ["كلتورا", "كلتورا الغدير"],
  "shal-al-mohammadiyah": ["shal coffee", "shal cafe", "شال كافيه", "قهوة شال"],
  // Batch R (19 Oct 2026), Al Qadisiyah: brand-qualified names; bare tokens are blocked below.
  "tu-momento-al-qadisiyah": ["tu momento", "تو مومنتو"],
  "rewanted-al-qadisiyah": ["rewanted", "re wanted", "ري ونتد", "ريونتد"],
  "starbucks-rakaa-plaza-al-qadisiyah": ["starbucks rakaa", "ستاربكس ركاء"],
  "starbucks-tamimi-al-qadisiyah": ["starbucks tamimi", "ستاربكس التميمي"],
  // Batch S (20 Oct 2026), As Salam: branch-qualified names; bare tokens are blocked below.
  "namq-as-salam": ["namq salam", "namq as salam", "نمق السلام"],
  "bud-art-cafe-as-salam": ["bud art", "bu'd art", "buad art", "بعد آرت", "بعد ارت"],
  "heddah-roaster-as-salam": ["heddah", "heddah roaster", "محمصة حدة", "محمصة حده"],
  "sakaf-as-salam": ["sakaf", "sakaf cafe", "سكف"],
  "breehant-as-salam": ["breehant salam", "breehant as salam", "بريهانت السلام"],
  // Batch SD1 (21 Oct 2026), Al Shohda: branch-qualified names for the second BeFine / Arco
  // rows and the Granada Mall chain branches; bare tokens are blocked below.
  "befine-coffee-al-shohda": ["befine shohda", "befine shuhada", "بي فاين الشهداء"],
  // Trending adds 21 Oct: multi-branch brands get a district alias so "brand + district" pins the new branch.
  "hjeen-roasters-at-taawun": ["hjeen taawun", "hjeen at taawun", "هجين التعاون"],
  "agrio-olaya": ["agrio olaya", "اقريو العليا"],
  "arco-al-shohda": ["arco shohda", "arco shuhada", "اركو الشهداء"],
  "tahn-al-shohda": ["tahn", "tahn coffee", "طحن قهوة", "طحن قهوة مختصة"],
  "illy-cafe-granada-mall-al-shohda": ["illy", "illy cafe", "illy caffe", "ايلي", "ايللي", "ايلي كافيه"],
  // 21 Oct 2026: common short spelling.
  "black-wolf-al-shohda": ["بلاك ولف"],
  "drcafe-ash-shuhada-al-shohda": ["dr cafe shuhada", "drcafe shuhada", "dr cafe shohda", "د.كيف الشهداء", "د كيف الشهداء"],
  "drcafe-granada-mall-al-shohda": ["dr cafe granada", "drcafe granada", "dr cafe granada mall", "د.كيف غرناطة", "د كيف غرناطة", "د.كيف غرناطة مول"],
  "peets-granada-mall-al-shohda": ["peets granada", "peet's granada", "بيتس غرناطة"],
  "starbucks-granada-mall-al-shohda": ["starbucks granada", "starbucks granada mall", "ستاربكس غرناطة"],
  "half-million-al-shohda": ["half million shohda", "half million shuhada", "هاف مليون الشهداء"],
  "tim-hortons-granada-mall-al-shohda": ["tim hortons granada", "تيم هورتنز غرناطة"],
  "caribou-granada-mall-al-shohda": ["caribou granada", "كاريبو غرناطة"],
  // TRENDVERIFY-1023PM (23 Oct 2026): OPULENT / أوبلنت, Qurtubah. Google lists it as "OPULENT BAKERY&CAFE"
  // and «اوبلنت بيكري كوفي»; bare bakery / coffee words never pin it (no block needed: they are generic already).
  "opulent-qurtubah": ["opulent", "أوبلنت", "اوبلنت", "opulent bakery", "opulent bakery cafe", "opulent bakery coffee", "اوبلنت بيكري", "اوبلنت بيكري كوفي"],
  // LINKCHECK-1030 (30 Oct 2026): Cafe Tale's second Riyadh row, Al Izdihar (Uthman Ibn Affan Rd). Same brand,
  // name and logo as cafe-tale-kafd, so bare "cafe tale" / «كافي تيل» keep leading KAFD (the live row); only
  // Izdihar-named asks lead this one. Maps labels it «كوفى تيل».
  // Brand spellings both rows share (website cafetale.com; Maps «كوفى تيل»); KAFD stays first on these.
  "cafe-tale-kafd": ["cafetale", "كوفي تيل", "كافيه تيل", "tale cafe", "tale coffee", "the tale cafe", "تيل كافيه", "قهوة تيل"],
  "cafe-tale-al-izdihar": [
    "cafetale", "كوفي تيل", "كافيه تيل",
    "cafe tale izdihar", "cafe tale al-izdihar", "cafe tale azdihar", "cafe tale al azdihar", "cafetale izdihar",
    "كافي تيل الازدهار", "كافي تيل حي الازدهار", "كوفي تيل الازدهار", "كوفى تيل الازدهار", "كافيه تيل الازدهار", "قهوة تيل الازدهار", "تيل الازدهار", "tale izdihar",
  ],
};

function addAlias(into: Set<string>, raw: string): void {
  const alias = normalize(raw);
  if (!alias || isBlockedAlias(alias)) return;
  if (tokens(alias).every((token) => isBlockedAlias(token))) return;
  into.add(alias);
}

/** Extra aliases may reuse a حي token when the full phrase is the shop name. */
function addExtraAlias(into: Set<string>, raw: string): void {
  const alias = normalize(raw);
  if (!alias) return;
  if (isBlockedAlias(alias) && !alias.includes(" ")) return;
  into.add(alias);
}

/**
 * Single-word name tokens a chain row must not answer to on its own.
 * Java Time: «جافا» / "java" already name Java Cafe (`java`), and "time" / «تايم» are plain words.
 * The full name ("java time", «جافا تايم», "javatime") still matches.
 */
const CHAIN_TOKEN_BLOCK: Partial<Record<ChainBrandId, readonly string[]>> = {
  "java-time": ["java", "جافا", "time", "تايم"],
};

/** Same idea for one row: a plain word in the name that should not name the café alone. */
const SHOP_TOKEN_BLOCK: Record<string, readonly string[]> = {
  // "The Tent" is the venue; "tent" alone is not Peaks (#257 QA n4). "peaks tent" / "peaks the tent" still match.
  "peaks-the-tent-al-rahmaniyyah": ["tent"],
  // "plaza" alone is any mall or hotel called Plaza, not this Starbucks (#257 QA r2 M1).
  "starbucks-the-plaza-al-rahmaniyyah": ["plaza", "the plaza", "بلازا", "ذا بلازا"],
  // «هات» is everyday Arabic ("bring me…"), and "hat" / «ذا» alone are not this café (Batch J). "the hat" / «ذا هات» still match.
  "the-hat-as-salam": ["hat", "هات", "ذا"],
  // "L'ETO" auto-splits to a bare "l"; one letter must not pin L'ETO (Batch J r2, QA n1). "l'eto" / "leto" still match.
  "leto-caffe-al-mathar": ["l"],
  // "bake" / «بيك» alone are generic (bakery asks; «بيك» is also everyday Arabic). "robusta" / «روبيستا» / full name still match.
  "robusta-bake-al-rawdah": ["bake", "بيك"],
  // Batch K (12 Oct): everyday words and venue names never pin a café on their own; full names still match.
  "book-of-beans-umm-al-hamam-al-gharbi": ["book", "beans", "كتاب"],
  "cafe-kitsune-laysen-umm-al-hamam-al-gharbi": ["caf"],
  "tobys-estate-laysen-umm-al-hamam-al-gharbi": ["laysen", "valley"],
  "hamasat-coffee-umm-al-hamam-al-gharbi": ["همسات"],
  "mazaj-cafe-umm-al-hamam-al-gharbi": ["مزاج"],
  "shafaq-cafe-umm-al-hamam-al-gharbi": ["شفق"],
  "malmoum-cafe-umm-al-hamam-al-gharbi": ["ملموم"],
  // Batch L (13 Oct): everyday words never pin a café on their own; brand-qualified names still match.
  "fill-umm-al-hamam-ash-sharqi": ["fill", "sill", "ملء"],
  "molten-umm-al-hamam-ash-sharqi": ["molten"],
  // Batch M (14 Oct 2026): generic words from DQ names never pin a café alone.
  "pink-camel-diplomatic-quarter": ["pink", "camel", "بينك", "كاميل"],
  // QA #264: the DQ Starbucks cards carry branch suffixes; the branch words alone never pin them.
  "starbucks-safarat-diplomatic-quarter": ["safarat", "السفارات"],
  "starbucks-oud-square-diplomatic-quarter": ["oud", "العود", "square", "ساحة", "oud square", "ساحة العود"],
  "coffee-table-diplomatic-quarter": ["table", "تيبل", "ذا", "ذا تيبل"],
  // QA #262 / #264 minor: bare "ash" / «آش» are common words; "ash bloom" / «آش بلوم» still find it.
  "ash-bloom-al-nakheel": ["ash", "آش"],
  // Batch N (15 Oct 2026): everyday tokens never pin a café alone; brand-qualified names still match.
  "filter-cafe-dhahrat-laban": ["filter", "فلتر"],
  "crete-cafe-dhahrat-laban": ["crete", "كريت"],
  "angel-coffee-dhahrat-laban": ["angel", "انجل"],
  "ezwa-cafe-dhahrat-laban": ["ezwa", "عزوة", "عزوه"],
  "sidedoor-dhahrat-laban": ["side", "door", "سايد", "دور"],
  "portafilter-dhahrat-laban": ["porta", "بورتا"],
  "yabub-coffee-dhahrat-laban": ["yabub", "يعبوب"],
  "jadeel-coffee-dhahrat-laban": ["jadeel", "جديل"],
  "nakhat-almashrub-dhahrat-laban": ["nakhat", "نكهة", "نكهه"],
  "coffee-address-najd-dhahrat-laban": ["najd", "نجد"],
  "qasura-coffee-dhahrat-laban": ["qasura", "قسورة", "قسوره"],
  // Batch O (16 Oct 2026): everyday tokens never pin a café alone; brand-qualified names still match.
  "coffee-bean-tea-leaf-namar": ["bean", "tea", "leaf", "bean tea", "tea leaf", "coffee bean", "ذا", "بين", "آند", "اند", "تي", "ليف", "بين آند", "بين اند"],
  "freedom-coffee-namar": ["freedom", "فريدم"],
  // AJ add (16 Oct 2026): "found" alone ("I found…", lost & found) never pins the café.
  "found-ar-rabwah": ["found"],
  // Batch P (17 Oct 2026): everyday words never pin a Tuwaiq row alone (breath, era, ratio; لحاف blanket, تغاريد chirps; «ان في» is "that in").
  // «بريث» and «سعف» stay: each is the café's whole Arabic name (check-plg needs nameAr to match), and «بريث» is only a transliteration.
  // Ratio and Era keep their older branches (Al Yarmouk, As Suwaidi) on the bare brand word, same as Jadeel in Batch N.
  "ratio-speciality-tuwaiq": ["ratio", "ريشيو", "ratio speciality"],
  "breath-tuwaiq": ["breath"],
  "era-coffee-tuwaiq": ["era", "إرا", "ارا", "ايرا"],
  "lihaf-tuwaiq": ["lihaf", "لحاف"],
  "taghrid-tuwaiq": ["taghrid", "تغاريد"],
  "nv-coffee-tuwaiq": ["ان في", "ان", "في"],
  // Batch Q (18 Oct 2026): everyday words never pin an Ash Shifa row alone (folk, light/dose, third/place, butterfly, icon;
  // «حي» is "neighborhood", «جرعة»/«خفيفة» "dose"/"light", «بليس» "place", «ومقهى» "and café").
  // Whole Arabic names stay matchable (check-plg): «فوك», «جرعة خفيفة», «ثيرد بليس», «أيقونة حي الشفا».
  "folk-coffee-ash-shifa": ["folk"],
  "light-dose-ash-shifa": ["light", "dose", "light dose", "جرعة", "خفيفة"],
  "third-place-ash-shifa": ["third", "place", "third place", "ثيرد", "بليس"],
  "butterfly-cafe-ash-shifa": ["butterfly"],
  "rwy-ash-shifa": ["ومقهى", "ومقهى rwy"],
  "icon-ash-shifa": ["icon", "أيقونة", "حي", "أيقونة حي"],
  // AJ add (18 Oct 2026): "trace" alone (a trace of, track and trace) never pins the café.
  "trace-al-mursalat": ["trace"],
  // Trending adds (18 Oct 2026): common words never pin these cafés on their own.
  "in-row-al-fayha": ["row", "ان", "رو"],
  "horus-house-olaya": ["بيت"],
  "espresso-culture-al-mursalat": ["espresso", "اسبريسو", "culture", "كالتشر"],
  // Batch R (19 Oct 2026): «تو» ("just now"), «ري» (Re Matcha), plaza / markets / Tamimi
  // (the supermarket) are everyday tokens and never pin a single Al Qadisiyah café alone.
  "tu-momento-al-qadisiyah": ["tu", "تو", "cafe", "كافيه"],
  "rewanted-al-qadisiyah": ["ري"],
  "starbucks-rakaa-plaza-al-qadisiyah": ["plaza", "بلازا"],
  "starbucks-tamimi-al-qadisiyah": ["tamimi", "التميمي", "markets", "ماركت"],
  // Batch S (20 Oct 2026): «بعد» ("after"), «حدة» ("sharpness"), bud / art / آرت / cafe
  // are everyday tokens and never pin a single As Salam café alone.
  "bud-art-cafe-as-salam": ["bud", "bu d", "بعد", "art", "آرت", "ارت", "art cafe", "آرت كافيه", "cafe", "كافيه"],
  "heddah-roaster-as-salam": ["حدة", "حده", "حِدّة", "roaster", "محمصة"],
  // Batch SD1 (21 Oct 2026): «طحن» ("grinding"), «كوبي» ("my cup"), black / wolf / بلاك and
  // mall / مول / Granada (also the Ghirnatah district) are everyday tokens and never pin an
  // Al Shohda café alone.
  "tahn-al-shohda": ["طحن"],
  "cobee-cafe-al-shohda": ["كوبي"],
  "black-wolf-al-shohda": ["black", "wolf", "بلاك", "وولف"],
  "illy-cafe-granada-mall-al-shohda": ["mall", "مول", "granada", "غرناطة", "granada mall", "غرناطة مول", "caffè", "caffe"],
  // 21 Oct 2026: renamed to "dr.CAFE Granada Mall"; bare mall / Granada words never pin it.
  "drcafe-granada-mall-al-shohda": ["mall", "مول", "granada", "غرناطة", "granada mall", "غرناطة مول"],
  // LINKCHECK-1030: "tale" is a plain word (fairy tale); neither Cafe Tale row answers to it alone. «تيل» (Google's
  // Arabic name, «كوفى تيل») still finds KAFD as on main (#304 QA Q1 default); the Izdihar row blocks both.
  // "cafe tale" / «كافي تيل», "tale cafe" / «قهوة تيل» and the branch-named phrases still match.
  "cafe-tale-kafd": ["tale"],
  "cafe-tale-al-izdihar": ["tale", "تيل"],
};

function chainBrandIdForShop(
  shop: Pick<Shop, "id" | "nameEn" | "nameAr" | "chainBrand">,
): ChainBrandId | null {
  if (shop.chainBrand && isChainBrandId(shop.chainBrand)) return shop.chainBrand;
  const key = shopBrandKey(shop);
  return isChainBrandId(key) ? key : null;
}

export function shopNameAliases(
  shop: Pick<Shop, "id" | "nameEn" | "nameAr" | "neighborhood" | "chainBrand">,
): string[] {
  const aliases = new Set<string>();

  addAlias(aliases, shop.nameEn);
  addAlias(aliases, shop.nameAr);
  addAlias(aliases, shop.id.replace(/-/g, " "));
  addAlias(aliases, stripNeighborhoodSuffix(shop.id, shop.neighborhood).replace(/-/g, " "));
  addAlias(aliases, shopBrandKey(shop).replace(/-/g, " "));

  for (const base of possessiveBases(shop.nameEn)) addAlias(aliases, base);

  const english = distinctiveTokens(normalize(shop.nameEn));
  for (const token of english) addAlias(aliases, token);
  if (english.length >= 2) addAlias(aliases, english.slice(0, 2).join(" "));
  if (english.length) addAlias(aliases, english.join(" "));

  const arabic = distinctiveTokens(normalize(shop.nameAr));
  for (const token of arabic) addAlias(aliases, token);
  if (arabic.length >= 2) addAlias(aliases, arabic.slice(0, 2).join(" "));
  if (arabic.length) addAlias(aliases, arabic.join(" "));

  for (const extra of EXTRA_ALIASES[shop.id] ?? []) addExtraAlias(aliases, extra);
  for (const extra of EXTRA_ALIASES[shopBrandKey(shop)] ?? []) {
    addExtraAlias(aliases, extra);
  }
  const chainBrand = chainBrandIdForShop(shop);
  if (chainBrand) {
    for (const extra of chainBrandSearchAliases(chainBrand)) {
      addExtraAlias(aliases, extra);
    }
    for (const blocked of CHAIN_TOKEN_BLOCK[chainBrand] ?? []) aliases.delete(normalize(blocked));
  }
  for (const blocked of SHOP_TOKEN_BLOCK[shop.id] ?? []) aliases.delete(normalize(blocked));

  return [...aliases];
}

const CHAIN_NEGATION_MARKERS = [
  "anything but",
  "except",
  "not",
  "no",
  "ما ابي",
  "بدون",
  "غير",
  "إلا",
  "مو",
] as const;

/** Brand ids the ask tells us to leave out, such as "not starbucks". */
export function negatedChainBrandIds(raw: string): Set<ChainBrandId> {
  const haystack = normalize(raw);
  const negated = new Set<ChainBrandId>();
  if (!haystack) return negated;
  for (const id of Object.keys(CHAIN_BRANDS)) {
    if (!isChainBrandId(id)) continue;
    for (const alias of chainBrandSearchAliases(id)) {
      const needle = normalize(alias);
      if (!needle) continue;
      for (const marker of CHAIN_NEGATION_MARKERS) {
        if (includesAlias(haystack, normalize(`${marker} ${needle}`))) negated.add(id);
      }
    }
  }
  return negated;
}

function aliasScore(
  haystack: string,
  alias: string,
  shop: Pick<Shop, "nameEn" | "nameAr" | "id">,
): number {
  let score = alias.length;
  if (haystack === alias) score += 80;
  if (normalize(shop.nameEn) === alias || normalize(shop.nameAr) === alias) {
    score += 40;
  }
  if (normalize(shop.id.replace(/-/g, " ")) === alias) score += 20;
  return score;
}

/**
 * Whole-ask short names like "wee" / "aim" / "ik" match.
 * Inside a longer ask, require 3+ characters so "in" / "up" stay vibe/area.
 */
function aliasUsableInAsk(haystack: string, alias: string): boolean {
  if (haystack === alias) return true;
  if (alias.includes(" ")) return true;
  if (alias.length >= 3) return true;
  return /\d/.test(alias);
}

export function matchCatalogShops<T extends Shop>(
  raw: string,
  shops: T[],
): T[] {
  const haystack = normalize(raw);
  if (!haystack) return [];
  // Whole-ask حي / chip labels stay vibe+area, even if a shop token sits inside
  // ("ash" from Ash Bloom must not steal "ash shohda").
  if (NEIGHBORHOOD_ALIASES.has(haystack) || CHIP_ASKS.has(haystack)) return [];

  const hits: { shop: T; score: number }[] = [];
  const negated = negatedChainBrandIds(raw);

  for (const shop of shops) {
    const brand = chainBrandIdForShop(shop);
    if (brand && negated.has(brand)) continue;
    let best = 0;
    for (const alias of shopNameAliases(shop)) {
      if (!aliasUsableInAsk(haystack, alias)) continue;
      if (!includesAlias(haystack, alias)) continue;
      best = Math.max(best, aliasScore(haystack, alias, shop));
    }
    if (best > 0) hits.push({ shop, score: best });
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return 0;
  });

  return hits.map((hit) => hit.shop);
}
