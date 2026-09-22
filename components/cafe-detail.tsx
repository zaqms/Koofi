"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  DetailBackIcon,
  DetailChevronIcon,
  DetailClockIcon,
  DetailDiamondIcon,
  DetailHeartIcon,
} from "@/components/cafe-detail-icons";
import { MapPinIcon } from "@/components/map-pin-icon";
import { MapsLink } from "@/components/maps-link";
import { ResultsFeedbackBlock } from "@/components/results-feedback";
import { ShareListingButton } from "@/components/share-listing-button";
import { ShopVisual } from "@/components/shop-visual";
import { useShopUpvote } from "@/components/shop-upvote-provider";
import {
  cafeDetailDescription,
  cafeDetailHeroNeedsGoogleCredit,
  cafeDetailHeroPhotos,
  cafeDetailHoursStatus,
  cafeDetailWeeklyHours,
  neighborhoodCafesHeading,
  type CafeDetailHeroPhoto,
} from "@/lib/cafe-detail";
import { copy } from "@/lib/copy";
import type { DirectoryShop } from "@/lib/directory";
import { listingLocationOrder } from "@/lib/listing-location";
import { listingCardTags } from "@/lib/listing-tags";
import { neighborhoodLabel } from "@/lib/neighborhoods";
import { officialShopCoords } from "@/lib/place-coords";
import { cardPath, districtPath, shopDisplayName } from "@/lib/product";
import { shopMapsHref } from "@/lib/public-url";
import { shopDistanceDisplay } from "@/lib/shop-distance-label";
import { SHOW_DETAIL_FAVORITE } from "@/lib/tonight";
import type { Language, Shop } from "@/lib/types";
import { useVisitorLocation } from "@/lib/visitor-location";

type CafeDetailProps = {
  shop: Shop;
  language: Language;
  backHref: string;
  siblings: DirectoryShop[];
};

const heroSquareClass =
  "inline-flex size-11 items-center justify-center rounded-full bg-foam text-ink shadow-[0_2px_8px_rgba(30,23,20,0.08)] ring-1 ring-wain-divider";

const heroNavClass =
  "absolute top-1/2 z-20 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-foam ring-1 ring-foam/25";

const mapsCtaClass =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-wain-warm-cream px-4 text-[15px] font-medium text-ink hover:bg-wain-warm-cream/80";

export function CafeDetail({
  shop,
  language,
  backHref,
  siblings,
}: CafeDetailProps) {
  const dir = language === "ar" ? "rtl" : "ltr";
  const name = shopDisplayName(shop, language);
  const area =
    language === "ar"
      ? shop.neighborhoodAr
      : neighborhoodLabel(shop.neighborhood, "en");
  const tags = listingCardTags(shop, language);
  const photos = cafeDetailHeroPhotos(shop);
  const description = cafeDetailDescription(shop);
  const status = cafeDetailHoursStatus(shop, language);
  const schedule = cafeDetailWeeklyHours(shop, language);
  const coords = officialShopCoords(shop);

  return (
    <article
      data-cafe-detail=""
      className="bg-wain-paper"
      dir={dir}
      lang={language}
    >
      <div className="relative">
        <CafeDetailHero
          photos={photos}
          language={language}
          backHref={backHref}
          shop={shop}
          name={name}
          neighborhood={area}
        />
        <div className="pointer-events-none absolute start-1 -bottom-8 z-10">
          <div className="pointer-events-auto rounded-[16px] shadow-[0_2px_8px_rgba(30,23,20,0.08)] ring-1 ring-wain-divider">
            <ShopVisual
              nameAr={shop.nameAr}
              nameEn={shop.nameEn}
              photoUrl={shop.photoUrl}
              logoUrl={shop.logoUrl}
              size="listing"
            />
          </div>
        </div>
      </div>

      <div className="pt-12">
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] break-words">
          {name}
        </h1>
        <CafeDetailLocation
          language={language}
          neighborhood={area}
          lat={coords?.lat}
          lng={coords?.lng}
        />
        {tags.length > 0 ? (
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-wain-warm-cream px-2.5 py-0.5 text-[11px] leading-4 text-ink"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6">
          <MapsLink
            href={shopMapsHref(shop)}
            shopId={shop.id}
            locale={language}
            source="card"
            className={mapsCtaClass}
          >
            <MapPinIcon className="size-5 shrink-0" />
            <span>{copy.detailTakeMeThere[language]}</span>
          </MapsLink>
        </div>

        {description ? (
          <p className="mt-5 text-sm leading-6 text-ink-soft">{description}</p>
        ) : null}

        <div className="mt-7 border-y border-wain-divider">
          <DetailInfoRow
            href={districtPath(shop.neighborhood, language)}
            icon={<MapPinIcon className="size-[18px]" />}
            label={copy.neighborhood[language]}
            value={area}
            language={language}
          />
          {status ? (
            <DetailInfoRow
              icon={<DetailClockIcon className="size-[18px]" />}
              label={copy.detailStatus[language]}
              value={status.label}
              valueClassName={
                status.kind === "open" ? "text-[#2f7d32]" : undefined
              }
              language={language}
            />
          ) : null}
          {schedule ? (
            <DetailHoursSchedule lines={schedule} language={language} />
          ) : null}
          {tags.length > 0 ? (
            <DetailInfoRow
              icon={<DetailDiamondIcon className="size-[18px]" />}
              label={copy.detailVibe[language]}
              value={tags.join(" · ")}
              language={language}
            />
          ) : null}
        </div>

        <div className="mt-5">
          <ResultsFeedbackBlock
            language={language}
            preset="cafe"
            resetKey={`cafe:${shop.id}`}
            shopId={shop.id}
            shopIds={[shop.id]}
          />
        </div>
      </div>

      <CafeRelatedRail
        language={language}
        neighborhood={area}
        neighborhoodId={shop.neighborhood}
        siblings={siblings}
      />
    </article>
  );
}

function CafeDetailHero({
  photos,
  language,
  backHref,
  shop,
  name,
  neighborhood,
}: {
  photos: CafeDetailHeroPhoto[];
  language: Language;
  backHref: string;
  shop: Shop;
  name: string;
  neighborhood: string;
}) {
  const [index, setIndex] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const photo = photos[index];
  const googleCredit = cafeDetailHeroNeedsGoogleCredit(photos);
  const author = photo?.attribution?.displayName?.trim();

  function go(delta: number) {
    if (photos.length < 2) return;
    setIndex((current) => (current + delta + photos.length) % photos.length);
  }

  function isHeroChrome(target: EventTarget | null): boolean {
    return target instanceof Element && Boolean(target.closest("a,button"));
  }

  return (
    <div
      data-cafe-detail-hero=""
      className={`relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-wain-warm-cream ring-1 ring-wain-divider touch-pan-y${photos.length > 1 ? " cursor-pointer" : ""}`}
      onPointerDown={(event) => {
        if (isHeroChrome(event.target)) return;
        start.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        if (start.current == null) return;
        const dx = event.clientX - start.current.x;
        const dy = event.clientY - start.current.y;
        start.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (isHeroChrome(event.target)) return;
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
          go(dx < 0 ? 1 : -1);
          return;
        }
        if (Math.abs(dx) < 40 && Math.abs(dy) < 24) go(1);
      }}
    >
      {photo ? (
        // Cached /cafe-heroes or catalog photoUrl. Local /logos stay off the well.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.src}
          alt={`${name} · ${neighborhood}`}
          draggable={false}
          className="pointer-events-none size-full select-none object-cover"
        />
      ) : null}

      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
        <Link
          href={backHref}
          className={heroSquareClass}
          aria-label={copy.backToChat[language]}
        >
          <DetailBackIcon className="rtl:scale-x-[-1]" />
        </Link>
        <div className="flex items-center gap-2">
          <ShareListingButton
            shop={shop}
            language={language}
            source="card"
            variant="hero"
          />
          <CafeDetailFavorite shopId={shop.id} language={language} />
        </div>
      </div>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className={`${heroNavClass} start-2`}
            aria-label={copy.detailHeroPrev[language]}
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
          >
            <DetailChevronIcon className="rotate-180 rtl:rotate-0" />
          </button>
          <button
            type="button"
            className={`${heroNavClass} end-2`}
            aria-label={copy.detailHeroNext[language]}
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
          >
            <DetailChevronIcon className="rtl:rotate-180" />
          </button>
        </>
      ) : null}

      {googleCredit || photos.length > 0 ? (
        <div
          data-cafe-detail-hero-meta=""
          className="pointer-events-none absolute bottom-3 end-3 z-20 flex max-w-[46%] flex-col items-end gap-1"
        >
          {googleCredit ? (
            <p className="truncate rounded-full bg-ink/70 px-2 py-0.5 text-[10px] leading-4 text-foam">
              {copy.detailPhotosGoogle[language]}
              {author ? <span className="sr-only">{` · ${author}`}</span> : null}
            </p>
          ) : null}
          {photos.length > 0 ? (
            <p className="rounded-full bg-ink/70 px-2 py-0.5 text-[11px] leading-4 text-foam">
              <span dir="ltr">
                {index + 1}/{photos.length}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CafeDetailFavorite({
  shopId,
  language,
}: {
  shopId: string;
  language: Language;
}) {
  const upvote = useShopUpvote();
  const parked = !SHOW_DETAIL_FAVORITE;
  const voted = !parked && upvote.hasVoted(shopId);
  const busy = upvote.votingId === shopId;
  const label = copy.detailFavorite[language];

  return (
    <button
      type="button"
      className={heroSquareClass}
      aria-pressed={parked ? undefined : voted}
      aria-disabled={parked || undefined}
      aria-label={label}
      title={label}
      disabled={parked ? false : busy}
      onClick={() => {
        if (parked || busy) return;
        void upvote.vote(shopId, language);
      }}
    >
      <DetailHeartIcon filled={voted} />
    </button>
  );
}

function CafeDetailLocation({
  language,
  neighborhood,
  lat,
  lng,
}: {
  language: Language;
  neighborhood: string;
  lat?: number;
  lng?: number;
}) {
  const visitor = useVisitorLocation();
  const origin =
    visitor.status === "ready"
      ? { lat: visitor.lat, lng: visitor.lng }
      : null;
  const display = shopDistanceDisplay({
    origin,
    coords: lat != null && lng != null ? { lat, lng } : null,
    language,
  });
  const order = listingLocationOrder(language);
  const distance =
    display.kind === "hidden" ? null : (
      <span
        dir="ltr"
        data-shop-distance={display.kind}
        {...(display.kind === "km"
          ? { "data-shop-distance-km": display.km.toFixed(3) }
          : {})}
      >
        {display.label}
      </span>
    );

  return (
    <p className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] leading-5 text-wain-soft-taupe">
      <MapPinIcon className="size-3.5 shrink-0" />
      {distance && order === "distance-first" ? (
        <>
          {distance}
          <span aria-hidden>{"·"}</span>
        </>
      ) : null}
      <span className="min-w-0 break-words">{neighborhood}</span>
      {distance && order === "neighborhood-first" ? (
        <>
          <span aria-hidden>{"·"}</span>
          {distance}
        </>
      ) : null}
    </p>
  );
}

function DetailHoursSchedule({
  lines,
  language,
}: {
  lines: { day: string; hours: string }[];
  language: Language;
}) {
  return (
    <div
      data-cafe-detail-hours=""
      className="flex w-full items-start gap-3 border-b border-wain-divider py-4 last:border-b-0"
      lang={language}
    >
      <span className="mt-0.5 text-wain-soft-taupe">
        <DetailClockIcon className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-4 text-wain-soft-taupe">
          {copy.hours[language]}
        </span>
        <ul className="mt-1 flex flex-col gap-1">
          {lines.map((line) => (
            <li
              key={line.day}
              className="flex items-baseline justify-between gap-3 text-sm leading-5 text-ink"
            >
              <span>{line.day}</span>
              <span dir="ltr" className="shrink-0 tabular-nums">
                {line.hours}
              </span>
            </li>
          ))}
        </ul>
      </span>
    </div>
  );
}

function DetailInfoRow({
  href,
  icon,
  label,
  value,
  valueClassName,
  language,
}: {
  href?: string;
  icon: ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
  language: Language;
}) {
  const inner = (
    <>
      <span className="mt-0.5 text-wain-soft-taupe">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] leading-4 text-wain-soft-taupe">
          {label}
        </span>
        <span className={`mt-0.5 block text-sm leading-5 ${valueClassName ?? "text-ink"}`}>
          {value}
        </span>
      </span>
      {href ? (
        <DetailChevronIcon className="shrink-0 text-wain-soft-taupe rtl:scale-x-[-1]" />
      ) : null}
    </>
  );

  const rowClass =
    "flex w-full items-start gap-3 border-b border-wain-divider py-4 last:border-b-0";

  if (href) {
    return (
      <Link
        href={href}
        className={`${rowClass} hover:bg-wain-warm-cream/50`}
        lang={language}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={rowClass} lang={language}>
      {inner}
    </div>
  );
}

function CafeRelatedRail({
  language,
  neighborhood,
  neighborhoodId,
  siblings,
}: {
  language: Language;
  neighborhood: string;
  neighborhoodId: Shop["neighborhood"];
  siblings: DirectoryShop[];
}) {
  if (siblings.length === 0) return null;
  const heading = neighborhoodCafesHeading(neighborhood, language);
  const seeAll = districtPath(neighborhoodId, language);

  return (
    <section className="mt-8" data-cafe-detail-related="">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold leading-tight">{heading}</h2>
        <Link
          href={seeAll}
          className="shrink-0 text-[13px] text-wain-soft-taupe hover:text-ink"
        >
          {copy.detailSeeAll[language]}
        </Link>
      </div>
      <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {siblings.map((sibling) => (
          <li key={sibling.id} className="w-[7.25rem] shrink-0">
            <Link
              href={cardPath(sibling.id, language)}
              className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] bg-foam px-3 py-3.5 ring-1 ring-wain-divider"
            >
              <ShopVisual
                nameAr={sibling.nameAr}
                nameEn={sibling.nameEn}
                photoUrl={sibling.photoUrl}
                logoUrl={sibling.logoUrl}
                size="listing"
              />
              <span
                className={
                  language === "en"
                    ? "line-clamp-2 text-center text-[11px] font-semibold uppercase leading-4 tracking-[0.04em]"
                    : "line-clamp-2 text-center text-[12px] font-semibold leading-4"
                }
              >
                {shopDisplayName(sibling, language)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
