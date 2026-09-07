"use client";

import Link from "next/link";
import { DirectoryCard } from "@/components/directory-card";
import {
  directoryNeighborhoods,
  filterDirectoryShops,
  type DirectoryShop,
} from "@/lib/directory";
import { copy } from "@/lib/copy";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
} from "@/lib/directory-category";
import { NEIGHBORHOODS, neighborhoodLabel } from "@/lib/neighborhoods";
import {
  districtPath,
  homePath,
  mostPopularHeading,
  mostPopularPath,
  VIBE_CHIPS,
  vibeChipLabel,
} from "@/lib/product";
import { trackEvent } from "@/lib/track";
import type { Language, NeighborhoodId } from "@/lib/types";

const POPULAR_CHIP = VIBE_CHIPS.find((chip) => chip.id === "popular") ?? {
  id: "popular",
  ar: "اللي عليها طلب",
  en: "Most Popular",
};

type ShopDirectoryProps = {
  language: Language;
  shops: DirectoryShop[];
  district?: NeighborhoodId | null;
  listing?: "popular" | null;
};

export function ShopDirectory({
  language,
  shops,
  district = null,
  listing = null,
}: ShopDirectoryProps) {
  const popular = listing === "popular";
  const areas = directoryNeighborhoods(shops);
  const visible = popular ? shops : filterDirectoryShops(shops, district);
  const heading = popular
    ? mostPopularHeading(language)
    : district
      ? categoryDistrictHeading(COFFEE_SHOPS_CATEGORY, district, language)
      : copy.directory[language];
  const headingId = popular
    ? "most-popular"
    : district
      ? "koofi-district"
      : "koofi-directory";

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-10"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby={headingId}
    >
      {district || popular ? (
        <h1 id={headingId} className="text-base font-semibold">
          {heading}
        </h1>
      ) : (
        <h2 id={headingId} className="text-base font-semibold">
          {heading}
        </h2>
      )}
      <p className="mt-1 text-xs leading-5 text-ink-soft">
        {copy.directoryHint[language]}
      </p>

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
          {vibeChipLabel(POPULAR_CHIP, language)}
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

      <ul className="mt-4 grid gap-2">
        {visible.map((shop) => (
          <DirectoryCard key={shop.id} shop={shop} language={language} />
        ))}
      </ul>
    </section>
  );
}

function chipClass(selected: boolean): string {
  return selected
    ? "rounded-full border border-bean bg-bean px-2.5 py-1 text-[11px] leading-5 text-foam"
    : "rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink hover:border-bean hover:bg-paper-deep";
}
