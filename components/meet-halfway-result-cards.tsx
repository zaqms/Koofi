"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { ShopVisual } from "@/components/shop-visual";
import { copy } from "@/lib/copy";
import {
  formatHalfwayShopMeta,
} from "@/lib/halfway-place";
import { postLearnMaps } from "@/lib/learn-session";
import { shopDisplayName } from "@/lib/product";
import { useSavedShopIds } from "@/lib/saved-shops";
import type { ChatPick, Language, Pin } from "@/lib/types";

type MeetHalfwayResultCardsProps = {
  picks: ChatPick[];
  language: Language;
  origin?: Pin | null;
};

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M7 4.75h10A1.25 1.25 0 0 1 18.25 6v13.1l-6.25-3.4-6.25 3.4V6A1.25 1.25 0 0 1 7 4.75z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      className="shrink-0 text-ink-soft rtl:rotate-180"
    >
      <path
        d="M9 6.5 15 12l-6 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MeetHalfwayResultCards({
  picks,
  language,
  origin,
}: MeetHalfwayResultCardsProps) {
  const saved = useSavedShopIds();

  return (
    <ol className="grid gap-2">
      {picks.map((pick, index) => {
        const name = shopDisplayName(pick, language);
        const shopPin =
          pick.lat != null && pick.lng != null
            ? { lat: pick.lat, lng: pick.lng }
            : null;
        const meta = formatHalfwayShopMeta(
          pick.neighborhoodLabel,
          shopPin,
          origin,
          language,
        );
        const tags = (pick.tags ?? []).slice(0, 2);
        const marked = saved.has(pick.id);

        return (
          <li
            key={pick.id}
            className="relative rounded-2xl border border-line bg-foam px-3 py-3 has-[[data-pick-card-link]:focus-visible]:ring-2 has-[[data-pick-card-link]:focus-visible]:ring-bean"
          >
            <div className="flex items-start gap-2.5">
              <ShopVisual
                nameAr={pick.nameAr}
                nameEn={pick.nameEn}
                photoUrl={pick.photoUrl}
                logoUrl={pick.logoUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold leading-5 text-ink">
                    {name}
                  </h3>
                  {index === 0 ? (
                    <span className="shrink-0 rounded-full bg-paper-deep px-2 py-0.5 text-[11px] leading-4 text-ink-soft">
                      {copy.meetHalfwayBestMatch[language]}
                    </span>
                  ) : null}
                  <span className="mt-0.5 shrink-0" aria-hidden>
                    <ChevronIcon />
                  </span>
                </div>
                {meta ? (
                  <p className="mt-0.5 truncate text-[11px] leading-4 text-ink-soft">
                    {meta}
                  </p>
                ) : null}
                {pick.why ? (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-ink">
                    {pick.why}
                  </p>
                ) : null}
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-paper-deep px-2 py-0.5 text-[11px] leading-4 text-ink-soft"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <MapsLink
                      href={pick.mapsHref}
                      shopId={pick.id}
                      locale={language}
                      source="pack"
                      className="relative z-10 inline-flex items-center gap-1 text-[11px] leading-4 text-ink-soft hover:text-ink"
                      aria-label={copy.meetHalfwayOpenMaps[language]}
                      title={copy.meetHalfwayOpenMaps[language]}
                      onClick={(event) => {
                        event.stopPropagation();
                        postLearnMaps({ shopId: pick.id, pickIndex: index });
                      }}
                    >
                      <MapPinIcon className="size-3.5" />
                      {copy.meetHalfwayOpenMaps[language]}
                    </MapsLink>
                    <span aria-hidden className="h-3 w-px bg-line" />
                    <button
                      type="button"
                      className="relative z-10 inline-flex items-center gap-1 text-[11px] leading-4 text-ink-soft hover:text-ink"
                      aria-pressed={marked}
                      aria-label={
                        marked
                          ? copy.meetHalfwaySaved[language]
                          : copy.meetHalfwaySave[language]
                      }
                      onClick={(event: MouseEvent<HTMLButtonElement>) => {
                        event.stopPropagation();
                        saved.toggle(pick.id);
                      }}
                    >
                      <BookmarkIcon filled={marked} />
                      {marked
                        ? copy.meetHalfwaySaved[language]
                        : copy.meetHalfwaySave[language]}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href={pick.cardPath}
              data-pick-card-link
              className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl after:content-[''] focus-visible:outline-none"
            >
              <span className="sr-only">{copy.cardLink[language]}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
