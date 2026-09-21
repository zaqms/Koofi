import { copy } from "./copy";
import type { DirectoryShop } from "./directory";
import { shopDistanceKm } from "./directory-sort";
import { isUsableVisitorOrigin } from "./place-coords";
import type { Language, Pin } from "./types";

/**
 * Neighborhood results sort only. Order is the control order on an LTR page.
 * Arabic renders the same sequence from the right via `dir="rtl"`.
 */
export const DISTRICT_CAFE_SORTS = ["nearby", "az", "new"] as const;
export type DistrictCafeSort = (typeof DISTRICT_CAFE_SORTS)[number];

export const DISTRICT_CAFE_SORT_COPY: Record<
  DistrictCafeSort,
  { ar: string; en: string }
> = {
  nearby: copy.neighborhoodsSortNearby,
  az: { ar: "أ - ي", en: copy.neighborhoodsSortAz.en },
  new: copy.directorySortNew,
};

/** Survives café back, language switch, and refresh in this tab. */
export const DISTRICT_CAFE_SORT_STORAGE_KEY = "wain.districtCafeSort.v1";
const DISTRICT_CAFE_SORT_EVENT = "wain-district-cafe-sort";

/** Session cache so a tap updates the chip before (and without) storage. */
let cachedSort: DistrictCafeSort | null | undefined;

function readStoredDistrictCafeSort(): DistrictCafeSort | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DISTRICT_CAFE_SORT_STORAGE_KEY);
    if (raw === "nearby" || raw === "az" || raw === "new") return raw;
    return null;
  } catch {
    return null;
  }
}

export function readDistrictCafeSort(): DistrictCafeSort | null {
  if (cachedSort !== undefined) return cachedSort;
  cachedSort = readStoredDistrictCafeSort();
  return cachedSort;
}

export function writeDistrictCafeSort(sort: DistrictCafeSort): void {
  cachedSort = sort;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DISTRICT_CAFE_SORT_STORAGE_KEY, sort);
  } catch {
    // Private mode — the in-memory selection still applies this view.
  }
  window.dispatchEvent(new Event(DISTRICT_CAFE_SORT_EVENT));
}

export function districtCafeSortServerSnapshot(): null {
  return null;
}

export function subscribeDistrictCafeSort(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(DISTRICT_CAFE_SORT_EVENT, onChange);
  return () => window.removeEventListener(DISTRICT_CAFE_SORT_EVENT, onChange);
}

/**
 * Page language only. Arabic never falls through to `nameEn`.
 * Equal names tie-break on id so the other language cannot reorder them.
 */
function compareDistrictName(
  a: Pick<DirectoryShop, "id" | "nameAr" | "nameEn">,
  b: Pick<DirectoryShop, "id" | "nameAr" | "nameEn">,
  language: Language,
): number {
  const left = (language === "ar" ? a.nameAr : a.nameEn).trim();
  const right = (language === "ar" ? b.nameAr : b.nameEn).trim();
  const byName = left.localeCompare(right, language === "ar" ? "ar" : "en", {
    sensitivity: "base",
  });
  if (byName !== 0) return byName;
  return a.id.localeCompare(b.id);
}

/** Missing / unparseable addedAt sorts oldest. Never a café opening date. */
function addedMillis(shop: Pick<DirectoryShop, "addedAt">): number {
  if (!shop.addedAt) return Number.NEGATIVE_INFINITY;
  const time = Date.parse(shop.addedAt);
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

/**
 * Display order for one neighborhood's existing rows.
 * Nearby without a usable visitor pin falls back to A–Z — it does not
 * invent a distance order. New is `addedAt` newest-first (catalog index
 * breaks same-commit ties).
 */
export function sortDistrictCafes(
  shops: readonly DirectoryShop[],
  sort: DistrictCafeSort,
  origin: Pin | null,
  language: Language,
): DirectoryShop[] {
  const rows = [...shops];
  const resolved: DistrictCafeSort =
    sort === "nearby" && !isUsableVisitorOrigin(origin) ? "az" : sort;

  if (resolved === "az") {
    return rows.sort((a, b) => compareDistrictName(a, b, language));
  }

  if (resolved === "new") {
    return rows.sort((a, b) => {
      const delta = addedMillis(b) - addedMillis(a);
      if (delta !== 0) return delta;
      if (b.catalogIndex !== a.catalogIndex) {
        return b.catalogIndex - a.catalogIndex;
      }
      return compareDistrictName(a, b, language);
    });
  }

  return rows.sort((a, b) => {
    const da = shopDistanceKm(a, origin);
    const db = shopDistanceKm(b, origin);
    if (da == null && db == null) return compareDistrictName(a, b, language);
    if (da == null) return 1;
    if (db == null) return -1;
    if (da !== db) return da - db;
    return compareDistrictName(a, b, language);
  });
}

/**
 * Chip that matches the order actually shown.
 * Explicit A–Z / New win. Nearby (chosen or default) only while GPS is usable;
 * otherwise the default-state fallback is A–Z.
 */
export function resolveDistrictCafeSort(
  chosen: DistrictCafeSort | null,
  nearbyAvailable: boolean,
): DistrictCafeSort {
  if (chosen === "az" || chosen === "new") return chosen;
  return nearbyAvailable ? "nearby" : "az";
}
