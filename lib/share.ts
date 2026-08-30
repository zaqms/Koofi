import { VIBE_CHIPS, PUBLIC_SITE_URL, cardPath, vibeChipLabel } from "./product";
import type { Language, MomentTag } from "./types";

/** Absolute wain.lol cafe card. Never `cardHref()` / `KOOFI_PUBLIC_URL`. */
export function shareUrl(id: string, language: Language): string {
  return `${PUBLIC_SITE_URL}${cardPath(id, language)}?ref=share`;
}

/** First VIBE_CHIPS label for a moment tag (qahwa → Best Coffee, not specialty). */
export function chipLabelForMoment(
  moment: MomentTag,
  language: Language,
): string | null {
  const chip = VIBE_CHIPS.find((row) => row.momentTag === moment);
  return chip ? vibeChipLabel(chip, language) : null;
}

/** intent.moments ∩ shop.momentTags, already-localized chip labels. */
export function matchedChipLabels(
  shopMoments: readonly MomentTag[],
  askedMoments: readonly MomentTag[],
  language: Language,
): string[] {
  if (askedMoments.length === 0) return [];
  const shopSet = new Set(shopMoments);
  const labels: string[] = [];
  const seen = new Set<string>();
  for (const moment of askedMoments) {
    if (!shopSet.has(moment)) continue;
    const label = chipLabelForMoment(moment, language);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
}

export function joinShareTags(tags: readonly string[], language: Language): string {
  return tags.join(language === "ar" ? " و " : ", ");
}

export function shareText(input: {
  name: string;
  tags: readonly string[];
  url: string;
  language: Language;
}): string {
  const { name, tags, url, language } = input;
  if (language === "ar") {
    if (tags.length === 0) {
      return `لقيت هذي على wain.lol — ${name} 👉 ${url}`;
    }
    return `لقيت هذي على wain.lol — ${name}، تناسب «${joinShareTags(tags, "ar")}» 👉 ${url}`;
  }
  if (tags.length === 0) {
    return `Found this on wain.lol — ${name} 👉 ${url}`;
  }
  return `Found this on wain.lol — ${name}, matches '${joinShareTags(tags, "en")}' 👉 ${url}`;
}

/** Click-to-chat share. No phone number. Never web.whatsapp.com or api.whatsapp.com. */
export function waMeShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
