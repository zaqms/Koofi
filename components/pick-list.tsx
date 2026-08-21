"use client";

import Link from "next/link";
import { BeenButton } from "@/components/been-button";
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
    <ol className="grid gap-2">
      {picks.map((pick, index) => {
        const name = shopDisplayName(pick, language);
        const other = shopDisplayName(
          pick,
          language === "ar" ? "en" : "ar",
        );

        return (
          <li
            key={pick.id}
            className="rounded-2xl border border-line bg-foam px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3" dir="ltr">
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
                  <p className="text-[11px] text-ink-soft">{index + 1}</p>
                  <h3 className="text-lg font-semibold leading-tight">{name}</h3>
                  <p className="text-[11px] leading-4 text-ink-soft" dir="auto">
                    {other} · {pick.neighborhoodLabel}
                  </p>
                  {!pick.example && pick.rating != null ? (
                    <p className="mt-1 text-xs leading-5 text-ink-soft">
                      <span dir="ltr">
                        {pick.rating.toFixed(1)}
                        {pick.reviewCount != null
                          ? ` · ${pick.reviewCount} ${copy.reviews[language]}`
                          : null}
                      </span>
                      {pick.reviewSnippet ? (
                        <span dir="auto">
                          {" "}
                          · “{pick.reviewSnippet}”
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </div>
              {isExampleShop(pick) ? (
                <span className="shrink-0 text-[11px] text-ink-soft">
                  {exampleBadge(language)}
                </span>
              ) : null}
            </div>
            <p className="mt-2 truncate text-sm leading-5">{pick.why}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              <a
                href={pick.mapsHref}
                className="rounded-full bg-bean px-3 py-1 text-xs text-foam hover:bg-bean-deep"
                onClick={() => {
                  postLearnMaps({ shopId: pick.id, pickIndex: index });
                }}
              >
                {copy.maps[language]}
              </a>
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
