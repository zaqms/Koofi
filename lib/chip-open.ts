import { headingForPicks, pickCafes, toChatPicks } from "./picker";
import {
  getDiscoveryCategory,
  isOffHomeChipId,
  vibeChipLabel,
} from "./product";
import type { ChatPick, Language } from "./types";

/** Server-served chip-open for off-home share URLs. Not a home-strip tile. */
export type ChipOpenRestore = {
  chipId: string;
  ask: string;
  picks: ChatPick[];
  language: Language;
  reply: string;
};

/**
 * Dedicated `/coffee-shops/{roaster,specialty,study,late,quiet}` URLs keep the
 * same three-picks UI as a chip tap. Home chrome stays 4×2 — these stay
 * off the grid. Nearby stays client-side (geo). Soft Places parked.
 */
export function restoreOffHomeChipOpen(
  chipId: string,
  language: Language,
): ChipOpenRestore | null {
  if (!isOffHomeChipId(chipId)) return null;
  const chip = getDiscoveryCategory(chipId);
  if (!chip) return null;
  const ask = vibeChipLabel(chip.label, language);
  const result = pickCafes({ text: ask, language });
  const picks = toChatPicks(result);
  if (picks.length === 0) return null;
  return {
    chipId,
    ask,
    picks,
    language: result.language,
    reply: headingForPicks(result),
  };
}
