"use client";

import Link from "next/link";
import { BeenButton } from "@/components/been-button";
import { MapsLink } from "@/components/maps-link";
import { ShopDistance } from "@/components/shop-distance";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import { postLearnMaps } from "@/lib/learn-session";
import { exampleBadge, isExampleShop, shopDisplayName } from "@/lib/product";
import type { ChatPick, Language } from "@/lib/types";

export type { ChatPick };

type PickListProps = {
  picks: ChatPick[];
  language: Language;
  beenIds: string[];
  onBeen: (id: string) => void;
};

export function PickList({ picks, language, beenIds, onBeen }: PickListProps) {
  return (
    <ol className="grid gap-1.5">
      {picks.map((pick, index) => {
        const name = shopDisplayName(pick, language);
        const other = shopDisplayName(
          pick,
          language === "ar" ? "en" : "ar",
        );

        return (
          <li
            key={pick.id}
            className="rounded-2xl border border-line bg-foam px-2.5 py-2"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex min-w-0 flex-1 items-start gap-2.5" dir="ltr">
                <ShopVisual
                  nameAr={pick.nameAr}
                  nameEn={pick.nameEn}
                  photoUrl={pick.photoUrl}
                  logoUrl={pick.logoUrl}
                />
                <div
                  className="min-w-0 flex-1"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate text-base font-semibold leading-5">
                      {name}
                    </h3>
                    {isExampleShop(pick) ? (
                      <span className="shrink-0 text-[11px] text-ink-soft">
                        {exampleBadge(language)}
                      </span>
                    ) : null}
                  </div>
                  <p
                    className="truncate text-[11px] leading-4 text-ink-soft"
                    dir="auto"
                  >
                    {other} · {pick.neighborhoodLabel}
                    <ShopDistance
                      coords={
                        pick.lat != null && pick.lng != null
                          ? { lat: pick.lat, lng: pick.lng }
                          : null
                      }
                      language={language}
                    />
                    {!pick.example && pick.rating != null ? (
                      <span dir="ltr">
                        {" · "}
                        {pick.rating.toFixed(1)}
                        {pick.reviewCount != null
                          ? ` · ${pick.reviewCount} ${copy.reviews[language]}`
                          : null}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 truncate text-xs leading-4 text-ink">
                    {pick.why}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <MapsLink
                href={pick.mapsHref}
                className="rounded-full bg-bean px-3 py-1.5 text-xs text-foam hover:bg-bean-deep"
                onClick={() => {
                  postLearnMaps({ shopId: pick.id, pickIndex: index });
                }}
              >
                {copy.maps[language]}
              </MapsLink>
              <Link
                href={pick.cardPath}
                className="text-xs text-ink-soft underline-offset-2 hover:underline"
              >
                {copy.cardLink[language]}
              </Link>
              <BeenButton
                marked={beenIds.includes(pick.id)}
                language={language}
                onMark={() => onBeen(pick.id)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
