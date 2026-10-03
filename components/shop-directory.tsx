"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { DirectoryCard } from "@/components/directory-card";
import { DirectoryResultSortPills } from "@/components/directory-result-sort";
import { ViewAllLink } from "@/components/view-all-link";
import { ResultsFeedbackBlock } from "@/components/results-feedback";
import { ResultsFeedbackReveal } from "@/components/results-feedback-reveal";
import {
  filterDirectoryShops,
  filterDirectoryShopsByMoment,
  type DirectoryShop,
} from "@/lib/directory";
import { cafesHeadingForCity, directoryHintForCity } from "@/lib/cities";
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
import {
  discoveryCategoryLabel,
  getDiscoveryCategory,
  isStaticDirectoryChip,
  mostPopularHeading,
} from "@/lib/product";
import {
  CHAIN_FILTER_EMPTY_LEAD,
  CHAIN_FILTER_LABEL,
  CHAIN_FILTER_SHOW,
  chainFilterDedupeKey,
  hideChainsServerSnapshot,
  readHideChains,
  subscribeHideChains,
  syncHideChainsAttribute,
  writeHideChains,
  type ChainFilterListing,
} from "@/lib/chain-filter";
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
  /** Bare home uses قهاوي الرياض / Riyadh cafés instead of the directory title. */
  headingMode?: "city-cafes";
  viewAllHref?: string | null;
  sectionId?: string;
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
  headingMode,
  viewAllHref = null,
  sectionId,
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
  const hideChains = useSyncExternalStore(
    subscribeHideChains,
    readHideChains,
    hideChainsServerSnapshot,
  );
  useEffect(() => {
    syncHideChainsAttribute(readHideChains());
  }, [hideChains]);
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

  const filtered = useMemo(
    () =>
      popular
        ? shops
        : moment
          ? filterDirectoryShopsByMoment(shops, moment)
          : filterDirectoryShops(shops, district),
    [popular, shops, moment, district],
  );
  const chainCount = filtered.filter((shop) => shop.isChain).length;
  const chainListing: ChainFilterListing | null = district
    ? "district"
    : popular || headingMode === "city-cafes"
      ? null
      : chipId || moment
        ? "category"
        : null;
  const showChainToggle = chainListing != null && chainCount > 0;
  const chainScoped = useMemo(
    () =>
      showChainToggle && hideChains
        ? filtered.filter((shop) => !shop.isChain)
        : filtered,
    [showChainToggle, hideChains, filtered],
  );
  const visible = useMemo(() => {
    if (district) {
      return sortDistrictCafes(chainScoped, districtSort, origin, language);
    }
    if (resultSort) {
      return sortDirectoryShops(chainScoped, sort, origin, language);
    }
    return chainScoped;
  }, [district, districtSort, resultSort, chainScoped, sort, origin, language]);

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

  function pickChainFilter(nextHidden: boolean) {
    if (!chainListing) return;
    writeHideChains(nextHidden);
    const visibleCount = (
      nextHidden ? filtered.filter((shop) => !shop.isChain) : filtered
    ).length;
    const state = nextHidden ? "hidden" : "shown";
    trackEvent(
      "chain_filter",
      {
        state,
        locale: language,
        ...(district ? { district_id: district } : {}),
        listing: chainListing,
        chain_count: chainCount,
        visible_count: visibleCount,
      },
      {
        dedupeKey: chainFilterDedupeKey({
          listing: chainListing,
          districtId: district ?? undefined,
          language,
          state,
        }),
      },
    );
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

  const heading =
    headingMode === "city-cafes"
      ? cafesHeadingForCity(language, liveCity)
      : popular
        ? mostPopularHeading(language)
        : district
          ? categoryDistrictHeading(COFFEE_SHOPS_CATEGORY, district, language)
          : vibe
            ? discoveryCategoryLabel(vibe.id, language) ??
              copy.directory[language]
            : copy.directory[language];
  const homeList = headingMode === "city-cafes";
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
  const localOnlyEmpty = showChainToggle && hideChains && visible.length === 0;
  const feedbackResetIds = district
    ? [...chainScoped].map((shop) => shop.id).sort()
    : listedIds;

  return (
    <section
      id={homeList ? sectionId : undefined}
      className={
        homeList
          ? "mx-auto mt-12 w-full max-w-md bg-paper px-4 pt-0 pb-6"
          : "mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-10"
      }
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby={headingId}
    >
      {homeList ? (
        <div className="flex items-start justify-between gap-3">
          <h2 id={headingId} className="min-w-0 text-base font-semibold leading-6">
            {heading}
          </h2>
          {viewAllHref ? (
            <ViewAllLink href={viewAllHref} language={language} />
          ) : null}
        </div>
      ) : (
        <>
          {district || popular || vibe ? (
            <h1 id={headingId} className="text-base font-semibold">
              {heading}
            </h1>
          ) : (
            <h2 id={headingId} className="text-base font-semibold">
              {heading}
            </h2>
          )}
        </>
      )}
      {intro || homeList ? null : (
        <p className="mt-1 text-xs leading-5 text-ink-soft">
          {directoryHintForCity(language, liveCity)}
        </p>
      )}

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

      {showChainToggle ? (
        <div className="mt-3">
          <button
            type="button"
            aria-pressed={hideChains}
            data-chain-filter=""
            data-chain-filter-state={hideChains ? "hidden" : "shown"}
            onClick={() => pickChainFilter(!hideChains)}
            className={
              hideChains
                ? "h-8 rounded-full bg-bean px-3 text-[13px] text-foam"
                : "h-8 rounded-full border border-line bg-paper px-3 text-[13px] text-ink"
            }
          >
            {CHAIN_FILTER_LABEL[language]}
          </button>
        </div>
      ) : null}

      <ul
        className={homeList ? "mt-8 grid gap-3" : "mt-4 grid gap-3"}
        data-district-cafe-order={district ? districtSort : undefined}
      >
        {visible.map((shop) => (
          <DirectoryCard key={shop.id} shop={shop} language={language} />
        ))}
      </ul>
      {localOnlyEmpty ? (
        <p className="mt-4 text-sm leading-6 text-ink" data-chain-filter-empty="">
          {CHAIN_FILTER_EMPTY_LEAD[language]}
          <button
            type="button"
            className="text-bean underline"
            onClick={() => pickChainFilter(false)}
          >
            {CHAIN_FILTER_SHOW[language]}
          </button>
        </p>
      ) : null}
      {categoryPage && visible.length === 0 && !waitingForNearby && !localOnlyEmpty ? (
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
