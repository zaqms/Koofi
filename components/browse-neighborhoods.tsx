"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  browseNeighborhoodLabel,
  featuredNeighborhoodIds,
} from "@/lib/browse-neighborhoods";
import { copy } from "@/lib/copy";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { districtPath, neighborhoodsPath } from "@/lib/product";
import { trackEvent } from "@/lib/track";
import type { City, Language, NeighborhoodId } from "@/lib/types";

type BrowseNeighborhoodsProps = {
  language: Language;
  city?: City;
};

function trackDistrict(id: NeighborhoodId, language: Language) {
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

function ViewAllLink({ language }: { language: Language }) {
  const rtl = language === "ar";
  return (
    <Link
      href={neighborhoodsPath(language)}
      data-view-all-cta={language}
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
}: {
  language: Language;
  ids: readonly NeighborhoodId[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const rtl = language === "ar";

  function scrollForward() {
    const row = rowRef.current;
    if (!row) return;
    const delta = Math.min(220, row.clientWidth * 0.7);
    row.scrollBy({ left: rtl ? -delta : delta, behavior: "smooth" });
  }

  return (
    <div className="relative -mx-4 mt-3 px-4">
      <div
        ref={rowRef}
        className="overflow-x-auto pe-10 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
              onClick={() => trackDistrict(id, language)}
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-line bg-foam px-3 text-[13px] leading-none text-ink"
            >
              {browseNeighborhoodLabel(id, language)}
            </Link>
          ))}
        </div>
      </div>
      <button
        type="button"
        data-browse-scroll=""
        onClick={scrollForward}
        aria-label={rtl ? "المزيد من الأحياء" : "More neighborhoods"}
        className={`absolute end-4 top-0 inline-flex size-9 items-center justify-center rounded-full border border-line bg-foam text-ink ${
          rtl
            ? "shadow-[8px_0_12px_8px_var(--paper)]"
            : "shadow-[-8px_0_12px_8px_var(--paper)]"
        }`}
      >
        <Arrow point={rtl ? "left" : "right"} />
      </button>
    </div>
  );
}

export function BrowseNeighborhoods({
  language,
  city = "riyadh",
}: BrowseNeighborhoodsProps) {
  const rtl = language === "ar";
  const ids = featuredNeighborhoodIds(language, city);

  return (
    <section
      className="mx-auto w-full max-w-md border-y border-line bg-paper px-4 py-4"
      dir={rtl ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="browse-neighborhoods"
      data-browse-pills=""
      style={rtl ? undefined : { direction: "ltr", unicodeBidi: "isolate" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="browse-neighborhoods" className="min-w-0 text-lg font-semibold leading-7">
          {copy.browseNeighborhoods[language]}
        </h2>
        <ViewAllLink language={language} />
      </div>
      <p className="mt-0.5 text-[13px] leading-5 text-ink-soft">
        {copy.browseNeighborhoodsHint[language]}
      </p>
      <FeaturedPills language={language} ids={ids} />
    </section>
  );
}
