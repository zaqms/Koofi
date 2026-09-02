"use client";

import { useState } from "react";
import { DirectoryCard } from "@/components/directory-card";
import {
  directoryNeighborhoods,
  filterDirectoryShops,
  type DirectoryShop,
} from "@/lib/directory";
import { copy } from "@/lib/copy";
import { NEIGHBORHOODS, neighborhoodLabel } from "@/lib/neighborhoods";
import { trackEvent } from "@/lib/track";
import type { Language, NeighborhoodId } from "@/lib/types";

type ShopDirectoryProps = {
  language: Language;
  shops: DirectoryShop[];
};

export function ShopDirectory({ language, shops }: ShopDirectoryProps) {
  const [district, setDistrict] = useState<NeighborhoodId | null>(null);
  const areas = directoryNeighborhoods(shops);
  const visible = filterDirectoryShops(shops, district);

  return (
    <section
      className="mx-auto w-full max-w-md border-t border-line bg-paper px-4 pt-5 pb-10"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
      aria-labelledby="koofi-directory"
    >
      <h2 id="koofi-directory" className="text-base font-semibold">
        {copy.directory[language]}
      </h2>
      <p className="mt-1 text-xs leading-5 text-ink-soft">
        {copy.directoryHint[language]}
      </p>

      <div
        className="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label={copy.neighborhood[language]}
      >
        <button
          type="button"
          aria-pressed={district === null}
          onClick={() => setDistrict(null)}
          className={chipClass(district === null)}
        >
          {copy.allDistricts[language]}
        </button>
        {areas.map((id) => {
          const selected = district === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
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
                setDistrict(selected ? null : id);
              }}
              className={chipClass(selected)}
            >
              {neighborhoodLabel(id, language)}
            </button>
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
