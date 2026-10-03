/**
 * Café raves: at most 3 researched lines per catalog slug.
 * Display copy stays short and free of promo wording. `ween` is banned
 * anywhere in lib/cafe-raves.ts. Evidence is required and never rendered.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cafeRaves, toCafeRaveLines, type CafeRave } from "../lib/cafe-raves";
import { copy } from "../lib/copy";

const REASON_MAX = 60;
/** Product names stay short enough to sit on one line beside the 18px emoji. */
const NAME_EN_MAX = 40;
const NAME_AR_MAX = 30;
const DISPLAY_FIELDS = [
  "emoji",
  "name_ar",
  "name_en",
  "reason_ar",
  "reason_en",
] as const;

/**
 * Every display-field rule runs on a matching copy, never on the shipped text:
 * NFKC (folds Arabic presentation forms), then tatweel, zero-width joiners and
 * spaces (ZWNJ/ZWJ/ZWSP/WJ/BOM) and Arabic diacritics are removed, and
 * أ/إ/آ fold to ا, ة to ه, ى to ي. So «عـرض», «مجانًا» and «اﻟﻜﻞ» match.
 */
const INVISIBLE_RE = /[\u0640\u200B-\u200D\u2060\uFEFF\u00AD]/gu;
const AR_MARKS_RE = /[\u064B-\u065F\u0670]/gu;

export function matchText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(INVISIBLE_RE, "")
    .replace(AR_MARKS_RE, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

/** Brand matching also drops spaces, hyphens, dots and underscores: "Cinna-bon", «سينا بون». */
export function squeezeText(value: string): string {
  return matchText(value).replace(/[\s\-\u2010-\u2015._·'’]+/gu, "").toLocaleLowerCase("en");
}

const AR_WORD_START = "(?<![\\p{L}\\p{N}_])";
const AR_WORD_END = "(?![\\p{L}\\p{N}_])";
const AR_PREFIX = "(?:و|ف)?(?:بال|وال|فال|كال|لل|ال|ب|ك|ل)?";
const AR_SUFFIX = "(?:هم|هن|ها|كم|كن|نا|ي|ه)?";
/**
 * Arabic promo tokens are whole words with Unicode lookaround (`\b` does not
 * treat Arabic letters as word characters). Clitic prefixes always count
 * (بخصم، الخصم، بعرض، والعروض). Possessive suffixes count for the plural and
 * discount words (عروضهم، خصمكم). Bare «عرض» also takes the promo possessives
 * عرضهم، عرضنا، عرضكم، عرضه (and هن/كن), but not «عرضي» or «عرضها», which are
 * ordinary words: «عرضي» (crosswise, as in «كيكة العرضي»), «عرضها» (its width).
 * Patterns are written in matchText() form (ة → ه, no hamza, no tanween).
 */
const AR_PROMO_RE = new RegExp(
  `${AR_WORD_START}${AR_PREFIX}(?:` +
    `(?:عروض|خصومات|خصم|تخفيضات|تخفيض|كوبون|كود)${AR_SUFFIX}` +
    `|عرض(?:هم|هن|كم|كن|نا|ه)?` +
    `|(?:مجانا|مجاني|مجانيه|ببلاش)` +
    `)${AR_WORD_END}`,
  "u",
);
/** "off" is promo unless it is the "off-menu" compound. */
const EN_PROMO_RE =
  /\boffers?\b|\bdiscounts?\b|\bdeals?\b|\bpromo\b|\bsale\b|\bfree\b|\bcoupons?\b|\bcode\b|\bbogo\b|\bbuy one,? get one\b|\boff\b(?![-\u2010\u2011\s]?menu\b)|%\s*off/i;

/** Paid placement wording. `ad` and `advert` are whole words so "addition" is fine. */
const EN_PAID_RE =
  /\bsponsored\b|\bpaid partnership\b|\bpartners?\b|\bpartnership\b|\badvert\b|\bad\b/i;
const AR_PAID_RE = new RegExp(
  `${AR_WORD_START}(?:${AR_PREFIX}(?:اعلان|اعلاني|اعلانيه|ممول|ممولة|مموله)|برعايه|برعايتهم|برعايتنا)${AR_WORD_END}`,
  "u",
);

/** URLs, domain-shaped text and @handles in visitor-facing fields. Evidence is not scanned. */
const URL_RE =
  /https?:\/\/|\bhttps?\b|www\.|\.(?:com|net|org|sa|io|co|app|lol|me|ai|store|shop|cafe|xyz)\b/i;
const HANDLE_RE = /(?<![\p{L}\p{N}_])@[\p{L}\p{N}_.]{2,}/u;

/**
 * Latin brand tokens allowed inside Arabic name/reason fields.
 * Matched as whole alphanumeric tokens, so V600 is not excused by V60.
 */
const AR_LATIN_ALLOWLIST = ["V60"] as const;

/**
 * Cinnabon spellings, matched on squeezeText() so spaces, hyphens, tatweel and
 * ZWNJ/ZWJ can't split the word ("Cinna bon", "Cinna-bon", «سينا بون», «سيـنابون»).
 * Latin allows one n, a doubled b and a plural s; Arabic covers سينابون، سنابون،
 * سينابن and سينابونز. سينامون (cinnamon) does not match.
 */
const EN_BRAND_RE = /cinn?abb?ons?/;
const AR_BRAND_RE = /سي?نابو?نز?/;

/**
 * Universal-claim stock lines ("everyone keeps mentioning it", «الكل يذكرها»)
 * and their rewordings. Matched on matchText(), at most once across the file.
 */
const STOCK_REASON_EN =
  /\b(?:everyone|everybody|every (?:visitor|reviewer|review|guest)|all (?:the )?(?:reviewers|reviews|visitors|guests)|all over the reviews)\b/i;
const STOCK_REASON_AR =
  /(?<![\p{L}\p{N}_])(?:الكل|الجميع|كل الناس|كل الزوار|كل المراجعين|كل المراجعات|كلهم|كل من زار)(?![\p{L}\p{N}_])/u;

/** Arabic-Indic (٠–٩) and Extended Arabic-Indic (۰–۹) digits; English fields use 0–9. */
const ARABIC_INDIC_DIGIT_RE = /[\u0660-\u0669\u06F0-\u06F9]/;

const WEEN_RE = /\bween\b/i;

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function valueImportsCafeRaves(source: string): boolean {
  return /^\s*import\s+(?!type\b).*cafe-raves/m.test(source);
}

function catalogIds(): Set<string> {
  const catalog = JSON.parse(read("data/catalog.json")) as {
    shops: { id: string }[];
  };
  return new Set(catalog.shops.map((shop) => shop.id));
}

/** ASCII %, Arabic ٪ (U+066A), and full-width ％ (U+FF05). */
const PERCENT_RE = /[%\u066A\uFF05]/;

function hasPercent(value: string): boolean {
  return PERCENT_RE.test(value);
}

function hasBannedBrand(value: string): boolean {
  const squeezed = squeezeText(value);
  return EN_BRAND_RE.test(squeezed) || AR_BRAND_RE.test(squeezed);
}

/**
 * «عرضة» (the ardah dance; also "width" / «عرضة لـ» "prone to") ends in ة, so it
 * is not the promo «عرضه» ("his offer"). matchText() folds ة to ه, so the
 * word is blanked before folding. «عرضه» with ه is still promo.
 */
const ARDAH_RE = new RegExp(
  `${AR_WORD_START}${AR_PREFIX}ع[\u064B-\u065F\u0670]*ر[\u064B-\u065F\u0670]*ض[\u064B-\u065F\u0670]*ة${AR_WORD_END}`,
  "gu",
);

function hasPromo(value: string): boolean {
  const text = matchText(value.normalize("NFKC").replace(INVISIBLE_RE, "").replace(ARDAH_RE, " "));
  return AR_PROMO_RE.test(text) || EN_PROMO_RE.test(text) || hasPercent(text);
}

function hasPaid(value: string): boolean {
  const text = matchText(value);
  return EN_PAID_RE.test(text) || AR_PAID_RE.test(text);
}

function hasUrl(value: string): boolean {
  return URL_RE.test(matchText(value));
}

function hasHandle(value: string): boolean {
  return HANDLE_RE.test(matchText(value));
}

function isStockReason(reasonEn: string, reasonAr: string): boolean {
  return STOCK_REASON_EN.test(matchText(reasonEn)) || STOCK_REASON_AR.test(matchText(reasonAr));
}

function normalizeName(value: string, foldCase: boolean): string {
  const collapsed = value.trim().replace(/\s+/gu, " ");
  return foldCase ? collapsed.toLocaleLowerCase("en") : collapsed;
}

/**
 * One emoji grapheme that is an actual pictograph:
 * - default-emoji pictographs (🍵, and ZWJ sequences such as 👩‍🍳), or
 * - a text-default pictograph turned emoji by VS16 U+FE0F (❤️ 🌶️ 🍽️), or
 * - a flag: exactly two regional indicators (🇸🇦).
 * ©, ®, ™ never pass, even with VS16. Bare ★ • ✔ (no VS16) and letters fail.
 */
const TEXT_SYMBOLS = new Set(["\u00A9", "\u00AE", "\u2122"]);

/** Alcohol-coded drink emoji. Kombucha stays 🥤. Looked up without VS15/VS16. */
const EMOJI_DENYLIST = new Set(["🍺", "🍻", "🍹", "🍾", "🍷", "🥂", "🍸", "🥃", "🍶"]);

export function isDeniedEmoji(value: string): boolean {
  return EMOJI_DENYLIST.has(value.trim().replace(/[\uFE0E\uFE0F]/gu, ""));
}

export function isOneEmojiGrapheme(value: string): boolean {
  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
  ];
  if (segments.length !== 1) return false;
  const grapheme = segments[0].segment;
  const chars = [...grapheme];
  if (chars.some((char) => TEXT_SYMBOLS.has(char))) return false;
  if (chars.length === 2 && chars.every((char) => /\p{Regional_Indicator}/u.test(char))) {
    return true;
  }
  if (!/\p{Extended_Pictographic}/u.test(grapheme)) return false;
  // Only emoji parts may appear: pictographs, VS16, ZWJ, skin tones, keycap, tags.
  const allowed = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|\uFE0F|\u200D|\u20E3|[\u{E0020}-\u{E007F}])$/u;
  if (!chars.every((char) => allowed.test(char))) return false;
  return /\p{Emoji_Presentation}/u.test(grapheme) || grapheme.includes("\uFE0F");
}

function formatRunDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Real calendar day, from 2015 through the run date. Later days are future. */
function evidenceDateProblem(iso: string, now: Date): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return `${iso} is not a real calendar date`;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const stamp = new Date(Date.UTC(year, month - 1, day));
  const real =
    stamp.getUTCFullYear() === year &&
    stamp.getUTCMonth() === month - 1 &&
    stamp.getUTCDate() === day;
  if (!real) return `${iso} is not a real calendar date`;
  if (stamp.getTime() < Date.UTC(2015, 0, 1)) return `${iso} is before 2015`;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (stamp.getTime() > today) return `${iso} is in the future`;
  return null;
}

function stripAllowlistedLatin(value: string): string {
  return value.replace(/[A-Za-z0-9]+/g, (token) =>
    (AR_LATIN_ALLOWLIST as readonly string[]).includes(token) ? "" : token,
  );
}

function hasArabicLetters(value: string): boolean {
  for (const char of value) {
    if (/\p{Script=Arabic}/u.test(char) && /\p{L}/u.test(char)) return true;
  }
  return false;
}

/** One dated review citation: `type YYYY-MM-DD url`. */
const SOURCE_ENTRY_RE = /^([A-Za-z][\w-]*)\s+(\d{4}-\d{2}-\d{2})\s+(https?:\/\/\S+)$/;

type SourceEntry = { type: string; date: string; url: string };

/**
 * Citations after the first colon, split on `;`.
 * Each one must be `type YYYY-MM-DD url`. The same place URL on a
 * different date is a different review. An exact (date, url) repeat fails.
 */
function parseSourceEntries(evidence: string): {
  entries: SourceEntry[];
  undated: boolean;
  repeated: boolean;
  distinct: number;
} {
  const colon = evidence.indexOf(":");
  const body = colon === -1 ? evidence : evidence.slice(colon + 1);
  const citations = body
    .split(";")
    .map((citation) => citation.trim())
    .filter(Boolean);
  const entries: SourceEntry[] = [];
  let undated = false;
  for (const citation of citations) {
    const match = SOURCE_ENTRY_RE.exec(citation);
    if (!match) {
      undated = true;
      continue;
    }
    entries.push({ type: match[1], date: match[2], url: match[3] });
  }
  const seen = new Set<string>();
  let repeated = false;
  for (const entry of entries) {
    const key = `${entry.date}\n${entry.url}`;
    if (seen.has(key)) repeated = true;
    else seen.add(key);
  }
  return { entries, undated, repeated, distinct: seen.size };
}

function isCafeRave(value: unknown): value is CafeRave {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    DISPLAY_FIELDS.every((field) => typeof row[field] === "string") &&
    typeof row.evidence === "string"
  );
}

export function collectCafeRaveProblems(
  source: string,
  data: Record<string, readonly unknown[]>,
  ids: Set<string>,
  now = new Date(),
): string[] {
  const problems: string[] = [];
  if (WEEN_RE.test(source)) {
    problems.push("file contains ween as a whole word");
  }

  let stockReasonItems = 0;
  for (const [slug, items] of Object.entries(data)) {
    if (!ids.has(slug)) {
      problems.push(`${slug}: key is not a catalog slug`);
    }
    if (!Array.isArray(items)) {
      problems.push(`${slug}: value is not a list`);
      continue;
    }
    if (items.length > 3) {
      problems.push(`${slug}: at most 3 items (${items.length})`);
    }
    const seenEn = new Set<string>();
    const seenAr = new Set<string>();
    items.forEach((item, index) => {
      const where = `${slug}[${index}]`;
      if (!isCafeRave(item)) {
        problems.push(`${where}: expected emoji, names, reasons, and evidence`);
        return;
      }
      for (const field of DISPLAY_FIELDS) {
        const value = item[field].trim();
        if (!value) {
          problems.push(`${where}: ${field} is empty`);
          continue;
        }
        if (hasPromo(value)) {
          problems.push(`${where}: ${field} has promo or offer wording`);
        }
        if (hasBannedBrand(value)) {
          problems.push(`${where}: ${field} names a banned brand`);
        }
        if (hasPaid(value)) {
          problems.push(`${where}: ${field} has paid wording`);
        }
        if (hasUrl(value)) {
          problems.push(`${where}: ${field} has a URL or domain`);
        }
        if (hasHandle(value)) {
          problems.push(`${where}: ${field} has an @handle`);
        }
      }
      if (item.emoji.trim() && !isOneEmojiGrapheme(item.emoji.trim())) {
        problems.push(`${where}: emoji must be exactly one emoji`);
      }
      if (isDeniedEmoji(item.emoji)) {
        problems.push(`${where}: emoji is on the denylist`);
      }
      const nameEn = [...item.name_en].length;
      const nameAr = [...item.name_ar].length;
      if (nameEn > NAME_EN_MAX) {
        problems.push(`${where}: name_en is over ${NAME_EN_MAX} characters (${nameEn})`);
      }
      if (nameAr > NAME_AR_MAX) {
        problems.push(`${where}: name_ar is over ${NAME_AR_MAX} characters (${nameAr})`);
      }
      if (hasArabicLetters(item.name_en) || hasArabicLetters(item.reason_en)) {
        problems.push(`${where}: English fields contain Arabic letters`);
      }
      if (
        ARABIC_INDIC_DIGIT_RE.test(item.name_en) ||
        ARABIC_INDIC_DIGIT_RE.test(item.reason_en)
      ) {
        problems.push(`${where}: English fields contain Arabic-Indic digits`);
      }
      // \p{Script=Latin} also catches accented letters such as é and ñ.
      if (
        /\p{Script=Latin}/u.test(stripAllowlistedLatin(item.name_ar)) ||
        /\p{Script=Latin}/u.test(stripAllowlistedLatin(item.reason_ar))
      ) {
        problems.push(
          `${where}: Arabic fields contain Latin letters outside ${AR_LATIN_ALLOWLIST.join(", ")}`,
        );
      }
      const enKey = normalizeName(item.name_en, true);
      const arKey = normalizeName(item.name_ar, false);
      if (enKey) {
        if (seenEn.has(enKey)) problems.push(`${where}: duplicate normalized name_en`);
        else seenEn.add(enKey);
      }
      if (arKey) {
        if (seenAr.has(arKey)) problems.push(`${where}: duplicate normalized name_ar`);
        else seenAr.add(arKey);
      }
      if (!item.evidence.trim()) problems.push(`${where}: evidence is empty`);
      const sources = /^(\d+)\s+sources\b/.exec(item.evidence.trim());
      const parsed = parseSourceEntries(item.evidence);
      const claimed = sources ? Number(sources[1]) : null;
      if (parsed.undated) problems.push(`${where}: evidence has an undated entry`);
      if (parsed.repeated) problems.push(`${where}: evidence repeats a dated entry`);
      for (const entry of parsed.entries) {
        const dateProblem = evidenceDateProblem(entry.date, now);
        if (dateProblem) problems.push(`${where}: evidence date ${dateProblem}`);
      }
      if (claimed === null || parsed.distinct < 3) {
        problems.push(`${where}: evidence needs at least 3 dated sources`);
      }
      if (claimed !== null && claimed !== parsed.distinct) {
        problems.push(
          `${where}: claimed ${claimed} sources but ${parsed.distinct} dated sources`,
        );
      }
      if ([...item.reason_ar].length > REASON_MAX) {
        problems.push(`${where}: reason_ar is over ${REASON_MAX} characters`);
      }
      if ([...item.reason_en].length > REASON_MAX) {
        problems.push(`${where}: reason_en is over ${REASON_MAX} characters`);
      }
      if (isStockReason(item.reason_en, item.reason_ar)) {
        stockReasonItems += 1;
      }
    });
  }
  if (stockReasonItems > 1) {
    problems.push(
      `stock reason appears ${stockReasonItems} times; universal claims (everyone … / الكل …) at most once`,
    );
  }

  return problems;
}

function selfTest(ids: Set<string>): void {
  assert(!WEEN_RE.test("between"), "ween check is a whole word");
  assert(WEEN_RE.test("Ween"), "ween check is case-insensitive");

  const clean: CafeRave = {
    emoji: "🍵",
    name_ar: "ماتشا فراولة",
    name_en: "Strawberry Matcha",
    reason_ar: "اللي الكل يذكره.",
    reason_en: "The one everyone keeps mentioning.",
    evidence:
      "3 sources: google_review 2026-01-01 https://exa.ai/a ; google_review 2026-02-02 https://exa.ai/b ; google_review 2026-03-03 https://example.com/c",
  };
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [clean] }, ids).length ===
      0,
    "a short researched line passes",
  );
  const line = toCafeRaveLines([clean], "en")[0];
  assert(line?.name === "Strawberry Matcha", "EN line uses name_en");
  assert(!("evidence" in (line ?? {})), "display lines drop evidence");
  assert(
    !JSON.stringify(toCafeRaveLines([clean], "ar")).includes(clean.evidence),
    "evidence is not in the display payload",
  );

  const offer: CafeRave = {
    ...clean,
    name_en: "Weekend offer",
  };
  const bad = {
    "namq-al-malqa": [offer, clean, clean, clean],
  };
  const badSource = `// ween must not appear\n${JSON.stringify(bad)}`;
  const problems = collectCafeRaveProblems(badSource, bad, ids);
  assert(
    problems.some((problem) => problem.includes("at most 3")),
    `bad fixture should fail on 4 items: ${problems.join("; ")}`,
  );
  assert(
    problems.some((problem) => problem.includes("promo or offer wording")),
    `bad fixture should fail on offer wording: ${problems.join("; ")}`,
  );
  assert(
    problems.some((problem) => problem.includes("ween")),
    `bad fixture should fail on ween: ${problems.join("; ")}`,
  );
  console.log(
    `check-cafe-raves: bad fixture rejected (${problems.length} problems: 4 items, offer wording, ween)`,
  );

  const percentOff: CafeRave = {
    ...clean,
    name_en: "Coffee 20% off",
  };
  const percentOffProblems = collectCafeRaveProblems(
    "clean",
    { "namq-al-malqa": [percentOff] },
    ids,
  );
  assert(
    percentOffProblems.some((problem) => problem.includes("promo or offer wording")),
    `Coffee 20% off should be rejected: ${percentOffProblems.join("; ")}`,
  );

  const cocoa: CafeRave = {
    ...clean,
    name_ar: "هوت شوكلت 70%",
    name_en: "70% Hot Chocolate",
  };
  const cocoaProblems = collectCafeRaveProblems("clean", { "namq-al-malqa": [cocoa] }, ids);
  assert(
    cocoaProblems.some((problem) => problem.includes("promo or offer wording")),
    `70% Hot Chocolate should be rejected: ${cocoaProblems.join("; ")}`,
  );
  const reasonPercent: CafeRave = {
    ...clean,
    reason_en: "About 70% cocoa.",
  };
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [reasonPercent] }, ids).some(
      (problem) => problem.includes("reason_en"),
    ),
    "% stays banned in reason lines",
  );
  const thinEvidence: CafeRave = { ...clean, evidence: "2 sources, too thin" };
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [thinEvidence] }, ids).some(
      (problem) => problem.includes("at least 3 dated sources"),
    ),
    "evidence must include at least 3 dated sources",
  );
  console.log("check-cafe-raves: percent-off rejected; 70% Hot Chocolate rejected; thin evidence rejected");

  for (const [field, value] of [
    ["name_ar", "هوت شوكلت ٢٠\u066A"],
    ["name_en", "70\uFF05 Hot Chocolate"],
  ] as const) {
    const percentProblems = collectCafeRaveProblems(
      "clean",
      { "namq-al-malqa": [{ ...clean, [field]: value }] },
      ids,
    );
    assert(
      percentProblems.some((problem) => problem.includes("promo or offer wording")),
      `"${value}" should be rejected: ${percentProblems.join("; ")}`,
    );
  }
  console.log("check-cafe-raves: Arabic ٪ and full-width ％ rejected");

  const stockTwice = collectCafeRaveProblems(
    "clean",
    {
      "namq-al-malqa": [clean],
      "nap-al-qirawan": [{ ...clean, name_en: "Another Cake", name_ar: "كيكة ثانية" }],
    },
    ids,
  );
  assert(
    stockTwice.some((problem) => problem.includes("stock reason appears")),
    `the stock reason should fail on a second item: ${stockTwice.join("; ")}`,
  );
  console.log("check-cafe-raves: stock reason rejected when it appears twice");

  const brand: CafeRave = {
    ...clean,
    name_en: "Cinnabon Pecan",
    name_ar: "سينابون بيكان",
  };
  const brandProblems = collectCafeRaveProblems("clean", { "cherie-al-muruj": [brand] }, ids);
  assert(
    brandProblems.some((problem) => problem.includes("name_en names a banned brand")) &&
      brandProblems.some((problem) => problem.includes("name_ar names a banned brand")),
    `Cinnabon should be rejected: ${brandProblems.join("; ")}`,
  );
  const cinnamon: CafeRave = {
    ...clean,
    name_en: "Pecan Cinnamon Roll",
    name_ar: "سينامون رول بالبيكان",
    reason_en: "People often order it.",
    reason_ar: "ينطلب كثير.",
  };
  assert(
    collectCafeRaveProblems("clean", { "cherie-al-muruj": [cinnamon] }, ids).length === 0,
    "Pecan Cinnamon Roll is not the banned brand",
  );
  console.log("check-cafe-raves: Cinnabon rejected; Pecan Cinnamon Roll allowed");

  for (const name of ["Cinabon", "Cinnabons", "cInAbOn"]) {
    const variantProblems = collectCafeRaveProblems(
      "clean",
      { "cherie-al-muruj": [{ ...clean, name_en: name }] },
      ids,
    );
    assert(
      variantProblems.some((problem) => problem.includes("names a banned brand")),
      `"${name}" should be rejected: ${variantProblems.join("; ")}`,
    );
  }
  for (const name of ["سنابون", "سينابن", "السينابون"]) {
    const variantProblems = collectCafeRaveProblems(
      "clean",
      { "cherie-al-muruj": [{ ...clean, name_ar: name }] },
      ids,
    );
    assert(
      variantProblems.some((problem) => problem.includes("names a banned brand")),
      `"${name}" should be rejected: ${variantProblems.join("; ")}`,
    );
  }
  const cinnamonRoll: CafeRave = {
    ...clean,
    name_en: "Cinnamon Roll",
    name_ar: "سينامون رول",
    reason_en: "Often praised in reviews.",
    reason_ar: "ينمدح كثير في المراجعات.",
  };
  assert(
    collectCafeRaveProblems("clean", { "eya-specialty-coffee-al-wurud": [cinnamonRoll] }, ids)
      .length === 0,
    "Cinnamon Roll / سينامون رول is not the banned brand",
  );
  console.log(
    "check-cafe-raves: Cinabon, Cinnabons, سينابون, سنابون, and سينابن rejected; سينامون رول allowed",
  );

  const repeatedEntry: CafeRave = {
    ...clean,
    evidence:
      "3 sources: google_review 2026-01-01 https://example.com/place ; google_review 2026-01-01 https://example.com/place ; google_review 2026-03-03 https://example.com/other",
  };
  const repeatedProblems = collectCafeRaveProblems(
    "clean",
    { "namq-al-malqa": [repeatedEntry] },
    ids,
  );
  assert(
    repeatedProblems.some((problem) => problem.includes("repeats a dated entry")),
    `an exact repeated entry should fail: ${repeatedProblems.join("; ")}`,
  );
  console.log("check-cafe-raves: exact repeated entry rejected");

  const undatedEntry: CafeRave = {
    ...clean,
    evidence:
      "3 sources: google_review https://example.com/a ; google_review 2026-02-02 https://example.com/b ; google_review 2026-03-03 https://example.com/c",
  };
  const undatedProblems = collectCafeRaveProblems(
    "clean",
    { "namq-al-malqa": [undatedEntry] },
    ids,
  );
  assert(
    undatedProblems.some((problem) => problem.includes("undated entry")),
    `an undated entry should fail: ${undatedProblems.join("; ")}`,
  );
  console.log("check-cafe-raves: undated entry rejected");

  const claimedMismatch: CafeRave = {
    ...clean,
    evidence:
      "4 sources: google_review 2026-01-01 https://example.com/a ; google_review 2026-02-02 https://example.com/b ; google_review 2026-03-03 https://example.com/c",
  };
  const mismatchProblems = collectCafeRaveProblems(
    "clean",
    { "namq-al-malqa": [claimedMismatch] },
    ids,
  );
  assert(
    mismatchProblems.some((problem) => problem.includes("claimed 4 sources but 3 dated sources")),
    `a claimed-count mismatch should fail: ${mismatchProblems.join("; ")}`,
  );
  console.log("check-cafe-raves: claimed-count mismatch rejected");

  const sameUrlDifferentDates: CafeRave = {
    ...clean,
    evidence:
      "3 sources: google_review 2026-01-01 https://example.com/place ; google_review 2026-02-02 https://example.com/place ; google_review 2026-03-03 https://example.com/place",
  };
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [sameUrlDifferentDates] }, ids).length ===
      0,
    "the same URL on different dates is three sources",
  );
  console.log("check-cafe-raves: same URL with different dates allowed");

  function dated(evidence: string): string[] {
    return collectCafeRaveProblems("clean", { "namq-al-malqa": [{ ...clean, evidence }] }, ids);
  }
  const runDate = formatRunDate(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = formatRunDate(tomorrowDate);
  for (const badDate of ["2026-02-31", "2025-02-29", "2026-13-01"]) {
    const dateProblems = dated(
      `3 sources: google_review ${badDate} https://example.com/a ; google_review 2026-01-02 https://example.com/b ; google_review 2026-01-03 https://example.com/c`,
    );
    assert(
      dateProblems.some((problem) => problem.includes(`${badDate} is not a real calendar date`)),
      `${badDate} should be rejected: ${dateProblems.join("; ")}`,
    );
  }
  const futureProblems = dated(
    `3 sources: google_review ${tomorrow} https://example.com/a ; google_review 2026-01-02 https://example.com/b ; google_review 2026-01-03 https://example.com/c`,
  );
  assert(
    futureProblems.some((problem) => problem.includes(`${tomorrow} is in the future`)),
    `a future evidence date should fail: ${futureProblems.join("; ")}`,
  );
  const earlyProblems = dated(
    "3 sources: google_review 2014-12-31 https://example.com/a ; google_review 2026-01-02 https://example.com/b ; google_review 2026-01-03 https://example.com/c",
  );
  assert(
    earlyProblems.some((problem) => problem.includes("2014-12-31 is before 2015")),
    `a pre-2015 evidence date should fail: ${earlyProblems.join("; ")}`,
  );
  for (const okDate of ["2024-02-29", "2015-01-01", runDate]) {
    const okProblems = dated(
      `3 sources: google_review ${okDate} https://example.com/a ; google_review 2026-01-02 https://example.com/b ; google_review 2026-01-03 https://example.com/c`,
    );
    assert(
      okProblems.length === 0,
      `${okDate} should be a valid evidence date: ${okProblems.join("; ")}`,
    );
  }
  console.log(
    "check-cafe-raves: impossible, future, and pre-2015 evidence dates rejected",
  );

  const contained: CafeRave = { ...clean, reason_ar: "معروض على الطاولة." };
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [contained] }, ids).length === 0,
    "معروض contains عرض but is not the promo word",
  );
  const realOffer: CafeRave = { ...clean, reason_ar: "في عرض اليوم." };
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [realOffer] }, ids).some((problem) =>
      problem.includes("promo or offer wording"),
    ),
    "a standalone عرض is still promo wording",
  );
  for (const reason of ["بخصم", "الخصم", "عروضهم", "بعرض", "والعروض"]) {
    const cliticProblems = collectCafeRaveProblems(
      "clean",
      { "namq-al-malqa": [{ ...clean, reason_ar: reason }] },
      ids,
    );
    assert(
      cliticProblems.some((problem) => problem.includes("promo or offer wording")),
      `"${reason}" should be rejected: ${cliticProblems.join("; ")}`,
    );
  }
  for (const reason of ["Weekend offers", "Two deals", "A discount today"]) {
    const enPromoProblems = collectCafeRaveProblems(
      "clean",
      { "namq-al-malqa": [{ ...clean, reason_en: reason }] },
      ids,
    );
    assert(
      enPromoProblems.some((problem) => problem.includes("promo or offer wording")),
      `"${reason}" should be rejected: ${enPromoProblems.join("; ")}`,
    );
  }
  for (const reason of ["A special offering.", "The dealership is nearby."]) {
    const allowedPromo = collectCafeRaveProblems(
      "clean",
      { "namq-al-malqa": [{ ...clean, reason_en: reason }] },
      ids,
    );
    assert(
      allowedPromo.length === 0,
      `"${reason}" should stay allowed: ${allowedPromo.join("; ")}`,
    );
  }
  console.log(
    "check-cafe-raves: بخصم، الخصم، عروضهم، offers, deals, and discount rejected; معروض and offering allowed",
  );

  function problemsFor(row: CafeRave, extra?: CafeRave): string[] {
    return collectCafeRaveProblems(
      "clean",
      { "namq-al-malqa": extra ? [row, extra] : [row] },
      ids,
    );
  }

  const duplicate = problemsFor(clean, {
    ...clean,
    emoji: "🍪",
    name_en: "  strawberry   matcha ",
    name_ar: "ماتشا   فراولة",
  });
  assert(
    duplicate.some((problem) => problem.includes("duplicate normalized name_en")) &&
      duplicate.some((problem) => problem.includes("duplicate normalized name_ar")),
    `duplicate names should fail: ${duplicate.join("; ")}`,
  );
  console.log("check-cafe-raves: duplicate normalized EN and AR names rejected");

  const longEn = problemsFor({ ...clean, name_en: "A".repeat(NAME_EN_MAX + 1) });
  assert(
    longEn.some((problem) => problem.includes(`name_en is over ${NAME_EN_MAX}`)),
    `EN name over ${NAME_EN_MAX} should fail: ${longEn.join("; ")}`,
  );
  const longAr = problemsFor({ ...clean, name_ar: "م".repeat(NAME_AR_MAX + 1) });
  assert(
    longAr.some((problem) => problem.includes(`name_ar is over ${NAME_AR_MAX}`)),
    `AR name over ${NAME_AR_MAX} should fail: ${longAr.join("; ")}`,
  );
  console.log(
    `check-cafe-raves: overlong names rejected (EN max ${NAME_EN_MAX}, AR max ${NAME_AR_MAX})`,
  );

  for (const emoji of ["AB", "🍵🍵", "x"]) {
    const emojiProblems = problemsFor({ ...clean, emoji });
    assert(
      emojiProblems.some((problem) => problem.includes("exactly one emoji")),
      `"${emoji}" should fail the emoji slot: ${emojiProblems.join("; ")}`,
    );
  }
  console.log("check-cafe-raves: non-emoji slots rejected (AB, two emoji, x)");

  for (const emoji of ["©", "®", "™", "★", "•", "✔"]) {
    const symbolProblems = problemsFor({ ...clean, emoji });
    assert(
      symbolProblems.some((problem) => problem.includes("exactly one emoji")),
      `"${emoji}" should fail the emoji slot: ${symbolProblems.join("; ")}`,
    );
  }
  assert(
    problemsFor({ ...clean, emoji: "🍰" }).length === 0,
    "a pictographic emoji still passes",
  );
  console.log(
    "check-cafe-raves: © ® ™ and other non-pictographic symbols rejected",
  );

  const latinAr = problemsFor({ ...clean, name_ar: "لاتيه latte" });
  assert(
    latinAr.some((problem) => problem.includes("Latin letters")),
    `Latin in an Arabic name should fail: ${latinAr.join("; ")}`,
  );
  const v60: CafeRave = {
    ...clean,
    emoji: "☕",
    name_ar: "V60",
    name_en: "V60",
    reason_ar: "الزوار يمدحونها.",
    reason_en: "Visitors keep praising it.",
  };
  assert(
    problemsFor(v60).length === 0,
    `V60 is an allowed brand token: ${problemsFor(v60).join("; ")}`,
  );
  const arabicEn = problemsFor({ ...clean, name_en: "Matcha ماتشا" });
  assert(
    arabicEn.some((problem) => problem.includes("Arabic letters")),
    `Arabic letters in an English name should fail: ${arabicEn.join("; ")}`,
  );
  console.log("check-cafe-raves: Latin in AR rejected; V60 allowed; Arabic in EN rejected");

  for (const paid of ["Sponsored", "paid partnership", "ad", "advert", "إعلان", "ممول"]) {
    const paidProblems = problemsFor({ ...clean, reason_en: `A ${paid} line.`, reason_ar: paid });
    assert(
      paidProblems.some((problem) => problem.includes("paid wording")),
      `"${paid}" should fail as paid wording: ${paidProblems.join("; ")}`,
    );
  }
  assert(
    problemsFor({ ...clean, reason_en: "A small addition." }).length === 0,
    "the word addition is not the whole word ad",
  );
  console.log("check-cafe-raves: paid wording rejected; addition allowed");

  for (const url of ["See https://example.com", "www.example.sa", "Order at shop.com"]) {
    const urlProblems = problemsFor({ ...clean, name_en: url });
    assert(
      urlProblems.some((problem) => problem.includes("URL or domain")),
      `"${url}" should fail as a URL or domain: ${urlProblems.join("; ")}`,
    );
  }
  const evidenceUrl = problemsFor({
    ...clean,
    evidence:
      "3 sources: google_review 2026-01-01 https://exa.ai/example ; google_review 2026-02-02 https://exa.ai/other ; google_review 2026-03-03 https://cafesriyadh.com/post",
  });
  assert(evidenceUrl.length === 0, `URLs in evidence stay internal: ${evidenceUrl.join("; ")}`);
  console.log("check-cafe-raves: URLs in display text rejected; evidence URLs allowed");

  // --- #238 QA follow-ups: each rule has a positive and a negative fixture. ---
  const plain: CafeRave = { ...clean, reason_en: "Often mentioned.", reason_ar: "تنذكر كثير." };
  function rejects(row: Partial<CafeRave>, needle: string, label: string): void {
    const found = problemsFor({ ...plain, ...row });
    assert(
      found.some((problem) => problem.includes(needle)),
      `${label} should fail with "${needle}": ${found.join("; ") || "no problems"}`,
    );
  }
  function allows(row: Partial<CafeRave>, label: string): void {
    const found = problemsFor({ ...plain, ...row });
    assert(found.length === 0, `${label} should pass: ${found.join("; ")}`);
  }

  // عرض is whole-word: possessive/adjective forms are ordinary words.
  for (const word of ["عرضي", "كيكة العرضي", "عرضها", "بالعرضي"]) {
    allows({ name_ar: word }, `«${word}»`);
  }
  for (const word of ["عرض", "بعرض", "العرض", "والعرض", "عـرض", "بالعـــرض", "عَرض", "عروضنا", "خصمكم", "عرضهم", "عرضنا", "عرضكم", "عرضه"]) {
    rejects({ reason_ar: word }, "promo or offer wording", `«${word}»`);
  }
  console.log("check-cafe-raves: عرضي / كيكة العرضي / عرضها allowed; عرض بعرض العرض والعرض عـرض and عرضهم عرضنا عرضكم عرضه rejected");

  // Promo and paid additions.
  for (const word of ["خصومات", "بخصومات", "مجانًا", "مجانا", "مجاناً", "قهوة مجانية", "برعاية", "كإعلان", "كاعلان", "الإعلان"]) {
    const found = problemsFor({ ...plain, reason_ar: word });
    assert(
      found.some((problem) => problem.includes("promo or offer wording") || problem.includes("paid wording")),
      `«${word}» should fail as promo/paid: ${found.join("; ") || "no problems"}`,
    );
  }
  for (const word of ["BOGO", "bogo Friday", "Buy one get one"]) {
    rejects({ reason_en: word }, "promo or offer wording", `"${word}"`);
  }
  for (const word of ["Our Partner", "Partners pick", "partnership"]) {
    rejects({ reason_en: word }, "paid wording", `"${word}"`);
  }
  for (const word of ["Try it at wain.ai", "brew.cafe"]) {
    rejects({ name_en: word }, "URL or domain", `"${word}"`);
  }
  rejects({ reason_en: "Ask @wainlol" }, "@handle", "an @handle in EN");
  rejects({ reason_ar: "تابعهم @قهوة_الرياض" }, "@handle", "an @handle in AR");
  allows({ reason_en: "Often ordered at brunch." }, "no @handle");
  for (const [field, word] of [
    ["name_en", "Off-Menu Latte"],
    ["name_en", "Off menu cortado"],
    ["reason_en", "An off-menu favourite."],
    ["reason_en", "Partnered well with the cake."],
    ["reason_en", "A good email-worthy cake."],
    ["name_ar", "مجانين القهوة"],
  ] as const) {
    allows({ [field]: word }, `"${word}"`);
  }
  rejects({ name_en: "Coffee 2 for 1, 50 off" }, "promo or offer wording", "bare off");
  rejects({ name_en: "Latte off today" }, "promo or offer wording", "off today");
  console.log(
    "check-cafe-raves: خصومات مجانًا BOGO برعاية كإعلان Partner .ai @handle rejected; off-menu allowed",
  );

  // Emoji slot: VS16, ZWJ sequences, skin tones and flags pass.
  for (const emoji of ["❤️", "🌶️", "🍽️", "☕", "🇸🇦", "👩‍🍳", "🧑🏽‍🍳", "❤️‍🔥"]) {
    allows({ emoji }, `emoji ${emoji}`);
  }
  for (const emoji of ["❤", "🌶", "©️", "®️", "™️", "🇸", "🇸🇦🇸🇦", "☕️☕️", "1️⃣x", "A️"]) {
    rejects({ emoji }, "exactly one emoji", `emoji ${JSON.stringify(emoji)}`);
  }
  console.log("check-cafe-raves: ❤️ 🌶️ 🍽️ 🇸🇦 and ZWJ emoji allowed; bare ❤ / 🌶, ©️ and lone indicators rejected");

  for (const emoji of ["🍺", "🍻", "🍹", "🍾", "🍷", "🥂", "🍸", "🥃", "🍶", "🍷\uFE0F", "🍺\uFE0F", "🥃\uFE0F", "🍶\uFE0F", "🍸\uFE0E"]) {
    rejects({ emoji }, "emoji is on the denylist", `emoji ${JSON.stringify(emoji)}`);
  }
  for (const emoji of ["🥤", "🧋", "🧃", "☕", "☕\uFE0F", "🍵", "🫖"]) {
    allows({ emoji }, `${emoji} is not on the denylist`);
  }
  console.log("check-cafe-raves: 🍺 🍻 🍹 🍾 🍷 🥂 🍸 🥃 🍶 (also with VS15/VS16) denied; 🥤 🧋 ☕️ allowed");

  // «عرضة» (ة) is an ordinary word; «عرضه» (ه, "his offer") stays promo.
  for (const word of ["عرضة", "العرضة", "العرضة النجدية", "والعرضة", "عَرْضَة", "عرضـة"]) {
    allows({ reason_ar: word }, `«${word}»`);
  }
  for (const word of ["عرضه", "عرضة وعرض", "العرضة والخصم"]) {
    rejects({ reason_ar: word }, "promo or offer wording", `«${word}»`);
  }
  console.log("check-cafe-raves: «عرضة» / «العرضة» allowed; «عرضه» and عرضة next to عرض/خصم rejected");

  // Cinnabon evasions are caught after normalisation; cinnamon stays allowed.
  for (const name of ["Cinna bon", "Cinna-bon", "C-i-n-n-a-b-o-n", "Cinna\u200Cbon", "Cinna\u200Dbon", "CINNA.BON", "Ｃｉｎｎａｂｏｎ"]) {
    rejects({ name_en: name }, "names a banned brand", JSON.stringify(name));
  }
  for (const name of ["سينابون", "سينا بون", "سينـــابون", "سي\u200Cنابون", "سينا-بون", "ال سينابون"]) {
    rejects({ name_ar: name }, "names a banned brand", JSON.stringify(name));
  }
  allows({ name_en: "Cinnamon Bun", name_ar: "سينامون بن" }, "Cinnamon Bun / سينامون بن");
  allows({ name_en: "Cinnamon Roll", name_ar: "سينامون رول" }, "Cinnamon Roll / سينامون رول");
  console.log("check-cafe-raves: Cinnabon spaced / hyphenated / tatweel / ZWNJ / full-width rejected; cinnamon allowed");

  // Script mixing.
  rejects({ name_ar: "كريم بروليé" }, "Latin letters", "é in an Arabic name");
  rejects({ reason_ar: "ينطلب كثير café." }, "Latin letters", "café in an Arabic reason");
  allows({ name_en: "Crème Brûlée", name_ar: "كريم بروليه" }, "é in an English name");
  rejects({ name_en: "Latte ٣" }, "Arabic-Indic digits", "٣ in an English name");
  rejects({ reason_en: "Top ۳ pick." }, "Arabic-Indic digits", "۳ in an English reason");
  allows({ name_en: "3 Milk Cake", name_ar: "كيكة ٣ حليب" }, "ASCII digits in EN, Arabic-Indic in AR");
  console.log("check-cafe-raves: é in AR rejected; Arabic-Indic digits in EN rejected; Crème Brûlée in EN allowed");

  // Reworded stock lines count toward the at-most-once limit.
  for (const [reason_en, reason_ar] of [
    ["Everybody orders it.", "ينطلب كثير."],
    ["Every reviewer mentions it.", "ينطلب كثير."],
    ["All the reviews mention it.", "ينطلب كثير."],
    ["Often mentioned.", "الجميع يذكرها."],
    ["Often mentioned.", "كل الناس يطلبونها."],
    ["Often mentioned.", "كلهم يمدحونها."],
    ["Often mentioned.", "الكـل يذكره."],
  ] as const) {
    const twice = collectCafeRaveProblems(
      "clean",
      {
        "namq-al-malqa": [clean],
        "nap-al-qirawan": [{ ...clean, name_en: "Another Cake", name_ar: "كيكة ثانية", reason_en, reason_ar }],
      },
      ids,
    );
    assert(
      twice.some((problem) => problem.includes("stock reason appears")),
      `"${reason_en}" / «${reason_ar}» should count as a stock line: ${twice.join("; ")}`,
    );
  }
  const notStock = collectCafeRaveProblems(
    "clean",
    {
      "namq-al-malqa": [clean],
      "nap-al-qirawan": [
        { ...clean, name_en: "Another Cake", name_ar: "كيكة ثانية", reason_en: "Every visit, a new batch.", reason_ar: "كل مرة تنطلب." },
      ],
    },
    ids,
  );
  assert(
    !notStock.some((problem) => problem.includes("stock reason appears")),
    `"Every visit" / «كل مرة» is not a universal claim: ${notStock.join("; ")}`,
  );
  console.log("check-cafe-raves: reworded stock lines (everybody, every reviewer, الجميع, كل الناس, كلهم) counted");
}

const ids = catalogIds();
selfTest(ids);

assert(copy.detailRaves.en === "People rave about", "EN heading");
assert(copy.detailRaves.ar === "وش يمدحون هنا؟", "AR heading");

const detail = read("components/cafe-detail.tsx");
const card = read("components/cafe-card.tsx");
const page = read("components/cafe-card-page.tsx");
assert(detail.includes("copy.detailRaves[language]"), "detail uses the heading copy");
assert(detail.includes("raveItems.length > 0"), "no rave markup when the list is empty");
assert(!detail.includes("evidence"), "detail never mentions evidence");
assert(!card.includes("evidence"), "card never mentions evidence");
assert(!page.includes("evidence"), "page never mentions evidence");
assert(page.includes("cafeRaveLines"), "page passes display lines only");
assert(!read("lib/structured-data.ts").includes("cafe-raves"), "JSON-LD does not load raves");
assert(!read("lib/cafe-metadata.ts").includes("cafe-raves"), "meta does not load raves");
assert(!valueImportsCafeRaves(detail), "client detail does not value-import raves");
assert(!valueImportsCafeRaves(card), "client card does not value-import raves");

const source = read("lib/cafe-raves.ts");
const shipped = collectCafeRaveProblems(
  source,
  cafeRaves as Record<string, readonly CafeRave[]>,
  ids,
);
assert(
  shipped.length === 0,
  `lib/cafe-raves.ts failed:\n${shipped.join("\n")}`,
);

const shippedItems = Object.values(cafeRaves).reduce((count, rows) => count + rows.length, 0);
const liveCafes = [
  "namq-al-malqa",
  "bab-al-mohammadiyah",
  "cherie-al-muruj",
  "okawa-al-narjis",
  "nap-al-qirawan",
  "ouia-al-qirawan",
  "for-coffee-roasters-al-qirawan",
  "sulalat-coffee-ar-rabwah",
] as const;
const batch02Cafes = [
  "mkth-ghirnatah",
  "archi-al-bujairi-diriyah",
  "semi-specialty-cafe-ghirnatah",
  "dips-plus-diriyah",
  "eya-specialty-coffee-al-wurud",
] as const;
const batch03Cafes = [
  "essert-al-rawabi",
  "essert-al-arid",
  "iota-al-ghadeer",
  "oromiffa-al-olaya",
  "carve-coffee-bar-al-wurud",
  "moff-ghirnatah",
  "rex-king-salman",
  "nosound-al-narjis",
  "atea-al-rabi",
] as const;
const batch04Cafes = [
  "percent-arabica-hittin",
  "good-neighbor-olaya",
  "sors-hittin",
  "peaks-digital-city-al-nakheel",
  "jather-al-hamra",
  "one-gram-sulimaniyah",
] as const;
for (const slug of liveCafes) {
  assert(slug in cafeRaves, `${slug} still renders a rave section`);
}
for (const slug of batch02Cafes) {
  assert(slug in cafeRaves, `${slug} renders a rave section`);
}
for (const slug of batch03Cafes) {
  assert(slug in cafeRaves, `${slug} renders a rave section (batch 03)`);
  assert(cafeRaves[slug]?.length === 1, `${slug} ships one item in batch 03`);
}
for (const slug of batch04Cafes) {
  assert(slug in cafeRaves, `${slug} renders a rave section (batch 04)`);
  assert(cafeRaves[slug]?.length === 1, `${slug} ships one item in batch 04`);
  assert(
    (cafeRaves[slug]?.[0]?.evidence ?? "").includes("(batch-04 2026-10-03)"),
    `${slug} evidence is tagged batch-04`,
  );
}
assert(
  Object.keys(cafeRaves).length ===
    liveCafes.length + batch02Cafes.length + batch03Cafes.length + batch04Cafes.length,
  "8 live cafés plus the batch-02, batch-03 and batch-04 cafés render a rave section",
);
assert(Object.keys(cafeRaves).length === 28, `28 cafés after batch 04, got ${Object.keys(cafeRaves).length}`);
assert(shippedItems === 29, `29 items after batch 04, got ${shippedItems}`);
for (const deferred of [
  "asfoura-al-malqa",
  "da-nonna-al-nakheel",
  "woods-olaya",
  "idmi-olaya",
  "waqar-al-aziziyah",
  "fav-coffee-room-al-malqa",
  "shml-al-qirawan",
  "urth-caffe-tahlia-sulimaniyah",
  "kava-al-rabi",
  "okawa-king-fahd",
  // Flat White is a standard espresso drink (generic, V60 precedent).
  "volume-coffee-roasters-al-narjis",
  // Batch 04 (2026-10-03): fewer than 3 same-branch dated sources, generic, mixed, or grouped.
  "just-a-space-al-nakheel",
  "sand-clock-al-muruj",
  "taim-specialty-coffee-as-sahafah",
  "cafe-tale-kafd",
  "trieste-kafd",
  "qamaria-hittin",
  "kicksters-al-malqa",
  "cross-coffee-an-nazhah",
  "raslania-al-safa",
  "silo-cafe-al-yarmouk",
  "woods-al-yasmin",
  "seven-beans-sulimaniyah",
  "infuse-al-nakheel",
  "hawaf-al-safa",
  "aim-coffee-bar-al-malqa",
  "breehant-al-yasmin",
  "wee-al-nakheel",
  "just-another-hittin",
  "arco-al-rabi",
  "rex-hittin",
  "diplab-al-rabi",
  "jae-specialty-coffee-ghirnatah",
]) {
  assert(!(deferred in cafeRaves), `${deferred} is deferred`);
}
assert(
  !("volume-coffee-roasters-al-narjis" in cafeRaves),
  "volume-coffee-roasters-al-narjis is deferred: Flat White is a standard espresso drink (generic, V60 precedent)",
);
const eya = cafeRaves["eya-specialty-coffee-al-wurud"];
assert(eya?.[0]?.name_en === "Cinnamon Roll", "Eya name is Cinnamon Roll");
assert(eya?.[0]?.name_ar === "سينامون رول", "Eya AR name is سينامون رول");
assert(
  !(eya?.[0]?.evidence ?? "").includes("/@") && !(eya?.[0]?.evidence ?? "").includes("!16s"),
  "Eya Maps links use the clean place form",
);
const sulalat = cafeRaves["sulalat-coffee-ar-rabwah"];
assert(sulalat?.length === 1, "Sulalat keeps one item");
assert(sulalat?.[0]?.name_en === "Dark Hot Chocolate", "Sulalat name is Dark Hot Chocolate");
assert(sulalat?.[0]?.name_ar === "هوت شوكلت داكن", "Sulalat AR name is هوت شوكلت داكن");
assert(!source.includes("Gelato") && !source.includes("جيلاتو"), "Sulalat gelato is dropped");

const packageJson = read("package.json");
assert(
  packageJson.includes("check-cafe-raves"),
  "package.json wires check-cafe-raves",
);

console.log(
  `check-cafe-raves: ok (${Object.keys(cafeRaves).length} cafes, reason max ${REASON_MAX}, EN name max ${NAME_EN_MAX}, AR name max ${NAME_AR_MAX})`,
);
