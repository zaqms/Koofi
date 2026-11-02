"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
import { mostPopularHeading, neighborhoodsPath } from "@/lib/product";
import {
  LIST_SCROLL_MAX_WAIT_MS,
  listScrollAnchorY,
  listScrollRestoreTarget,
  listScrollShouldRelease,
  nearbyListScrollSettled,
  releaseListScroll,
  rememberListScroll,
  takeListScroll,
  writeListScroll,
} from "@/lib/list-scroll";
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

/** Top card still on screen, with its top edge measured from the viewport. */
function topVisibleListCard(): { id: string; top: number } | null {
  const nodes = document.querySelectorAll<HTMLElement>("[data-shop-id]");
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom < 64) continue;
    if (rect.top > window.innerHeight * 0.9) continue;
    const id = node.getAttribute("data-shop-id") ?? "";
    if (!/^[a-z0-9-]{1,80}$/.test(id)) continue;
    return { id, top: Math.round(rect.top) };
  }
  return null;
}

function listCardDocumentTop(cardId: string | undefined): number | null {
  if (!cardId) return null;
  const node = document.querySelector<HTMLElement>(`[data-shop-id="${CSS.escape(cardId)}"]`);
  if (!node) return null;
  return node.getBoundingClientRect().top + window.scrollY;
}

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
  const listScrollRestored = useRef(false);
  const listScrollStarted = useRef<number | null>(null);
  const listScrollMoved = useRef(false);
  const [listScrollTick, setListScrollTick] = useState(0);

  useEffect(() => {
    function onPageHide() {
      const record = rememberListScroll(window.location.pathname, window.scrollY, topVisibleListCard());
      if (!record) return;
      try {
        writeListScroll(window.sessionStorage, record);
      } catch {
        // Private mode still has the browser's own scroll restoration.
      }
    }
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  useEffect(() => {
    listScrollStarted.current = performance.now();
    function onMove() {
      if (listScrollMoved.current) return;
      listScrollMoved.current = true;
      setListScrollTick((tick) => tick + 1);
    }
    const options = { passive: true, capture: true } as const;
    window.addEventListener("wheel", onMove, options);
    window.addEventListener("touchstart", onMove, options);
    window.addEventListener("touchmove", onMove, options);
    window.addEventListener("keydown", onMove, options);
    const timer = window.setTimeout(() => setListScrollTick((tick) => tick + 1), LIST_SCROLL_MAX_WAIT_MS);
    return () => {
      window.removeEventListener("wheel", onMove, options);
      window.removeEventListener("touchstart", onMove, options);
      window.removeEventListener("touchmove", onMove, options);
      window.removeEventListener("keydown", onMove, options);
      window.clearTimeout(timer);
    };
  }, []);

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
  const scrollSettled = nearbyListScrollSettled({
    listId,
    located,
    permission,
    visitorStatus: visitor.status,
  });

  useLayoutEffect(() => {
    if (listScrollRestored.current) return;
    const elapsedMs = performance.now() - (listScrollStarted.current ?? performance.now());
    let record = null;
    try {
      record = takeListScroll(window.sessionStorage);
    } catch {
      record = null;
    }
    let navigationType: string | null = null;
    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      navigationType = nav?.type ?? null;
    } catch {
      navigationType = null;
    }
    const decision = {
      navigationType,
      pathname: window.location.pathname,
      record,
      settled: scrollSettled,
      elapsedMs,
      userMoved: listScrollMoved.current,
    };
    if (!listScrollShouldRelease(decision)) return;
    listScrollRestored.current = true;
    releaseListScroll();
    const y = listScrollRestoreTarget(decision);
    if (y == null || !record) return;
    const top = listCardDocumentTop(record.cardId);
    const anchored = listScrollAnchorY(record, top);
    window.scrollTo(0, anchored);
    window.requestAnimationFrame(() => window.scrollTo(0, anchored));
  }, [scrollSettled, listScrollTick]);

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
          {locationDenied ? (
            <p
              className="rounded-xl border border-line bg-foam px-3 py-2 text-sm leading-5 text-ink"
              data-location-notice="blocked"
              role="status"
            >
              {FIXED_LIST_ACTION.locationBlocked[language]}{" "}
              <Link
                href={neighborhoodsPath(language)}
                className="font-medium underline underline-offset-2"
              >
                {FIXED_LIST_ACTION.pickNeighborhood[language]}
              </Link>
              {" · "}
              <button
                type="button"
                data-retry-location=""
                onClick={useMyLocation}
                className="font-medium underline underline-offset-2"
              >
                {FIXED_LIST_ACTION.retryLocation[language]}
              </button>
            </p>
          ) : (
            <button
              type="button"
              data-use-my-location=""
              data-location-state={locationUnread ? "unread" : "prompt"}
              onClick={useMyLocation}
              className="inline-flex h-10 items-center rounded-full bg-bean px-4 text-sm text-foam"
            >
              {locationUnread
                ? FIXED_LIST_ACTION.retryLocation[language]
                : FIXED_LIST_ACTION.useLocation[language]}
            </button>
          )}
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
