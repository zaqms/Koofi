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
  clearListScroll,
  installListScrollTraverseListener,
  listScrollTraverseRecent,
  listScrollAnchorY,
  listScrollLooksLikeUserMove,
  listScrollRestoreTarget,
  listScrollShouldRelease,
  listScrollShownToRestore,
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

/** Café card href, Arabic or English, with or without a query. Not a Maps link. */
function isCafeCardHref(href: string): boolean {
  if (!href || href.startsWith("#")) return false;
  let path = href;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      path = new URL(href).pathname;
    } catch {
      return false;
    }
  }
  const cut = path.search(/[?#]/);
  if (cut >= 0) path = path.slice(0, cut);
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return /^\/(?:en\/)?c\/[^/]+$/.test(path);
}

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

function trackedListCard(): { id: string; top: number } | null {
  try {
    const record = takeListScroll(window.sessionStorage);
    if (record?.cardId) {
      const node = document.querySelector<HTMLElement>(`[data-shop-id="${CSS.escape(record.cardId)}"]`);
      if (node) return { id: record.cardId, top: Math.round(node.getBoundingClientRect().top) };
    }
  } catch {
    // The card on screen is enough to tell a scroll from layout anchoring.
  }
  return topVisibleListCard();
}

function listCardScreenTop(cardId: string | null): number | null {
  if (!cardId) return null;
  const node = document.querySelector<HTMLElement>(`[data-shop-id="${CSS.escape(cardId)}"]`);
  if (!node) return null;
  return Math.round(node.getBoundingClientRect().top);
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
  const listScrollBaselineId = useRef<string | null>(null);
  const listScrollBaselineTop = useRef<number | null>(null);
  const listScrollBaselineY = useRef<number | null>(null);
  const listScrollIgnoreUntil = useRef(0);
  const listScrollBack = useRef<boolean | null>(null);
  const listScrollNavType = useRef<string | null>(null);
  const shownRef = useRef(shown);
  const openedCardRef = useRef<{ id: string; top: number } | null>(null);
  const [listScrollTick, setListScrollTick] = useState(0);

  useEffect(() => {
    shownRef.current = shown;
  }, [shown]);

  useEffect(() => {
    installListScrollTraverseListener();

    function persist(card: { id: string; top: number } | null) {
      const sample = document.querySelector<HTMLElement>("[data-shop-id]");
      try {
        const record = rememberListScroll(
          window.location.pathname,
          window.scrollY,
          card,
          sample ? sample.getBoundingClientRect().height : null,
          shownRef.current,
        );
        if (!record) {
          clearListScroll(window.sessionStorage);
          return;
        }
        writeListScroll(window.sessionStorage, record);
      } catch {
        // Private mode still has the browser's own scroll restoration.
      }
    }

    function onPageHide() {
      // A click already stored the opened card. A hard navigation that
      // never clicked (the address bar, or a scripted assign) uses the
      // top card on screen.
      persist(openedCardRef.current ?? topVisibleListCard());
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : null;
      if (!element) return;
      const link = element.closest("a");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!isCafeCardHref(link.getAttribute("href") ?? "")) return;
      const card = link.closest("[data-shop-id]");
      if (!(card instanceof HTMLElement)) return;
      const id = card.getAttribute("data-shop-id") ?? "";
      if (!/^[a-z0-9-]{1,80}$/.test(id)) return;
      const anchor = { id, top: Math.round(card.getBoundingClientRect().top) };
      openedCardRef.current = anchor;
      // Next.js <Link> stays in this document, so pagehide does not fire.
      persist(anchor);
    }

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    listScrollStarted.current = performance.now();
    function markMoved() {
      if (listScrollMoved.current) return;
      listScrollMoved.current = true;
      setListScrollTick((tick) => tick + 1);
    }
    function adoptBaseline() {
      const card = trackedListCard();
      listScrollBaselineId.current = card?.id ?? null;
      listScrollBaselineTop.current = card?.top ?? null;
      listScrollBaselineY.current = window.scrollY;
    }
    function onScroll() {
      if (listScrollMoved.current) return;
      if (performance.now() < listScrollIgnoreUntil.current) {
        adoptBaseline();
        return;
      }
      const baselineId = listScrollBaselineId.current;
      const currentTop = listCardScreenTop(baselineId);
      if (!baselineId || currentTop == null) {
        // The list swapped, or nothing was on screen yet. Adopt the new card.
        adoptBaseline();
        return;
      }
      const moved = listScrollLooksLikeUserMove({
        cardId: baselineId,
        cardTop: currentTop,
        baselineCardId: baselineId,
        baselineCardTop: listScrollBaselineTop.current,
        scrollY: window.scrollY,
        baselineScrollY: listScrollBaselineY.current,
      });
      if (!moved) listScrollBaselineY.current = window.scrollY;
      if (moved) markMoved();
    }
    adoptBaseline();
    const options = { passive: true, capture: true } as const;
    window.addEventListener("wheel", markMoved, options);
    window.addEventListener("touchstart", markMoved, options);
    window.addEventListener("touchmove", markMoved, options);
    window.addEventListener("keydown", markMoved, options);
    window.addEventListener("pointerdown", markMoved, options);
    window.addEventListener("mousedown", markMoved, options);
    window.addEventListener("scroll", onScroll, options);
    const timer = window.setTimeout(() => setListScrollTick((tick) => tick + 1), LIST_SCROLL_MAX_WAIT_MS);
    return () => {
      window.removeEventListener("wheel", markMoved, options);
      window.removeEventListener("touchstart", markMoved, options);
      window.removeEventListener("touchmove", markMoved, options);
      window.removeEventListener("keydown", markMoved, options);
      window.removeEventListener("pointerdown", markMoved, options);
      window.removeEventListener("mousedown", markMoved, options);
      window.removeEventListener("scroll", onScroll, options);
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
    if (listScrollBack.current == null) {
      let navigationType: string | null = null;
      try {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        navigationType = nav?.type ?? null;
      } catch {
        navigationType = null;
      }
      listScrollNavType.current = navigationType;
      // A full Back reloads the document (`back_forward`). A <Link> Back
      // stays in the document, so only the popstate flag says it was Back.
      listScrollBack.current =
        navigationType !== "reload" &&
        (navigationType === "back_forward" || listScrollTraverseRecent());
    }
    const navigationType = listScrollNavType.current;
    const traversed = listScrollBack.current === true && navigationType !== "back_forward";
    const elapsedMs = performance.now() - (listScrollStarted.current ?? performance.now());
    let record = null;
    try {
      record = takeListScroll(window.sessionStorage);
    } catch {
      record = null;
    }
    const decision = {
      navigationType,
      pathname: window.location.pathname,
      record,
      settled: scrollSettled,
      elapsedMs,
      userMoved: listScrollMoved.current,
      traversed,
    };
    // The extra cards have to be in the document before scroll. Otherwise
    // the anchor is missing and the browser clamps the offset to 12 cards.
    const needed = listScrollShownToRestore(decision);
    if (needed != null && shown < needed) {
      setShown(needed);
      return;
    }
    if (!listScrollShouldRelease(decision)) return;
    listScrollRestored.current = true;
    releaseListScroll();
    const y = listScrollRestoreTarget(decision);
    if (y == null || !record) return;
    const anchorId = record.cardId;
    const savedTop = record.cardTop;
    // The browser's history snapshot can land a moment after we scroll, a
    // little short of the card. Re-measure and correct until that settles.
    // Stop when the visitor actually moves, so we don't pull them back.
    const apply = (focus: boolean) => {
      if (listScrollMoved.current) return;
      const card = anchorId
        ? document.querySelector<HTMLElement>(`[data-shop-id="${CSS.escape(anchorId)}"]`)
        : null;
      const docTop = card ? card.getBoundingClientRect().top + window.scrollY : null;
      const fallback = listScrollAnchorY(record, docTop);
      const liveTop = card ? card.getBoundingClientRect().top : null;
      const y =
        liveTop != null && typeof savedTop === "number"
          ? Math.max(0, Math.round(window.scrollY + (liveTop - savedTop)))
          : fallback;
      listScrollIgnoreUntil.current = performance.now() + 80;
      window.scrollTo(0, y);
      if (focus) {
        const link = card?.querySelector('a[href*="/c/"]');
        // preventScroll keeps the anchor. Without this, Back leaves focus on body.
        if (link instanceof HTMLElement && document.activeElement !== link) {
          link.focus({ preventScroll: true });
        }
      }
      listScrollBaselineId.current = anchorId ?? null;
      listScrollBaselineTop.current = card ? Math.round(card.getBoundingClientRect().top) : null;
      listScrollBaselineY.current = window.scrollY;
    };
    const path = window.location.pathname;
    const run = (focus: boolean) => {
      if (window.location.pathname !== path) return;
      apply(focus);
    };
    run(true);
    const frame = window.requestAnimationFrame(() => run(false));
    const timers = [
      window.setTimeout(() => run(true), 50),
      window.setTimeout(() => run(false), 140),
    ];
    return () => {
      window.cancelAnimationFrame(frame);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [scrollSettled, listScrollTick, shown]);

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
          onClick={() =>
            setShown((count) => {
              const next = count + FIXED_LIST_NEARBY_PAGE_SIZE;
              shownRef.current = next;
              return next;
            })
          }
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
