/**
 * House counts shared by district intro, meta, and the Local only empty state.
 * English and Arabic keep words for 1 and 2 (one cafe / two cafes, قهوة وحدة / قهوتين)
 * and use western digits from 3 up. Never "zero" or «صفر».
 */

/** 1 one, 2 two, 3+ western digits. Zero is never shown. */
export function countWord(n: number): string {
  if (n <= 0) return "zero";
  if (n === 1) return "one";
  if (n === 2) return "two";
  return String(n);
}

/** 1 وحدة، 2 ثنتين، 3+ western digits. Zero is never shown. */
export function countWordAr(n: number): string {
  if (n <= 0) return "صفر";
  if (n === 1) return "وحدة";
  if (n === 2) return "ثنتين";
  return String(n);
}

/** 1 واحد، 2 اثنين، 3+ western digits. */
function masculineCount(n: number): string {
  if (n <= 0) return "صفر";
  if (n === 1) return "واحد";
  if (n === 2) return "اثنين";
  return String(n);
}

/** one cafe / two cafes / 12 cafes. Zero is the bare plural. */
export function countedCafesEn(n: number): string {
  if (n <= 0) return "cafes";
  if (n === 1) return "one cafe";
  if (n === 2) return "two cafes";
  return `${countWord(n)} cafes`;
}

export function countedCafesEnHead(n: number): string {
  if (n <= 0) return "No cafes";
  const phrase = countedCafesEn(n);
  if (n === 1 || n === 2) return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  return phrase;
}

/** قهوة وحدة / قهوتين / N قهاوي. */
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
  if (n === 2) return "two local cafes";
  return `${countWord(n)} local cafes`;
}

export function chainBranchesEn(n: number): string | null {
  if (n <= 0) return null;
  if (n === 1) return "one chain branch";
  if (n === 2) return "two chain branches";
  return `${countWord(n)} chain branches`;
}

export function localCafesAr(n: number): string | null {
  if (n <= 0) return null;
  if (n === 1) return "قهوة محلية وحدة";
  if (n === 2) return "قهوتين محليتين";
  return `${countedCafesAr(n)} محلية`;
}

/** فرع واحد / فرعين / N فروع. 3+ is a western digit. */
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
 * the bare phrase; the caller wraps it with `chainOnlyBlock`.
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

/**
 * Hide a lead or intro while Local only is on.
 * Each paragraph gets its own pair so a blank line cannot split the markers.
 */
export function chainOnlyBlock(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (/\{chain-only\}|\{\/chain-only\}/.test(part)) return part;
      if (/^#{1,6} /.test(part)) {
        return part.replace(/^(#{1,6} )/, "$1{chain-only}");
      }
      return `{chain-only}${part}{/chain-only}`;
    })
    .join("\n\n");
}
