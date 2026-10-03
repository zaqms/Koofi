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
 * Arabic promo tokens are word-bounded with Unicode lookaround.
 * `\b` does not treat Arabic letters as word characters, so a substring
 * check false-flags words such as معروض. Longer alternatives come first.
 * Clitics that glue on (بخصم، الخصم، عروضهم، بعرض) count as the same word.
 */
const AR_PROMO_RE =
  /(?<![\p{L}\p{N}_])(?:و|ف)?(?:بال|وال|فال|لل|ال|ب|ك|ل)?(?:عروض|خصم|تخفيض|مجاناً|مجانا|كود|عرض)(?:هم|هن|ها|كم|كن|نا|ي|ه)?(?![\p{L}\p{N}_])/u;
const EN_PROMO_RE =
  /\boffers?\b|\bdiscounts?\b|\bdeals?\b|\bpromo\b|\bsale\b|\bfree\b|\bcoupon\b|\bcode\b|\boff\b|%\s*off/i;

/** Paid placement wording. `ad` and `advert` are whole words so "addition" is fine. */
const PAID_RE =
  /\bsponsored\b|\bpaid partnership\b|\badvert\b|\bad\b|(?<![\p{L}\p{N}_])(?:إعلان|ممول)(?![\p{L}\p{N}_])/iu;

/** URLs and domain-shaped text in visitor-facing fields. Evidence is not scanned. */
const URL_RE =
  /https?:\/\/|\bhttps?\b|www\.|\.(?:com|net|org|sa|io|co|app|lol|me)\b/i;

/**
 * Latin brand tokens allowed inside Arabic name/reason fields.
 * Matched as whole alphanumeric tokens, so V600 is not excused by V60.
 */
const AR_LATIN_ALLOWLIST = ["V60"] as const;

/**
 * Cinnabon spellings. Latin is case-insensitive and allows one n and a
 * plural s (Cinabon, Cinnabons). Arabic covers سينابون، سنابون، and سينابن.
 * سينامون (cinnamon) does not match.
 */
const EN_BRAND_RE = /\bcinn?abons?\b/i;
const AR_BRAND_RE = /س(?:ي)?ناب(?:و)?ن/;

const STOCK_REASON_EN = /everyone keeps mentioning/i;
const STOCK_REASON_AR = /الكل يذكر/;

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
  return EN_BRAND_RE.test(value) || AR_BRAND_RE.test(value);
}

function normalizeName(value: string, foldCase: boolean): string {
  const collapsed = value.trim().replace(/\s+/gu, " ");
  return foldCase ? collapsed.toLocaleLowerCase("en") : collapsed;
}

/**
 * One emoji grapheme that is an actual pictograph.
 * ©, ®, and ™ are Extended_Pictographic in Unicode but default to text,
 * so the slot also requires Emoji_Presentation. Bullets and other
 * non-pictographic symbols fail the pictograph check.
 */
function isOneEmojiGrapheme(value: string): boolean {
  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
  ];
  if (segments.length !== 1) return false;
  const grapheme = segments[0].segment;
  return (
    /\p{Extended_Pictographic}/u.test(grapheme) &&
    /\p{Emoji_Presentation}/u.test(grapheme)
  );
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
        if (AR_PROMO_RE.test(value) || EN_PROMO_RE.test(value) || hasPercent(value)) {
          problems.push(`${where}: ${field} has promo or offer wording`);
        }
        if (hasBannedBrand(value)) {
          problems.push(`${where}: ${field} names a banned brand`);
        }
        if (PAID_RE.test(value)) {
          problems.push(`${where}: ${field} has paid wording`);
        }
        if (URL_RE.test(value)) {
          problems.push(`${where}: ${field} has a URL or domain`);
        }
      }
      if (item.emoji.trim() && !isOneEmojiGrapheme(item.emoji.trim())) {
        problems.push(`${where}: emoji must be exactly one emoji`);
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
        /[A-Za-z]/.test(stripAllowlistedLatin(item.name_ar)) ||
        /[A-Za-z]/.test(stripAllowlistedLatin(item.reason_ar))
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
      if (STOCK_REASON_EN.test(item.reason_en) || STOCK_REASON_AR.test(item.reason_ar)) {
        stockReasonItems += 1;
      }
    });
  }
  if (stockReasonItems > 1) {
    problems.push(
      `stock reason appears ${stockReasonItems} times; everyone keeps mentioning / الكل يذكر at most once`,
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
for (const slug of liveCafes) {
  assert(slug in cafeRaves, `${slug} still renders a rave section`);
}
for (const slug of batch02Cafes) {
  assert(slug in cafeRaves, `${slug} renders a rave section`);
}
assert(
  Object.keys(cafeRaves).length === liveCafes.length + batch02Cafes.length,
  "8 live cafés plus the batch-02 cafés render a rave section",
);
assert(shippedItems === 14, `14 items after batch 02, got ${shippedItems}`);
for (const deferred of [
  "asfoura-al-malqa",
  "da-nonna-al-nakheel",
  "woods-olaya",
  "idmi-olaya",
]) {
  assert(!(deferred in cafeRaves), `${deferred} is deferred`);
}
const eya = cafeRaves["eya-specialty-coffee-al-wurud"];
assert(eya?.[0]?.name_en === "Cinnamon Roll", "Eya name is Cinnamon Roll");
assert(eya?.[0]?.name_ar === "سينامون رول", "Eya AR name is سينامون رول");
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
