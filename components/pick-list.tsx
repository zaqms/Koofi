"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BeenButton } from "@/components/been-button";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { SharePackButton } from "@/components/share-pack-button";
import { ShopDistance } from "@/components/shop-distance";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import { postLearnMaps } from "@/lib/learn-session";
import { exampleBadge, isExampleShop, shopDisplayName } from "@/lib/product";
import { packIdForPicks } from "@/lib/share-pack";
import { trackEvent, type MapsClickSource } from "@/lib/track";
import type { ChatPick, Language } from "@/lib/types";

export type { ChatPick };

type PickListProps = {
  picks: ChatPick[];
  language: Language;
  uiLanguage: Language;
  beenIds: string[];
  onBeen: (id: string) => void;
  ask?: string;
  packId?: string;
  mapsSource?: MapsClickSource;
};

export function PickList({
  picks,
  language,
  uiLanguage,
  beenIds,
  onBeen,
  ask = "",
  packId,
  mapsSource = "pack",
}: PickListProps) {
  const resolvedPackId =
    packId ??
    (picks.length > 0
      ? packIdForPicks({ picks, language, ask })
      : undefined);

  useEffect(() => {
    if (picks.length !== 3) return;
    trackEvent(
      "three_pick_shown",
      {
        locale: language,
        shop_ids: picks.map((pick) => pick.id).join(","),
        ...(resolvedPackId ? { pack_id: resolvedPackId } : {}),
      },
      {
        dedupeKey: `three_pick_shown:${picks.map((pick) => pick.id).join(",")}`,
      },
    );
  }, [language, picks, resolvedPackId]);

  return (
    <div>
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
                  shopId={pick.id}
                  locale={language}
                  source={mapsSource}
                  className="inline-flex size-8 items-center justify-center rounded-full text-ink-soft hover:bg-paper-deep hover:text-ink"
                  aria-label={copy.maps[language]}
                  title={copy.maps[language]}
                  onClick={() => {
                    postLearnMaps({ shopId: pick.id, pickIndex: index });
                  }}
                >
                  <MapPinIcon />
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
      {picks.length > 0 ? (
        <SharePackButton
          picks={picks}
          language={language}
          uiLanguage={uiLanguage}
          ask={ask}
          packId={resolvedPackId}
        />
      ) : null}
    </div>
  );
}
