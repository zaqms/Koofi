"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_BROWSE_CITY,
  browseNeighborhoodLabel,
  resolveHomeNeighborhoods,
  type HomeNeighborhoodCandidate,
} from "@/lib/browse-neighborhoods";
import {
  browseNeighborhoodsHintForCity,
  isCatalogCity,
  type CityId,
} from "@/lib/cities";
import { useCity } from "@/lib/city-context";
import { copy } from "@/lib/copy";
import { useFreshHomeOrigin } from "@/lib/fresh-visitor-origin";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { districtPath, neighborhoodsPath } from "@/lib/product";
import { trackEvent, type DistrictSelectSource } from "@/lib/track";
import type { City, Language, NeighborhoodId } from "@/lib/types";

type BrowseNeighborhoodsProps = {
  language: Language;
  city?: CityId;
  candidates: readonly HomeNeighborhoodCandidate[];
};

function trackDistrict(
  id: NeighborhoodId,
  language: Language,
  city: City,
  source: DistrictSelectSource,
) {
  const hood = NEIGHBORHOODS[id];
  trackEvent(
    "district_select",
    {
      district_id: hood.id,
      district_ar: hood.ar,
      district_en: hood.en,
      locale: language,
      source,
      city,
    },
    { dedupeKey: `district_select:${source}:${hood.id}` },
  );
}

function Arrow({ point }: { point: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {point === "right" ? (
        <path d="M3.2 8h9.2M8.6 3.8 13 8l-4.4 4.2" />
      ) : (
        <path d="M12.8 8H3.6M7.4 3.8 3 8l4.4 4.2" />
      )}
    </svg>
  );
}

function ViewAllLink({
  language,
  city,
}: {
  language: Language;
  city: City;
}) {
  const rtl = language === "ar";
  return (
    <Link
      href={neighborhoodsPath(language)}
      data-view-all-cta={language}
      onClick={() => {
        trackEvent(
          "neighborhoods_view_all",
          { locale: language, city },
          { dedupeKey: `neighborhoods_view_all:${language}:${city}` },
        );
      }}
      className="inline-flex shrink-0 items-center gap-1 pt-1 text-[13px] leading-5 text-ink-soft"
    >
      <span>{copy.viewAllNeighborhoods[language]}</span>
      <Arrow point={rtl ? "left" : "right"} />
    </Link>
  );
}

function FeaturedPills({
  language,
  ids,
  city,
}: {
  language: Language;
  ids: readonly NeighborhoodId[];
  city: City;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rtl = language === "ar";
  const [canScroll, setCanScroll] = useState(true);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => {
      setCanScroll(row.scrollWidth > row.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [ids]);

  function scrollForward() {
    const row = rowRef.current;
    if (!row) return;
    const delta = Math.min(220, row.clientWidth * 0.7);
    row.scrollBy({ left: rtl ? -delta : delta, behavior: "smooth" });
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <div
        ref={rowRef}
        className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        data-neighborhood-row=""
        data-featured-visual={ids.join(",")}
      >
        <div className="flex w-max flex-nowrap items-center gap-1.5">
          {ids.map((id) => (
            <Link
              key={id}
              role="listitem"
              data-neighborhood-id={id}
              href={districtPath(id, language)}
              onClick={() => trackDistrict(id, language, city, "home_pill")}
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-line bg-foam px-3 text-[13px] leading-none text-ink"
            >
              {browseNeighborhoodLabel(id, language)}
            </Link>
          ))}
        </div>
      </div>
      {canScroll ? (
        <button
          type="button"
          data-browse-scroll=""
          onClick={scrollForward}
          aria-label={rtl ? "المزيد من الأحياء" : "More neighborhoods"}
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-foam text-ink"
        >
          <Arrow point={rtl ? "left" : "right"} />
        </button>
      ) : null}
    </div>
  );
}

export function BrowseNeighborhoods({
  language,
  city,
  candidates,
}: BrowseNeighborhoodsProps) {
  const { cityId: selectedCityId } = useCity();
  const selected = city ?? selectedCityId;
  const origin = useFreshHomeOrigin();
  const originLat = origin.status === "ready" ? origin.lat : null;
  const originLng = origin.status === "ready" ? origin.lng : null;
  const resolved = useMemo(
    () =>
      resolveHomeNeighborhoods({
        candidates,
        origin:
          originLat != null && originLng != null
            ? { lat: originLat, lng: originLng }
            : null,
        locationReady: originLat != null && originLng != null,
        selectedCityId: selected,
      }),
    [candidates, originLat, originLng, selected],
  );
  const trackCity: City = isCatalogCity(resolved.cityId)
    ? resolved.cityId
    : DEFAULT_BROWSE_CITY;
  const rtl = language === "ar";
  const ids = resolved.ids;

  return (
    <section
      className="mx-auto w-full max-w-md border-y border-line bg-paper px-4 py-4"
      dir={rtl ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="browse-neighborhoods"
      data-browse-pills=""
      data-browse-mode={resolved.mode}
      data-browse-city={resolved.cityId}
      style={rtl ? undefined : { direction: "ltr", unicodeBidi: "isolate" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="browse-neighborhoods" className="min-w-0 text-lg font-semibold leading-7">
          {copy.browseNeighborhoods[language]}
        </h2>
        <ViewAllLink language={language} city={trackCity} />
      </div>
      <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">
        {browseNeighborhoodsHintForCity(language, resolved.cityId)}
      </p>
      <FeaturedPills language={language} ids={ids} city={trackCity} />
    </section>
  );
}
