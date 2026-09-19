import { discoveryCategoryLabel } from "./discovery-categories";
import type { Language, MomentTag } from "./types";
import { vibeLabels, type VibeSource } from "./vibe-labels";

export const MAX_LISTING_TAGS = 2;

/**
 * Moment → registry row for a listing pill. Prefer descriptor rows
 * (`specialty`) over ranking titles (`roaster` / Best Roasteries).
 * Popular and Nearby never become cafe tags.
 */
const MOMENT_LISTING_CATEGORY: Partial<Record<MomentTag, string>> = {
  matcha: "matcha",
  "drive-through": "drive-through",
  roaster: "specialty",
  pastry: "pastry",
  qahwa: "coffee",
  quiet: "quiet",
  work: "work",
  study: "study",
  late: "late",
  outdoor: "outdoor",
  "with-friends": "with-friends",
};

function normalize(label: string): string {
  return label.trim().toLowerCase();
}

function similar(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

/**
 * 1–2 listing pills. Existing vibe tags first, then approved discovery
 * registry labels. Does not invent a generic cafe-type pill or a new
 * category system.
 */
export function listingCardTags(
  shop: VibeSource,
  language: Language,
): string[] {
  const tags = vibeLabels(shop, language).slice(0, MAX_LISTING_TAGS);
  if (tags.length >= MAX_LISTING_TAGS) return tags;

  for (const moment of shop.momentTags ?? []) {
    const id = MOMENT_LISTING_CATEGORY[moment];
    if (!id) continue;
    const label = discoveryCategoryLabel(id, language);
    if (!label) continue;
    if (tags.some((tag) => similar(tag, label))) continue;
    tags.push(label);
    if (tags.length >= MAX_LISTING_TAGS) break;
  }

  return tags;
}
