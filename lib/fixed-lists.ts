import type { Metadata } from "next";
import { countedCafesAr, countedCafesEn } from "./cafe-count";
import { listDiscoveryShops, listListingShops } from "./catalog";
import { rankByPopularity } from "./district-rank";
import { fixedListHeading, type FixedListId } from "./fixed-list-ids";
import { listingOgCopy, listingOgImage } from "./listing-og";
import { pageAlternates } from "./locale";
import { officialShopCoords } from "./place-coords";
import {
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
  chipSharePath,
} from "./product";
import type { Language, Shop } from "./types";

/**
 * Eligibility for the four list pages.
 * Hours and seating come only from baked Places fields on the catalog row.
 * Null fails closed. No Places API calls. No invented seating.
 * Chat's 3-pick cap stays in lib/nearby.ts — this module is the page list.
 */

/** Most Popular order, then any row the index skipped, by id. */
function rankLikeMostPopular(shops: readonly Shop[]): Shop[] {
  const ranked = rankByPopularity(shops);
  if (ranked.length === shops.length) return ranked;
  const seen = new Set(ranked.map((shop) => shop.id));
  const rest = shops
    .filter((shop) => !seen.has(shop.id))
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  return [...ranked, ...rest];
}

/**
 * Every listed café with official coords. Local + listed chains.
 * Not brand-deduped and not capped at three. Distance sort is client-side.
 */
export function listNearbyShops(): Shop[] {
  return listListingShops().filter((shop) => officialShopCoords(shop) != null);
}

/** Places `outdoorSeating === true` only. null / false / missing stay out. */
export function listOutdoorShops(): Shop[] {
  return rankLikeMostPopular(
    listListingShops().filter((shop) => shop.outdoorSeating === true),
  );
}

/** Local roasters, same order as Most Popular. No chains. */
export function listBestCoffeeShops(): Shop[] {
  return rankLikeMostPopular(
    listDiscoveryShops().filter((shop) => shop.momentTags.includes("roaster")),
  );
}

/** Local, tagged work, and Places dineIn === true. No chains. */
export function listWorkShops(): Shop[] {
  return rankLikeMostPopular(
    listDiscoveryShops().filter(
      (shop) => shop.momentTags.includes("work") && shop.dineIn === true,
    ),
  );
}

export function listFixedListShops(id: FixedListId): Shop[] {
  if (id === "nearby") return listNearbyShops();
  if (id === "outdoor") return listOutdoorShops();
  if (id === "coffee") return listBestCoffeeShops();
  return listWorkShops();
}

export function fixedListCount(id: FixedListId): number {
  return listFixedListShops(id).length;
}

/** Meta description. Live count, not the opener and not the one-line explainer. */
export function fixedListDescription(id: FixedListId, language: Language): string {
  const n = fixedListCount(id);
  if (language === "ar") {
    const count = countedCafesAr(n);
    if (id === "nearby") return `${count} في الرياض، مرتبة حسب المسافة من موقعك.`;
    if (id === "outdoor") {
      return `${count} فيها جلسات خارجية في الرياض، حسب قائمة Google Maps.`;
    }
    if (id === "coffee") {
      return `${count} من محامص الرياض، مرتبة بنفس ترتيب أشهر القهاوي.`;
    }
    return `${count} تنفع للشغل في الرياض، وفيها قعدة حسب Google Maps.`;
  }
  const count = countedCafesEn(n);
  if (id === "nearby") return `${count} in Riyadh, sorted by distance from you.`;
  if (id === "outdoor") {
    return `${count} with outdoor seating in Riyadh, from the Google Maps listing.`;
  }
  if (id === "coffee") {
    return `${count} — Riyadh roasters, ranked the same way as Most Popular.`;
  }
  return `${count} good for work in Riyadh, tagged for work and dine-in on Google Maps.`;
}

export function fixedListTitle(id: FixedListId, language: Language): string {
  return `${fixedListHeading(id, language)} · ${PRODUCT_NAME}`;
}

export function fixedListMetadata(id: FixedListId, language: Language): Metadata {
  const title = fixedListTitle(id, language);
  const description = fixedListDescription(id, language);
  const url = chipSharePath(id, language);
  const ogSpec = { kind: "chip" as const, language, id };
  const og = listingOgCopy(ogSpec);
  const images = og ? [listingOgImage(ogSpec, og.title)] : [SOCIAL_SHARE_IMAGE];

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    alternates: pageAlternates(url, chipSharePath(id, "ar"), chipSharePath(id, "en")),
    openGraph: {
      title,
      description,
      siteName: PRODUCT_NAME,
      locale: language === "en" ? "en_US" : "ar_SA",
      type: "website",
      url,
      images,
    },
    twitter: {
      card: SOCIAL_TWITTER_CARD,
      title,
      description,
      images,
    },
  };
}
