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
          ? "flex aspect-[4/5] w-[6.85rem] shrink-0 snap-start flex-col items-center rounded-[1.55rem] border border-line bg-blush px-2 pt-5 pb-3 text-ink sm:w-[7.6rem] md:w-[8.15rem]"
          : "flex aspect-[4/5] w-[6.85rem] shrink-0 snap-start flex-col items-center rounded-[1.55rem] border border-line bg-foam px-2 pt-5 pb-3 text-ink-soft sm:w-[7.6rem] md:w-[8.15rem]"
      }
    >
      <span className="flex flex-1 items-center justify-center">
        <NeighborhoodIcon kind={neighborhoodIconKind(id)} className="size-9" />
      </span>
      <span
        className={
          selected
            ? "mt-1 line-clamp-2 text-center text-[12px] font-medium leading-tight"
            : "mt-1 line-clamp-2 text-center text-[12px] font-normal leading-tight"
        }
      >
        {label}
      </span>
    </Link>
  );
}

export function BrowseNeighborhoods({ language }: BrowseNeighborhoodsProps) {
  const ids = featuredNeighborhoodIds(language);

  return (
    <section
      className="mx-auto w-full max-w-lg bg-paper px-4 pt-8 pb-2 md:max-w-4xl"
      lang={language}
      aria-labelledby="browse-neighborhoods"
    >
      <div className="flex items-end justify-between gap-4" dir="ltr">
        <Link
          href={neighborhoodsPath(language)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-foam px-3.5 py-2 text-[13px] leading-5 text-ink"
        >
          <span aria-hidden className="text-[15px] leading-none">
            ‹
          </span>
          <span dir={language === "ar" ? "rtl" : "ltr"}>
            {copy.viewAllNeighborhoods[language]}
          </span>
        </Link>
        <div className="min-w-0 text-end">
          <h2
            id="browse-neighborhoods"
            className="text-[1.65rem] font-semibold leading-8 tracking-tight text-ink sm:text-[1.85rem] sm:leading-9"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {copy.browseNeighborhoods[language]}
          </h2>
          <p
            className="mt-1 text-[13px] leading-5 text-ink-soft sm:text-sm"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            {copy.browseNeighborhoodsHint[language]}
          </p>
        </div>
      </div>

      <div
        className="-mx-4 mt-7 flex flex-nowrap gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] snap-x snap-mandatory [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
        dir={language === "ar" ? "rtl" : "ltr"}
        role="list"
      >
        {ids.map((id) => (
          <div key={id} role="listitem">
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
