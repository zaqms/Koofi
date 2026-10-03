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
const DISPLAY_FIELDS = [
  "emoji",
  "name_ar",
  "name_en",
  "reason_ar",
  "reason_en",
] as const;

const PROMO_RE =
  /خصم|عروض|عرض|تخفيض|مجاناً|مجانا|كود|\boffer\b|\bdiscount\b|\bdeal\b|\bpromo\b|\bsale\b|\bfree\b|\bcoupon\b|\bcode\b|%/i;

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
    items.forEach((item, index) => {
      const where = `${slug}[${index}]`;
      if (!isCafeRave(item)) {
        problems.push(`${where}: expected emoji, names, reasons, and evidence`);
        return;
      }
      for (const field of DISPLAY_FIELDS) {
        const value = item[field].trim();
        if (!value) problems.push(`${where}: ${field} is empty`);
        else if (PROMO_RE.test(value)) {
          problems.push(`${where}: ${field} has promo or offer wording`);
        }
      }
      if (!item.evidence.trim()) problems.push(`${where}: evidence is empty`);
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
    evidence: "verified note",
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

const packageJson = read("package.json");
assert(
  packageJson.includes("check-cafe-raves"),
  "package.json wires check-cafe-raves",
);

console.log(
  `check-cafe-raves: ok (${Object.keys(cafeRaves).length} cafes, reason max ${REASON_MAX})`,
);
