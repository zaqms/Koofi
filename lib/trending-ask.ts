import { getShop } from "./catalog";
import { shopToChatPick } from "./chat-pick";
import { copy } from "./copy";
import { detectLanguage } from "./language";
import { PUBLIC_SITE_URL, trendingPath } from "./product";
import { TRENDING_THIS_WEEK } from "./trending-this-week";
import type { ChatPick, Language } from "./types";

export type TrendingWeekAskRow = {
  id: string;
  lineAr: string;
  lineEn: string;
};

/**
 * Weekly trending ask. Empty week: the neutral line and the page link, no cafés.
 * A filled allowlist returns those cafés, in allowlist order.
 */
export function trendingWeekChatAnswer(input: {
  text: string;
  landing: Language;
  rows?: readonly TrendingWeekAskRow[];
}): { language: Language; reply: string; picks: ChatPick[] } {
  const language = /\p{L}/u.test(input.text)
    ? detectLanguage(input.text)
    : input.landing;
  const rows = input.rows ?? TRENDING_THIS_WEEK;
  const picks = rows.flatMap((row) => {
    const shop = getShop(row.id);
    if (!shop || shop.example) return [];
    const why = language === "ar" ? row.lineAr : row.lineEn;
    return [shopToChatPick(shop, language, why)];
  });
  if (picks.length === 0) {
    const href = `${PUBLIC_SITE_URL}${trendingPath(language)}`;
    return {
      language,
      reply: `${copy.trendingEmpty[language]}\n${href}`,
      picks: [],
    };
  }
  return {
    language,
    reply: copy.trendingThisWeek[language],
    picks,
  };
}
