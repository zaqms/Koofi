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
          ? "flex aspect-square w-full flex-col items-center overflow-hidden rounded-[1.15rem] border border-line bg-blush px-1 pt-2 pb-1.5 text-ink"
          : "flex aspect-square w-full flex-col items-center overflow-hidden rounded-[1.15rem] border border-line bg-foam px-1 pt-2 pb-1.5 text-ink"
      }
    >
      <span className="flex min-h-0 flex-1 items-center justify-center">
        <NeighborhoodIcon kind={neighborhoodIconKind(id)} className="size-7" />
      </span>
      <span
        className={
          selected
            ? "mt-0.5 line-clamp-2 min-h-[2.2em] w-full min-w-0 px-0.5 text-center text-[10px] font-medium leading-[1.15] break-words [overflow-wrap:anywhere]"
            : "mt-0.5 line-clamp-2 min-h-[2.2em] w-full min-w-0 px-0.5 text-center text-[10px] font-normal leading-[1.15] break-words [overflow-wrap:anywhere]"
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
  return (
    <Link
      href={neighborhoodsPath(language)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-foam px-3 py-1.5 text-xs leading-5 text-ink"
    >
      <span>{copy.viewAllNeighborhoods[language]}</span>
      <Chevron point="right" />
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
        className="@container -mx-4 mt-4 overflow-x-auto ps-4 pe-0 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        data-neighborhood-row=""
      >
        <div className="flex w-max flex-nowrap gap-2.5">
          {ids.map((id) => (
            <div
              key={id}
              role="listitem"
              className="w-[min(5.15rem,calc((100cqi-2.5rem)/4.45))] shrink-0"
            >
              <NeighborhoodCard
                id={id}
                language={language}
                selected={id === BROWSE_DEMO_SELECTED}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
