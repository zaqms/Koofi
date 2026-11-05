import { copy } from "./copy";
import type { Language, Shop } from "./types";

/** True while Scout's temporary-closure note is on the row. */
export function isTemporarilyClosed(
  shop: Pick<Shop, "temporaryClosure">,
): boolean {
  return shop.temporaryClosure != null;
}

export function temporaryClosureLabel(
  shop: Pick<Shop, "temporaryClosure">,
  language: Language,
): string | null {
  if (!shop.temporaryClosure) return null;
  return copy.temporarilyClosedRenovation[language];
}
