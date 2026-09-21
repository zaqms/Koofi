"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DirectoryCard } from "@/components/directory-card";
import { DirectoryResultSortPills } from "@/components/directory-result-sort";
import { ResultsFeedbackBlock } from "@/components/results-feedback";
import { ResultsFeedbackReveal } from "@/components/results-feedback-reveal";
import {
  directoryNeighborhoods,
  filterDirectoryShops,
  filterDirectoryShopsByMoment,
  type DirectoryShop,
} from "@/lib/directory";
import { directoryHintForCity } from "@/lib/cities";
import { useCity } from "@/lib/city-context";
import { copy } from "@/lib/copy";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
} from "@/lib/directory-category";
import {
  isDirectoryResultSortChip,
  sortDirectoryShops,
  type DirectoryResultSort,
} from "@/lib/directory-sort";
import {
  DISTRICT_CAFE_SORT_COPY,
  DISTRICT_CAFE_SORTS,
  districtCafeSortServerSnapshot,
  readDistrictCafeSort,
  resolveDistrictCafeSort,
  sortDistrictCafes,
  subscribeDistrictCafeSort,
  writeDistrictCafeSort,
  type DistrictCafeSort,
} from "@/lib/district-cafe-sort";
import { NEIGHBORHOODS, neighborhoodLabel } from "@/lib/neighborhoods";
import {
  districtPath,
  discoveryCategoryLabel,
  getDiscoveryCategory,
  homePath,
  isStaticDirectoryChip,
  mostPopularHeading,
  mostPopularPath,
} from "@/lib/product";
import { trackEvent } from "@/lib/track";
import { isUsableVisitorOrigin } from "@/lib/place-coords";
import type { Language, MomentTag, NeighborhoodId, Pin } from "@/lib/types";
import {
  requestVisitorLocation,
  usePeekVisitorLocation,
} from "@/lib/visitor-location";

type ShopDirectoryProps = {
  language: Language;
  shops: DirectoryShop[];
  district?: NeighborhoodId | null;
  listing?: "popular" | null;
  moment?: MomentTag | null;
  chipId?: string | null;
  intro?: ReactNode;
};

function originFromVisitor(
  visitor: ReturnType<typeof usePeekVisitorLocation>,
): Pin | null {
  if (visitor.status !== "ready") return null;
  const pin = { lat: visitor.lat, lng: visitor.lng };
  return isUsableVisitorOrigin(pin) ? pin : null;
}

export function ShopDirectory({
  language,
  shops,
  district = null,
  listing = null,
  moment = null,
  chipId = null,
  intro = null,
}: ShopDirectoryProps) {
  const { liveCity } = useCity();
  const popular = listing === "popular";
  const vibe = chipId ? getDiscoveryCategory(chipId) : undefined;
  const resultSort = isDirectoryResultSortChip(chipId);
  const visitor = usePeekVisitorLocation();
  const origin = originFromVisitor(visitor);
  const nearbyAvailable = origin != null;
  const [userSort, setUserSort] = useState<DirectoryResultSort | null>(null);
  const storedDistrictSort = useSyncExternalStore(
    subscribeDistrictCafeSort,
    readDistrictCafeSort,
    districtCafeSortServerSnapshot,
  );
  const districtSort = resolveDistrictCafeSort(
    storedDistrictSort,
    nearbyAvailable,
  );
  const requested: DirectoryResultSort =
    userSort ?? (resultSort && nearbyAvailable ? "nearby" : "new");
  const waitingForNearby =
    requested === "nearby" && visitor.status === "pending";
  const sort: DirectoryResultSort =
    requested === "nearby" && !nearbyAvailable ? "new" : requested;
  const selectedSort: DirectoryResultSort = waitingForNearby
    ? "nearby"
    : sort;
  const showNearbyHint = resultSort && requested === "nearby" && !nearbyAvailable;

  const areas = directoryNeighborhoods(shops);
  const filtered = useMemo(
    () =>
      popular
        ? shops
        : moment
          ? filterDirectoryShopsByMoment(shops, moment)
          : filterDirectoryShops(shops, district),
    [popular, shops, moment, district],
  );
  const visible = useMemo(() => {
    if (district) {
      return sortDistrictCafes(filtered, districtSort, origin, language);
    }
    if (resultSort) {
      return sortDirectoryShops(filtered, sort, origin, language);
    }
    return filtered;
  }, [district, districtSort, resultSort, filtered, sort, origin, language]);

  function pickDistrictSort(next: DistrictCafeSort) {
    writeDistrictCafeSort(next);
    trackEvent(
      "directory_sort",
      {
        sort: next,
        locale: language,
        district_id: district ?? undefined,
      },
      { dedupeKey: `district_cafe_sort:${district}:${language}:${next}` },
    );
    if (next === "nearby" && !nearbyAvailable) {
      void requestVisitorLocation({ retry: true });
    }
  }

  function pickSort(next: DirectoryResultSort) {
    setUserSort(next);
    trackEvent(
      "directory_sort",
      { sort: next, locale: language, chip_id: chipId ?? undefined },
      { dedupeKey: `directory_sort:${chipId}:${language}:${next}` },
    );
    if (next === "nearby" && visitor.status !== "ready") {
      void requestVisitorLocation({ retry: true });
    }
  }

  const heading = popular
    ? mostPopularHeading(language)
    : district
      ? categoryDistrictHeading(COFFEE_SHOPS_CATEGORY, district, language)
      : vibe
        ? discoveryCategoryLabel(vibe.id, language) ?? copy.directory[language]
        : copy.directory[language];
  const headingId = popular
    ? "most-popular"
    : district
      ? "koofi-district"
      : vibe
        ? `wain-chip-${vibe.id}`
        : "koofi-directory";
  const categoryPage =
    Boolean(district) ||
    popular ||
    Boolean(chipId && isStaticDirectoryChip(chipId));
  const categoryId = district ?? (popular ? "popular" : chipId);
  const listedIds = visible.slice(0, 8).map((shop) => shop.id);
  const feedbackResetIds = district
    ? [...filtered].map((shop) => shop.id).sort()
    : listedIds;

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-10"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby={headingId}
    >
      {district || popular || vibe ? (
        <h1 id={headingId} className="text-base font-semibold">
          {heading}
        </h1>
      ) : (
        <h2 id={headingId} className="text-base font-semibold">
          {heading}
        </h2>
      )}
      {intro ? null : (
        <p className="mt-1 text-xs leading-5 text-ink-soft">
          {directoryHintForCity(language, liveCity)}
        </p>
      )}

      {popular ? (
      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label={copy.neighborhood[language]}
      >
        <Link
          href={homePath(language)}
          scroll={false}
          aria-current={district === null && !popular ? "page" : undefined}
          className={chipClass(district === null && !popular)}
        >
          {copy.allDistricts[language]}
        </Link>
        <Link
          href={popular ? homePath(language) : mostPopularPath(language)}
          scroll={false}
          aria-current={popular ? "page" : undefined}
          className={chipClass(popular)}
        >
          {discoveryCategoryLabel("popular", language)}
        </Link>
        {areas.map((id) => {
          const selected = district === id;
          return (
            <Link
              key={id}
              href={selected ? homePath(language) : districtPath(id, language)}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              onClick={() => {
                if (!selected) {
                  const hood = NEIGHBORHOODS[id];
                  trackEvent(
                    "district_select",
                    {
                      district_id: hood.id,
                      district_ar: hood.ar,
                      district_en: hood.en,
                      locale: language,
                    },
                    { dedupeKey: `district_select:${hood.id}` },
                  );
                }
              }}
              className={chipClass(selected)}
            >
              {neighborhoodLabel(id, language)}
            </Link>
          );
        })}
      </div>
      ) : null}

      {district ? (
        <DirectoryResultSortPills
          language={language}
          sort={districtSort}
          sorts={DISTRICT_CAFE_SORTS}
          labels={DISTRICT_CAFE_SORT_COPY}
          marker="district"
          onPick={pickDistrictSort}
          nearbyAvailable={nearbyAvailable}
        />
      ) : resultSort ? (
        <DirectoryResultSortPills
          language={language}
          sort={selectedSort}
          onPick={pickSort}
          nearbyAvailable={nearbyAvailable}
          showNearbyHint={showNearbyHint}
        />
      ) : null}

      <ul
        className="mt-4 grid gap-3"
        data-district-cafe-order={district ? districtSort : undefined}
      >
        {visible.map((shop) => (
          <DirectoryCard key={shop.id} shop={shop} language={language} />
        ))}
      </ul>
      {categoryPage && visible.length === 0 && !waitingForNearby ? (
        <div className="mt-4">
          <ResultsFeedbackBlock
            language={language}
            preset="zero"
            resetKey={`category-zero:${categoryId ?? "none"}`}
            categoryId={categoryId ?? undefined}
            categorySlug={district ?? vibe?.slug ?? categoryId ?? undefined}
          />
        </div>
      ) : null}
      {categoryPage && visible.length > 0 ? (
        <div className="mt-4">
          <ResultsFeedbackReveal ready={!waitingForNearby}>
            <ResultsFeedbackBlock
              language={language}
              preset="category"
              resetKey={`category:${categoryId ?? "none"}:${feedbackResetIds.join(",")}`}
              shopIds={listedIds}
              count={visible.length}
              categoryId={categoryId ?? undefined}
              categorySlug={district ?? vibe?.slug ?? categoryId ?? undefined}
            />
          </ResultsFeedbackReveal>
        </div>
      ) : null}
      {intro}
    </section>
  );
}

function chipClass(selected: boolean): string {
  return selected
    ? "rounded-full border border-bean bg-bean px-2.5 py-1 text-[11px] leading-5 text-foam"
    : "rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink hover:border-bean hover:bg-paper-deep";
}
