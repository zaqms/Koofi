import { listRealShops } from "./catalog";
import { parseIntent } from "./parse-intent";
import { VIBE_CHIPS } from "./product";
import { matchCatalogShops } from "./shop-name";

/**
 * Conservative off-topic gate. Cafe / vibe / neighborhood / avoid
 * asks still pick. Chip taps never use this.
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

const CAFE_WORDS = [
  ...VIBE_CHIPS.flatMap((chip) => [chip.ar, chip.en]),
  "قهوه",
  "قهاوي",
  "فنجان",
  "محمصه",
  "محامص",
  "كافي",
  "coffee",
  "cafe",
  "café",
  "qahwa",
  "roaster",
  "roastery",
  "roasteries",
].map((word) => normalize(word));

const OFF_TOPIC_TOPICS =
  /\b(?:weather|forecast|temperature|news|sports?|football|soccer|basketball|trivia|joke|jokes|politics|election|stock|bitcoin|movie|score)\b|طقس|جو اليوم|الاخبار|اخبار|رياضه|كره|مباراه|نكته|سياسه/;

const BARE_QUESTION =
  /^(hows|how s|how is|how are|how do|what s|whats|what is|what are|what time|who|when|why|are you|is it)\b|^(كيف حالك|كيفك|كيف الحال|وش اخبارك|شو اخبارك|كيف الجو|كيف الطقس|وش رايك|شو رايك)\b|^(كيف|وش|شو|ليش|متى|هل)\s/;

function hasCafeSignal(text: string): boolean {
  const intent = parseIntent(text);
  if (
    intent.moments.length > 0 ||
    intent.neighborhoods.length > 0 ||
    intent.avoidedNeighborhoods.length > 0
  ) {
    return true;
  }
  if (matchCatalogShops(text, listRealShops()).length > 0) return true;
  const haystack = ` ${normalize(text)} `;
  return CAFE_WORDS.some((word) => {
    if (!word) return false;
    if (word.includes(" ")) return haystack.includes(` ${word} `);
    return new RegExp(`(^|\\s)${word}(\\s|$)`, "u").test(haystack.trim());
  });
}

export function isOffTopicAsk(text: string): boolean {
  const haystack = normalize(text);
  if (!haystack || hasCafeSignal(text)) return false;
  if (OFF_TOPIC_TOPICS.test(haystack)) return true;
  return BARE_QUESTION.test(haystack);
}
