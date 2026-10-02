/**
 * House counts shared by district intro, meta, and the Local only empty state.
 * Words through twelve, then western digits. Never "zero" or «صفر».
 */

const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

const AR_COUNT_WORDS = [
  "صفر",
  "وحدة",
  "ثنتين",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثمان",
  "تسع",
  "عشر",
  "إحدى عشر",
  "اثنتي عشر",
] as const;

const MASCULINE_COUNT = [
  "صفر",
  "واحد",
  "اثنين",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
] as const;

export function countWord(n: number): string {
  if (n >= 0 && n < COUNT_WORDS.length) return COUNT_WORDS[n] ?? String(n);
  return String(n);
}

export function countWordAr(n: number): string {
  if (n >= 0 && n < AR_COUNT_WORDS.length) return AR_COUNT_WORDS[n] ?? String(n);
  return String(n);
}

function masculineCount(n: number): string {
  if (n >= 0 && n < MASCULINE_COUNT.length) return MASCULINE_COUNT[n] ?? String(n);
  return String(n);
}

/** one cafe / two cafes / eleven cafes / 13 cafes. Zero is the bare plural. */
export function countedCafesEn(n: number): string {
  if (n <= 0) return "cafes";
  if (n === 1) return "one cafe";
  return `${countWord(n)} cafes`;
}

export function countedCafesEnHead(n: number): string {
  if (n <= 0) return "No cafes";
  if (n === 1) return "One cafe";
  const phrase = countedCafesEn(n);
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** قهوة وحدة / قهوتين / N قهاوي. 11+ follows the non-chain helper, including إحدى عشر قهاوي. */
export function countedCafesAr(n: number): string {
  if (n <= 0) return "قهاوي";
  if (n === 1) return "قهوة وحدة";
  if (n === 2) return "قهوتين";
  return `${countWordAr(n)} قهاوي`;
}

/** Plural noun from the same helper the intro uses. */
export function cafePluralAr(): string {
  const phrase = countedCafesAr(3);
  const space = phrase.indexOf(" ");
  return space === -1 ? phrase : phrase.slice(space + 1);
}

export function localCafesEn(n: number): string | null {
  if (n <= 0) return null;
  if (n === 1) return "one local cafe";
  return `${countWord(n)} local cafes`;
}

export function chainBranchesEn(n: number): string | null {
  if (n <= 0) return null;
  if (n === 1) return "one chain branch";
  return `${countWord(n)} chain branches`;
}

export function localCafesAr(n: number): string | null {
  if (n <= 0) return null;
  if (n === 1) return "قهوة محلية وحدة";
  if (n === 2) return "قهوتين محليتين";
  return `${countedCafesAr(n)} محلية`;
}

/** فرع واحد / فرعين / N فروع. 11+ stays plural فروع, words through twelve. */
export function chainBranchesAr(n: number): string | null {
  if (n <= 0) return null;
  if (n === 1) return "فرع واحد";
  if (n === 2) return "فرعين";
  return `${masculineCount(n)} فروع`;
}
/**
 * Rewrite a hand-written What's-here template so the live count and noun
 * come from the house helper. The district tail ("from X on the catalog…") stays.
 */
export function fillHereIntroEn(template: string, count: number): string {
  const word = count <= 0 ? "zero" : countWord(count);
  const noun = count === 1 ? "cafe" : "cafes";
  const verb = count === 1 ? "is" : "are";
  const cap = word.charAt(0).toUpperCase() + word.slice(1);
  const are = count === 1 ? "is" : "are";
  let next = template.replace(
    /\*\*\{countWordCap\}\*\* cafes? from (.+?) are\b/,
    `**${cap}** ${noun} from $1 ${are}`,
  );
  next = next.replace(
    /There (?:is|are) \*\*\{count\}\*\* cafes?/gi,
    `There ${verb} **${word}** ${noun}`,
  );
  next = next.replace(/\*\*\{count\}\*\* cafes?/g, `**${word}** ${noun}`);
  return next.replaceAll("{count}", word).replaceAll("{countWordCap}", cap);
}

/** Same house phrase for Arabic intros: قهوة وحدة / قهوتين / N قهاوي. */
export function fillHereIntroAr(template: string, count: number): string {
  const phrase = countedCafesAr(count);
  let next = template.replace(/فيه \*\*\{count\}\*\* قهاوي/g, `فيه **${phrase}**`);
  next = next.replace(/فيه قهوة \*\*\{count\}\*\*/g, `فيه **${phrase}**`);
  next = next.replace(/فيه \*\*\{count\}\*\*/g, `فيه **${phrase}**`);
  return next.replaceAll("{count}", countWordAr(count));
}

function boldFirstWord(phrase: string): string {
  const space = phrase.indexOf(" ");
  if (space === -1) return `**${phrase}**`;
  return `**${phrase.slice(0, space)}** ${phrase.slice(space + 1)}`;
}

/**
 * Full count plus the chain breakdown. When local cafés remain, Local only
 * hides `{chain-counts}` and shows `{local-counts}`. A chain-only count is
 * the bare phrase; the caller wraps the whole sentence in `{chain-only}`.
 */
export function chainCountClauseEn(total: number, local: number, chains: number): string {
  const word = total <= 0 ? "zero" : countWord(total);
  const noun = total === 1 ? "cafe" : "cafes";
  const parts = [localCafesEn(local), chainBranchesEn(chains)].filter(
    (part): part is string => part != null,
  );
  const full = `**${word}** ${noun}${parts.length ? ` — ${parts.join(", ")}` : ""}`;
  if (local <= 0) return full;
  return `{chain-counts}${full}{/chain-counts}{local-counts}${boldFirstWord(localCafesEn(local) ?? "")}{/local-counts}`;
}

export function chainCountClauseAr(total: number, local: number, chains: number): string {
  const localPart = localCafesAr(local);
  const chainPart = chainBranchesAr(chains);
  const parts = [localPart, chainPart].filter((part): part is string => part != null);
  const breakdown =
    parts.length === 0
      ? ""
      : parts.length === 1
        ? ` — ${parts[0]}`
        : ` — ${parts[0]}، و${parts[1]}`;
  const full = `**${countedCafesAr(total)}**${breakdown}`;
  if (local <= 0) return full;
  return `{chain-counts}${full}{/chain-counts}{local-counts}**${localPart}**{/local-counts}`;
}

/** Hide a whole lead or intro while Local only is on. */
export function chainOnlyBlock(text: string): string {
  return `{chain-only}${text}{/chain-only}`;
}
