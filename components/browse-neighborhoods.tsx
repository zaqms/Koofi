"use client";

import Link from "next/link";
import { NeighborhoodIcon } from "@/components/neighborhood-icons";
import {
  BROWSE_DEMO_SELECTED,
  browseNeighborhoodLabel,
  featuredNeighborhoodIds,
  neighborhoodIconKind,
} from "@/lib/browse-neighborhoods";
import { copy } from "@/lib/copy";
import { NEIGHBORHOODS } from "@/lib/neighborhoods";
import { districtPath, neighborhoodsPath } from "@/lib/product";
import { trackEvent } from "@/lib/track";
import type { Language, NeighborhoodId } from "@/lib/types";

type BrowseNeighborhoodsProps = {
  language: Language;
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

function NeighborhoodCard({
  id,
  language,
  selected,
}: {
  id: NeighborhoodId;
  language: Language;
  selected: boolean;
}) {
  const label = browseNeighborhoodLabel(id, language);
  return (
    <Link
      href={districtPath(id, language)}
      onClick={() => trackDistrict(id, language)}
      className={
        selected
          ? "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[1.15rem] border border-line bg-blush px-1 py-2 text-ink"
          : "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-[1.15rem] border border-line bg-foam px-1 py-2 text-ink"
      }
    >
      <NeighborhoodIcon kind={neighborhoodIconKind(id)} className="size-7" />
      <span
        className={
          selected
            ? "line-clamp-2 text-center text-[11px] font-medium leading-tight"
            : "line-clamp-2 text-center text-[11px] font-normal leading-tight"
        }
      >
        {label}
      </span>
    </Link>
  );
}

function Chevron({ point }: { point: "left" | "right" }) {
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
        <path d="M6 3.2 11.2 8 6 12.8" />
      ) : (
        <path d="M10 3.2 4.8 8 10 12.8" />
      )}
    </svg>
  );
}

function ViewAllPill({ language }: { language: Language }) {
  const rtl = language === "ar";
  return (
    <Link
      href={neighborhoodsPath(language)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-foam px-3 py-1.5 text-xs leading-5 text-ink"
    >
      {rtl ? (
        <>
          <span>{copy.viewAllNeighborhoods.ar}</span>
          <Chevron point="right" />
        </>
      ) : (
        <>
          <Chevron point="left" />
          <span>{copy.viewAllNeighborhoods.en}</span>
        </>
      )}
    </Link>
  );
}

export function BrowseNeighborhoods({ language }: BrowseNeighborhoodsProps) {
  const rtl = language === "ar";
  const ids = featuredNeighborhoodIds(language);

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-2"
      dir={rtl ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="browse-neighborhoods"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="browse-neighborhoods" className="text-base font-semibold">
            {copy.browseNeighborhoods[language]}
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-soft">
            {copy.browseNeighborhoodsHint[language]}
          </p>
        </div>
        <ViewAllPill language={language} />
      </div>

      <div
        className="-mx-4 mt-4 flex flex-nowrap gap-2.5 overflow-x-auto ps-4 pe-0 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        data-neighborhood-row=""
      >
        {ids.map((id) => (
          <div
            key={id}
            role="listitem"
            className="w-[calc((100%-2.5rem)/5.35)] shrink-0"
          >
            <NeighborhoodCard
              id={id}
              language={language}
              selected={id === BROWSE_DEMO_SELECTED}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
