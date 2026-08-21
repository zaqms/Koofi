/**
 * Tight typed "how do I add a shop?" matcher.
 * Chip taps never use this. Cafe asks like "add sugar" or a neighborhood
 * must not match.
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/(^|\s)ال(?=\p{L})/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const EN_ADD_SHOP =
  /\badd(?:ing)? (?:a |an |another |more )?(?:shop|shops|cafe|cafes|coffee shop|coffee shops)\b/;
const EN_HOW_ADD = /\bhow (?:can|do|to)(?: i)? add\b/;
const EN_SHOP = /\b(?:shop|shops|cafe|cafes|coffee shop|coffee shops)\b/;

const AR_HOW_ADD = /كيف\s+اضيف/;
const AR_WANT_ADD = /(?:ابي|ابغى)\s+اضيف/;
const AR_ADD_PLACE = /(?:اضف|اضيف)\s+(?:قهوه|محل|مكان|كافي)/;

export function isAddShopIntent(text: string): boolean {
  const haystack = normalize(text);
  if (!haystack) return false;

  if (EN_ADD_SHOP.test(haystack)) return true;
  if (EN_HOW_ADD.test(haystack) && EN_SHOP.test(haystack)) return true;

  if (haystack === "اضف قهوه" || haystack === "اضف محل") return true;
  if (AR_HOW_ADD.test(haystack)) return true;
  if (AR_WANT_ADD.test(haystack) && /(?:قهوه|محل|مكان|كافي)/.test(haystack)) {
    return true;
  }
  if (AR_ADD_PLACE.test(haystack)) return true;

  return false;
}
