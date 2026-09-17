import type { DirectoryShop } from "./directory";
import { copy } from "./copy";
import { haversineKm } from "./distance";
import { isRiyadhPlacePin } from "./place-coords";
import { shopDisplayName } from "./product";
import type { Language, Pin } from "./types";

/** Shared Matcha + Drive-through results sort. */
export const DIRECTORY_RESULT_SORTS = ["nearby", "new", "az"] as const;
export type DirectoryResultSort = (typeof DIRECTORY_RESULT_SORTS)[number];

export const DIRECTORY_RESULT_SORT_CHIPS = ["matcha", "drive-through"] as const;

export function isDirectoryResultSortChip(
  chipId: string | null | undefined,
): boolean {
  return (
    chipId === "matcha" || chipId === "drive-through"
  );
}

export const DIRECTORY_SORT_COPY: Record<
  DirectoryResultSort,
  { ar: string; en: string }
> = {
  nearby: copy.neighborhoodsSortNearby,
  new: copy.directorySortNew,
  az: copy.neighborhoodsSortAz,
};

export function shopDistanceKm(
  shop: Pick<DirectoryShop, "lat" | "lng">,
  origin: Pin | null,
): number | null {
  if (!origin || shop.lat == null || shop.lng == null) return null;
  const coords = { lat: shop.lat, lng: shop.lng };
  if (!isRiyadhPlacePin(coords)) return null;
  const km = haversineKm(origin, coords);
  return Number.isFinite(km) && km >= 0 ? km : null;
}

function compareShopName(
  a: Pick<DirectoryShop, "nameAr" | "nameEn">,
  b: Pick<DirectoryShop, "nameAr" | "nameEn">,
  language: Language,
): number {
  return shopDisplayName(a, language).localeCompare(
    shopDisplayName(b, language),
    language === "ar" ? "ar" : "en",
    { sensitivity: "base" },
  );
}

/**
 * Nearby only distance-sorts when a visitor origin exists.
 * Without location, Nearby must not silently clone A–Z — it uses
 * catalog-added order (same as New) until geo is ready.
 */
export function effectiveDirectorySort(
  sort: DirectoryResultSort,
  origin: Pin | null,
): DirectoryResultSort {
  if (sort === "nearby" && !origin) return "new";
  return sort;
}

/**
 * Display sort only. Does not filter the list.
 * New is catalog-added order (later catalog index first), not store opening date.
 */
export function sortDirectoryShops(
  shops: readonly DirectoryShop[],
  sort: DirectoryResultSort,
  origin: Pin | null,
  language: Language,
): DirectoryShop[] {
  const rows = [...shops];
  const resolved = effectiveDirectorySort(sort, origin);
  if (resolved === "new") {
    return rows.sort((a, b) => {
      if (b.catalogIndex !== a.catalogIndex) {
        return b.catalogIndex - a.catalogIndex;
      }
      return compareShopName(a, b, language);
    });
  }
  if (resolved === "az") {
    return rows.sort((a, b) => compareShopName(a, b, language));
  }
  return rows.sort((a, b) => {
    const da = shopDistanceKm(a, origin);
    const db = shopDistanceKm(b, origin);
    if (da == null && db == null) return compareShopName(a, b, language);
    if (da == null) return 1;
    if (db == null) return -1;
    if (da !== db) return da - db;
    return compareShopName(a, b, language);
  });
}
