import type { DirectoryShop } from "./directory";
import { copy } from "./copy";
import { haversineKm } from "./distance";
import { shopDisplayName } from "./product";
import type { Language, Pin } from "./types";

/** Matcha results sort — reused on Drive-through results only. */
export const DIRECTORY_RESULT_SORTS = ["nearby", "new", "az"] as const;
export type DirectoryResultSort = (typeof DIRECTORY_RESULT_SORTS)[number];

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
  const km = haversineKm(origin, { lat: shop.lat, lng: shop.lng });
  return Number.isFinite(km) ? km : null;
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
 * Display sort only. Does not filter the list.
 * Nearby falls back to A–Z when no origin. New is catalog-added order
 * (later catalog index first), not store opening date.
 */
export function sortDirectoryShops(
  shops: readonly DirectoryShop[],
  sort: DirectoryResultSort,
  origin: Pin | null,
  language: Language,
): DirectoryShop[] {
  const rows = [...shops];
  if (sort === "new") {
    return rows.sort((a, b) => {
      if (b.catalogIndex !== a.catalogIndex) {
        return b.catalogIndex - a.catalogIndex;
      }
      return compareShopName(a, b, language);
    });
  }
  if (sort === "az" || (sort === "nearby" && !origin)) {
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
