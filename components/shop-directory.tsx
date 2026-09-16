"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { DirectoryCard } from "@/components/directory-card";
import { DirectoryResultSortPills } from "@/components/directory-result-sort";
import {
  directoryNeighborhoods,
  filterDirectoryShops,
  filterDirectoryShopsByMoment,
  type DirectoryShop,
} from "@/lib/directory";
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
import type { Language, MomentTag, NeighborhoodId, Pin } from "@/lib/types";
import {
  requestVisitorLocation,
  usePeekVisitorLocation,
} from "@/lib/visitor-location";

const POPULAR_CHIP = VIBE_CHIPS.find((chip) => chip.id === "popular") ?? {
  id: "popular",
  ar: "الأكثر شعبية",
  en: "Most Popular",
};

type ShopDirectoryProps = {
  language: Language;
  shops: DirectoryShop[];
  district?: NeighborhoodId | null;
  listing?: "popular" | null;
  moment?: MomentTag | null;
  chipId?: string | null;
  intro?: ReactNode;
};

function originFromVisitor(
  visitor: ReturnType<typeof usePeekVisitorLocation>,
): Pin | null {
  if (visitor.status !== "ready") return null;
  return { lat: visitor.lat, lng: visitor.lng };
}

export function ShopDirectory({
  language,
  shops,
  district = null,
  listing = null,
  moment = null,
  chipId = null,
  intro = null,
}: ShopDirectoryProps) {
  const popular = listing === "popular";
  const vibe = chipId
    ? VIBE_CHIPS.find((chip) => chip.id === chipId)
    : undefined;
  const resultSort = isDirectoryResultSortChip(chipId);
  const visitor = usePeekVisitorLocation();
  const origin = originFromVisitor(visitor);
  const nearbyAvailable = visitor.status === "ready";
  const [userSort, setUserSort] = useState<DirectoryResultSort | null>(null);
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

  const areas = directoryNeighborhoods(shops);
  const filtered = useMemo(
    () =>
      popular
        ? shops
        : moment
          ? filterDirectoryShopsByMoment(shops, moment)
          : filterDirectoryShops(shops, district),
    [popular, shops, moment, district],
  );
  const visible = useMemo(
    () =>
      resultSort
        ? sortDirectoryShops(filtered, sort, origin, language)
        : filtered,
    [resultSort, filtered, sort, origin, language],
  );

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

  const heading = popular
    ? mostPopularHeading(language)
    : district
      ? categoryDistrictHeading(COFFEE_SHOPS_CATEGORY, district, language)
      : vibe
        ? vibeChipLabel(vibe, language)
        : copy.directory[language];
  const headingId = popular
    ? "most-popular"
    : district
      ? "koofi-district"
      : vibe
        ? `koofi-chip-${vibe.id}`
        : "koofi-directory";

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-10"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby={headingId}
    >
      {district || popular || vibe ? (
        <h1 id={headingId} className="text-base font-semibold">
          {heading}
        </h1>
      ) : (
        <h2 id={headingId} className="text-base font-semibold">
          {heading}
        </h2>
      )}
      {intro ? null : (
        <p className="mt-1 text-xs leading-5 text-ink-soft">
          {copy.directoryHint[language]}
        </p>
      )}

      {popular ? (
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
      ) : null}

      {resultSort ? (
        <DirectoryResultSortPills
          language={language}
          sort={selectedSort}
          onPick={pickSort}
          nearbyAvailable={nearbyAvailable}
          showNearbyHint={showNearbyHint}
        />
      ) : null}

      <ul className="mt-4 grid gap-2">
        {visible.map((shop) => (
          <DirectoryCard key={shop.id} shop={shop} language={language} />
        ))}
      </ul>
      {intro}
    </section>
  );
}

function chipClass(selected: boolean): string {
  return selected
    ? "rounded-full border border-bean bg-bean px-2.5 py-1 text-[11px] leading-5 text-foam"
    : "rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink hover:border-bean hover:bg-paper-deep";
}
