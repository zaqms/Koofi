"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { BrowseNeighborhoods } from "@/components/browse-neighborhoods";
import { DirectoryCard } from "@/components/directory-card";
import { FixedListPills } from "@/components/fixed-list-nav";
import { ResultsFeedbackBlock } from "@/components/results-feedback";
import { ResultsFeedbackReveal } from "@/components/results-feedback-reveal";
import type { HomeNeighborhoodCandidate } from "@/lib/browse-neighborhoods";
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
} from "@/lib/chain-filter";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import { shopDistanceKm } from "@/lib/directory-sort";
import {
  FIXED_LIST_ACTION,
  FIXED_LIST_NEARBY_PAGE_SIZE,
  fixedListAllowsChains,
  fixedListExplainer,
  fixedListHasSort,
  fixedListHeading,
  nearbyExplainer,
  type FixedListId,
  type NearbyExplainerState,
} from "@/lib/fixed-list-ids";
import { mostPopularHeading } from "@/lib/product";
import { isUsableVisitorOrigin } from "@/lib/place-coords";
import { trackEvent } from "@/lib/track";
import type { Language, Pin } from "@/lib/types";
import {
  readGeolocationPermission,
  requestVisitorLocation,
  usePeekVisitorLocation,
  type GeoPermission,
} from "@/lib/visitor-location";

type FixedListSort = "popular" | "nearby";

type FixedListBodyProps = {
  language: Language;
  listId: FixedListId;
  shops: DirectoryShop[];
  popularFallback: DirectoryShop[];
  neighborhoodCandidates: readonly HomeNeighborhoodCandidate[];
};

function originFromVisitor(
  visitor: ReturnType<typeof usePeekVisitorLocation>,
): Pin | null {
  if (visitor.status !== "ready") return null;
  const pin = { lat: visitor.lat, lng: visitor.lng };
  return isUsableVisitorOrigin(pin) ? pin : null;
}

function sortByDistance(shops: readonly DirectoryShop[], origin: Pin): DirectoryShop[] {
  return shops.slice().sort((a, b) => {
    const ak = shopDistanceKm(a, origin);
    const bk = shopDistanceKm(b, origin);
    if (ak == null && bk == null) return a.id.localeCompare(b.id);
    if (ak == null) return 1;
    if (bk == null) return -1;
    if (ak !== bk) return ak - bk;
    return a.id.localeCompare(b.id);
  });
}

export function FixedListBody({
  language,
  listId,
  shops,
  popularFallback,
  neighborhoodCandidates,
}: FixedListBodyProps) {
  const visitor = usePeekVisitorLocation();
  const origin = originFromVisitor(visitor);
  const allowsChains = fixedListAllowsChains(listId);
  const hideChains = useSyncExternalStore(
    subscribeHideChains,
    readHideChains,
    hideChainsServerSnapshot,
  );
  const [shown, setShown] = useState(FIXED_LIST_NEARBY_PAGE_SIZE);
  const [sort, setSort] = useState<FixedListSort>("popular");
  const [permission, setPermission] = useState<GeoPermission>("unknown");

  useEffect(() => {
    syncHideChainsAttribute(readHideChains());
  }, [hideChains]);

  useEffect(() => {
    let cancelled = false;
    void readGeolocationPermission().then((next) => {
      if (!cancelled) setPermission(next);
    });
    return () => {
      cancelled = true;
    };
  }, [visitor.status]);

  const located = listId === "nearby" && origin != null;
  const popularFallbackOn = listId === "nearby" && !located;
  const pool = popularFallbackOn ? popularFallback : shops;
  const chainCount = shops.filter((shop) => shop.isChain).length;
  // The popular-12 fallback has no chains, so Local only would do nothing there.
  // Nearby shows the toggle only once the distance-sorted list is on screen.
  const showChainToggle = allowsChains && chainCount > 0 && !popularFallbackOn;
  const chainScoped = useMemo(
    () =>
      showChainToggle && hideChains ? pool.filter((shop) => !shop.isChain) : pool,
    [showChainToggle, hideChains, pool],
  );
  const sorted = useMemo(() => {
    if (listId === "nearby") {
      return origin ? sortByDistance(chainScoped, origin) : chainScoped;
    }
    if (sort === "nearby" && origin) return sortByDistance(chainScoped, origin);
    return chainScoped;
  }, [listId, origin, sort, chainScoped]);
  const visible =
    located ? sorted.slice(0, shown) : sorted;
  const canShowMore = located && shown < sorted.length;
  const locationDenied =
    permission === "denied" || visitor.status === "denied";
  const locationUnread =
    !locationDenied && visitor.status === "unavailable";
  const nearbyState: NearbyExplainerState | null =
    listId !== "nearby"
      ? null
      : located
        ? "located"
        : locationDenied
          ? "denied"
          : locationUnread
            ? "unread"
            : "noLocation";
  const explainer = nearbyState
    ? nearbyExplainer(nearbyState, language)
    : fixedListExplainer(listId, language);
  const headingId = `fixed-list-${listId}`;
  const listedIds = sorted.slice(0, 8).map((shop) => shop.id);
  const localOnlyEmpty = showChainToggle && hideChains && sorted.length === 0;

  function pickChainFilter(nextHidden: boolean) {
    writeHideChains(nextHidden);
    const visibleCount = (
      nextHidden ? pool.filter((shop) => !shop.isChain) : pool
    ).length;
    const state = nextHidden ? "hidden" : "shown";
    trackEvent(
      "chain_filter",
      {
        state,
        locale: language,
        listing: "category",
        chain_count: chainCount,
        visible_count: visibleCount,
      },
      {
        dedupeKey: chainFilterDedupeKey({
          listing: "category",
          language,
          state,
        }),
      },
    );
  }

  function pickSort(next: FixedListSort) {
    setSort(next);
    if (next === "nearby" && !origin) {
      void requestVisitorLocation({ retry: true });
    }
  }

  function useMyLocation() {
    void requestVisitorLocation({ retry: true });
  }

  return (
    <section
      className="mx-auto w-full max-w-md bg-paper px-4 pt-2 pb-8"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby={headingId}
      data-fixed-list={listId}
      data-fixed-list-mode={
        located ? "distance" : popularFallbackOn ? "popular-fallback" : "list"
      }
      data-fixed-list-count={shops.length}
    >
      <h1 id={headingId} className="text-lg font-semibold leading-7">
        {fixedListHeading(listId, language)}
      </h1>
      <p
        className="mt-1 text-sm leading-6 text-ink-soft"
        data-fixed-list-explainer={nearbyState ?? ""}
      >
        {explainer}
      </p>
      <FixedListPills language={language} current={listId} />

      {popularFallbackOn ? (
        <div className="mt-4" data-fixed-list-locate="">
          <button
            type="button"
            data-use-my-location=""
            data-location-state={
              locationDenied ? "blocked" : locationUnread ? "unread" : "prompt"
            }
            onClick={useMyLocation}
            className="inline-flex h-10 items-center rounded-full bg-bean px-4 text-sm text-foam"
          >
            {locationDenied
              ? FIXED_LIST_ACTION.locationBlocked[language]
              : locationUnread
                ? FIXED_LIST_ACTION.retryLocation[language]
                : FIXED_LIST_ACTION.useLocation[language]}
          </button>
          {neighborhoodCandidates.length > 0 ? (
            <BrowseNeighborhoods
              language={language}
              candidates={neighborhoodCandidates}
              embedded
            />
          ) : null}
        </div>
      ) : null}

      {fixedListHasSort(listId) ? (
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="tablist"
          aria-label={copy.directorySortLabel[language]}
          data-fixed-list-sort=""
        >
          {(["popular", "nearby"] as const).map((key) => {
            const selected = sort === key;
            const label =
              key === "popular"
                ? copy.neighborhoodsSortPopular[language]
                : copy.neighborhoodsSortNearby[language];
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                data-fixed-list-sort-key={key}
                onClick={() => pickSort(key)}
                className={
                  selected
                    ? "h-8 rounded-full bg-bean px-3 text-[13px] text-foam"
                    : "h-8 rounded-full border border-line bg-paper px-3 text-[13px] text-ink"
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}
      {fixedListHasSort(listId) && sort === "nearby" && !origin ? (
        <p className="mt-2 text-xs leading-5 text-ink-soft" data-fixed-list-nearby-hint="">
          {copy.directorySortNearbyHint[language]}
        </p>
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

      {popularFallbackOn ? (
        <h2 className="mt-5 text-base font-semibold" data-fixed-list-popular="">
          {mostPopularHeading(language)}
        </h2>
      ) : null}

      <ul className="mt-4 grid gap-3" data-fixed-list-cards="">
        {visible.map((shop) => (
          <DirectoryCard
            key={shop.id}
            shop={shop}
            language={language}
            autoLocate={false}
          />
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
      {canShowMore ? (
        <button
          type="button"
          data-fixed-show-more=""
          onClick={() => setShown((count) => count + FIXED_LIST_NEARBY_PAGE_SIZE)}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-line bg-paper text-sm text-ink"
        >
          {FIXED_LIST_ACTION.showMore[language]}
        </button>
      ) : null}

      {sorted.length === 0 && !localOnlyEmpty ? (
        <div className="mt-4">
          <ResultsFeedbackBlock
            language={language}
            preset="zero"
            resetKey={`fixed-zero:${listId}`}
            categoryId={listId}
            categorySlug={listId}
          />
        </div>
      ) : null}
      {sorted.length > 0 ? (
        <div className="mt-4">
          <ResultsFeedbackReveal ready>
            <ResultsFeedbackBlock
              language={language}
              preset="category"
              resetKey={`fixed:${listId}:${listedIds.join(",")}`}
              shopIds={listedIds}
              count={sorted.length}
              categoryId={listId}
              categorySlug={listId}
            />
          </ResultsFeedbackReveal>
        </div>
      ) : null}
    </section>
  );
}
