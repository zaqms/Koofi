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
 */
const AR_PROMO_RE =
  /(?<![\p{L}\p{N}_])(?:عروض|خصم|تخفيض|مجاناً|مجانا|كود|عرض)(?![\p{L}\p{N}_])/u;
const EN_PROMO_RE =
  /\boffer\b|\bdiscount\b|\bdeal\b|\bpromo\b|\bsale\b|\bfree\b|\bcoupon\b|\bcode\b|\boff\b|%\s*off/i;

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

/** Cocoa strength in a product name. A trailing "%" is the cacao share, not a discount. */
const COCOA_NAME_RE = /hot chocolate|شوكلت|chocolate|cacao|كاكاو/i;

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

function percentIsOffer(field: (typeof DISPLAY_FIELDS)[number], value: string): boolean {
  if (!value.includes("%")) return false;
  if (field === "reason_ar" || field === "reason_en" || field === "emoji") return true;
  const cocoaName = COCOA_NAME_RE.test(value);
  const everyPercentFollowsDigit = !/(^|[^\d])%/.test(value);
  return !(cocoaName && everyPercentFollowsDigit);
}

function normalizeName(value: string, foldCase: boolean): string {
  const collapsed = value.trim().replace(/\s+/gu, " ");
  return foldCase ? collapsed.toLocaleLowerCase("en") : collapsed;
}

function isOneEmojiGrapheme(value: string): boolean {
  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
  ];
  return segments.length === 1 && /\p{Extended_Pictographic}/u.test(segments[0].segment);
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
): string[] {
  const problems: string[] = [];
  if (WEEN_RE.test(source)) {
    problems.push("file contains ween as a whole word");
  }

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
        if (AR_PROMO_RE.test(value) || EN_PROMO_RE.test(value) || percentIsOffer(field, value)) {
          problems.push(`${where}: ${field} has promo or offer wording`);
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
      if (!sources || Number(sources[1]) < 3) {
        problems.push(`${where}: evidence must claim 3 or more sources`);
      }
      if ([...item.reason_ar].length > REASON_MAX) {
        problems.push(`${where}: reason_ar is over ${REASON_MAX} characters`);
      }
      if ([...item.reason_en].length > REASON_MAX) {
        problems.push(`${where}: reason_en is over ${REASON_MAX} characters`);
      }
    });
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
    evidence: "3 sources, verified note",
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
  assert(
    collectCafeRaveProblems("clean", { "namq-al-malqa": [cocoa] }, ids).length === 0,
    "cocoa percentage in a product name is not an offer",
  );
  const reasonPercent: CafeRave = {
    ...cocoa,
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
      (problem) => problem.includes("3 or more sources"),
    ),
    "evidence must lead with 3 or more sources",
  );
  console.log("check-cafe-raves: percent-off rejected; cocoa 70% allowed; thin evidence rejected");

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
    evidence: "3 sources, https://exa.ai/example and cafesriyadh.com",
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
assert(Object.keys(cafeRaves).length === 12, "12 cafés still render a rave section");
assert(shippedItems === 13, `13 items after dropping Sulalat gelato, got ${shippedItems}`);
const sulalat = cafeRaves["sulalat-coffee-ar-rabwah"];
assert(sulalat?.length === 1, "Sulalat keeps one item");
assert(sulalat?.[0]?.name_en === "70% Hot Chocolate", "Sulalat keeps 70% Hot Chocolate");
assert(sulalat?.[0]?.name_ar === "هوت شوكلت 70%", "Sulalat AR name stays هوت شوكلت 70%");
assert(!source.includes("Gelato") && !source.includes("جيلاتو"), "Sulalat gelato is dropped");

const packageJson = read("package.json");
assert(
  packageJson.includes("check-cafe-raves"),
  "package.json wires check-cafe-raves",
);

console.log(
  `check-cafe-raves: ok (${Object.keys(cafeRaves).length} cafes, reason max ${REASON_MAX}, EN name max ${NAME_EN_MAX}, AR name max ${NAME_AR_MAX})`,
);
